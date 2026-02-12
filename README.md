# Mini App Prototype (отдельный проект)

Этот каталог автономен от остальных файлов репозитория.

## Что внутри
- `index-motif.html`, `styles-motif.css`, `app.js` — фронт Mini App.
- `server.py` — backend (статика + API статуса + webhook Tribute).
- `bot.py` — отдельный Telegram-бот для запуска Mini App и команды `/status`.

## Быстрый запуск (локально)
Из папки `/Users/maximshtern/Documents/New project/mini-app-prototype`:

```bash
source ../.venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8090 --reload
```

Открыть:
- `http://localhost:8090/index-motif.html`
- первый запуск: `http://localhost:8090/index-motif.html?onboarding=1`
- конец демо: `http://localhost:8090/index-motif.html?demo=end`
- сброс локального состояния: `http://localhost:8090/index-motif.html?reset=1`
- принудительный тариф для теста: `http://localhost:8090/index-motif.html?tier=DEMO` (или `CORE/BOOST/ELITE`)

## Как теперь работает оплата
- Нажатие на тариф открывает Tribute и ставит статус `Ожидается оплата`.
- Доступ **не активируется локальной кнопкой**.
- Mini App проверяет `/api/access/status` (по `telegram_user_id`) и активирует тариф только после подтверждения backend.
- Если пользователь отменил оплату, тариф не повышается.

## Настройка webhook Tribute
1. Задай токен в окружении backend:
```bash
export MINIAPP_TRIBUTE_WEBHOOK_TOKEN='your-secret-token'
```
2. В Tribute укажи webhook URL:
```text
https://<your-domain>/api/tribute/webhook?token=your-secret-token
```

## Переменные окружения
Скопируй `mini-app-prototype/.env.example` и заполни значения.

```bash
cp .env.example .env
```

## Запуск Telegram-бота (опционально)
```bash
source ../.venv/bin/activate
export MINIAPP_BOT_TOKEN='<telegram-bot-token>'
export MINIAPP_WEBAPP_URL='https://<your-domain>'
export MINIAPP_BACKEND_URL='https://<your-domain>'
python bot.py
```

Команды бота:
- `/start` — открыть Mini App
- `/status` — показать текущий уровень доступа
- `/plans` — ссылки CORE / BOOST / ELITE

## Прод-хостинг без ngrok (рекомендация: Render)
Ниже схема, чтобы Mini App работал по постоянному HTTPS URL без экранов `ERR_NGROK_*`.

1. Создай отдельный репозиторий **только для содержимого** `mini-app-prototype`.
2. В Render создай `Web Service` из этого репозитория:
   - Runtime: `Docker`
   - План: `Starter` (чтобы не было авто-sleep)
   - Health check path: `/api/health`
   - Environment variable: `MINIAPP_TRIBUTE_WEBHOOK_TOKEN=<твой-секрет>`
3. Дождись деплоя и возьми URL вида:
   - `https://cheatcode-miniapp.onrender.com`
4. Обнови Mini App URL в Telegram-боте:
   - `https://cheatcode-miniapp.onrender.com/index-motif.html`
5. Обнови webhook URL в Tribute:
   - `https://cheatcode-miniapp.onrender.com/api/tribute/webhook?token=<твой-секрет>`

Быстрое обновление кнопки меню бота:
```bash
export MINIAPP_BOT_TOKEN='<telegram-bot-token>'
export MINIAPP_WEBAPP_URL='https://cheatcode-miniapp.onrender.com'
python scripts/set_chat_menu_button.py
```

Проверка:
- `GET /api/health` должен вернуть `{"ok": true, ...}`
- в Tribute тест webhook должен возвращать HTTP `200`
