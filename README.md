# Telegram AI Assistant Bot (Aiogram 3 + Gemini API + Google Calendar)

An asynchronous Telegram bot built with Python, **Aiogram 3**, **Google Gemini AI**, and **Google Calendar API**. It supports text, voice messages, automatic keyboard layout correction, proxy/VPN capabilities, event scheduling in Google Calendar, and multi-stage Telegram reminders.

---

## 🌟 Features

- **🤖 Multimodal AI:** Powered by Google Gemini (`gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-flash-latest`) with automatic model fallbacks.
- **🎙 Voice Message Processing:** Native Telegram `.ogg` voice notes transcription and processing using Gemini Multimodal API.
- **📅 Google Calendar Integration:** Automatic creation of scheduled events in Google Calendar via Google Calendar API.
- **⏰ Smart Multi-Stage Telegram Reminders:**
  - 🌙 Evening before event (at 22:00)
  - ☀️ Morning of event (at 10:00)
  - ⏳ 1 hour before event
  - 🔔 Exact minute of the event
  - *Dynamic adaptive time calculation (filters out past stages automatically).*
- **🔤 Auto Keyboard Layout Correction:** Decodes mistyped English layout into Cyrillic (e.g. `ghbdtn` ➡️ `привет`).
- **🛡 Security First:** Complete isolation of tokens and service keys in `.env` and `google_keys.json` (git-ignored).
- **📡 Proxy & VPN Ready:** Supports HTTP/SOCKS5 proxy authentication or native system-wide VPN setups.

---

## 🛠 Detailed Setup & Installation

### 1. Requirements
- **Python:** `3.10` or higher
- **Operating System:** Windows, Linux, or macOS
- **Google Cloud Account:** With Google Calendar API enabled

### 2. Clone the Repository
```bash
git clone https://github.com/1Haritono/telegram-ai-bot.git
cd telegram-ai-bot
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration (`.env`)
Create a `.env` file in the root directory:

```env
BOT_TOKEN=your_telegram_bot_token_from_botfather
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
GOOGLE_CALENDAR_ID=your_email@gmail.com

# Optional Proxy Configuration
PROXY_URL=http://username:password@ip:port
```

### 5. Google Calendar API Credentials Setup
To allow the bot to create events in your Google Calendar:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Calendar API**.
3. Create a **Service Account** under **IAM & Admin -> Service Accounts**.
4. Create a **JSON key** for the Service Account and download it.
5. Rename the downloaded file to `google_keys.json` and place it in the root folder of the project.
6. Open [Google Calendar](https://calendar.google.com/), go to **Calendar Settings -> Share with specific people**, add your Service Account's email (`client_email` from `google_keys.json`), and grant it **Make changes to events** permission.

### 6. Run the Bot
```bash
python bot.py
```

---

## 🧪 Verification & Testing Scenario

1. Launch the bot (`python bot.py`).
2. Send a voice or text message to your Telegram bot:
   > *"Remind me that I have an important meeting tomorrow at 15:00"*
3. **Expected Behavior:**
   - The bot responds confirming the scheduled event.
   - A new event appears in your **Google Calendar**.
   - Notifications are automatically registered in the local `reminders.db` SQLite database.

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `FileNotFoundError: google_keys.json` | Missing Google Service Account key | Create and place `google_keys.json` in root folder. |
| `TelegramConflictError` | Multiple instances of `bot.py` running | Stop all background Python processes using Task Manager or `taskkill`. |
| `429 Too Many Requests` | Gemini API quota exceeded | The bot automatically falls back to secondary models (`gemini-2.0-flash-lite`, `gemini-flash-latest`). |

---

## 🏷 Release History

- **`v1.3`** — Google Calendar Integration & Multi-stage Telegram Reminders.
- **`v1.2`** — Auto Keyboard Layout Correction (e.g. `ghbdtn` ➡️ `привет`).
- **`v1.1`** — Voice Messages Multimodal Processing.
- **`v1.0`** — Initial Asynchronous Telegram AI Bot release.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for details.
