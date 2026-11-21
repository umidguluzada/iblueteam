"""Əhatə (coverage) məntiqi. Tam sənəd: docs/coverage.md

Qayda səviyyəsi (effektiv):
  disabled                                   -> boşluq (0)
  siyahıdakı log mənbələrindən biri toplanmır -> boşluq (0), «kor» (blind): qayda var, amma işləyə bilməz
  log mənbəyi göstərilməyib                  -> ən çoxu qismən (1): telemetriyanı yoxlamaq mümkün deyil
  active + son test uğurlu                   -> tam (2)
  qalan (draft, test olunmamış)              -> qismən (1)

Texnika səviyyəsi = ona bağlı qaydaların effektiv səviyyələrinin maksimumu.
Ana texnikanın xanası = özü və alt-texnikaları arasında maksimum.
Heatmap balı (0-100) əhatənin dərinliyini göstərir: əlavə müstəqil qaydalar və keyfiyyət artırır.
"""
import threading
from collections import defaultdict

from sqlalchemy.orm import Session, selectinload

from .models import HoneypotEvent, Rule, Tactic, Technique

GAP, PARTIAL, FULL = 0, 1, 2
LABELS = {GAP: "gap", PARTIAL: "partial", FULL: "full"}
CREDIT = {GAP: 0.0, PARTIAL: 0.5, FULL: 1.0}


def rule_state(rule: Rule) -> dict:
    """Qaydanın effektiv vəziyyəti: level, blind, missing, unlinked."""
    if rule.status == "disabled":
        return {"level": GAP, "blind": False, "missing": [], "unlinked": False}
    missing = sorted(d.name for d in rule.data_sources if not d.collected)
    if missing:
        return {"level": GAP, "blind": True, "missing": missing, "unlinked": False}
    unlinked = not rule.data_sources
    if rule.status == "active" and rule.tested and not unlinked:
        return {"level": FULL, "blind": False, "missing": [], "unlinked": False}
    return {"level": PARTIAL, "blind": False, "missing": [], "unlinked": unlinked}


def rule_level(rule: Rule) -> int:
    return rule_state(rule)["level"]


def depth_score(level: int, effective_rules: int, avg_quality: float) -> int:
    if level == GAP:
        return 0
    base = 70 if level == FULL else 40
    extra = min(20, 10 * max(0, effective_rules - 1))
    qual = round((max(1.0, avg_quality) - 1) / 4 * 10)
    return min(100, base + extra + qual)


def own_coverage(db: Session) -> dict:
    """technique_id -> {level, rules, live, blocked, missing, quality, score, best_rule, last_tested}"""
    rules = (
        db.query(Rule)
        .options(selectinload(Rule.techniques), selectinload(Rule.data_sources))
        .all()
    )
    agg: dict = {}
    for r in rules:
        st = rule_state(r)
        for t in r.techniques:
            a = agg.setdefault(
                t.id,
                {"level": GAP, "rules": 0, "live": 0, "blocked": 0, "missing": set(), "eff": 0, "qsum": 0,
                 "best": (-1, ""), "last_tested": "", "sources": set()},
            )
            a["rules"] += 1
            a["sources"].update(d.name for d in r.data_sources)
            a["level"] = max(a["level"], st["level"])
            if r.status != "disabled":
                a["live"] += 1
            if st["blind"]:
                a["blocked"] += 1
                a["missing"].update(st["missing"])
            if st["level"] > GAP:
                a["eff"] += 1
                a["qsum"] += r.quality or 0
                if st["level"] > a["best"][0]:
                    a["best"] = (st["level"], r.name)
            if r.last_tested and r.last_tested > a["last_tested"]:
                a["last_tested"] = r.last_tested
    for a in agg.values():
        avg = a["qsum"] / a["eff"] if a["eff"] else 0
        a["quality"] = round(avg, 1)
        a["score"] = depth_score(a["level"], a["eff"], avg)
        a["best_rule"] = a["best"][1]
        a["missing"] = sorted(a["missing"])
        a["sources"] = sorted(a["sources"])
        for k in ("qsum", "best"):
            del a[k]
    return agg


def collected_names(db: Session) -> set:
    from .models import DataSource

    return {n for (n,) in db.query(DataSource.name).filter(DataSource.collected.is_(True)).all()}


