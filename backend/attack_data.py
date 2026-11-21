"""Ehtiyat (fallback) ATT&CK dəsti.

Internet olmadıqda və ya data/enterprise-attack.json faylı yoxdursa istifadə olunur.
Bu, tam matris deyil, əsas texnikaların seçmə hissəsidir. Tam məlumat üçün:
    python run.py --reimport-attack
"""

TACTICS = [
    ("reconnaissance", "Reconnaissance", "TA0043"),
    ("resource-development", "Resource Development", "TA0042"),
    ("initial-access", "Initial Access", "TA0001"),
    ("execution", "Execution", "TA0002"),
    ("persistence", "Persistence", "TA0003"),
    ("privilege-escalation", "Privilege Escalation", "TA0004"),
    ("defense-evasion", "Defense Evasion", "TA0005"),
    ("credential-access", "Credential Access", "TA0006"),
    ("discovery", "Discovery", "TA0007"),
    ("lateral-movement", "Lateral Movement", "TA0008"),
    ("collection", "Collection", "TA0009"),
    ("command-and-control", "Command and Control", "TA0011"),
    ("exfiltration", "Exfiltration", "TA0010"),
    ("impact", "Impact", "TA0040"),
]

CODE = {
    "REC": "reconnaissance",
    "RES": "resource-development",
    "INI": "initial-access",
    "EXE": "execution",
    "PER": "persistence",
    "PRI": "privilege-escalation",
    "DEF": "defense-evasion",
    "CRE": "credential-access",
    "DIS": "discovery",
    "LAT": "lateral-movement",
    "COL": "collection",
    "C2": "command-and-control",
    "EXF": "exfiltration",
    "IMP": "impact",
}

