"""Live Detection Monitor üçün sintetik hadisə generatoru.

Hadisələr UYDURMADIR, amma real hücum deyil: texnika əhatə cədvəlindən (çəkiyə görə) seçilir,
nəticə (aşkarlandı / qismən / qaçırıldı) platformanın CARİ əhatə hesablamasından gəlir.
Yəni qayda əlavə edib test etsəniz, monitorda həmin texnika dərhal «aşkarlandı» görünür.
Mənbə nöqtələri məlumat mərkəzi şəhərləridir (hücumçu mənşəyi iddiası yoxdur), IP-lər sənəd aralığındandır.
"""
import itertools
import os
import random
from datetime import datetime, timezone

from .coverage import FULL, GAP, PARTIAL, gap_reason

TARGET = {
    "name": os.environ.get("IBT_TARGET_NAME", "Qorunan şəbəkə"),
    "lat": float(os.environ.get("IBT_TARGET_LAT", "47.38")),
    "lon": float(os.environ.get("IBT_TARGET_LON", "8.54")),
}

# (ad, enlik, uzunluq)
HUBS = [
    ("Amsterdam", 52.37, 4.90), ("London", 51.51, -0.13), ("Stokholm", 59.33, 18.07),
    ("Varşava", 52.23, 21.01), ("Virciniya", 38.95, -77.45), ("Oreqon", 45.60, -121.18),
    ("Toronto", 43.65, -79.38), ("San-Paulu", -23.55, -46.63), ("Mumbay", 19.08, 72.88),
    ("Sinqapur", 1.35, 103.82), ("Tokio", 35.68, 139.69), ("Seul", 37.57, 126.98),
    ("Sidney", -33.87, 151.21), ("Yohannesburq", -26.20, 28.05), ("Dubay", 25.20, 55.27),
    ("Mexiko", 19.43, -99.13),
]
HOSTS = ["WS-014", "WS-027", "WS-031", "LT-117", "SRV-FILE-01", "SRV-WEB-02", "SRV-SQL-01", "DC-01", "DC-02"]
_NETS = ["198.51.100", "203.0.113", "192.0.2"]  # RFC 5737: sənəd üçün ayrılmış IP aralıqları
_seq = itertools.count(1)

_hubs = [h for h in HUBS if abs(h[1] - TARGET["lat"]) + abs(h[2] - TARGET["lon"]) > 6]


def _outcome(level: int) -> str:
    return {FULL: "detected", PARTIAL: "partial", GAP: "missed"}[level]


def make_events(units: list, n: int, rng: random.Random | None = None) -> list[dict]:
    rng = rng or random
    pool = [u for u in units if u.get("leaf", True)]
    if not pool:
        return []
    weights = [1 + min(40, u["groups"]) for u in pool]
    picks = rng.choices(pool, weights=weights, k=n)
    out = []
    for u in picks:
        hub = rng.choice(_hubs)
        tactic_i = rng.randrange(len(u["tactics"])) if u["tactics"] else 0
        outcome = _outcome(u["level"])
        if outcome == "detected":
            reason = f"Qayda: {u['best_rule']}"
        elif outcome == "partial":
            reason = f"{u['best_rule']}: aktiv və ya test olunmuş deyil"
        else:
            reason = gap_reason(u)
        out.append(
            {
                "id": next(_seq),
                "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "technique": u["id"],
                "name": u["name"],
                "tactic": u["tactic_names"][tactic_i] if u["tactic_names"] else "",
                "tactic_key": u["tactics"][tactic_i] if u["tactics"] else "",
                "outcome": outcome,
                "blind": bool(u["blind"]),
                "reason": reason,
                "rule": u["best_rule"] or None,
                "groups": u["groups"],
                "host": rng.choice(HOSTS),
                "src": {"name": hub[0], "lat": hub[1], "lon": hub[2], "ip": f"{rng.choice(_NETS)}.{rng.randint(2, 250)}"},
            }
        )
    return out
