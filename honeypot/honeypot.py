#!/usr/bin/env python3
"""iBlueTeam honeypot agenti.

15 default portu dinləyir, qarşı tərəfə inandırıcı banner göndərir, ilk baytları qeydə alır və
iBlueTeam platformasına göndərir. HEÇ NƏYİ İCRA ETMİR: real shell, fayl və ya xidmət yoxdur.

Yalnız standart kitabxana (Python 3.9+).

Nümunə:
    sudo python3 honeypot.py --url http://10.0.0.5:8000 --key hp_XXXX --name hp-1 --user nobody
    python3 honeypot.py --url http://127.0.0.1:8000 --key hp_XXXX --offset 10000     # root olmadan sınaq (22 -> 10022)

TƏHLÜKƏSİZLİK: yalnız ayrı, təcrid olunmuş VM-də işlədin. Real məlumat, parol və açar qoymayın.
VM-in çıxış (egress) trafikini firewall ilə platformaya və DNS-ə qədər məhdudlaşdırın.
"""
import argparse
import asyncio
import collections
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

DEFAULT_PORTS = [21, 22, 23, 25, 80, 110, 139, 443, 445, 1433, 3306, 3389, 5900, 6379, 8080]

BANNERS = {
    21: b"220 FTP server ready\r\n",
    22: b"SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6\r\n",
    23: b"\xff\xfd\x18\xff\xfd\x1flogin: ",
    25: b"220 mail.example.com ESMTP Postfix\r\n",
    110: b"+OK POP3 server ready\r\n",
    3306: b"\x4a\x00\x00\x00\x0a5.7.42-0ubuntu0.18.04.1\x00\x01\x00\x00\x00abcdefgh\x00",
    5900: b"RFB 003.008\n",
}
HTTP_PORTS = {80, 8080}
HTTP_REPLY = (b"HTTP/1.1 404 Not Found\r\nServer: Apache/2.4.52 (Ubuntu)\r\nContent-Type: text/html\r\n"
              b"Content-Length: 0\r\nConnection: close\r\n\r\n")
FOLLOWUP = {21: b"331 Password required\r\n", 23: b"Password: ", 110: b"+OK\r\n", 6379: b"-NOAUTH Authentication required.\r\n"}

READ_TIMEOUT = 6.0
MAX_BYTES = 1024
MAX_CONN = 300
PER_IP_PER_MIN = 30
SPOOL_LIMIT = 20 * 1024 * 1024

_CTRL = re.compile(r"[^\x20-\x7e\r\n\t]")
_SECRET = re.compile(r"(?im)^(pass(word)?\s+|authorization:\s*).*$")


def clean(raw: bytes) -> str:
    """Çap oluna bilən ASCII saxlanır, qalanı nöqtə olur. Parol sətirləri gizlədilir."""
    text = _CTRL.sub(".", raw.decode("latin-1"))
    text = _SECRET.sub(lambda m: m.group(0).split()[0] + " ***", text)
    return text[:512]


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


# ---------------------------------------------------------------- göndərici
class Sender(threading.Thread):
    """Hadisələri toplu göndərir. Platforma əlçatmaz olsa, lokal fayla yazır və sonra yenidən cəhd edir."""

    def __init__(self, url: str, key: str, name: str, spool: str):
        super().__init__(daemon=True)
        self.url = url.rstrip("/") + "/api/honeypot/ingest"
        self.key, self.name, self.spool = key, name, spool
        self.q: collections.deque = collections.deque(maxlen=20000)
        self.sent = 0
        self.failed_logged = 0.0

    def push(self, ev: dict):
        self.q.append(ev)

    def _post(self, events: list) -> bool:
        body = json.dumps({"sensor": self.name, "events": events}).encode()
        req = urllib.request.Request(self.url, data=body, method="POST",
                                     headers={"Content-Type": "application/json", "X-Sensor-Key": self.key})
        try:
            with urllib.request.urlopen(req, timeout=8) as r:
                return r.status == 200
        except urllib.error.HTTPError as e:
            if time.time() - self.failed_logged > 30:
                log(f"Platforma rədd etdi: HTTP {e.code} ({'açar səhvdir' if e.code == 401 else 'qəbul söndürülüb' if e.code == 403 else 'xəta'})")
                self.failed_logged = time.time()
            return e.code in (400, 422)  # yanlış formatlı batch təkrar göndərilməsin
        except (urllib.error.URLError, TimeoutError, OSError):
            if time.time() - self.failed_logged > 30:
                log("Platforma əlçatmazdır, hadisələr lokal faylda saxlanılır")
                self.failed_logged = time.time()
            return False

    def _spool_write(self, events: list):
        try:
            if os.path.exists(self.spool) and os.path.getsize(self.spool) > SPOOL_LIMIT:
                return
            with open(self.spool, "a", encoding="utf-8") as f:
                for e in events:
                    f.write(json.dumps(e) + "\n")
        except OSError:
            pass

    def _spool_flush(self):
        if not os.path.exists(self.spool):
            return
        try:
            with open(self.spool, encoding="utf-8") as f:
                lines = [json.loads(x) for x in f if x.strip()]
        except (OSError, ValueError):
            lines = []
        while lines:
            batch = lines[:100]
            if not self._post(batch):
                break
            lines = lines[100:]
            self.sent += len(batch)
        try:
            if lines:
                with open(self.spool, "w", encoding="utf-8") as f:
                    for e in lines:
                        f.write(json.dumps(e) + "\n")
            else:
                os.remove(self.spool)
        except OSError:
            pass

    def run(self):
        while True:
            time.sleep(2)
            batch = []
            while self.q and len(batch) < 100:
                batch.append(self.q.popleft())
            if batch:
                if self._post(batch):
                    self.sent += len(batch)
                else:
                    self._spool_write(batch)
            self._spool_flush()


