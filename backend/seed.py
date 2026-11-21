"""Demo üçün nümunə qaydaları yükləyir (yalnız qayda cədvəli boşdursa)."""
from sqlalchemy.orm import Session

from .database import DATA_DIR
from .datasources import suggest
from .linking import attach_sources, attach_techniques
from .models import Meta, Note, Rule, TestRun, Technique
from .seed_content import NEW_NOTES, NEW_RULES, NEW_TESTS, SOURCES, TESTS
from .sigma import parse_sigma, sigma_tags

SAMPLE_DIR = DATA_DIR / "sample_rules"

# başlıq -> (status, test olunub, keyfiyyət)
SIGMA_STATE = {
    "Encoded PowerShell Command Line": ("active", True, 4),
    "Windows Security Event Log Cleared": ("active", True, 5),
    "LSASS Memory Access by Non-System Process": ("active", True, 4),
    "New Local User Account Created": ("active", False, 3),
    "Scheduled Task Created via schtasks": ("active", True, 3),
    "Password Spraying - Many Failed Logons From One Source": ("active", True, 4),
    "Rundll32 Spawned From Office Application": ("draft", False, 2),
    "Service Installed With Suspicious Binary Path": ("active", False, 3),
    "RDP Logon From External Address": ("active", True, 3),
    "Web Server Worker Spawns Command Shell": ("disabled", False, 2),
    "Shadow Copy Deletion via vssadmin": ("active", True, 5),
    "DNS Query to Dynamic DNS Provider": ("draft", False, 2),
    "NTLM Logon With Pass-the-Hash Pattern": ("active", True, 3),
    "Registry Run Key Modification": ("active", True, 4),
    "Kerberoasting - RC4 Service Ticket Requests": ("active", True, 4),
    "Microsoft Defender Real-Time Protection Disabled": ("active", False, 3),
}

MANUAL = [
    ("Certutil Download Activity", "Splunk", "active", True, 4, ["T1105"], "Sysmon / EDR",
     "certutil.exe ilə uzaq fayl yüklənməsi."),
    ("Credential Dumping via comsvcs.dll MiniDump", "Elastic", "active", True, 4, ["T1003.001"],
     "Windows / process", "comsvcs.dll vasitəsilə LSASS yaddaş dump-ı."),
    ("Sign-in From Unfamiliar Country", "Sentinel", "active", False, 3, ["T1078.004"],
     "Entra ID / SigninLogs", "Əvvəl görünməyən ölkədən giriş."),
]

NOTES = [
    ("T1566", "Fişinq e-poçtları üçün aşkarlama yoxdur. E-poçt gateway loglarını SIEM-ə qoşmaq lazımdır.", "high"),
    ("T1190", "Veb tətbiq WAF logları hələ toplanmır.", "high"),
    ("T1021", "SMB/WinRM üçün qayda yazılmalıdır, RDP artıq örtülüb.", "medium"),
]


def _attach(db: Session, rule: Rule, ids: list[str]):
    attach_techniques(db, rule, ids)


def _add_runs(db: Session, rule: Rule, runs):
    """Test qeydlərini əlavə edir və qaydanın tested/last_tested sahələrini ən son nəticədən çıxarır."""
    for date, result, method, notes in runs:
        db.add(TestRun(rule_id=rule.id, tested_at=date, result=result, method=method,
                       notes=notes, tester="iBlueTeam lab"))
    last = max(runs, key=lambda r: r[0])
    rule.tested = last[1] == "pass"
    rule.last_tested = last[0]


def upgrade_content(db: Session) -> str:
    """Bir dəfəlik yeniləmə: log mənbələri, test qeydləri, yeni qaydalar, ləğv olunmuş ID-lərin təmiri."""
    if db.get(Meta, "seed_v2"):
        return ""
    db.flush()
    notes = []

    # 1) Sigma mətnindəki etiketlərə görə texnika bağlantılarını təmir et (ləğv olunmuş ID-lər itirilmişdi)
    repaired = 0
    for r in db.query(Rule).filter(Rule.source == "Sigma").all():
        tags = sigma_tags(r.content)
        have = {t.id for t in r.techniques}
        if tags and not set(tags) <= have:
            attach_techniques(db, r, list(have) + tags)
            repaired += 1
    if repaired:
        notes.append(f"{repaired} qaydanın texnika bağlantısı təmir olundu")

    # 2) Yeni qaydalar (ada görə təkrarsız)
    names = {n for (n,) in db.query(Rule.name).all()}
    added = 0
    for spec in NEW_RULES:
        if spec["name"] in names:
            continue
        parsed = parse_sigma(spec["content"])[0]
        r = Rule(name=spec["name"], source="Sigma", status=spec["status"], tested=False, quality=spec["quality"],
                 logsource=parsed["logsource"], description=spec["desc"], content=spec["content"])
        db.add(r)
        db.flush()
        attach_techniques(db, r, spec["techniques"])
        attach_sources(db, r, spec["sources"])
        added += 1
    db.flush()
    if added:
        notes.append(f"{added} yeni qayda")

    # 3) Log mənbəyi və test qeydləri
    linked = 0
    for r in db.query(Rule).all():
        if not r.data_sources:
            names_ = SOURCES.get(r.name) or suggest(r.logsource)
            if names_:
                attach_sources(db, r, names_)
                linked += 1
        runs = (TESTS.get(r.name) or NEW_TESTS.get(r.name)) if not r.test_runs else None
        if runs:
            _add_runs(db, r, runs)
    if linked:
        notes.append(f"{linked} qaydaya log mənbəyi bağlandı")

    for tid, text, prio in NEW_NOTES:
        if db.get(Technique, tid) and not db.query(Note).filter(Note.technique_id == tid).count():
            db.add(Note(technique_id=tid, text=text, priority=prio))

    db.merge(Meta(key="seed_v2", value="1"))
    db.commit()
    return "; ".join(notes)


def seed_sample_rules(db: Session) -> int:
    if db.query(Rule).count() > 0:
        upgrade_content(db)
        return 0

    created = 0
    path = SAMPLE_DIR / "sample_sigma_rules.yml"
    if path.exists():
        for i, item in enumerate(parse_sigma(path.read_text(encoding="utf-8"))):
            status, tested, quality = SIGMA_STATE.get(item["name"], ("draft", False, 3))
            rule = Rule(
                name=item["name"], source="Sigma", status=status, tested=tested, quality=quality,
                last_tested=f"2026-09-{10 + i:02d}" if tested else None,
                logsource=item["logsource"], description=item["description"], content=item["content"],
            )
            _attach(db, rule, item["techniques"])
            db.add(rule)
            created += 1

    for i, (name, source, status, tested, quality, techs, logsource, desc) in enumerate(MANUAL):
        rule = Rule(
            name=name, source=source, status=status, tested=tested, quality=quality,
            last_tested=f"2026-10-{5 + i:02d}" if tested else None, logsource=logsource, description=desc,
        )
        _attach(db, rule, techs)
        db.add(rule)
        created += 1

    for tid, text, prio in NOTES:
        if db.get(Technique, tid):
            db.add(Note(technique_id=tid, text=text, priority=prio))

    db.commit()
    upgrade_content(db)
    return created
