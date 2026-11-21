"""IP -> yer (ixtiyari). GeoIP bazası olmadan real IP-lər xəritədə göstərilmir, qalan hər şey işləyir.

Pulsuz baza: DB-IP «IP to City Lite» (mmdb) və ya MaxMind GeoLite2-City.
Faylı data/GeoLite2-City.mmdb və ya data/dbip-city-lite.mmdb adı ilə qoyun və `pip install maxminddb` edin.
"""
import ipaddress
import json
import os
from pathlib import Path

from .database import DATA_DIR

_CANDIDATES = ["GeoLite2-City.mmdb", "dbip-city-lite.mmdb", "city.mmdb"]
_reader = None
_tried = False


def _open():
    global _reader, _tried
    if _tried:
        return _reader
    _tried = True
    try:
        import maxminddb  # type: ignore
    except ImportError:
        return None
    for name in _CANDIDATES:
        path = DATA_DIR / name
        if path.exists():
            try:
                _reader = maxminddb.open_database(str(path))
                break
            except Exception:  # noqa: BLE001  (zədələnmiş fayl)
                _reader = None
    return _reader


def status() -> dict:
    try:
        import maxminddb  # type: ignore  # noqa: F401

        lib = True
    except ImportError:
        lib = False
    return {"library": lib, "database": _open() is not None, "lab_mappings": len(_lab_entries()), "asn_database": _open_asn() is not None}


def is_public(ip: str) -> bool:
    try:
        a = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (a.is_private or a.is_loopback or a.is_link_local or a.is_reserved or a.is_multicast or a.is_unspecified)


def lookup(ip: str):
    """(lat, lon, 'Şəhər, Ölkə') və ya None."""
    r = _open()
    if not r or not is_public(ip):
        return None
    try:
        rec = r.get(ip) or {}
        loc = rec.get("location") or {}
        if loc.get("latitude") is None or loc.get("longitude") is None:
            return None
        city = ((rec.get("city") or {}).get("names") or {}).get("en", "")
        country = ((rec.get("country") or {}).get("names") or {}).get("en", "")
        place = ", ".join(x for x in (city, country) if x)
        return float(loc["latitude"]), float(loc["longitude"]), place
    except Exception:  # noqa: BLE001
        return None


LAB_FILE = DATA_DIR / "lab-locations.json"


def _lab_entries():
    path = Path(os.environ.get("IBT_LAB_GEO_FILE", str(LAB_FILE)))
    try:
        if not path.is_file() or path.stat().st_size > 65536:
            return []
        entries = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(entries, list):
            return []
        valid = []
        for item in entries[:100]:
            if not isinstance(item, dict):
                continue
            try:
                network = ipaddress.ip_network(item["network"], strict=False)
                lat, lon = float(item["lat"]), float(item["lon"])
                label = str(item.get("label", "Lab VM"))[:70]
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    continue
                if not network.is_private:
                    continue
                valid.append((network, lat, lon, label))
            except (ValueError, TypeError, KeyError):
                continue
        return valid
    except (OSError, ValueError, UnicodeError):
        return []


def lookup_with_lab(ip: str):
    """Returns coordinates, place, and source. Lab coordinates are explicitly configured, not inferred."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return None
    if not is_public(ip):
        for network, lat, lon, label in _lab_entries():
            if addr in network:
                return lat, lon, f"[LAB] {label}", "lab"
        return None
    result = lookup(ip)
    return (*result, "geoip") if result else None


_ASN_CANDIDATES = ("GeoLite2-ASN.mmdb", "dbip-asn-lite.mmdb", "asn.mmdb")
_asn_reader = None
_asn_tried = False


def _open_asn():
    global _asn_reader, _asn_tried
    if _asn_tried:
        return _asn_reader
    _asn_tried = True
    try:
        import maxminddb
    except ImportError:
        return None
    for filename in _ASN_CANDIDATES:
        path = DATA_DIR / filename
        if path.is_file():
            try:
                _asn_reader = maxminddb.open_database(str(path))
                break
            except (OSError, ValueError):
                continue
    return _asn_reader


def enrich_ip(ip: str) -> dict:
    result = {"country": None, "city": None, "lat": None, "lon": None,
              "place": "", "asn": None, "organization": None, "location_source": "unknown"}
    try:
        address = ipaddress.ip_address(ip)
    except ValueError:
        return result
    if not address.is_global:
        lab = lookup_with_lab(ip)
        if lab:
            result.update(lat=lab[0], lon=lab[1], place=lab[2], location_source="lab")
        return result
    city_reader = _open()
    if city_reader:
        try:
            record = city_reader.get(ip) or {}
            country = (record.get("country") or {}).get("names") or {}
            city = (record.get("city") or {}).get("names") or {}
            loc = record.get("location") or {}
            result["country"] = country.get("en")
            result["city"] = city.get("en")
            result["lat"] = float(loc["latitude"]) if loc.get("latitude") is not None else None
            result["lon"] = float(loc["longitude"]) if loc.get("longitude") is not None else None
            result["place"] = ", ".join(v for v in (result["city"], result["country"]) if v)
            if result["place"] or result["lat"] is not None:
                result["location_source"] = "geoip"
        except (OSError, ValueError, TypeError, KeyError):
            pass
    asn_reader = _open_asn()
    if asn_reader:
        try:
            record = asn_reader.get(ip) or {}
            result["asn"] = record.get("autonomous_system_number")
            result["organization"] = record.get("autonomous_system_organization")
        except (OSError, ValueError, TypeError):
            pass
    return result
