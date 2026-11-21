# iBlueTeam: Detection Coverage Matrix

A team platform that shows detection coverage on the MITRE ATT&CK matrix. Coverage status is not picked by hand. It is calculated from rules, test results, and the state of log sources.

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite (`data/ibluteam.db`)
- **Frontend:** HTML, CSS, vanilla JS (no build step)
- **Data:** ATT&CK Enterprise (MITRE’s official STIX file), synthetic sample rules, and test records

## Run (clean environment)

```bash
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
IBT_ADMIN_PASSWORD='your-password' python run.py     # Windows PowerShell: $env:IBT_ADMIN_PASSWORD='...'; python run.py
```

Open in a browser: http://127.0.0.1:8000 (sign in as `admin` with the password you set).

- If `IBT_ADMIN_PASSWORD` is not set, a random password is created on first start and printed once to the console.
- The ATT&CK file `data/enterprise-attack.json` is in the repo. If it is missing, download it from https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json and place it at that path (about 50 MB). It is loaded into the database on first open.
- Keep an existing `data/ibluteam.db` if you have one. It is upgraded automatically on startup, and data is not lost.
- For other devices on the same network (phone, honeypot VM): `python run.py --lan` (connection addresses are printed in the console). Anyone on the network can view. Changes require a login.
- Options: `--port 9000`, `--no-sample` (without sample rules), `--reimport-attack`, `--reload`.
- Environment variables: `IBT_ADMIN_PASSWORD`, `IBT_SECRET` (token key), `IBT_TARGET_NAME`, `IBT_TARGET_LAT`, `IBT_TARGET_LON` (location of the protected network on the monitor map).
- Interactive API docs: http://127.0.0.1:8000/docs

## Pages

| Page | Contents |
|---|---|
| **Matrix** | Columns by tactic, status colors, **heatmap mode**, tactic and overall coverage percent, risk-weighted coverage, blind techniques, search and filters (tactic name, status, platform), sub-techniques |
| **Monitor** | **Live Detection Monitor**: synthetic event flow on a world map (detected, partial, missed), live feed, most dangerous gaps |
| **Honeypot** | Real scans and attacks against open ports: statistics, sensor key, simulation, install command, event table. Events are mapped to ATT&CK techniques and appear in Monitor **Honeypot** mode, on the matrix, and in the gap score. Details: [docs/honeypot.md](docs/honeypot.md) |
| **Rules** | Rule list, add, edit, delete, link a log source, **test records**, Sigma YAML and CSV import |
| **Sources** | Log source catalog: which source is collected. A source that is not collected makes the rule blind |
| **Gaps** | Gaps sorted by priority score, cause, filters, CSV export |
| **Overview** | Overall percent, coverage by tactic, and rule, test, and log source statistics |

Clicking a technique opens a side panel: description, required log sources, linked rules, test records, sub-techniques, and notes.

**Access:** login is not required to read. Rule, test, note, log source, and import changes are only for a signed-in user. An admin can add users (top bar → user menu).

**Export:** **Export** menu in the top bar: Matrix JSON, Matrix CSV, Gaps CSV, ATT&CK Navigator layer.

## How coverage is calculated

Short summary (full document: [docs/coverage.md](docs/coverage.md)):

| State | Condition |
|---|---|
| Full | at least one rule **is active, its latest test passed, and all log sources are collected** |
| Partial | a rule exists, but it is a draft, untested, the latest test failed, or a log source is not set |
| Gap | no rule, the rule is disabled, or a log source is not collected |
| Blind | a gap caused by telemetry (a rule exists but the source is not collected, or none of the sources ATT&CK requires are collected) |

## Documents

- [docs/architecture.md](docs/architecture.md): architecture diagram, data flow, security
- [docs/data-model.md](docs/data-model.md): data model and API summary
- [docs/coverage.md](docs/coverage.md): coverage calculation, heatmap score, gap score
- [docs/honeypot.md](docs/honeypot.md): honeypot setup, classification, security
- [docs/demo.md](docs/demo.md): demo scenario

## Presentation / Overview Deck

The English overview deck lives in the repository `docs/` folder. Open or download it from GitHub:

[iBlueTeam Platform — Full Analysis & Presentation (EN)](docs/iBlueTeam_Platform_Analysis_and_Presentation_EN.pptx)

The deck covers the platform overview, the MITRE ATT&CK coverage matrix, the live threat monitor, the honeypot sensor workflow, Sigma rule management, RBAC, and the system architecture.

Place the file at `docs/iBlueTeam_Platform_Analysis_and_Presentation_EN.pptx` so this link resolves for anyone who clones or browses the repository.

