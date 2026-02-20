from __future__ import annotations

import asyncio
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass

from telegram import (
    KeyboardButton,
    ReplyKeyboardMarkup,
    Update,
    WebAppInfo,
)
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, MessageHandler, filters


ASSET_VERSION = "20260218h"
TIER_DISPLAY = {"DEMO": "FREE", "CORE": "CORE", "BOOST": "PRO", "ELITE": "VIP"}

TRIBUTE_LINKS = {
    "CORE": {
        "telegram": "https://web.tribute.tg/shop/pay/3c5b4c19-f50a-4a4f-81e1-2e74fe4677dd",
        "web": "https://web.tribute.tg/shop/pay/3c5b4c19-f50a-4a4f-81e1-2e74fe4677dd",
    },
    "BOOST": {
        "telegram": "https://web.tribute.tg/shop/pay/79274360-faab-4c87-9e1d-64aabe4de65e",
        "web": "https://web.tribute.tg/shop/pay/79274360-faab-4c87-9e1d-64aabe4de65e",
    },
    "ELITE": {
        "telegram": "https://web.tribute.tg/shop/pay/9f5939e0-1153-4e1e-99dc-d311b5ff8029",
        "web": "https://web.tribute.tg/shop/pay/9f5939e0-1153-4e1e-99dc-d311b5ff8029",
    },
}


@dataclass
class Settings:
    token: str
    miniapp_url: str
    backend_url: str
    admin_token: str


def load_settings() -> Settings:
    token = os.getenv("MINIAPP_BOT_TOKEN", "").strip()
    miniapp_url = os.getenv("MINIAPP_WEBAPP_URL", "").strip().rstrip("/")
    backend_url = os.getenv("MINIAPP_BACKEND_URL", "").strip().rstrip("/")
    admin_token = os.getenv("MINIAPP_ADMIN_TOKEN", "").strip()

    if not token:
        raise RuntimeError("MINIAPP_BOT_TOKEN is required")
    if not miniapp_url:
        raise RuntimeError("MINIAPP_WEBAPP_URL is required")
    if not backend_url:
        backend_url = miniapp_url

    return Settings(token=token, miniapp_url=miniapp_url, backend_url=backend_url, admin_token=admin_token)


SETTINGS = load_settings()


