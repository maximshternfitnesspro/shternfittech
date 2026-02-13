from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

ASSET_VERSION = "20260213b"


def fail(message: str) -> None:
    print(message)
    sys.exit(1)


token = os.getenv("MINIAPP_BOT_TOKEN", "").strip()
webapp_url = os.getenv("MINIAPP_WEBAPP_URL", "").strip().rstrip("/")

if not token:
    fail("MINIAPP_BOT_TOKEN is required")
if not webapp_url:
    fail("MINIAPP_WEBAPP_URL is required")

# Normalize to .../index-motif.html and append cache-busting query param ?v=
parsed = urllib.parse.urlparse(webapp_url)
path = parsed.path or ""
base = webapp_url
if not path.endswith("/index-motif.html"):
    base = webapp_url.rstrip("/") + "/index-motif.html"

parsed = urllib.parse.urlparse(base)
query = dict(urllib.parse.parse_qsl(parsed.query))
query["v"] = ASSET_VERSION
webapp_url = urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(query)))

payload = {
    "menu_button": {
        "type": "web_app",
        "text": "ЧИТ-КОД НА СУШКУ",
        "web_app": {"url": webapp_url},
    }
}

req = urllib.request.Request(
    url=f"https://api.telegram.org/bot{token}/setChatMenuButton",
    method="POST",
    headers={"Content-Type": "application/json"},
    data=json.dumps(payload).encode("utf-8"),
)

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = json.loads(resp.read().decode("utf-8"))
except (urllib.error.URLError, TimeoutError) as exc:
    fail(f"Network error: {exc}")
except json.JSONDecodeError:
    fail("Telegram returned invalid JSON")

print(json.dumps(body, ensure_ascii=False, indent=2))
if not body.get("ok"):
    sys.exit(1)
