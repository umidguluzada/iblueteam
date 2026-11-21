# Automatic GeoIP and ASN enrichment

The backend enriches **new real sensor events** at `/api/honeypot/ingest`. The reported source IP is looked up in local MMDB files. No outbound GeoIP API request is made for each event.

## Windows CMD setup

1. Extract the ZIP into a **new folder**. Open CMD in the folder containing `run.py`.
2. Create and activate a virtual environment (optional if you already use one):
   ```cmd
   py -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Obtain licensed MaxMind-compatible databases from a provider, such as MaxMind GeoLite2 **City** and **ASN**. Place the downloaded and decompressed files here:
   ```text
   data/GeoLite2-City.mmdb
   data/GeoLite2-ASN.mmdb
   ```
   `data/dbip-city-lite.mmdb` is also supported for City data. These databases are **not included** in the ZIP; comply with provider download and attribution rules. City and ASN databases should be updated regularly.
4. For private VMware IPs, copy `data/lab-locations.example.json` to `data/lab-locations.json` and edit the network to match your VM subnet. LAB locations are configured, not real geolocation.
5. Start the backend:
   ```cmd
   python run.py
   ```
6. Create a sensor key in the Honeypot page, start the sensor using the command and reachable backend address in the sensor setup instructions, then choose **Honeypot** mode in Monitor. Only traffic reaching a sensor listening port creates real events.

## What is recorded

`country`, `city`, `lat`, `lon`, `place`, `asn`, `organization`, and `location_source` (`geoip`, `lab`, `unknown`) are saved with each new event. The `/api/honeypot/events` and `/api/honeypot/live` responses include these fields. If an MMDB is absent or an IP has no match, those fields remain null rather than inventing a country. The backend also preserves the source IP, destination port, category, and heuristic ATT&CK technique.

Existing SQLite databases are upgraded in place with new columns on startup. Back up `data/ibluteam.db` before upgrading. Existing historical events are not automatically backfilled. For public IPs, the country and city are approximate network geolocation; proxies and VPNs can obscure origin. The category describes observed indicators, not proven attacker intent.

**Security:** Keep the sensor key secret. Run the listener in an isolated lab, restrict firewall access, and never treat the sensor as a production-grade intrusion prevention system.
