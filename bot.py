from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes


ASSET_VERSION = "20260214b"

TRIBUTE_LINKS = {
    "CORE": {
        "telegram": "https://t.me/tribute/app?startapp=sNQO",
        "web": "https://web.tribute.tg/s/NQO",
    },
    "BOOST": {
        "telegram": "https://t.me/tribute/app?startapp=sNQP",
        "web": "https://web.tribute.tg/s/NQP",
    },
    "ELITE": {
        "telegram": "https://t.me/tribute/app?startapp=sNQQ",
        "web": "https://web.tribute.tg/s/NQQ",
    },
}


@dataclass
class Settings:
    token: str
    miniapp_url: str
    backend_url: str


def load_settings() -> Settings:
    token = os.getenv("MINIAPP_BOT_TOKEN", "").strip()
    miniapp_url = os.getenv("MINIAPP_WEBAPP_URL", "").strip().rstrip("/")
    backend_url = os.getenv("MINIAPP_BACKEND_URL", "").strip().rstrip("/")

    if not token:
        raise RuntimeError("MINIAPP_BOT_TOKEN is required")
    if not miniapp_url:
        raise RuntimeError("MINIAPP_WEBAPP_URL is required")
    if not backend_url:
        backend_url = miniapp_url

    return Settings(token=token, miniapp_url=miniapp_url, backend_url=backend_url)


SETTINGS = load_settings()


def build_main_keyboard() -> InlineKeyboardMarkup:
    webapp_link = f"{SETTINGS.miniapp_url}/index-motif.html?v={ASSET_VERSION}"
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Открыть Mini App", web_app=WebAppInfo(url=webapp_link))],
            [InlineKeyboardButton("Статус подписки", callback_data="status")],
            [InlineKeyboardButton("Тарифы", callback_data="plans")],
        ]
    )


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
    tier = status.get("tier") or "DEMO"
    pending = status.get("pending_tier") or ""
    if pending:
        return (
            f"Текущий уровень: {tier}\n"
            f"Ожидается оплата: {pending}\n"
            "После оплаты нажми «Проверить оплату» внутри Mini App."
        )
    return f"Текущий уровень: {tier}\nОплат в ожидании нет."


def plans_text() -> str:
    return (
        "Тарифы:\n\n"
        "CORE — 1 490 ₽/мес (2 990 ₽/3 мес)\n"
        f"{TRIBUTE_LINKS['CORE']['telegram']}\n\n"
        "BOOST — 3 490 ₽/мес (6 990 ₽/3 мес)\n"
        f"{TRIBUTE_LINKS['BOOST']['telegram']}\n\n"
        "ELITE — 34 990 ₽ (разовая покупка)\n"
        f"{TRIBUTE_LINKS['ELITE']['telegram']}"
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        "Чит-код на сушку активирован. Открой Mini App и проходи 1 уровень в день.",
        reply_markup=build_main_keyboard(),
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
    await update.callback_query.answer("Команда не распознана", show_alert=False)


def main() -> None:
    app = Application.builder().token(SETTINGS.token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("status", status_cmd))
    app.add_handler(CommandHandler("plans", plans_cmd))
    app.add_handler(CommandHandler("id", id_cmd))
    app.add_handler(CommandHandler("chatid", chatid_cmd))
    app.add_handler(CallbackQueryHandler(callbacks))
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