def visibility(t: Technique, collected: set) -> dict:
    """ATT&CK-ın bu texnika üçün tələb etdiyi log mənbələrindən neçəsi toplanır."""
    req = [s for s in (t.data_sources or "").split("|") if s]
    have = [s for s in req if s in collected]
    return {
        "required": req,
        "collected": have,
        "missing": [s for s in req if s not in collected],
        "known": bool(req),
        "blind": bool(req) and not have,
    }


def _plat(t: Technique) -> list:
    return [p for p in (t.platforms or "").split(",") if p]


def in_platform(t: Technique, platform: str) -> bool:
    return not platform or platform.lower() == "all" or platform in _plat(t)


def observed_counts(db: Session, hours: int = 24) -> dict:
    """Son N saatda honeypot-da müşahidə olunan hadisə sayı (texnika ID-si üzrə)."""
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import func

    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows = (
        db.query(HoneypotEvent.technique_id, func.count(HoneypotEvent.id))
        .filter(HoneypotEvent.ts >= since, HoneypotEvent.technique_id.isnot(None))
        .group_by(HoneypotEvent.technique_id)
        .all()
    )
    return {t: n for t, n in rows}


def unit_table(db: Session, platform: str = "Windows") -> list[dict]:
    """Hər texnika (ana və alt) üçün düz vəziyyət cədvəli. Monitor, boşluqlar və ixrac bundan istifadə edir."""
    own = own_coverage(db)
    collected = collected_names(db)
    observed = observed_counts(db)
    tactic_names = {x.shortname: x.name for x in db.query(Tactic).all()}
    out = []
    for t in db.query(Technique).all():
        if not in_platform(t, platform):
            continue
        c = own.get(t.id)
        vis = visibility(t, collected)
        level = c["level"] if c else GAP
        blocked = bool(c and c["blocked"])
        out.append(
            {
                "id": t.id,
                "name": t.name,
                "is_sub": bool(t.is_sub),
                "parent_id": t.parent_id,
                "tactics": [x for x in (t.tactics or "").split(",") if x],
                "tactic_names": [tactic_names.get(x, x) for x in (t.tactics or "").split(",") if x],
                "platforms": _plat(t),
                "level": level,
                "rules": c["rules"] if c else 0,
                "live": c["live"] if c else 0,
                "quality": c["quality"] if c else 0,
                "score": c["score"] if c else 0,
                "best_rule": c["best_rule"] if c else "",
                "last_tested": c["last_tested"] if c else "",
                "blocked_rules": c["blocked"] if c else 0,
                "missing_rule_sources": c["missing"] if c else [],
                "rule_sources": c["sources"] if c else [],
                "visibility": vis,
                # kor: əhatə yoxdur və səbəb telemetriyadır (qayda bloklanıb və ya ATT&CK-ın tələb etdiyi mənbə yoxdur)
                "blind": level == GAP and (blocked or vis["blind"]),
                "groups": t.group_count or 0,
                "obs": observed.get(t.id, 0),
            }
        )
    # «yarpaq» texnika: hadisələr ən dəqiq səviyyədə müşahidə olunur (alt-texnika). Alt-texnikası olan ana texnika
    # yalnız özünə qayda bağlıdırsa (ümumi aşkarlama) ayrıca hədəf sayılır.
    has_sub = {u["parent_id"] for u in out if u["is_sub"]}
    for u in out:
        u["leaf"] = u["is_sub"] or u["id"] not in has_sub or u["level"] > GAP
    return out