def build_bottom_keyboard() -> ReplyKeyboardMarkup:
    webapp_link = f"{SETTINGS.miniapp_url}/index-motif.html?v={ASSET_VERSION}"
    return ReplyKeyboardMarkup(
        [
            [KeyboardButton("🚀 Открыть Mini App", web_app=WebAppInfo(url=webapp_link))],
            [KeyboardButton("📊 Статус"), KeyboardButton("💳 Оплатить")],
            [KeyboardButton("🛟 Поддержка")],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
        is_persistent=True,
        input_field_placeholder="Выбери действие",
    )


def tier_label(value: str) -> str:
    normalized = (value or "").strip().upper()
    return TIER_DISPLAY.get(normalized, normalized or "FREE")


def fetch_status(tg_user_id: int) -> dict[str, str]:
    query = urllib.parse.urlencode({"tg_user_id": str(tg_user_id)})
    url = f"{SETTINGS.backend_url}/api/access/status?{query}"

    request = urllib.request.Request(url=url, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=6) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return {"tier": "unknown", "pending_tier": "", "updated_at": ""}

    return {
        "tier": str(payload.get("tier") or "DEMO"),
        "pending_tier": str(payload.get("pending_tier") or ""),
        "updated_at": str(payload.get("updated_at") or ""),
    }


def format_status_text(status: dict[str, str]) -> str:
    tier = tier_label(status.get("tier") or "DEMO")
    pending = status.get("pending_tier") or ""
    pending_label = tier_label(pending) if pending else ""
    if pending:
        return (
            f"Текущий уровень: {tier}\n"
            f"Ожидается оплата: {pending_label}\n"
            "После оплаты нажми «Проверить оплату» внутри Mini App."
        )
    return f"Текущий уровень: {tier}\nОплат в ожидании нет."


def plans_text() -> str:
    return (
        "💳 Тарифы:\n\n"
        "🟦 CORE — 1 490 ₽/мес (2 990 ₽/3 мес)\n"
        f"{TRIBUTE_LINKS['CORE']['telegram']}\n\n"
        "🟪 PRO — 3 490 ₽/мес (6 990 ₽/3 мес)\n"
        f"{TRIBUTE_LINKS['BOOST']['telegram']}\n\n"
        "🟥 VIP — 34 990 ₽ (разовая покупка)\n"
        f"{TRIBUTE_LINKS['ELITE']['telegram']}"
    )

def support_text() -> str:
    return (
        "🛟 Поддержка: @bemoresupport\n"
        "Если оплата не открылась — нажми «💳 Оплатить» и повтори попытку."
    )


def extract_referrer_id(start_arg: str | None) -> str:
    text = (start_arg or "").strip().lower()
    if not text:
        return ""
    if text.startswith("ref_"):
        candidate = text.split("ref_", 1)[1]
        return candidate if candidate.isdigit() else ""
    return ""


def register_referral_remote(invitee_tg_user_id: int, referrer_tg_user_id: str) -> bool:
    if not referrer_tg_user_id or not SETTINGS.admin_token:
        return False
    query = urllib.parse.urlencode({"token": SETTINGS.admin_token})
    url = f"{SETTINGS.backend_url}/api/referral/register?{query}"
    payload = json.dumps(
        {
            "tg_user_id": str(invitee_tg_user_id),
            "referrer_tg_user_id": str(referrer_tg_user_id),
        },
        ensure_ascii=False,
    ).encode("utf-8")
    request = urllib.request.Request(
        url=url,
        method="POST",
        headers={"Content-Type": "application/json"},
        data=payload,
    )
    try:
        with urllib.request.urlopen(request, timeout=6) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return False
    return bool(body.get("ok"))


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    start_arg = context.args[0] if context.args else ""
    referrer_id = extract_referrer_id(start_arg)
    referral_registered = False
    if referrer_id and referrer_id != str(update.effective_user.id):
        referral_registered = register_referral_remote(update.effective_user.id, referrer_id)

    referral_tail = (
        "\n\n🎁 Реферальная связь сохранена.\n"
        "Друг получит бонус месяца, когда ты оплатишь любой тариф."
        if referral_registered
        else ""
    )
    await update.message.reply_text(
        "⚡ Чит-код на сушку активирован.\nОткрой Mini App и проходи 1 уровень в день."
        f"{referral_tail}",
        reply_markup=build_bottom_keyboard(),
    )


async def status_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user:
        return

    status = fetch_status(update.effective_user.id)
    text = format_status_text(status)

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(text)
        return

    if update.message:
        await update.message.reply_text(text)


async def plans_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = plans_text()
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(text)
        return

    if update.message:
        await update.message.reply_text(text)

async def support_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = support_text()
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(text)
        return
    if update.message:
        await update.message.reply_text(text)


async def id_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    await update.message.reply_text(f"Твой TG ID: {update.effective_user.id}")


async def chatid_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_chat or not update.message:
        return
    await update.message.reply_text(f"Chat ID: {update.effective_chat.id}")


async def callbacks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.callback_query:
        return
    data = update.callback_query.data or ""
    if data == "status":
        await status_cmd(update, context)
        return
    if data == "plans":
        await plans_cmd(update, context)
        return
    if data == "support":
        await support_cmd(update, context)
        return
    await update.callback_query.answer("Команда не распознана", show_alert=False)


async def text_router(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    text = (update.message.text or "").strip().lower()
    if not text:
        return

    if "статус" in text:
        await status_cmd(update, context)
        return
    if "оплат" in text:
        await plans_cmd(update, context)
        return
    if "поддерж" in text:
        await support_cmd(update, context)
        return


def main() -> None:
    # Python 3.14 no longer creates a default event loop automatically.
    # python-telegram-bot still expects one before run_polling().
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())

    app = Application.builder().token(SETTINGS.token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("status", status_cmd))
    app.add_handler(CommandHandler("plans", plans_cmd))
    app.add_handler(CommandHandler("support", support_cmd))
    app.add_handler(CommandHandler("id", id_cmd))
    app.add_handler(CommandHandler("chatid", chatid_cmd))
    app.add_handler(CallbackQueryHandler(callbacks))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), text_router))
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
