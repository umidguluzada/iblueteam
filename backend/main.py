import csv
import hmac
import io
import json
import re
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from typing import Literal, Optional

import yaml
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from . import auth, coverage, geo, honeypot, monitor
from .coverage import FULL, GAP, LABELS, PARTIAL, build_matrix, gap_reason, gap_score, own_coverage, rule_state, unit_table
from .database import BASE_DIR, get_db
from .datasources import category_of, suggest
from .linking import attach_sources, attach_techniques
from .migrate import ensure_schema
from .models import DataSource, HoneypotEvent, Meta, Note, Rule, RuleReview, Tactic, TestRun, Technique, User, rule_technique
from .sigma import parse_sigma

STATUSES = ("draft", "active", "disabled")
DEFAULT_PLATFORM = "Windows"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_schema()
    yield


app = FastAPI(title="iBlueTeam: Detection Coverage Matrix", lifespan=lifespan)


# ---------------------------------------------------------------- sxemlər
class RuleIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    source: str = Field(default="Manual", max_length=60)
    status: Literal["draft", "active", "disabled"] = "draft"
    quality: int = Field(default=3, ge=1, le=5)
    tested: bool = False
    last_tested: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    logsource: str = ""
    description: str = ""
    content: str = ""
    techniques: list[str] = []
    data_sources: list[str] = []


class ReviewDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    comment: str = Field(default="", max_length=1200)


class ReviewSubmission(BaseModel):
    comment: str = Field(default="", max_length=1200)


class NoteIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    priority: Literal["low", "medium", "high"] = "medium"


class TestRunIn(BaseModel):
    tested_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    result: Literal["pass", "fail"] = "pass"
    method: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=1500)


class SourceIn(BaseModel):
    collected: Optional[bool] = None
    collector: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)


class SourceNew(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    collector: str = Field(default="", max_length=120)
    description: str = Field(default="", max_length=500)
    collected: bool = False


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=200)


class UserIn(BaseModel):
    username: str = Field(pattern=r"^[a-z0-9_.-]{3,32}$")
    password: str = Field(min_length=8, max_length=200)
    role: Literal["admin", "analyst", "reviewer"] = "analyst"


# ---------------------------------------------------------------- köməkçilər
def today() -> str:
    return date.today().isoformat()


def test_out(t: TestRun) -> dict:
    return {"id": t.id, "tested_at": t.tested_at, "result": t.result, "method": t.method,
            "notes": t.notes, "tester": t.tester}


