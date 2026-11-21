# Honeypot map locations

## Public IP addresses
Install dependencies with `pip install -r requirements.txt`. Download a current MaxMind-compatible **City** MMDB database from its licensed provider and place it at `data/dbip-city-lite.mmdb` or `data/GeoLite2-City.mmdb`. Restart `python run.py`. Public source IPs with available coordinates will appear on the Monitor map. No GeoIP database is distributed with this project.

## Private VMware lab addresses
Copy `data/lab-locations.example.json` to `data/lab-locations.json`. Edit the CIDR network and coordinates to match your isolated lab. The example `192.168.56.0/24` is only a placeholder. The resulting location is explicitly labeled `[LAB]` in the UI; it is **not** the real physical location of the VM or an attacker.

Example: `[{"network":"192.168.56.0/24","lat":40.4093,"lon":49.8671,"label":"Baku VMware Lab"}]`

Do not map all private addresses to a city unless that is truly the intended lab visualization. The ingest API uses the sensor-reported source IP. Check VMware NAT/bridged networking: the observed source IP may differ from the Windows guest's interface address. New incoming events are enriched at ingest time; old stored events are not automatically backfilled. Private IPs without a configured lab mapping are still logged but have no map marker.

**Security:** `data/lab-locations.json` is gitignored. Do not expose sensor keys or open honeypot listeners to the public internet without network isolation and access controls. GeoIP is approximate and may reflect a VPN/proxy.