# ---------------------------------------------------------------- matris
def build_matrix(db: Session, platform: str = "Windows") -> dict:
    tactics = db.query(Tactic).order_by(Tactic.position).all()
    units = unit_table(db, platform)
    by_id = {u["id"]: u for u in units}

    children = defaultdict(list)
    for u in units:
        if u["is_sub"] and u["parent_id"]:
            children[u["parent_id"]].append(u)

    def node(u: dict) -> dict:
        return {
            "id": u["id"],
            "name": u["name"],
            "platforms": u["platforms"],
            "own": u["level"],
            "coverage": u["level"],
            "rules": u["rules"],
            "quality": u["quality"],
            "score": u["score"],
            "blind": u["blind"],
            "groups": u["groups"],
            "obs": u["obs"],
            "ds": sorted(set(u["visibility"]["required"]) | set(u["rule_sources"])),
        }

    by_tactic = defaultdict(list)
    for u in units:
        if u["is_sub"]:
            continue
        n = node(u)
        subs = sorted((node(s) for s in children[u["id"]]), key=lambda x: x["id"])
        n["subs"] = subs
        n["coverage"] = max([n["own"]] + [s["own"] for s in subs])
        n["score"] = max([n["score"]] + [s["score"] for s in subs])
        n["blind"] = n["coverage"] == GAP and (n["blind"] or any(s["blind"] for s in subs))
        n["ds"] = sorted(set(n["ds"]).union(*(s["ds"] for s in subs)))
        n["obs"] = n["obs"] + sum(s["obs"] for s in subs)
        n["sub_total"] = len(subs)
        n["sub_full"] = sum(1 for s in subs if s["own"] == FULL)
        n["sub_partial"] = sum(1 for s in subs if s["own"] == PARTIAL)
        for tac in u["tactics"]:
            by_tactic[tac].append(n)

    out = []
    for tac in tactics:
        items = sorted(by_tactic.get(tac.shortname, []), key=lambda x: x["name"].lower())
        if not items:  # platformaya aid texnikası olmayan taktika (məs. Reconnaissance) göstərilmir
            continue
        out.append({"shortname": tac.shortname, "name": tac.name, "ext_id": tac.ext_id, "techniques": items})

    stats = summarize(out)
    stats["weighted"] = weighted_detection(units)
    return {"tactics": out, "stats": stats, "platform": platform or "all"}


def weighted_detection(units: list) -> dict:
    """Risk-çəkili əhatə: tez-tez istifadə olunan texnikalar (çox qrup) daha çox çəkiyə malikdir."""
    num = den = 0.0
    for u in units:
        if not u.get("leaf", True):
            continue
        w = 1 + min(40, u["groups"])
        num += w * CREDIT[u["level"]]
        den += w
    return {"score": round(100 * num / den, 1) if den else 0.0}


def summarize(tactics: list) -> dict:
    uniq = {}
    for tac in tactics:
        for t in tac["techniques"]:
            uniq[t["id"]] = t

    techniques = _count(t["coverage"] for t in uniq.values())
    subs = _count(s["own"] for t in uniq.values() for s in t["subs"])
    techniques["blind"] = sum(1 for t in uniq.values() if t["blind"])
    per_tactic = []
    for tac in tactics:
        c = _count(t["coverage"] for t in tac["techniques"])
        c.update({"shortname": tac["shortname"], "name": tac["name"]})
        per_tactic.append(c)
    return {"techniques": techniques, "subtechniques": subs, "tactics": per_tactic}


def _count(items) -> dict:
    c = {"total": 0, "full": 0, "partial": 0, "gap": 0}
    for lvl in items:
        c["total"] += 1
        c[LABELS[lvl]] += 1
    return c


# ---------------------------------------------------------------- boşluq analizi
PRIO_RANK = {"high": 3, "medium": 2, "low": 1}


def gap_score(u: dict, note_prio: str | None) -> int:
    """Prioritet balı (yüksək = əvvəl bağlanmalı). Düstur docs/coverage.md-dədir."""
    s = {GAP: 40, PARTIAL: 15}[u["level"]]
    s += min(30, u["groups"])  # real hücumçu qrupların istifadəsi
    if u["blind"]:
        s += 10  # əvvəl telemetriya bağlanmalıdır
    s += {"high": 20, "medium": 10, "low": 4}.get(note_prio or "", 0)
    s += min(20, u.get("obs", 0))  # honeypot-da son 24 saatda real müşahidə
    return s


def gap_reason(u: dict) -> str:
    if u["blocked_rules"]:
        return "A rule exists, but its log source is not collected: " + ", ".join(u["missing_rule_sources"])
    if u["blind"]:
        return "Required log source not collected: " + ", ".join(u["visibility"]["missing"][:3])
    if u["level"] == PARTIAL:
        return "A rule exists but is not active and tested"
    if u["rules"] and not u["live"]:
        return "All rules are disabled"
    return "No detection rule"


# ---------------------------------------------------------------- monitor üçün kiçik keş
_cache: dict = {}
_lock = threading.Lock()


def cached_units(db: Session, platform: str = "Windows", ttl: float = 30.0) -> list:
    import time

    key = platform or "all"
    with _lock:
        hit = _cache.get(key)
        if hit and time.time() - hit[0] < ttl:
            return hit[1]
    units = unit_table(db, platform)
    with _lock:
        _cache[key] = (time.time(), units)
    return units


def invalidate():
    with _lock:
        _cache.clear()