## Folder layout

```
honeypot/  honeypot.py (sensor agent), sim_client.py (test traffic)
backend/   main.py (API), honeypot.py, geo.py, models.py, coverage.py, auth.py, monitor.py, attack_import.py, sigma.py, seed*.py
frontend/  index.html, css/style.css, js/ (matrix, monitor, honeypot, rules, sources, gaps, overview, panel, auth)
data/      ATT&CK JSON, sample rules. The SQLite file and secret key are created on startup (not committed)
docs/      architecture, data model, coverage rules, demo
```

## Limitations

- There is no SIEM integration. Real honeypot traffic needs a separate VM with a public IP, set up outside this platform. Rules and log source state are entered by hand or from a file. The monitor uses synthetic events.
- Rules are not tied to a platform. A rule is linked to a technique, and if that technique exists on several platforms, coverage is counted on all of them.
- SQLite is enough for a small number of concurrent users. Switch to PostgreSQL by changing the connection string in `backend/database.py`.
- Fonts load from Google Fonts. Without internet, a system font is used.

## Windows / VM: honeypot sensor, live monitoring, and map setup

Use these steps in **Windows CMD** on the lab VM. On the `10.10.1.0/24` lab network:

- `10.10.1.130` is the VM that runs the iBlueTeam server and the honeypot sensor.
- `10.10.1.1` is the physical host’s VMnet8 address.

### 1. Virtual environment and dependencies

```cmd
cd /d "C:\Users\umid\Desktop\iBlueTeam_FINAL v2\ibluteam"
py -3.12 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the backend in LAN mode

Keep the virtual environment active in `ibluteam`, then start the server:

```cmd
python run.py --lan
```

Open the UI in a browser:

- On the VM: http://127.0.0.1:8000
- From the physical PC: http://10.10.1.130:8000

Sign in with username `admin` and password `I3AS-owpkAzA`. If you set `IBT_ADMIN_PASSWORD` before the first start, that password is used instead.

On the **Honeypot** page, create a sensor key. It is shown only once. Paste it in place of `<YOUR_HONEYPOT_API_KEY>` below.

### 3. Connect and run the honeypot sensor

Open a second CMD window. Start inside `honeypot`, then activate the virtual environment one folder up:

```cmd
cd /d "C:\Users\umid\Desktop\iBlueTeam_FINAL v2\ibluteam\honeypot"
..\.venv\Scripts\activate
python honeypot.py --url http://10.10.1.130:8000 --key <YOUR_HONEYPOT_API_KEY> --ports 8080
```

Expected output:

- `Dinlənir: 0.0.0.0:8080` — the sensor is listening on all interfaces, port 8080.
- About once a minute: `Göndərildi: N, növbədə: N, limitə görə atıldı: N` — sent, queued, and dropped counters.
- An invalid API key prints `Platforma rədd etdi: HTTP 401 (açar səhvdir)`. Create a new key on the Honeypot page and start the sensor again.

Leave this window running.

### 4. Simulate live traffic and port checks

Open a third CMD window. Start inside `honeypot` again:

```cmd
cd /d "C:\Users\umid\Desktop\iBlueTeam_FINAL v2\ibluteam\honeypot"
..\.venv\Scripts\activate
python sim_client.py --host 10.10.1.130 --rounds 999999 --delay 1
```

A listening port prints `ok`. A closed or unmonitored port prints `[WinError 10061]`; that is normal when the sensor was started with `--ports 8080` only. Press `Ctrl + C` to stop.

With port 8080 open, the sensor’s sent counter should rise, and new events should show up in the UI.

### 5. Local lab subnet and GeoIP / ASN map setup

Private lab addresses are mapped from `data/lab-locations.json` (copy `data/lab-locations.example.json` if the file is missing). Add the lab subnets, for example `10.10.1.0/24` and `192.168.56.0/24`:

```json
[
  {"network": "10.10.1.0/24", "lat": 40.4093, "lon": 49.8671, "label": "VMnet8 Lab"},
  {"network": "192.168.56.0/24", "lat": 40.4093, "lon": 49.8671, "label": "Baku VMware Lab"}
]
```

For public source IPs, place licensed MaxMind databases in `data/` (they are not included in the repo):

- `data/GeoLite2-City.mmdb`
- `data/GeoLite2-ASN.mmdb`

Restart `python run.py --lan` and `honeypot.py` after you change `data/lab-locations.json` or add the MMDB files. New events are enriched when they arrive; older events are not backfilled.

Check live events and map markers on the **Honeypot** page and under **Monitor → Honeypot**. Lab traffic uses the labels above. Public IPs show city and ASN when the matching database is present.
