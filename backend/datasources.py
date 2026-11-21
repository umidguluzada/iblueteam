"""Log mənbəyi kataloqu: ad -> kateqoriya, təsvir, susmaya görə toplanırmı.

Kataloqun adları MITRE ATT&CK analitiklərindəki log source adlarıdır (məs. WinEventLog:Sysmon).
Beləliklə hər texnikanın «lazım olan data source»-u real ATT&CK məlumatından gəlir.
"""
import re

from sqlalchemy.orm import Session

from .models import DataSource

# Lab mühitində həqiqətən toplanan mənbələr (qalan hamısı «toplanmır» başlayır, əl ilə dəyişdirilir)
COLLECTED_DEFAULT = {
    "WinEventLog:Sysmon",
    "WinEventLog:Security",
    "WinEventLog:PowerShell",
    "WinEventLog:System",
    "WinEventLog:Application",
    "WinEventLog:WMI",
    "WinEventLog:TaskScheduler",
    "WinEventLog:Windows Defender",
    "WinEventLog:Microsoft-Windows-Windows Defender/Operational",
    "dns:query",
}

KNOWN = {
    "WinEventLog:Sysmon": ("Sysmon + Winlogbeat", "Proses yaradılması, şəbəkə bağlantısı, registry, fayl, modul və LSASS girişi hadisələri."),
    "WinEventLog:Security": ("Winlogbeat", "Windows Security jurnalı: giriş, hesab dəyişikliyi, Kerberos, audit hadisələri."),
    "WinEventLog:PowerShell": ("Winlogbeat", "PowerShell Script Block (4104) və modul jurnalı."),
    "WinEventLog:System": ("Winlogbeat", "Servis quraşdırılması, sürücü və sistem hadisələri."),
    "WinEventLog:Application": ("Winlogbeat", "Tətbiq jurnalı."),
    "WinEventLog:WMI": ("Winlogbeat", "WMI-Activity jurnalı: WMI abunəlikləri və uzaq çağırışlar."),
    "WinEventLog:TaskScheduler": ("Winlogbeat", "Task Scheduler əməliyyat jurnalı."),
    "WinEventLog:Windows Defender": ("Winlogbeat", "Microsoft Defender antivirus hadisələri."),
    "NSM:Flow": ("Zeek / Suricata", "Şəbəkə sensorunun axın və protokol qeydləri (SMB, DNS, HTTP)."),
    "dns:query": ("Sysmon EID 22 / DNS server", "DNS sorğu jurnalı."),
    "ApplicationLog:IIS": ("Filebeat", "IIS veb server giriş jurnalı."),
    "azure:signinlogs": ("Entra ID diagnostic settings", "Entra ID (Azure AD) giriş jurnalı."),
}


def category_of(name: str) -> str:
    return name.split(":", 1)[0].strip() if ":" in name else "Digər"


def seed_catalog(db: Session, names) -> int:
    """Kataloqda olmayan adları əlavə edir. Mövcud 'collected' seçimlərinə toxunmur."""
    have = {n for (n,) in db.query(DataSource.name).all()}
    added = 0
    for name in sorted({n.strip() for n in names if n and n.strip()}):
        if name in have:
            continue
        collector, desc = KNOWN.get(name, ("", "ATT&CK analitikalarında istifadə olunan log mənbəyi."))
        db.add(DataSource(name=name, category=category_of(name), description=desc, collector=collector,
                          collected=name in COLLECTED_DEFAULT))
        added += 1
    db.flush()
    return added


# Sigma logsource mətnindən log mənbəyi təklifi (açar söz -> katalog adı)
_HINTS = [
    (r"sysmon|process_creation|process creation|process_access|registry|image_load|file_event|network_connection|edr|windows / process", "WinEventLog:Sysmon"),
    (r"powershell", "WinEventLog:PowerShell"),
    (r"security|logon|kerberos|account", "WinEventLog:Security"),
    (r"dns", "dns:query"),
    (r"windefend|defender", "WinEventLog:Windows Defender"),
    (r"windows / system|/ system|service", "WinEventLog:System"),
    (r"taskscheduler|task scheduler", "WinEventLog:TaskScheduler"),
    (r"wmi", "WinEventLog:WMI"),
    (r"iis|webserver|web server", "ApplicationLog:IIS"),
    (r"signin|entra|azure", "azure:signinlogs"),
]


def suggest(logsource: str) -> list[str]:
    text = (logsource or "").lower()
    out = []
    for pattern, name in _HINTS:
        if re.search(pattern, text) and name not in out:
            out.append(name)
    # Sysmon və Security eyni anda təklif olunsa, ilk uyğunluq kifayətdir: AND şərti ağırlaşmasın
    return out[:1] if out else []
