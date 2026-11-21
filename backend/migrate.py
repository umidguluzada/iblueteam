"""Sxem yeniləməsi: köhnə bazanı pozmadan yeni cədvəl və sütunları əlavə edir."""
from sqlalchemy import text

from .database import Base, engine


def ensure_schema():
    from . import models  # noqa: F401  (cədvəllərin qeydiyyatı)

    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        cols = {r[1] for r in conn.execute(text("PRAGMA table_info(techniques)"))}
        if "data_sources" not in cols:
            conn.execute(text("ALTER TABLE techniques ADD COLUMN data_sources TEXT DEFAULT ''"))
        if "group_count" not in cols:
            conn.execute(text("ALTER TABLE techniques ADD COLUMN group_count INTEGER DEFAULT 0"))

        event_cols = {r[1] for r in conn.execute(text("PRAGMA table_info(honeypot_events)"))}
        for column, datatype in (("country", "TEXT"), ("city", "TEXT"),
                                 ("asn", "INTEGER"), ("organization", "TEXT"),
                                 ("location_source", "TEXT DEFAULT 'unknown'")):
            if column not in event_cols:
                conn.execute(text(f"ALTER TABLE honeypot_events ADD COLUMN {column} {datatype}"))