# (id, ad, taktikalar, alt-texnikalar)
TECHS = [
    ("T1595", "Active Scanning", "REC", []),
    ("T1592", "Gather Victim Host Information", "REC", []),
    ("T1589", "Gather Victim Identity Information", "REC", []),
    ("T1590", "Gather Victim Network Information", "REC", []),
    ("T1591", "Gather Victim Org Information", "REC", []),
    ("T1598", "Phishing for Information", "REC", []),
    ("T1597", "Search Closed Sources", "REC", []),
    ("T1596", "Search Open Technical Databases", "REC", []),
    ("T1593", "Search Open Websites/Domains", "REC", []),
    ("T1594", "Search Victim-Owned Websites", "REC", []),
    ("T1583", "Acquire Infrastructure", "RES", []),
    ("T1586", "Compromise Accounts", "RES", []),
    ("T1584", "Compromise Infrastructure", "RES", []),
    ("T1587", "Develop Capabilities", "RES", []),
    ("T1585", "Establish Accounts", "RES", []),
    ("T1588", "Obtain Capabilities", "RES", []),
    ("T1608", "Stage Capabilities", "RES", []),
    ("T1189", "Drive-by Compromise", "INI", []),
    ("T1190", "Exploit Public-Facing Application", "INI", []),
    ("T1133", "External Remote Services", "INI PER", []),
    ("T1200", "Hardware Additions", "INI", []),
    ("T1566", "Phishing", "INI", [("001", "Spearphishing Attachment"), ("002", "Spearphishing Link"), ("003", "Spearphishing via Service")]),
    ("T1091", "Replication Through Removable Media", "INI", []),
    ("T1195", "Supply Chain Compromise", "INI", []),
    ("T1199", "Trusted Relationship", "INI", []),
    ("T1078", "Valid Accounts", "INI PER PRI DEF", [("001", "Default Accounts"), ("002", "Domain Accounts"), ("003", "Local Accounts"), ("004", "Cloud Accounts")]),
    ("T1059", "Command and Scripting Interpreter", "EXE", [("001", "PowerShell"), ("003", "Windows Command Shell"), ("004", "Unix Shell"), ("005", "Visual Basic"), ("006", "Python"), ("007", "JavaScript")]),
    ("T1203", "Exploitation for Client Execution", "EXE", []),
    ("T1559", "Inter-Process Communication", "EXE", []),
    ("T1106", "Native API", "EXE", []),
    ("T1053", "Scheduled Task/Job", "EXE PER PRI", [("003", "Cron"), ("005", "Scheduled Task")]),
    ("T1129", "Shared Modules", "EXE", []),
    ("T1072", "Software Deployment Tools", "EXE LAT", []),
    ("T1569", "System Services", "EXE", [("002", "Service Execution")]),
    ("T1204", "User Execution", "EXE", [("001", "Malicious Link"), ("002", "Malicious File")]),
    ("T1047", "Windows Management Instrumentation", "EXE", []),
    ("T1098", "Account Manipulation", "PER PRI", []),
    ("T1197", "BITS Jobs", "PER DEF", []),
    ("T1547", "Boot or Logon Autostart Execution", "PER PRI", [("001", "Registry Run Keys / Startup Folder")]),
    ("T1136", "Create Account", "PER", [("001", "Local Account"), ("002", "Domain Account")]),
    ("T1543", "Create or Modify System Process", "PER PRI", [("003", "Windows Service")]),
    ("T1546", "Event Triggered Execution", "PER PRI", []),
    ("T1505", "Server Software Component", "PER", [("003", "Web Shell")]),
    ("T1548", "Abuse Elevation Control Mechanism", "PRI DEF", [("002", "Bypass User Account Control")]),
    ("T1134", "Access Token Manipulation", "PRI DEF", []),
    ("T1068", "Exploitation for Privilege Escalation", "PRI", []),
    ("T1055", "Process Injection", "PRI DEF", []),
    ("T1140", "Deobfuscate/Decode Files or Information", "DEF", []),
    ("T1562", "Impair Defenses", "DEF", [("001", "Disable or Modify Tools")]),
    ("T1070", "Indicator Removal", "DEF", [("001", "Clear Windows Event Logs"), ("004", "File Deletion")]),
    ("T1036", "Masquerading", "DEF", []),
    ("T1112", "Modify Registry", "DEF", []),
    ("T1027", "Obfuscated Files or Information", "DEF", []),
    ("T1218", "System Binary Proxy Execution", "DEF", [("005", "Mshta"), ("011", "Rundll32")]),
    ("T1110", "Brute Force", "CRE", [("001", "Password Guessing"), ("003", "Password Spraying")]),
    ("T1555", "Credentials from Password Stores", "CRE", []),
    ("T1003", "OS Credential Dumping", "CRE", [("001", "LSASS Memory"), ("002", "Security Account Manager"), ("003", "NTDS")]),
    ("T1558", "Steal or Forge Kerberos Tickets", "CRE", [("003", "Kerberoasting")]),
    ("T1056", "Input Capture", "CRE COL", []),
    ("T1552", "Unsecured Credentials", "CRE", []),
    ("T1539", "Steal Web Session Cookie", "CRE", []),
    ("T1621", "Multi-Factor Authentication Request Generation", "CRE", []),
    ("T1087", "Account Discovery", "DIS", []),
    ("T1482", "Domain Trust Discovery", "DIS", []),
    ("T1083", "File and Directory Discovery", "DIS", []),
    ("T1046", "Network Service Discovery", "DIS", []),
    ("T1135", "Network Share Discovery", "DIS", []),
    ("T1057", "Process Discovery", "DIS", []),
    ("T1018", "Remote System Discovery", "DIS", []),
    ("T1082", "System Information Discovery", "DIS", []),
    ("T1016", "System Network Configuration Discovery", "DIS", []),
    ("T1033", "System Owner/User Discovery", "DIS", []),
    ("T1049", "System Network Connections Discovery", "DIS", []),
    ("T1069", "Permission Groups Discovery", "DIS", []),
    ("T1021", "Remote Services", "LAT", [("001", "Remote Desktop Protocol"), ("002", "SMB/Windows Admin Shares"), ("006", "Windows Remote Management")]),
    ("T1550", "Use Alternate Authentication Material", "DEF LAT", [("002", "Pass the Hash"), ("003", "Pass the Ticket")]),
    ("T1570", "Lateral Tool Transfer", "LAT", []),
    ("T1210", "Exploitation of Remote Services", "LAT", []),
    ("T1563", "Remote Service Session Hijacking", "LAT", []),
    ("T1560", "Archive Collected Data", "COL", []),
    ("T1119", "Automated Collection", "COL", []),
    ("T1005", "Data from Local System", "COL", []),
    ("T1039", "Data from Network Shared Drive", "COL", []),
    ("T1074", "Data Staged", "COL", []),
    ("T1113", "Screen Capture", "COL", []),
    ("T1114", "Email Collection", "COL", []),
    ("T1115", "Clipboard Data", "COL", []),
    ("T1071", "Application Layer Protocol", "C2", [("001", "Web Protocols"), ("004", "DNS")]),
    ("T1105", "Ingress Tool Transfer", "C2", []),
    ("T1090", "Proxy", "C2", []),
    ("T1572", "Protocol Tunneling", "C2", []),
    ("T1573", "Encrypted Channel", "C2", []),
    ("T1219", "Remote Access Software", "C2", []),
    ("T1095", "Non-Application Layer Protocol", "C2", []),
    ("T1102", "Web Service", "C2", []),
    ("T1041", "Exfiltration Over C2 Channel", "EXF", []),
    ("T1048", "Exfiltration Over Alternative Protocol", "EXF", []),
    ("T1567", "Exfiltration Over Web Service", "EXF", []),
    ("T1020", "Automated Exfiltration", "EXF", []),
    ("T1030", "Data Transfer Size Limits", "EXF", []),
    ("T1537", "Transfer Data to Cloud Account", "EXF", []),
    ("T1486", "Data Encrypted for Impact", "IMP", []),
    ("T1490", "Inhibit System Recovery", "IMP", []),
    ("T1489", "Service Stop", "IMP", []),
    ("T1485", "Data Destruction", "IMP", []),
    ("T1498", "Network Denial of Service", "IMP", []),
    ("T1491", "Defacement", "IMP", []),
    ("T1531", "Account Access Removal", "IMP", []),
    ("T1496", "Resource Hijacking", "IMP", []),
]

