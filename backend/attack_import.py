"""MITRE ATT&CK (Enterprise) məlumatını bazaya yükləyir.

Mənbə: MITRE-in rəsmi STIX faylı (mitre/cti). Fayl data/enterprise-attack.json yoluna qoyulur.
Fayl yoxdursa yüklənməyə cəhd olunur, alınmasa ehtiyat dəst (attack_data.py) istifadə olunur.
"""
import json
import re
import urllib.request

from sqlalchemy.orm import Session

from . import attack_data
from .database import DATA_DIR
from .datasources import seed_catalog
from .models import DataSource, Meta, Tactic, Technique, TechniqueAlias

STIX_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
STIX_PATH = DATA_DIR / "enterprise-attack.json"

_CITATION = re.compile(r"\(Citation:[^)]*\)")


def _clean(text: str, limit: int = 900) -> str:
    text = _CITATION.sub("", text or "")
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)  # markdown linkləri
    text = text.strip().split("\n\n")[0]
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def _ext_id(obj: dict):
    for ref in obj.get("external_references", []):
        if ref.get("source_name") == "mitre-attack" and ref.get("external_id"):
            return ref["external_id"], ref.get("url", "")
    return None, ""


def _extras(objs: list, by_id: dict) -> dict:
    """Ləğv olunmuş ID-lər, texnika -> Windows log source-ları, texnika -> qrup sayı."""
    id_of = {}  # STIX id -> ATT&CK ID (ləğv olunmuşlar daxil)
    for o in objs:
        if o.get("type") == "attack-pattern":
            ext, _ = _ext_id(o)
            if ext:
                id_of[o["id"]] = ext

    aliases = {}
    strategies = {}  # texnika STIX id -> [detection strategy id]
    groups = {}  # ATT&CK ID -> {intrusion-set id}
    for r in objs:
        if r.get("type") != "relationship":
            continue
        kind, src, dst = r.get("relationship_type"), r.get("source_ref", ""), r.get("target_ref", "")
        if kind == "revoked-by" and src in id_of and dst in id_of and not by_id[dst].get("revoked"):
            aliases[id_of[src]] = id_of[dst]
        elif kind == "detects" and src.startswith("x-mitre-detection-strategy"):
            strategies.setdefault(dst, []).append(src)
        elif kind == "uses" and src.startswith("intrusion-set--") and dst in id_of:
            groups.setdefault(id_of[dst], set()).add(src)

    tech_sources, catalog = {}, set()
    for tid, strat_ids in strategies.items():
        ext = id_of.get(tid)
        if not ext:
            continue
        for sid in strat_ids:
            for aid in by_id.get(sid, {}).get("x_mitre_analytic_refs", []):
                an = by_id.get(aid)
                if not an or "Windows" not in an.get("x_mitre_platforms", []):
                    continue
                for ls in an.get("x_mitre_log_source_references", []):
                    name = (ls.get("name") or "").strip()
                    if name:
                        tech_sources.setdefault(ext, set()).add(name)
                        catalog.add(name)
    return {"aliases": aliases, "sources": tech_sources, "catalog": catalog, "groups": groups}


def parse_stix(data: dict):
    objs = data["objects"]
    by_id = {o["id"]: o for o in objs}

    tactic_objs = [o for o in objs if o.get("type") == "x-mitre-tactic"]
    matrix = next((o for o in objs if o.get("type") == "x-mitre-matrix"), None)
    if matrix and matrix.get("tactic_refs"):
        ordered = [by_id[r] for r in matrix["tactic_refs"] if r in by_id]
    else:
        ordered = sorted(tactic_objs, key=lambda o: _ext_id(o)[0] or "")

    tactics = []
    for i, o in enumerate(ordered):
        ext, _ = _ext_id(o)
        tactics.append(
            {"shortname": o["x_mitre_shortname"], "name": o["name"], "ext_id": ext, "position": i}
        )

    techniques = []
    for o in objs:
        if o.get("type") != "attack-pattern" or o.get("revoked") or o.get("x_mitre_deprecated"):
            continue
        ext, url = _ext_id(o)
        if not ext:
            continue
        phases = [
            p["phase_name"]
            for p in o.get("kill_chain_phases", [])
            if p.get("kill_chain_name") == "mitre-attack"
        ]
        is_sub = bool(o.get("x_mitre_is_subtechnique"))
        techniques.append(
            {
                "id": ext,
                "name": o["name"],
                "is_sub": is_sub,
                "parent_id": ext.split(".")[0] if is_sub else None,
                "tactics": ",".join(phases),
                "platforms": ",".join(o.get("x_mitre_platforms", [])),
                "description": _clean(o.get("description", "")),
                "url": url,
            }
        )

    extras = _extras(objs, by_id)
    union = {}
    for t in techniques:
        key = t["parent_id"] or t["id"]
        union.setdefault(key, set()).update(extras["groups"].get(t["id"], set()))
    for t in techniques:
        t["data_sources"] = "|".join(sorted(extras["sources"].get(t["id"], [])))
        t["group_count"] = len(union.get(t["id"], set())) if not t["is_sub"] else len(extras["groups"].get(t["id"], set()))

    # Fayldakı ən son dəyişiklik tarixi (STIX faylında matris versiyası yoxdur)
    updated = max(
        (o.get("modified", "") for o in objs if o.get("type") == "attack-pattern" and not o.get("revoked")),
        default="",
    )[:10]
    return tactics, techniques, updated, extras


