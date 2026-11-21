"""Qaydanı texnikalara və log mənbələrinə bağlayan ortaq köməkçilər."""
from sqlalchemy.orm import Session

from .models import DataSource, Rule, Technique, TechniqueAlias


def normalize_ids(ids) -> list[str]:
    out = []
    for i in ids:
        i = str(i).strip().upper()
        if i and i not in out:
            out.append(i)
    return out


def attach_techniques(db: Session, rule: Rule, ids) -> list[str]:
    """Texnikaları qaydaya bağlayır. ATT&CK-da ləğv olunmuş ID avtomatik yeni ID-yə çevrilir.
    Bazada tapılmayan ID-ləri qaytarır."""
    ids = normalize_ids(ids)
    alias = {a.old_id: a.new_id for a in db.query(TechniqueAlias).filter(TechniqueAlias.old_id.in_(ids)).all()} if ids else {}
    resolved = []
    for i in ids:
        j = alias.get(i, i)
        if j not in resolved:
            resolved.append(j)
    found = db.query(Technique).filter(Technique.id.in_(resolved)).all() if resolved else []
    rule.techniques = found
    known = {t.id for t in found}
    return [i for i in ids if alias.get(i, i) not in known]


def attach_sources(db: Session, rule: Rule, names) -> list[str]:
    """Log mənbələrini adla bağlayır. Kataloqda olmayan adları qaytarır."""
    names = [n.strip() for n in names if n and n.strip()]
    found = db.query(DataSource).filter(DataSource.name.in_(names)).all() if names else []
    rule.data_sources = found
    have = {d.name for d in found}
    return [n for n in names if n not in have]
