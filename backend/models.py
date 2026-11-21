from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship

from .database import Base


def _now():
    return datetime.now(timezone.utc)


rule_technique = Table(
    "rule_technique",
    Base.metadata,
    Column("rule_id", Integer, ForeignKey("rules.id", ondelete="CASCADE"), primary_key=True),
    Column("technique_id", String, ForeignKey("techniques.id", ondelete="CASCADE"), primary_key=True),
)

rule_datasource = Table(
    "rule_datasource",
    Base.metadata,
    Column("rule_id", Integer, ForeignKey("rules.id", ondelete="CASCADE"), primary_key=True),
    Column("datasource_id", Integer, ForeignKey("data_sources.id", ondelete="CASCADE"), primary_key=True),
)


class Meta(Base):
    __tablename__ = "meta"
    key = Column(String, primary_key=True)
    value = Column(String)


class Tactic(Base):
    __tablename__ = "tactics"
    shortname = Column(String, primary_key=True)  # məs: "credential-access"
    name = Column(String, nullable=False)
    ext_id = Column(String)  # məs: "TA0006"
    position = Column(Integer, default=0)


class Technique(Base):
    __tablename__ = "techniques"
    id = Column(String, primary_key=True)  # "T1059" və ya "T1059.001"
    name = Column(String, nullable=False)
    is_sub = Column(Boolean, default=False)
    parent_id = Column(String)
    tactics = Column(String, default="")  # vergüllə ayrılmış shortname-lər
    platforms = Column(String, default="")
    description = Column(Text, default="")
    url = Column(String, default="")
    # ATT&CK detection strategy -> analytic -> log source əlaqəsindən (Windows). "|" ilə ayrılır.
    data_sources = Column(Text, default="")
    # Bu texnikanı istifadə edən ATT&CK qrup (intrusion set) sayı: real dünyada nə qədər yayğındır
    group_count = Column(Integer, default=0)

    rules = relationship("Rule", secondary=rule_technique, back_populates="techniques")


class TechniqueAlias(Base):
    """ATT&CK-da ləğv edilmiş (revoked) ID -> onu əvəz edən ID. Köhnə etiketli qaydalar itməsin deyə."""

    __tablename__ = "technique_aliases"
    old_id = Column(String, primary_key=True)
    new_id = Column(String, nullable=False)


class DataSource(Base):
    """Log mənbəyi kataloqu. 'collected' = bu mənbə SIEM-ə həqiqətən toplanırmı."""

    __tablename__ = "data_sources"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)  # məs: "WinEventLog:Sysmon"
    category = Column(String, default="")
    description = Column(Text, default="")
    collector = Column(String, default="")  # məs: "Winlogbeat, Sysmon v15"
    collected = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), default=_now)

    rules = relationship("Rule", secondary=rule_datasource, back_populates="data_sources")


class Rule(Base):
    __tablename__ = "rules"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    source = Column(String, default="Manual")  # Sigma, Splunk, Elastic, Sentinel, Manual...
    status = Column(String, default="draft")  # draft | active | disabled
    quality = Column(Integer, default=3)  # 1-5
    tested = Column(Boolean, default=False)
    last_tested = Column(String)  # YYYY-MM-DD
    logsource = Column(String, default="")
    description = Column(Text, default="")
    content = Column(Text, default="")  # xam qayda mətni (Sigma YAML, SPL, KQL...)
    created_at = Column(DateTime(timezone=True), default=_now)

    techniques = relationship("Technique", secondary=rule_technique, back_populates="rules")
    data_sources = relationship("DataSource", secondary=rule_datasource, back_populates="rules")
    test_runs = relationship("TestRun", cascade="all, delete-orphan", order_by="TestRun.tested_at.desc()")


class TestRun(Base):
    """Qaydanın test qeydi: nə vaxt, necə, nəticə nə oldu."""

    __tablename__ = "test_runs"
    __test__ = False  # pytest bunu test sinfi saymasın
    id = Column(Integer, primary_key=True)
    rule_id = Column(Integer, ForeignKey("rules.id", ondelete="CASCADE"), nullable=False)
    tested_at = Column(String, nullable=False)  # YYYY-MM-DD
    result = Column(String, default="pass")  # pass | fail
    method = Column(String, default="")  # məs: "Atomic Red Team T1059.001-3"
    notes = Column(Text, default="")
    tester = Column(String, default="")
    created_at = Column(DateTime(timezone=True), default=_now)


class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True)
    technique_id = Column(String, ForeignKey("techniques.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    priority = Column(String, default="medium")  # low | medium | high
    created_at = Column(DateTime(timezone=True), default=_now)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="analyst")  # admin | analyst
    created_at = Column(DateTime(timezone=True), default=_now)


class HoneypotEvent(Base):
    """Honeypot-a gələn bir bağlantı. Mənbə: sensor agenti (real) və ya platformanın simulyasiyası."""

    __tablename__ = "honeypot_events"
    id = Column(Integer, primary_key=True)
    ts = Column(DateTime(timezone=True), default=_now, index=True)
    sensor = Column(String, default="")
    src_ip = Column(String, index=True)
    src_port = Column(Integer, default=0)
    dst_port = Column(Integer, index=True)
    proto = Column(String, default="tcp")
    service = Column(String, default="")
    category = Column(String, default="scan", index=True)  # scan | bruteforce | web | smb | rdp | database | exploit
    technique_id = Column(String, index=True)  # ATT&CK texnikası (heuristik uyğunlaşdırma)
    payload = Column(Text, default="")  # təmizlənmiş, qısaldılmış ilk baytlar (parollar qeyd olunmur)
    lat = Column(Float)
    lon = Column(Float)
    place = Column(String, default="")
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    asn = Column(Integer, nullable=True)
    organization = Column(String, nullable=True)
    location_source = Column(String, default="unknown")
    simulated = Column(Boolean, default=False)


class RuleReview(Base):
    __tablename__ = "rule_reviews"
    id = Column(Integer, primary_key=True)
    rule_id = Column(Integer, ForeignKey("rules.id", ondelete="CASCADE"), nullable=False, index=True)
    author = Column(String, nullable=False)
    reviewer = Column(String, default="")
    status = Column(String, nullable=False, default="pending")
    comment = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=_now)
    reviewed_at = Column(DateTime(timezone=True))
