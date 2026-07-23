# Telegram AI Assistant Bot (Aiogram 3 + Gemini API)

An asynchronous Telegram bot built with Python, **Aiogram 3**, and **Google Gemini AI** supporting text, voice messages, automatic keyboard layout correction, and proxy/VPN capabilities.

## 🚀 Key Features

- **Asynchronous Architecture:** Built on top of `Aiogram 3` for fast, non-blocking operation.
- **Multimodal AI Integration:** Leverages Google Gemini models for deep text understanding and natural language processing.
- **Voice Message Support:** Transcribes, understands, and replies to Telegram voice messages (`.ogg` audio files).
- **Auto Keyboard Layout Correction:** Automatically detects and decodes mistyped text in English keyboard layout (e.g., `ghbdtn` ➡️ `привет`).
- **Smart Model Fallback:** Automatically switches between lightweight models (`gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-flash-latest`) when rate limits or quotas are hit.
- **Security First:** Confidential credentials (tokens & proxy auth) are isolated in `.env` and kept out of version control.
- **Proxy & VPN Ready:** Supports HTTP/SOCKS5 proxies with authentication as well as system-wide VPN setups.
- **Windows UTF-8 Optimized:** Properly reconfigured stdout encoding and logging for Windows environments.

---

## 🛠 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/1Haritono/telegram-ai-bot.git
cd telegram-ai-bot
```

### 2. Install Dependencies
```bash
pip install aiogram google-genai python-dotenv aiohttp-socks
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory of the project:

```env
BOT_TOKEN=your_telegram_bot_token_from_botfather
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio

# Optional: If you use a proxy server (HTTP/SOCKS5)
# Format with authentication: http://username:password@ip:port
# Format without authentication: http://ip:port
PROXY_URL=http://user:password@ip:port
```

> ⚠️ **Note:** If you are running a **system-wide VPN** on your machine or server, leaving `PROXY_URL` blank will allow the bot to seamlessly use your active VPN connection.

### 4. Run the Bot
```bash
python bot.py
```

---

## 🏷 Release History & Detailed Release Notes

### 🔹 **`v1.2` — Auto Keyboard Layout Correction (Latest)**
- Added `fix_keyboard_layout()` function that detects mistyped English keyboard characters (e.g., `ghbdtn`, `rfr ltkf`) and decodes them to Cyrillic (`привет`, `как дела`).
- Instructed Gemini prompt to process converted layout seamlessly.
- Ignores valid English words while converting obvious layout mistakes.

### 🔹 **`v1.1` — Voice Messages Support**
- Added handler for `F.voice` Telegram audio messages.
- Integrated `ai_client.files.upload()` to stream `.ogg` audio directly to Google Gemini Multimodal API.
- Implemented temporary audio file cleanup after processing.

### 🔹 **`v1.0` — Initial Release**
- Core asynchronous Telegram bot based on `Aiogram 3`.
- Integration with Google Gemini API (`gemini-2.0-flash`).
- Safe `.env` key management.
- HTTP/SOCKS5 proxy authentication support.
- Windows UTF-8 stdout fix.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
