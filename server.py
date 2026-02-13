from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import sqlite3
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "miniapp.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

TIER_ORDER = {"DEMO": 0, "CORE": 1, "BOOST": 2, "ELITE": 3}
TIER_HINTS = {
    "CORE": {"core", "sNQO".lower(), "nqo"},
    "BOOST": {"boost", "sNQP".lower(), "nqp"},
    "ELITE": {"elite", "sNQQ".lower(), "nqq"},
}

WEBHOOK_TOKEN = os.getenv("MINIAPP_TRIBUTE_WEBHOOK_TOKEN", "")
TELEGRAM_BOT_TOKEN = (os.getenv("MINIAPP_NOTIFY_BOT_TOKEN") or os.getenv("MINIAPP_BOT_TOKEN") or "").strip()
NOTIFY_ON_PAYMENT = os.getenv("MINIAPP_NOTIFY_ON_PAYMENT", "1").strip() not in {"0", "false", "False", "no", "NO"}
TRIBUTE_API_KEY = (os.getenv("MINIAPP_TRIBUTE_API_KEY") or "").strip()
ADMIN_TOKEN = (os.getenv("MINIAPP_ADMIN_TOKEN") or "").strip()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("miniapp")

app = FastAPI(title="Mini App Backend", version="1.0.0")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS access_state (
              tg_user_id TEXT PRIMARY KEY,
              tier TEXT NOT NULL DEFAULT 'DEMO',
              pending_tier TEXT,
              pending_since TEXT,
              updated_at TEXT NOT NULL,
              source TEXT,
              last_payload TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS webhook_events (
              event_key TEXT PRIMARY KEY,
              received_at TEXT NOT NULL,
              payload TEXT NOT NULL
            )
            """
        )


@app.on_event("startup")
def startup() -> None:
    init_db()


def normalize_tier(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip().upper()
    return text if text in TIER_ORDER else None


def json_dumps(payload: Any) -> str:
    try:
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    except Exception:
        return "{}"


def verify_tribute_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """
    Tribute signs webhook requests with HMAC-SHA256 using your API key.
    Verification is enabled only when MINIAPP_TRIBUTE_API_KEY is set.
    """
    if not TRIBUTE_API_KEY:
        return True
    if not signature_header:
        return False

    provided = str(signature_header).strip().lower()
    expected = hmac.new(TRIBUTE_API_KEY.encode("utf-8"), raw_body, hashlib.sha256).hexdigest().lower()
    return hmac.compare_digest(provided, expected)


def send_telegram_message(tg_user_id: str, text: str) -> bool:
    """
    Best-effort notification after successful payment.
    Important: Telegram allows bot->user messages only if the user started the bot earlier.
    """
    if not TELEGRAM_BOT_TOKEN or not NOTIFY_ON_PAYMENT:
        return False

    payload = {
        "chat_id": tg_user_id,
        "text": text,
        "disable_web_page_preview": True,
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url=f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        method="POST",
        headers={"Content-Type": "application/json"},
        data=data,
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            response = json.loads(resp.read().decode("utf-8"))
        return bool(response.get("ok"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return False


def get_row(tg_user_id: str) -> sqlite3.Row | None:
    with db() as conn:
        return conn.execute("SELECT * FROM access_state WHERE tg_user_id = ?", (tg_user_id,)).fetchone()


def get_status(tg_user_id: str) -> dict[str, Any]:
    row = get_row(tg_user_id)
    if not row:
        return {
            "tg_user_id": tg_user_id,
            "tier": "DEMO",
            "pending_tier": None,
            "pending_since": None,
            "updated_at": None,
        }
    return {
        "tg_user_id": row["tg_user_id"],
        "tier": row["tier"],
        "pending_tier": row["pending_tier"],
        "pending_since": row["pending_since"],
        "updated_at": row["updated_at"],
    }


def upsert_pending(tg_user_id: str, tier: str) -> None:
    tier = normalize_tier(tier) or "DEMO"
    ts = now_iso()
    with db() as conn:
        row = conn.execute("SELECT tier FROM access_state WHERE tg_user_id = ?", (tg_user_id,)).fetchone()
        current_tier = row["tier"] if row else "DEMO"
        conn.execute(
            """
            INSERT INTO access_state (tg_user_id, tier, pending_tier, pending_since, updated_at, source, last_payload)
            VALUES (?, ?, ?, ?, ?, 'pending', NULL)
            ON CONFLICT(tg_user_id) DO UPDATE SET
              pending_tier=excluded.pending_tier,
              pending_since=excluded.pending_since,
              updated_at=excluded.updated_at,
              source='pending'
            """,
            (tg_user_id, current_tier, tier, ts, ts),
        )


def upsert_paid(tg_user_id: str, paid_tier: str, payload: Any) -> dict[str, str]:
    paid_tier = normalize_tier(paid_tier) or "DEMO"
    ts = now_iso()
    payload_json = json_dumps(payload)

    with db() as conn:
        row = conn.execute(
            "SELECT tier, pending_tier, pending_since FROM access_state WHERE tg_user_id = ?",
            (tg_user_id,),
        ).fetchone()
        current = row["tier"] if row else "DEMO"
        pending = row["pending_tier"] if row else None
        pending_since_prev = row["pending_since"] if row else None

        if TIER_ORDER.get(paid_tier, 0) < TIER_ORDER.get(current, 0):
            final_tier = current
        else:
            final_tier = paid_tier

        clear_pending = pending is not None and TIER_ORDER.get(final_tier, 0) >= TIER_ORDER.get(str(pending).upper(), 0)
        pending_tier = None if clear_pending else pending
        pending_since = None if clear_pending else pending_since_prev

        conn.execute(
            """
            INSERT INTO access_state (tg_user_id, tier, pending_tier, pending_since, updated_at, source, last_payload)
            VALUES (?, ?, ?, ?, ?, 'tribute_webhook', ?)
            ON CONFLICT(tg_user_id) DO UPDATE SET
              tier=excluded.tier,
              pending_tier=excluded.pending_tier,
              pending_since=excluded.pending_since,
              updated_at=excluded.updated_at,
              source='tribute_webhook',
              last_payload=excluded.last_payload
            """,
            (tg_user_id, final_tier, pending_tier, pending_since, ts, payload_json),
        )

    return {"tier_before": current, "tier_after": final_tier}


def remember_event(payload: Any) -> tuple[str, bool]:
    payload_json = json_dumps(payload)
    event_key_raw = str(
        payload.get("id")
        or payload.get("event_id")
        or payload.get("payment_id")
        or payload.get("subscription_id")
        or hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
    )
    event_key = hashlib.sha256(event_key_raw.encode("utf-8")).hexdigest()

    with db() as conn:
        exists = conn.execute("SELECT 1 FROM webhook_events WHERE event_key = ?", (event_key,)).fetchone()
        if exists:
            return event_key, True
        conn.execute(
            "INSERT INTO webhook_events (event_key, received_at, payload) VALUES (?, ?, ?)",
            (event_key, now_iso(), payload_json),
        )
    return event_key, False


def extract_first_int(obj: Any) -> str | None:
    if obj is None:
        return None
    if isinstance(obj, bool):
        return None
    if isinstance(obj, int):
        return str(obj)
    if isinstance(obj, str):
        text = obj.strip()
        if text.isdigit():
            return text
        return None
    if isinstance(obj, dict):
        preferred_keys = [
            "telegram_user_id",
            "telegramId",
            "telegram_id",
            "tg_user_id",
            "user_id",
            "userId",
        ]
        for key in preferred_keys:
            if key in obj:
                found = extract_first_int(obj.get(key))
                if found:
                    return found
        for value in obj.values():
            found = extract_first_int(value)
            if found:
                return found
    if isinstance(obj, list):
        for value in obj:
            found = extract_first_int(value)
            if found:
                return found
    return None


def flatten_strings(obj: Any, limit: int = 512) -> list[str]:
    bucket: list[str] = []

    def walk(value: Any) -> None:
        if len(bucket) >= limit:
            return
        if value is None:
            return
        if isinstance(value, str):
            bucket.append(value.lower())
            return
        if isinstance(value, (int, float, bool)):
            bucket.append(str(value).lower())
            return
        if isinstance(value, dict):
            for key, nested in value.items():
                walk(key)
                walk(nested)
            return
        if isinstance(value, list):
            for nested in value:
                walk(nested)

    walk(obj)
    return bucket


def extract_tier(payload: dict[str, Any]) -> str | None:
    texts = flatten_strings(payload)
    merged = " | ".join(texts)

    for tier, hints in TIER_HINTS.items():
        for hint in hints:
            if hint in merged:
                return tier

    for key in ("tier", "plan", "module", "product", "offer", "offer_id"):
        if key in payload:
            direct = normalize_tier(payload.get(key))
            if direct:
                return direct

    return None


def is_success_event(payload: dict[str, Any]) -> bool:
    status_candidates = flatten_strings(
        {
            "event": payload.get("event") or payload.get("name") or payload.get("type"),
            "status": payload.get("status"),
            "payload": payload.get("payload"),
            "data": payload.get("data"),
        }
    )
    blob = " | ".join(status_candidates)

    negative = ["cancel", "canceled", "cancelled", "fail", "error", "refund", "expired"]
    positive = ["success", "paid", "active", "approved", "completed", "new_subscription", "purchase"]

    if any(word in blob for word in negative):
        return False
    if any(word in blob for word in positive):
        return True

    # Если Tribute пришлёт нестандартное имя события — не активируем доступ вслепую.
    return False


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "mini-app-prototype"}


@app.head("/api/health")
def health_head() -> Response:
    # Некоторые аптайм-мониторы/прокси делают HEAD-запросы.
    # Явно поддерживаем, чтобы keep-alive не ловил 404.
    return Response(status_code=200)


@app.get("/api/access/status")
def access_status(tg_user_id: str = Query(..., min_length=1, max_length=64)) -> dict[str, Any]:
    return {"ok": True, **get_status(tg_user_id.strip())}


@app.post("/api/access/pending")
async def access_pending(request: Request) -> dict[str, Any]:
    body = await request.json()
    tg_user_id = str(body.get("tg_user_id", "")).strip()
    tier = normalize_tier(body.get("tier"))
    if not tg_user_id or not tier:
        raise HTTPException(status_code=400, detail="tg_user_id и tier обязательны")

    upsert_pending(tg_user_id, tier)
    return {"ok": True, **get_status(tg_user_id)}


@app.post("/api/tribute/webhook")
async def tribute_webhook(request: Request, token: str | None = None) -> JSONResponse:
    if WEBHOOK_TOKEN and token != WEBHOOK_TOKEN:
        raise HTTPException(status_code=403, detail="invalid webhook token")

    raw_body = await request.body()
    signature = request.headers.get("trbt-signature") or request.headers.get("Trbt-Signature")
    if not verify_tribute_signature(raw_body, signature):
        logger.warning("tribute_webhook rejected: invalid signature path=%s", request.url.path)
        raise HTTPException(status_code=401, detail="invalid signature")

    try:
        payload = json.loads(raw_body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="invalid json") from None
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="invalid payload")

    event_key, duplicate = remember_event(payload)
    if duplicate:
        logger.info("tribute_webhook duplicate event_key=%s path=%s", event_key, request.url.path)
        return JSONResponse({"ok": True, "duplicate": True, "event_key": event_key})

    # Часть интеграций кладёт реальные поля в payload.data / payload.payload
    nested = payload.get("payload") if isinstance(payload.get("payload"), dict) else {}
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    merged_payload = {**payload, **nested, **data}

    tg_user_id = extract_first_int(merged_payload)
    tier = extract_tier(merged_payload)
    success = is_success_event(merged_payload)

    if not tg_user_id:
        logger.info(
            "tribute_webhook accepted=false reason=telegram_user_id_not_found event_key=%s path=%s tier=%s success=%s",
            event_key,
            request.url.path,
            tier,
            success,
        )
        return JSONResponse(
            {
                "ok": True,
                "accepted": False,
                "reason": "telegram_user_id_not_found",
                "event_key": event_key,
                "success_event": success,
                "tier_detected": tier,
            }
        )

    if success and not tier and tg_user_id:
        # Если Tribute не прислал тариф в webhook, берём ожидаемый pending-тариф пользователя.
        status_now = get_status(tg_user_id)
        pending_tier = normalize_tier(status_now.get("pending_tier"))
        if pending_tier:
            tier = pending_tier

    if not success or not tier:
        logger.info(
            "tribute_webhook accepted=false reason=payment_not_confirmed_or_tier_missing tg_user_id=%s event_key=%s path=%s tier=%s success=%s",
            tg_user_id,
            event_key,
            request.url.path,
            tier,
            success,
        )
        return JSONResponse(
            {
                "ok": True,
                "accepted": False,
                "reason": "payment_not_confirmed_or_tier_missing",
                "event_key": event_key,
                "success_event": success,
                "tier_detected": tier,
                "status": get_status(tg_user_id),
            }
        )

    transition = upsert_paid(tg_user_id, tier, merged_payload)
    tier_after = transition.get("tier_after", tier)
    logger.info(
        "tribute_webhook accepted=true tg_user_id=%s tier=%s event_key=%s path=%s",
        tg_user_id,
        tier_after,
        event_key,
        request.url.path,
    )
    send_telegram_message(
        tg_user_id,
        (
            f"Оплата подтверждена. Доступ {tier_after} активирован.\n\n"
            "Открой Mini App и продолжай уровни. Если уровень не обновился — зайди в «Подписка» и нажми «Проверить оплату»."
        ),
    )
    return JSONResponse(
        {
            "ok": True,
            "accepted": True,
            "event_key": event_key,
            "tg_user_id": tg_user_id,
            "tier_detected": tier,
            **transition,
            "status": get_status(tg_user_id),
        }
    )


@app.post("/webhook/tribute")
async def tribute_webhook_compat(request: Request, token: str | None = None) -> JSONResponse:
    # Backward-compatible path: some Tribute configs used /webhook/tribute.
    return await tribute_webhook(request, token=token)


@app.get("/api/admin/grant")
def admin_grant_get(
    tg_user_id: str = Query(..., min_length=1, max_length=64),
    tier: str = Query(..., min_length=1, max_length=16),
    token: str | None = None,
) -> dict[str, Any]:
    if not ADMIN_TOKEN or token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="forbidden")
    normalized = normalize_tier(tier)
    if not normalized:
        raise HTTPException(status_code=400, detail="invalid tier")
    upsert_paid(tg_user_id.strip(), normalized, {"source": "admin_grant", "tier": normalized})
    logger.info("admin_grant tg_user_id=%s tier=%s", tg_user_id.strip(), normalized)
    return {"ok": True, **get_status(tg_user_id.strip())}


@app.post("/api/admin/grant")
async def admin_grant_post(request: Request, token: str | None = None) -> dict[str, Any]:
    if not ADMIN_TOKEN or token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="forbidden")
    body = await request.json()
    tg_user_id = str(body.get("tg_user_id", "")).strip()
    tier = normalize_tier(body.get("tier"))
    if not tg_user_id or not tier:
        raise HTTPException(status_code=400, detail="tg_user_id и tier обязательны")
    upsert_paid(tg_user_id, tier, {"source": "admin_grant", "tier": tier})
    logger.info("admin_grant tg_user_id=%s tier=%s", tg_user_id, tier)
    return {"ok": True, **get_status(tg_user_id)}


app.mount("/", StaticFiles(directory=BASE_DIR, html=True), name="frontend")