# Yalnız Windows-a aid olanlar (qalanlara Windows/Linux/macOS yazılır)
WINDOWS_ONLY = {
    "T1047", "T1218", "T1218.005", "T1218.011", "T1112", "T1197", "T1003.001", "T1003.002",
    "T1003.003", "T1021.001", "T1021.002", "T1021.006", "T1550.002", "T1550.003", "T1558.003",
    "T1543.003", "T1569.002", "T1053.005", "T1547.001", "T1070.001", "T1135", "T1482", "T1134",
    "T1059.001", "T1059.003", "T1059.005", "T1550", "T1021", "T1003", "T1558", "T1543",
}


def build():
    """(tactics, techniques) qaytarır: attack_import ilə eyni formatda."""
    tactics = [
        {"shortname": s, "name": n, "ext_id": e, "position": i}
        for i, (s, n, e) in enumerate(TACTICS)
    ]
    techniques = []
    for tid, name, codes, subs in TECHS:
        tac = ",".join(CODE[c] for c in codes.split())
        plat = "Windows" if tid in WINDOWS_ONLY else "Windows,Linux,macOS"
        base_url = f"https://attack.mitre.org/techniques/{tid}/"
        techniques.append(
            {"id": tid, "name": name, "is_sub": False, "parent_id": None, "tactics": tac,
             "platforms": plat, "description": "", "url": base_url}
        )
        for suffix, sname in subs:
            sid = f"{tid}.{suffix}"
            splat = "Windows" if sid in WINDOWS_ONLY else plat
            techniques.append(
                {"id": sid, "name": sname, "is_sub": True, "parent_id": tid, "tactics": tac,
                 "platforms": splat, "description": "",
                 "url": f"https://attack.mitre.org/techniques/{tid}/{suffix}/"}
            )
    return tactics, techniques