# ---------------------------------------------------------------- server
class Honeypot:
    def __init__(self, sender: Sender, offset: int):
        self.sender, self.offset = sender, offset
        self.sem = asyncio.Semaphore(MAX_CONN)
        self.hits: dict = collections.defaultdict(list)
        self.dropped = 0

    def allow(self, ip: str) -> bool:
        now = time.time()
        recent = [t for t in self.hits[ip] if now - t < 60]
        self.hits[ip] = recent
        if len(recent) >= PER_IP_PER_MIN:
            self.dropped += 1
            return False
        recent.append(now)
        if len(self.hits) > 5000:  # yaddaş şişməsin
            self.hits = collections.defaultdict(list, {k: v for k, v in self.hits.items() if v and now - v[-1] < 60})
        return True

    async def handle(self, port: int, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        peer = writer.get_extra_info("peername") or ("?", 0)
        ip = str(peer[0]).replace("::ffff:", "")
        if self.sem.locked():
            writer.close()
            return
        async with self.sem:
            data = b""
            try:
                if port in BANNERS:
                    writer.write(BANNERS[port])
                    await writer.drain()
                for _ in range(3):  # ən çox 3 mübadilə (məs. FTP: USER, PASS)
                    chunk = await asyncio.wait_for(reader.read(MAX_BYTES), READ_TIMEOUT)
                    if not chunk:
                        break
                    data += chunk
                    if port in HTTP_PORTS:
                        writer.write(HTTP_REPLY)
                        await writer.drain()
                        break
                    if port in FOLLOWUP:
                        writer.write(FOLLOWUP[port])
                        await writer.drain()
                    else:
                        break
            except (asyncio.TimeoutError, ConnectionError, OSError):
                pass
            finally:
                try:
                    writer.close()
                except OSError:
                    pass
            if self.allow(ip):
                self.sender.push({
                    "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                    "src_ip": ip, "src_port": int(peer[1]) if len(peer) > 1 else 0,
                    "dst_port": port, "proto": "tcp", "payload": clean(data[:MAX_BYTES * 3]),
                })


async def serve(args, sender):
    hp = Honeypot(sender, args.offset)
    servers = []
    for p in args.ports:
        listen = p + args.offset
        try:
            srv = await asyncio.start_server(lambda r, w, p=p: hp.handle(p, r, w), args.bind, listen)
            servers.append(srv)
            log(f"Dinlənir: {args.bind}:{listen}" + (f" (real port {p})" if args.offset else ""))
        except OSError as e:
            log(f"Port {listen} açılmadı: {e.strerror or e} (root lazımdır və ya port məşğuldur)")
    if not servers:
        log("Heç bir port açılmadı, çıxılır.")
        return

    if args.user and hasattr(os, "geteuid") and os.geteuid() == 0:
        import pwd

        pw = pwd.getpwnam(args.user)
        os.setgroups([])
        os.setgid(pw.pw_gid)
        os.setuid(pw.pw_uid)
        log(f"İmtiyazlar '{args.user}' istifadəçisinə endirildi")

    async def status():
        while True:
            await asyncio.sleep(60)
            log(f"Göndərildi: {sender.sent}, növbədə: {len(sender.q)}, limitə görə atıldı: {hp.dropped}")

    await asyncio.gather(status(), *(s.serve_forever() for s in servers))


def main():
    ap = argparse.ArgumentParser(description="iBlueTeam honeypot agenti")
    ap.add_argument("--url", required=True, help="platformanın ünvanı, məs. http://10.0.0.5:8000")
    ap.add_argument("--key", default=os.environ.get("IBT_SENSOR_KEY", ""), help="sensor açarı (və ya IBT_SENSOR_KEY)")
    ap.add_argument("--name", default="hp-1", help="sensorun adı")
    ap.add_argument("--ports", default=",".join(map(str, DEFAULT_PORTS)), help="vergüllə ayrılmış portlar")
    ap.add_argument("--bind", default="0.0.0.0")
    ap.add_argument("--offset", type=int, default=0, help="port + offset dinlə (root olmadan sınaq üçün, məs. 10000)")
    ap.add_argument("--user", default="", help="portlar açıldıqdan sonra bu istifadəçiyə keç (root ilə işlədəndə)")
    ap.add_argument("--spool", default="honeypot-spool.jsonl", help="platforma əlçatmaz olanda hadisələrin yazıldığı fayl")
    args = ap.parse_args()
    args.ports = [int(x) for x in args.ports.split(",") if x.strip()]

    if not args.key:
        sys.exit("Sensor açarı lazımdır: --key və ya IBT_SENSOR_KEY (platformadakı Honeypot səhifəsindən yaradın)")
    if args.url.startswith("http://") and not re.match(r"http://(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|localhost)", args.url):
        log("DİQQƏT: ictimai ünvana HTTP ilə göndərilir, açar şifrələnmir. Şəxsi şəbəkə, VPN və ya HTTPS istifadə edin.")

    sender = Sender(args.url, args.key, args.name, args.spool)
    sender.start()
    try:
        asyncio.run(serve(args, sender))
    except KeyboardInterrupt:
        log("Dayandırıldı")


if __name__ == "__main__":
    main()
