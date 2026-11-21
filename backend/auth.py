"""Sadə autentifikasiya: PBKDF2 parol hash-i + HMAC imzalı token (yalnız standart kitabxana).

Oxumaq açıqdır. Dəyişiklik (POST/PUT/DELETE) üçün giriş lazımdır.
Token müddəti: 12 saat. Gizli açar data/.secret faylında saxlanılır (repoya düşmür, .gitignore-dadır).
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import DATA_DIR, get_db
from .models import User

TOKEN_TTL = 12 * 3600
ITER = 200_000
_SECRET_FILE = DATA_DIR / ".secret"


def _secret() -> bytes:
    env = os.environ.get("IBT_SECRET")
    if env:
        return env.encode()
    if not _SECRET_FILE.exists():
        _SECRET_FILE.write_text(secrets.token_hex(32))
        try:
            _SECRET_FILE.chmod(0o600)
        except OSError:
            pass
    return _SECRET_FILE.read_text().strip().encode()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITER)
    return f"pbkdf2${ITER}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, it, salt, dk = stored.split("$")
        calc = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(it))
        return hmac.compare_digest(calc.hex(), dk)
    except (ValueError, TypeError):
        return False


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_token(user: User) -> str:
    body = _b64(json.dumps({"u": user.username, "r": user.role, "exp": int(time.time()) + TOKEN_TTL}).encode())
    sig = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def read_token(token: str):
    try:
        body, sig = token.split(".")
        good = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, good):
            return None
        data = json.loads(_unb64(body))
        return data if data.get("exp", 0) > time.time() else None
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def optional_user(authorization: str = Header(default=""), db: Session = Depends(get_db)):
    if not authorization.lower().startswith("bearer "):
        return None
    data = read_token(authorization[7:].strip())
    if not data:
        return None
    return db.query(User).filter(User.username == data["u"]).first()


def require_user(user: User = Depends(optional_user)) -> User:
    if not user:
        raise HTTPException(401, "Sign in to perform this action")
    return user


def require_analyst(user: User = Depends(require_user)) -> User:
    if user.role not in ("admin", "analyst"):
        raise HTTPException(403, "This action is restricted to analysts and administrators")
    return user


def require_reviewer(user: User = Depends(require_user)) -> User:
    if user.role not in ("admin", "reviewer"):
        raise HTTPException(403, "This action is restricted to reviewers and administrators")
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Only administrators can perform this action")
    return user


# ---- giriş cəhdlərinin məhdudlaşdırılması (yaddaşda, bir proses üçün kifayətdir)
_fails: dict = {}
MAX_FAILS, WINDOW = 6, 300


def check_rate(key: str):
    now = time.time()
    hits = [t for t in _fails.get(key, []) if now - t < WINDOW]
    _fails[key] = hits
    if len(hits) >= MAX_FAILS:
        raise HTTPException(429, "Too many failed attempts. Try again in a few minutes")


def note_fail(key: str):
    _fails.setdefault(key, []).append(time.time())


def clear_fails(key: str):
    _fails.pop(key, None)


def ensure_admin(db: Session):
    """İlk işə salmada admin yaradır. Parol IBT_ADMIN_PASSWORD-dan, yoxdursa təsadüfi yaradılıb bir dəfə çap olunur."""
    if db.query(User).count() > 0:
        return None
    pw = os.environ.get("IBT_ADMIN_PASSWORD")
    generated = not pw
    if generated:
        pw = secrets.token_urlsafe(9)
    db.add(User(username="admin", password_hash=hash_password(pw), role="admin"))
    db.commit()
    return pw if generated else "(IBT_ADMIN_PASSWORD-dan)"