def rule_out(r: Rule) -> dict:
    st = rule_state(r)
    runs = sorted(r.test_runs, key=lambda x: (x.tested_at, x.id), reverse=True)
    return {
        "id": r.id,
        "name": r.name,
        "source": r.source,
        "status": r.status,
        "quality": r.quality,
        "tested": bool(r.tested),
        "last_tested": r.last_tested,
        "logsource": r.logsource,
        "description": r.description,
        "content": r.content,
        "techniques": sorted(t.id for t in r.techniques),
        "data_sources": sorted(d.name for d in r.data_sources),
        "level": LABELS[st["level"]],
        "blind": st["blind"],
        "missing_sources": st["missing"],
        "unlinked": st["unlinked"],
        "tests": [test_out(t) for t in runs],
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def sync_tests(rule: Rule):
    """Test qeydləri varsa, tested/last_tested ən son qeydin nəticəsindən çıxarılır."""
    if rule.test_runs:
        last = max(rule.test_runs, key=lambda x: (x.tested_at, x.id or 0))
        rule.tested = last.result == "pass"
        rule.last_tested = last.tested_at


def get_rule(db: Session, rule_id: int) -> Rule:
    r = db.get(Rule, rule_id)
    if not r:
        raise HTTPException(404, "Rule not found")
    return r


def get_meta(db: Session) -> dict:
    return {m.key: m.value for m in db.query(Meta).all() if m.key in ("attack_updated", "attack_source", "attack_version")}


def parse_bool(v) -> bool:
    return str(v).strip().lower() in {"1", "true", "yes", "y", "bəli", "beli", "hə", "he"}


def csv_safe(v) -> str:
    v = "" if v is None else str(v)
    return "'" + v if v[:1] in ("=", "+", "-", "@", "\t", "\r") else v


def rules_query(db: Session):
    return db.query(Rule).options(selectinload(Rule.techniques), selectinload(Rule.data_sources), selectinload(Rule.test_runs))


def changed():
    coverage.invalidate()


# ---------------------------------------------------------------- giriş
@app.post("/api/auth/login")
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    key = f"{request.client.host if request.client else '?'}|{body.username.lower()}"
    auth.check_rate(key)
    u = db.query(User).filter(User.username == body.username.strip().lower()).first()
    if not u or not auth.verify_password(body.password, u.password_hash):
        auth.note_fail(key)
        raise HTTPException(401, "Incorrect username or password")
    auth.clear_fails(key)
    return {"token": auth.make_token(u), "user": {"username": u.username, "role": u.role}}


@app.get("/api/auth/me")
def me(user: User = Depends(auth.require_user)):
    return {"username": user.username, "role": user.role}


@app.get("/api/users")
def list_users(_: User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    return [{"id": u.id, "username": u.username, "role": u.role} for u in db.query(User).order_by(User.id).all()]


@app.post("/api/users", status_code=201)
def create_user(body: UserIn, _: User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(409, "Username already exists")
    u = User(username=body.username, password_hash=auth.hash_password(body.password), role=body.role)
    db.add(u)
    db.commit()
    return {"id": u.id, "username": u.username, "role": u.role}


@app.delete("/api/users/{uid}", status_code=204)
def delete_user(uid: int, me_: User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, "User not found")
    if u.id == me_.id:
        raise HTTPException(400, "You cannot delete your own account")
    db.delete(u)
    db.commit()


# ---------------------------------------------------------------- matris və statistika
@app.get("/api/platforms")
def api_platforms(db: Session = Depends(get_db)):
    found = set()
    for (p,) in db.query(Technique.platforms).all():
        found.update(x for x in (p or "").split(",") if x)
    return sorted(found)


@app.get("/api/matrix")
def api_matrix(platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    m = build_matrix(db, platform)
    m["meta"] = get_meta(db)
    return m


@app.get("/api/stats")
def api_stats(platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    m = build_matrix(db, platform)
    rules = rules_query(db).all()
    by_source: dict = {}
    for r in rules:
        by_source[r.source] = by_source.get(r.source, 0) + 1
    live = [r for r in rules if r.status != "disabled"]
    states = [rule_state(r) for r in rules]
    sources = db.query(DataSource).all()
    runs = db.query(TestRun).all()
    passed = sum(1 for t in runs if t.result == "pass")
    return {
        **m["stats"],
        "platform": m["platform"],
        "rules": {
            "total": len(rules),
            "active": sum(1 for r in rules if r.status == "active"),
            "draft": sum(1 for r in rules if r.status == "draft"),
            "disabled": sum(1 for r in rules if r.status == "disabled"),
            "tested": sum(1 for r in rules if r.tested),
            "blind": sum(1 for s in states if s["blind"]),
            "avg_quality": round(sum(r.quality or 0 for r in live) / len(live), 1) if live else 0,
            "by_source": by_source,
        },
        "data_sources": {
            "total": len(sources),
            "collected": sum(1 for s in sources if s.collected),
            "in_use": sum(1 for s in sources if s.rules),
        },
        "tests": {"total": len(runs), "passed": passed, "pass_rate": round(100 * passed / len(runs)) if runs else 0},
        "covered_techniques": len({t.id for r in rules if r.status != "disabled" for t in r.techniques}),
        "meta": get_meta(db),
    }


def _obs_for(db: Session, tid: str) -> dict:
    """Texnika və alt-texnikaları üçün son 24 saatın honeypot müşahidəsi."""
    from datetime import timedelta

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    q = db.query(func.count(HoneypotEvent.id), func.max(HoneypotEvent.ts)).filter(
        HoneypotEvent.ts >= since,
        (HoneypotEvent.technique_id == tid) | HoneypotEvent.technique_id.like(f"{tid}.%"),
    )
    n, last = q.one()
    return {"count": n or 0, "last": last.isoformat(timespec="seconds") if last else None}


@app.get("/api/techniques/{tid}")
def api_technique(tid: str, db: Session = Depends(get_db)):
    t = db.get(Technique, tid.upper())
    if not t:
        raise HTTPException(404, "Technique not found")

    own = own_coverage(db)
    collected = coverage.collected_names(db)
    names = {x.shortname: x.name for x in db.query(Tactic).all()}

    def cov(x_id):
        return own.get(x_id, {"level": GAP})["level"]

    subs = db.query(Technique).filter(Technique.parent_id == t.id).order_by(Technique.id).all()
    level = max([cov(t.id)] + [cov(s.id) for s in subs])
    rules = (
        rules_query(db)
        .filter(Rule.techniques.any(Technique.id == t.id))
        .order_by(Rule.name)
        .all()
    )
    notes = db.query(Note).filter(Note.technique_id == t.id).order_by(Note.id.desc()).all()
    parent = db.get(Technique, t.parent_id) if t.parent_id else None
    vis = coverage.visibility(t, collected)
    unit = next((u for u in unit_table(db, "all") if u["id"] == t.id), None)

    return {
        "id": t.id,
        "name": t.name,
        "is_sub": bool(t.is_sub),
        "parent": {"id": parent.id, "name": parent.name} if parent else None,
        "description": t.description,
        "url": t.url,
        "platforms": [p for p in (t.platforms or "").split(",") if p],
        "tactics": [names.get(x, x) for x in (t.tactics or "").split(",") if x],
        "coverage": LABELS[level],
        "own": LABELS[cov(t.id)],
        "score": own.get(t.id, {}).get("score", 0),
        "groups": t.group_count or 0,
        "obs": _obs_for(db, t.id),
        "required_sources": [{"name": n, "collected": n in collected} for n in vis["required"]],
        "blind": bool(unit and unit["blind"]),
        "gap_reason": gap_reason(unit) if unit and unit["level"] != FULL else "",
        "rules": [rule_out(r) for r in rules],
        "subs": [
            {"id": s.id, "name": s.name, "coverage": LABELS[cov(s.id)], "rules": own.get(s.id, {}).get("rules", 0)}
            for s in subs
        ],
        "notes": [
            {"id": n.id, "text": n.text, "priority": n.priority, "created_at": n.created_at.isoformat()}
            for n in notes
        ],
    }




def review_out(v: RuleReview, db: Session):
    rule = db.get(Rule, v.rule_id)
    return {"id": v.id, "rule_id": v.rule_id, "rule_name": rule.name if rule else "Deleted rule", "author": v.author, "reviewer": v.reviewer, "status": v.status, "comment": v.comment, "created_at": v.created_at.isoformat() if v.created_at else None}


@app.get("/api/reviews")
def list_reviews(_: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    return [review_out(v, db) for v in db.query(RuleReview).order_by(RuleReview.id.desc()).limit(250).all()]


@app.post("/api/rules/{rule_id}/submit-review", status_code=201)
def submit_review(rule_id: int, body: ReviewSubmission, user: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    r = get_rule(db, rule_id)
    if db.query(RuleReview).filter(RuleReview.rule_id == rule_id, RuleReview.status == "pending").first():
        raise HTTPException(409, "Rule is already under review")
    r.status = "draft"
    v = RuleReview(rule_id=rule_id, author=user.username, status="pending", comment=body.comment)
    db.add(v)
    db.commit()
    db.refresh(v)
    changed()
    return review_out(v, db)


@app.post("/api/reviews/{review_id}/decision")
def decide_review(review_id: int, body: ReviewDecision, user: User = Depends(auth.require_reviewer), db: Session = Depends(get_db)):
    v = db.get(RuleReview, review_id)
    if not v:
        raise HTTPException(404, "Review not found")
    if v.status != "pending":
        raise HTTPException(409, "This review is already completed")
    if v.author == user.username:
        raise HTTPException(403, "You cannot approve your own rule")
    if body.decision == "rejected" and not body.comment.strip():
        raise HTTPException(422, "Enter a rejection reason")
    r = get_rule(db, v.rule_id)
    r.status = "active" if body.decision == "approved" else "draft"
    v.status = body.decision
    v.reviewer = user.username
    v.comment = body.comment.strip()
    v.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    changed()
    return review_out(v, db)

# ---------------------------------------------------------------- qaydalar
@app.get("/api/rules")
def list_rules(q: str = "", status: str = "", source: str = "", user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    query = rules_query(db)
    if q:
        query = query.filter(Rule.name.ilike(f"%{q}%"))
    if status:
        query = query.filter(Rule.status == status)
    if source:
        query = query.filter(Rule.source == source)
    return [rule_out(r) for r in query.order_by(Rule.id.desc()).all()]


def _save_links(db: Session, r: Rule, body: RuleIn):
    unknown = attach_techniques(db, r, body.techniques)
    if unknown:
        db.rollback()
        raise HTTPException(400, f"Unknown technique ID: {', '.join(unknown)}")
    bad = attach_sources(db, r, body.data_sources)
    if bad:
        db.rollback()
        raise HTTPException(400, f"Unknown log source: {', '.join(bad)}")


@app.post("/api/rules", status_code=201)
def create_rule(body: RuleIn, user: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    if user.role == "analyst" and body.status == "active":
        raise HTTPException(403, "Reviewer approval is required for activation")
    r = Rule(**body.model_dump(exclude={"techniques", "data_sources"}))
    db.add(r)
    db.flush()
    _save_links(db, r, body)
    db.commit()
    db.refresh(r)
    changed()
    return rule_out(r)


@app.get("/api/rules/{rule_id}")
def read_rule(rule_id: int, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    return rule_out(get_rule(db, rule_id))


@app.put("/api/rules/{rule_id}")
def update_rule(rule_id: int, body: RuleIn, user: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    if user.role == "analyst" and body.status == "active":
        raise HTTPException(403, "Administrator permission is required to change active rules; save as draft")
    r = get_rule(db, rule_id)
    has_runs = bool(r.test_runs)
    _save_links(db, r, body)
    skip = {"techniques", "data_sources"} | ({"tested", "last_tested"} if has_runs else set())
    for k, v in body.model_dump(exclude=skip).items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    changed()
    return rule_out(r)


@app.delete("/api/rules/{rule_id}", status_code=204)
def delete_rule(rule_id: int, _: User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    db.delete(get_rule(db, rule_id))
    db.commit()
    changed()


@app.post("/api/rules/{rule_id}/tests", status_code=201)
def add_test(rule_id: int, body: TestRunIn, user: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    r = get_rule(db, rule_id)
    t = TestRun(rule_id=r.id, tested_at=body.tested_at, result=body.result, method=body.method.strip(),
                notes=body.notes.strip(), tester=user.username)
    db.add(t)
    db.flush()
    db.refresh(r)
    sync_tests(r)
    db.commit()
    changed()
    return rule_out(r)


@app.delete("/api/tests/{test_id}", status_code=204)
def delete_test(test_id: int, _: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    t = db.get(TestRun, test_id)
    if not t:
        raise HTTPException(404, "Test record not found")
    r = get_rule(db, t.rule_id)
    db.delete(t)
    db.flush()
    db.refresh(r)
    sync_tests(r)
    db.commit()
    changed()


@app.post("/api/rules/upload-sigma")
async def upload_sigma(
    files: list[UploadFile] = File(...),
    status: str = Form("draft"),
    tested: bool = Form(False),
    user: User = Depends(auth.require_analyst),
    db: Session = Depends(get_db),
):
    if user.role == "analyst" and status == "active":
        raise HTTPException(403, "Imported rules must be reviewed first")
    if status not in STATUSES:
        raise HTTPException(400, "Status must be draft, active, or disabled")

    created, skipped, unknown_all = 0, [], set()
    existing = {r.name for r in db.query(Rule).filter(Rule.source == "Sigma").all()}

    for f in files:
        text = (await f.read()).decode("utf-8", errors="replace")
        try:
            parsed = parse_sigma(text)
        except yaml.YAMLError as exc:
            skipped.append({"file": f.filename, "reason": f"YAML error: {str(exc).splitlines()[0]}"})
            continue
        if not parsed:
            skipped.append({"file": f.filename, "reason": "Sigma rule not found (missing title field)"})
            continue
        for item in parsed:
            if item["name"] in existing:
                skipped.append({"file": f.filename, "reason": f"'{item['name']}' already exists"})
                continue
            r = Rule(
                name=item["name"], source="Sigma", status=status, tested=tested, quality=3,
                logsource=item["logsource"], description=item["description"], content=item["content"],
            )
            db.add(r)
            db.flush()
            unknown_all.update(attach_techniques(db, r, item["techniques"]))
            attach_sources(db, r, suggest(item["logsource"]))
            existing.add(item["name"])
            created += 1
    db.commit()
    changed()
    return {"created": created, "skipped": skipped, "unknown_techniques": sorted(unknown_all)}


@app.post("/api/rules/import-csv")
async def import_csv(file: UploadFile = File(...), user: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    text = (await file.read()).decode("utf-8-sig", errors="replace")
    try:
        dialect = csv.Sniffer().sniff(text[:2000], delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    if not reader.fieldnames or "name" not in [h.strip().lower() for h in reader.fieldnames]:
        raise HTTPException(400, "CSV file must contain a 'name' column")

    created, skipped, unknown_all = 0, [], set()
    for i, raw in enumerate(reader, start=2):
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw.items()}
        if not row.get("name"):
            skipped.append({"file": f"row {i}", "reason": "name is empty"})
            continue
        status = row.get("status", "draft").lower()
        try:
            quality = min(5, max(1, int(row.get("quality") or 3)))
        except ValueError:
            quality = 3
        r = Rule(
            name=row["name"],
            source=row.get("source") or "CSV",
            status=("draft" if user.role == "analyst" else status if status in STATUSES else "draft"),
            quality=quality,
            tested=parse_bool(row.get("tested", "")),
            last_tested=row.get("last_tested") or None,
            logsource=row.get("logsource", ""),
            description=row.get("description", ""),
        )
        db.add(r)
        db.flush()
        unknown_all.update(attach_techniques(db, r, re.split(r"[;,|\s]+", row.get("techniques", ""))))
        names = [x for x in re.split(r"[;|]+", row.get("data_sources", "")) if x.strip()] or suggest(r.logsource)
        attach_sources(db, r, names)
        created += 1
    db.commit()
    changed()
    return {"created": created, "skipped": skipped, "unknown_techniques": sorted(unknown_all)}


# ---------------------------------------------------------------- log mənbələri
def source_out(d: DataSource, need: dict) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "category": d.category,
        "description": d.description,
        "collector": d.collector,
        "collected": bool(d.collected),
        "rules": len(d.rules),
        "techniques": need.get(d.name, 0),
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


def _need_counts(db: Session, platform: str) -> dict:
    need: dict = {}
    for t in db.query(Technique).all():
        if not coverage.in_platform(t, platform):
            continue
        for n in (t.data_sources or "").split("|"):
            if n:
                need[n] = need.get(n, 0) + 1
    return need


@app.get("/api/data-sources")
def list_sources(platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    need = _need_counts(db, platform)
    rows = db.query(DataSource).options(selectinload(DataSource.rules)).all()
    out = [source_out(d, need) for d in rows]
    out.sort(key=lambda x: (not x["collected"], -x["techniques"], x["name"].lower()))
    return out


@app.put("/api/data-sources/{sid}")
def update_source(sid: int, body: SourceIn, _: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    d = db.get(DataSource, sid)
    if not d:
        raise HTTPException(404, "Log source not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(d, k, v)
    d.updated_at = datetime.now(timezone.utc)
    db.commit()
    changed()
    return source_out(d, _need_counts(db, DEFAULT_PLATFORM))


@app.post("/api/data-sources", status_code=201)
def create_source(body: SourceNew, _: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    name = body.name.strip()
    if db.query(DataSource).filter(func.lower(DataSource.name) == name.lower()).first():
        raise HTTPException(409, "This log source already exists")
    d = DataSource(name=name, category=category_of(name), description=body.description, collector=body.collector,
                   collected=body.collected)
    db.add(d)
    db.commit()
    changed()
    return source_out(d, {})


# ---------------------------------------------------------------- qeydlər və boşluqlar
@app.post("/api/techniques/{tid}/notes", status_code=201)
def add_note(tid: str, body: NoteIn, _: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    if not db.get(Technique, tid.upper()):
        raise HTTPException(404, "Technique not found")
    n = Note(technique_id=tid.upper(), text=body.text, priority=body.priority)
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"id": n.id, "text": n.text, "priority": n.priority, "created_at": n.created_at.isoformat()}


@app.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: int, _: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    n = db.get(Note, note_id)
    if not n:
        raise HTTPException(404, "Note not found")
    db.delete(n)
    db.commit()


def gaps_list(db: Session, platform: str = DEFAULT_PLATFORM) -> list[dict]:
    """Tam örtülməyən texnikalar (matris xanası səviyyəsində), prioritet balına görə sıralanır."""
    matrix = build_matrix(db, platform)
    units = {u["id"]: u for u in unit_table(db, platform)}
    prio_rank = coverage.PRIO_RANK
    notes: dict = {}
    for n in db.query(Note).all():
        cur = notes.setdefault(n.technique_id, {"count": 0, "priority": None})
        cur["count"] += 1
        if cur["priority"] is None or prio_rank[n.priority] > prio_rank[cur["priority"]]:
            cur["priority"] = n.priority

    seen: dict = {}
    for tac in matrix["tactics"]:
        for t in tac["techniques"]:
            if t["coverage"] >= FULL:
                continue
            e = seen.get(t["id"])
            if not e:
                u = units[t["id"]]
                info = notes.get(t["id"], {"count": 0, "priority": None})
                eff = dict(u, level=t["coverage"], blind=t["blind"], obs=t["obs"])
                e = seen[t["id"]] = {
                    "id": t["id"],
                    "name": t["name"],
                    "coverage": LABELS[t["coverage"]],
                    "level": t["coverage"],
                    "rules": t["rules"],
                    "platforms": t["platforms"],
                    "tactics": [],
                    "notes": info["count"],
                    "priority": info["priority"],
                    "groups": u["groups"],
                    "obs": t["obs"],
                    "blind": t["blind"],
                    "reason": gap_reason(eff),
                    "missing_sources": (u["missing_rule_sources"] or u["visibility"]["missing"])[:4],
                    "score": gap_score(eff, info["priority"]),
                }
            e["tactics"].append(tac["name"])

    items = list(seen.values())
    items.sort(key=lambda x: (-x["score"], x["id"]))
    for i, x in enumerate(items, 1):
        x["rank"] = i
    return items


@app.get("/api/gaps")
def api_gaps(platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    return gaps_list(db, platform)


# ---------------------------------------------------------------- ixrac
NAV_COLORS = {FULL: "#3fb68b", PARTIAL: "#e0b04a", GAP: "#c8454d"}


def _download(content: str, media: str, name: str) -> Response:
    return Response(content=content, media_type=media, headers={"Content-Disposition": f'attachment; filename="{name}"'})


@app.get("/api/export/navigator")
def export_navigator(include_gaps: bool = True, platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    """ATT&CK Navigator layer (v4.5) faylı. Navigator-da 'Open Existing Layer' ilə açılır."""
    m = build_matrix(db, platform)
    techniques, seen = [], set()
    for tac in m["tactics"]:
        for t in tac["techniques"]:
            if t["id"] in seen:
                continue
            seen.add(t["id"])
            entries = [(t["id"], t["coverage"], t["rules"])] + [(s["id"], s["own"], s["rules"]) for s in t["subs"]]
            for tid, level, count in entries:
                if level == GAP and not include_gaps:
                    continue
                techniques.append(
                    {"techniqueID": tid, "score": level, "color": NAV_COLORS[level],
                     "comment": f"{LABELS[level]}: {count} rules", "enabled": True}
                )
    layer = {
        "name": "iBlueTeam Detection Coverage",
        "versions": {"navigator": "5.1.0", "layer": "4.5"},
        "domain": "enterprise-attack",
        "description": "Detection coverage exported from iBlueTeam.",
        "sorting": 0,
        "layout": {"layout": "side", "showID": True, "showName": True},
        "hideDisabled": False,
        "techniques": techniques,
        "legendItems": [
            {"label": "Full (active + tested + logs collected)", "color": NAV_COLORS[FULL]},
            {"label": "Partial (draft, not tested, or missing log source)", "color": NAV_COLORS[PARTIAL]},
            {"label": "Gap", "color": NAV_COLORS[GAP]},
        ],
        "showTacticRowBackground": False,
        "selectTechniquesAcrossTactics": True,
        "selectSubtechniquesWithParent": False,
    }
    return _download(json.dumps(layer, ensure_ascii=False, indent=2), "application/json", "ibluteam-navigator-layer.json")


def _export_rows(db: Session, platform: str) -> list[dict]:
    by_tech: dict = {}
    for r in rules_query(db).all():
        for t in r.techniques:
            by_tech.setdefault(t.id, []).append(r)
    rows = []
    for u in sorted(unit_table(db, platform), key=lambda x: x["id"]):
        rs = by_tech.get(u["id"], [])
        rows.append(
            {
                "technique_id": u["id"],
                "name": u["name"],
                "type": "sub-technique" if u["is_sub"] else "technique",
                "tactics": u["tactic_names"],
                "platforms": u["platforms"],
                "coverage": LABELS[u["level"]],
                "depth_score": u["score"],
                "blind": u["blind"],
                "attack_groups": u["groups"],
                "required_data_sources": u["visibility"]["required"],
                "collected_data_sources": u["visibility"]["collected"],
                "missing_data_sources": u["visibility"]["missing"],
                "last_tested": u["last_tested"] or "",
                "rules": [
                    {"id": r.id, "name": r.name, "status": r.status, "tested": bool(r.tested),
                     "last_tested": r.last_tested, "data_sources": sorted(d.name for d in r.data_sources),
                     "level": LABELS[rule_state(r)["level"]]}
                    for r in rs
                ],
            }
        )
    return rows


@app.get("/api/export/matrix.json")
def export_matrix_json(platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    m = build_matrix(db, platform)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "platform": m["platform"],
        "attack": get_meta(db),
        "stats": m["stats"],
        "techniques": _export_rows(db, platform),
        "gaps": gaps_list(db, platform),
        "data_sources": [{"name": d.name, "collected": bool(d.collected), "collector": d.collector}
                         for d in db.query(DataSource).order_by(DataSource.name).all()],
    }
    return _download(json.dumps(payload, ensure_ascii=False, indent=2), "application/json", "ibluteam-coverage.json")


@app.get("/api/export/matrix.csv")
def export_matrix_csv(platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["technique_id", "name", "type", "tactics", "platforms", "coverage", "depth_score", "blind",
                "attack_groups", "rules", "required_data_sources", "collected_data_sources",
                "missing_data_sources", "last_tested"])
    for r in _export_rows(db, platform):
        w.writerow([
            r["technique_id"], csv_safe(r["name"]), r["type"], "; ".join(r["tactics"]), "; ".join(r["platforms"]),
            r["coverage"], r["depth_score"], "yes" if r["blind"] else "no", r["attack_groups"],
            csv_safe("; ".join(x["name"] for x in r["rules"])),
            "; ".join(r["required_data_sources"]), "; ".join(r["collected_data_sources"]),
            "; ".join(r["missing_data_sources"]), r["last_tested"],
        ])
    return _download("\ufeff" + buf.getvalue(), "text/csv; charset=utf-8", "ibluteam-coverage.csv")


@app.get("/api/export/gaps.csv")
def export_gaps(platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["rank", "technique_id", "name", "coverage", "tactics", "platforms", "rules", "blind", "attack_groups",
                "priority_note", "score", "reason"])
    for g in gaps_list(db, platform):
        w.writerow([g["rank"], g["id"], csv_safe(g["name"]), g["coverage"], "; ".join(g["tactics"]),
                    "; ".join(g["platforms"]), g["rules"], "yes" if g["blind"] else "no", g["groups"],
                    g["priority"] or "", g["score"], csv_safe(g["reason"])])
    return _download("\ufeff" + buf.getvalue(), "text/csv; charset=utf-8", "ibluteam-gaps.csv")


# ---------------------------------------------------------------- monitor
@app.get("/api/monitor/config")
def monitor_config(platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    units = coverage.cached_units(db, platform)
    num = {"detected": 0.0, "partial": 0.0, "missed": 0.0}
    units = [u for u in units if u["leaf"]]
    for u in units:
        num[monitor._outcome(u["level"])] += 1 + min(40, u["groups"])
    tot = sum(num.values()) or 1
    worst = sorted((u for u in units if u["level"] == GAP), key=lambda u: (-u["groups"], u["id"]))[:6]
    return {
        "target": monitor.TARGET,
        "expected": {k: round(100 * v / tot, 1) for k, v in num.items()},
        "units": len(units),
        "top_missed": [
            {"id": u["id"], "name": u["name"], "groups": u["groups"], "blind": u["blind"], "reason": gap_reason(u)}
            for u in worst
        ],
    }


@app.get("/api/monitor/events")
def monitor_events(n: int = Query(2, ge=1, le=8), platform: str = DEFAULT_PLATFORM, db: Session = Depends(get_db)):
    return monitor.make_events(coverage.cached_units(db, platform), n)



# ---------------------------------------------------------------- honeypot
HP_PURGE_DAYS = 30
HP_AGENT = BASE_DIR / "honeypot" / "honeypot.py"


class HpEvent(BaseModel):
    ts: Optional[str] = None
    src_ip: str = Field(max_length=64)
    src_port: int = Field(default=0, ge=0, le=65535)
    dst_port: int = Field(ge=1, le=65535)
    proto: Literal["tcp", "udp"] = "tcp"
    payload: str = Field(default="", max_length=4000)


class HpBatch(BaseModel):
    sensor: str = Field(default="hp-1", max_length=40, pattern=r"^[A-Za-z0-9_.-]+$")
    events: list[HpEvent] = Field(max_length=200)


class HpSettings(BaseModel):
    enabled: bool


class HpSim(BaseModel):
    count: int = Field(default=10, ge=1, le=200)


def _meta(db: Session, key: str, default: str = "") -> str:
    m = db.get(Meta, key)
    return m.value if m and m.value is not None else default


def _set_meta(db: Session, key: str, value: str):
    db.merge(Meta(key=key, value=value))


def _hash_key(key: str) -> str:
    import hashlib

    return hashlib.sha256(key.encode()).hexdigest()


def _parse_ts(raw: Optional[str]) -> datetime:
    now = datetime.now(timezone.utc)
    if not raw:
        return now
    try:
        t = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        from datetime import timedelta

        return t if now - timedelta(days=7) <= t <= now + timedelta(minutes=5) else now
    except ValueError:
        return now


def _maybe_purge(db: Session):
    """Saxlama müddəti: köhnə hadisələr saatda bir dəfə silinir (məxfilik və baza ölçüsü)."""
    from datetime import timedelta

    last = _meta(db, "hp_last_purge", "0")
    now = datetime.now(timezone.utc)
    if now.timestamp() - float(last or 0) < 3600:
        return
    db.query(HoneypotEvent).filter(HoneypotEvent.ts < now - timedelta(days=HP_PURGE_DAYS)).delete()
    _set_meta(db, "hp_last_purge", str(now.timestamp()))
    db.commit()


@app.post("/api/honeypot/ingest")
def hp_ingest(batch: HpBatch, request: Request, x_sensor_key: str = Header(default=""), db: Session = Depends(get_db)):
    """Sensor agenti hadisələri bura göndərir. Giriş sensor açarı ilə qorunur (istifadəçi girişi yox)."""
    ip = request.client.host if request.client else "?"
    rate_key = f"hp|{ip}"
    auth.check_rate(rate_key)
    stored = _meta(db, "hp_key_hash")
    if not stored or not hmac.compare_digest(_hash_key(x_sensor_key), stored):
        auth.note_fail(rate_key)
        raise HTTPException(401, "Invalid sensor key")
    if _meta(db, "hp_enabled", "1") != "1":
        raise HTTPException(403, "Honeypot receiving is disabled")

    cache: dict = {}
    seen_batch: dict = {}
    accepted = 0
    for ev in batch.events:
        if not honeypot.valid_ip(ev.src_ip):
            continue
        payload = honeypot.sanitize_payload(ev.payload)
        service, cat = honeypot.classify(ev.dst_port, payload)
        cat = honeypot.refine(db, ev.src_ip, ev.dst_port, cat, payload, seen_batch)
        if cat not in cache:
            cache[cat] = honeypot.resolve_technique(db, cat)
        g = geo.enrich_ip(ev.src_ip)
        db.add(HoneypotEvent(
            ts=_parse_ts(ev.ts), sensor=batch.sensor, src_ip=ev.src_ip, src_port=ev.src_port, dst_port=ev.dst_port,
            proto=ev.proto, service=service, category=cat, technique_id=cache[cat], payload=payload,
            lat=g["lat"], lon=g["lon"], place=g["place"],
            country=g["country"], city=g["city"], asn=g["asn"], organization=g["organization"],
            location_source=g["location_source"], simulated=False,
        ))
        accepted += 1
    db.commit()
    _maybe_purge(db)
    if accepted:
        changed()
    return {"accepted": accepted}


def _hp_filters(q, category: str, port: int, sim: int):
    if category:
        q = q.filter(HoneypotEvent.category == category)
    if port:
        q = q.filter(HoneypotEvent.dst_port == port)
    if not sim:
        q = q.filter(HoneypotEvent.simulated.is_(False))
    return q


@app.get("/api/honeypot/summary")
def hp_summary(hours: int = Query(24, ge=1, le=720), user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=hours)
    base = db.query(HoneypotEvent).filter(HoneypotEvent.ts >= since)
    total = db.query(func.count(HoneypotEvent.id)).scalar() or 0
    real_total = db.query(func.count(HoneypotEvent.id)).filter(HoneypotEvent.simulated.is_(False)).scalar() or 0
    count = base.count()
    ips = db.query(func.count(func.distinct(HoneypotEvent.src_ip))).filter(HoneypotEvent.ts >= since).scalar() or 0
    cats = (db.query(HoneypotEvent.category, func.count(HoneypotEvent.id)).filter(HoneypotEvent.ts >= since)
            .group_by(HoneypotEvent.category).order_by(func.count(HoneypotEvent.id).desc()).all())
    ports = (db.query(HoneypotEvent.dst_port, HoneypotEvent.service, func.count(HoneypotEvent.id))
             .filter(HoneypotEvent.ts >= since).group_by(HoneypotEvent.dst_port, HoneypotEvent.service)
             .order_by(func.count(HoneypotEvent.id).desc()).limit(8).all())
    top_ips = (db.query(HoneypotEvent.src_ip, HoneypotEvent.place, func.count(HoneypotEvent.id))
               .filter(HoneypotEvent.ts >= since).group_by(HoneypotEvent.src_ip, HoneypotEvent.place)
               .order_by(func.count(HoneypotEvent.id).desc()).limit(5).all())
    sensors = (db.query(HoneypotEvent.sensor, func.count(HoneypotEvent.id), func.max(HoneypotEvent.ts))
               .group_by(HoneypotEvent.sensor).all())
    last = db.query(func.max(HoneypotEvent.ts)).scalar()

    def online(ts):
        if ts is None:
            return False
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return (now - ts).total_seconds() < 300

    return {
        "hours": hours,
        "enabled": _meta(db, "hp_enabled", "1") == "1",
        "key_set": bool(_meta(db, "hp_key_hash")),
        "key_hint": _meta(db, "hp_key_hint"),
        "total": total,
        "real_total": real_total,
        "count": count,
        "unique_ips": ips,
        "categories": [{"category": c, "label": honeypot.CATEGORY_LABEL.get(c, c), "count": n} for c, n in cats],
        "ports": [{"port": p, "service": s, "count": n} for p, s, n in ports],
        "top_ips": [{"ip": i, "place": pl or "", "count": n} for i, pl, n in top_ips],
        "sensors": [{"name": n, "count": c, "last_seen": t.isoformat(timespec="seconds") if t else None,
                     "online": online(t) and n != "simulyasiya"} for n, c, t in sensors],
        "last_event": last.isoformat(timespec="seconds") if last else None,
        "geo": geo.status(),
        "plan": [{"port": p, "service": s, "category": c, "label": honeypot.CATEGORY_LABEL[c],
                  "technique": honeypot.CATEGORY_TECH[c]} for p, s, c in honeypot.PORT_PLAN],
        "retention_days": HP_PURGE_DAYS,
    }


@app.get("/api/honeypot/events")
def hp_events(limit: int = Query(100, ge=1, le=500), category: str = "", port: int = 0, sim: int = 1,
              user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    q = _hp_filters(db.query(HoneypotEvent), category, port, sim)
    return [honeypot.event_out(e) for e in q.order_by(HoneypotEvent.id.desc()).limit(limit).all()]


@app.get("/api/honeypot/live")
def hp_live(after: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=50), user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    """Monitor üçün: `after` ID-dən sonrakı hadisələr (after=0 olduqda son 10). Nəticə cari əhatədən gəlir."""
    if after == 0:
        rows = list(reversed(db.query(HoneypotEvent).order_by(HoneypotEvent.id.desc()).limit(10).all()))
    else:
        rows = db.query(HoneypotEvent).filter(HoneypotEvent.id > after).order_by(HoneypotEvent.id).limit(limit).all()
    units = {u["id"]: u for u in coverage.cached_units(db, "all")}
    cursor = rows[-1].id if rows else after
    if after == 0 and not rows:
        cursor = db.query(func.max(HoneypotEvent.id)).scalar() or 0
    return {"cursor": cursor, "events": [honeypot.live_event(e, units) for e in rows]}


@app.post("/api/honeypot/simulate", status_code=201)
def hp_simulate(body: HpSim, _: User = Depends(auth.require_analyst), db: Session = Depends(get_db)):
    honeypot.simulate(db, body.count)
    changed()
    return {"created": body.count}


@app.post("/api/honeypot/key")
def hp_new_key(_: User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    import secrets

    key = "hp_" + secrets.token_urlsafe(24)
    _set_meta(db, "hp_key_hash", _hash_key(key))
    _set_meta(db, "hp_key_hint", key[-4:])
    db.commit()
    return {"key": key, "hint": key[-4:]}


@app.put("/api/honeypot/settings")
def hp_settings(body: HpSettings, _: User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    _set_meta(db, "hp_enabled", "1" if body.enabled else "0")
    db.commit()
    return {"enabled": body.enabled}


@app.delete("/api/honeypot/events")
def hp_clear(simulated_only: bool = False, _: User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    q = db.query(HoneypotEvent)
    if simulated_only:
        q = q.filter(HoneypotEvent.simulated.is_(True))
    n = q.delete(synchronize_session=False)
    db.commit()
    changed()
    return {"deleted": n}


@app.get("/api/honeypot/export.csv")
def hp_export(sim: int = 1, user: User = Depends(auth.require_user), db: Session = Depends(get_db)):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "time_utc", "sensor", "src_ip", "src_port", "dst_port", "service", "category", "technique",
                "place", "simulated", "payload"])
    q = _hp_filters(db.query(HoneypotEvent), "", 0, sim).order_by(HoneypotEvent.id.desc()).limit(5000)
    for e in q.all():
        w.writerow([e.id, e.ts.isoformat(timespec="seconds") if e.ts else "", csv_safe(e.sensor), e.src_ip, e.src_port,
                    e.dst_port, e.service, e.category, e.technique_id or "", csv_safe(e.place),
                    "yes" if e.simulated else "no", csv_safe(e.payload.replace("\n", " "))])
    return _download("\ufeff" + buf.getvalue(), "text/csv; charset=utf-8", "ibluteam-honeypot-events.csv")


@app.get("/api/honeypot/agent")
def hp_agent():
    """Honeypot agentinin mənbə kodu (yalnız stdlib, gizli məlumat yoxdur)."""
    if not HP_AGENT.exists():
        raise HTTPException(404, "Agent file not found")
    return _download(HP_AGENT.read_text(encoding="utf-8"), "text/x-python; charset=utf-8", "honeypot.py")

# ---------------------------------------------------------------- frontend (statik)
FRONTEND_DIR = BASE_DIR / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