def _store_extras(db: Session, extras: dict):
    known = {i for (i,) in db.query(Technique.id).all()}
    for old, new in extras["aliases"].items():
        if new in known:
            db.merge(TechniqueAlias(old_id=old, new_id=new))
    seed_catalog(db, extras["catalog"])
    db.merge(Meta(key="enrich_v", value="1"))


def _store(db: Session, tactics, techniques, updated: str, source: str, extras=None):
    db.query(Tactic).delete()
    for t in tactics:
        db.add(Tactic(**t))
    for t in techniques:
        db.merge(Technique(**t))
    for key, value in (("attack_updated", updated), ("attack_source", source)):
        db.merge(Meta(key=key, value=value))
    db.flush()
    if extras:
        _store_extras(db, extras)
    db.commit()


def import_file(db: Session, path=STIX_PATH) -> int:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    tactics, techniques, updated, extras = parse_stix(data)
    _store(db, tactics, techniques, updated, "stix", extras)
    return len(techniques)


def enrich_existing(db: Session) -> str:
    """Köhnə bazada data source, qrup sayı və ləğv olunmuş ID-ləri STIX faylından doldurur (bir dəfə)."""
    if db.get(Meta, "enrich_v") or not STIX_PATH.exists():
        return ""
    with open(STIX_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    _, techniques, _, extras = parse_stix(data)
    for t in techniques:
        db.query(Technique).filter(Technique.id == t["id"]).update(
            {"data_sources": t["data_sources"], "group_count": t["group_count"]}
        )
    _store_extras(db, extras)
    db.commit()
    return f"{len(extras['catalog'])} log mənbəyi, {len(extras['aliases'])} köhnə ID əlaqəsi"


def download(dest=STIX_PATH, timeout: int = 120) -> bool:
    try:
        req = urllib.request.Request(STIX_URL, headers={"User-Agent": "iBlueTeam/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
        json.loads(body)  # etibarlı JSON olduğunu yoxla
        dest.write_bytes(body)
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"  ! ATT&CK yüklənmədi: {exc}")
        return False


def import_fallback(db: Session) -> int:
    tactics, techniques = attack_data.build()
    _store(db, tactics, techniques, "", "fallback", None)
    return len(techniques)


def ensure_attack(db: Session, force: bool = False) -> str:
    """Baza boşdursa (və ya force=True) ATT&CK məlumatını yükləyir. Mənbəni təsvir edən mətn qaytarır."""
    if not force and db.query(Technique).count() > 0:
        extra = enrich_existing(db)
        return "mövcud verilənlər istifadə olunur" + (f" ({extra} əlavə olundu)" if extra else "")

    if not STIX_PATH.exists():
        print("  ATT&CK faylı yoxdur, MITRE-dən yüklənir...")
        download()

    if STIX_PATH.exists():
        try:
            n = import_file(db)
            return f"MITRE STIX faylından {n} texnika yükləndi"
        except Exception as exc:  # noqa: BLE001
            print(f"  ! STIX faylı oxunmadı: {exc}")

    n = import_fallback(db)
    return (
        f"ehtiyat dəstdən {n} texnika yükləndi (tam matris üçün data/enterprise-attack.json "
        "faylını qoyub 'python run.py --reimport-attack' işlədin)"
    )
