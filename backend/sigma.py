"""Sigma YAML faylından qayda məlumatını çıxarır (title, tags, logsource, description)."""
import re

import yaml

TAG_RE = re.compile(r"^attack\.(t\d{4}(?:\.\d{3})?)$", re.IGNORECASE)


def parse_sigma(text: str) -> list[dict]:
    """Bir faylda bir neçə sənəd (---) ola bilər. Hər sənəd üçün bir qayda qaytarır."""
    rules = []
    for doc in yaml.safe_load_all(text):
        if not isinstance(doc, dict) or not doc.get("title"):
            continue

        techniques = []
        for tag in doc.get("tags") or []:
            m = TAG_RE.match(str(tag).strip())
            if m and m.group(1).upper() not in techniques:
                techniques.append(m.group(1).upper())

        ls = doc.get("logsource") or {}
        if isinstance(ls, dict):
            logsource = " / ".join(str(ls[k]) for k in ("product", "category", "service") if ls.get(k))
        else:
            logsource = str(ls)

        rules.append(
            {
                "name": str(doc["title"]).strip(),
                "description": str(doc.get("description") or "").strip(),
                "logsource": logsource,
                "techniques": techniques,
                "content": yaml.safe_dump(doc, sort_keys=False, allow_unicode=True),
            }
        )
    return rules


def sigma_tags(content: str) -> list[str]:
    """Saxlanmış Sigma mətnindən ATT&CK texnika ID-lərini çıxarır."""
    try:
        docs = list(yaml.safe_load_all(content or ""))
    except yaml.YAMLError:
        return []
    out = []
    for doc in docs:
        if isinstance(doc, dict):
            for tag in doc.get("tags") or []:
                m = TAG_RE.match(str(tag).strip())
                if m and m.group(1).upper() not in out:
                    out.append(m.group(1).upper())
    return out
