# Telegram AI Assistant Bot (Aiogram 3 + Gemini API + Google Calendar & Speech)

An asynchronous Telegram bot built with Python, **Aiogram 3**, **Google Gemini AI**, **Google Speech Engine**, and **Google Calendar API**. It supports bidirectional voice interactions (Speech-to-Text & Text-to-Speech), automatic keyboard layout correction, proxy/VPN capabilities, event scheduling in Google Calendar, and multi-stage Telegram reminders.

---

## 🌟 Key Features

- **🗣 Speech-to-Text (Voice Recognition):** Recognizes and transcribes incoming Telegram `.ogg` voice messages into text.
- **🔊 Text-to-Speech (Voice Synthesis):** Synthesizes natural Russian voice messages:
  - Responds automatically with voice notes when spoken to.
  - Interactive **«🔊 Озвучить ответ»** button under any bot message.
  - Custom `/voice <text>` command for instantly generating voice notes.
  - Spoken audio alerts for scheduled reminders!
- **🤖 Multimodal AI Engine:** Powered by Google Gemini (`gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-flash-latest`) with automatic model fallbacks.
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
- **Google Cloud Account:** With Google Calendar API and Speech Services enabled

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

### 5. Google Cloud Service Account Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Calendar API** and **Text-to-Speech API**.
3. Create a **Service Account** under **IAM & Admin -> Service Accounts**.
4. Download the **JSON key file**, rename it to `google_keys.json`, and place it in the project root.
5. Share your Google Calendar with the Service Account email.

### 6. Run the Bot
```bash
python bot.py
```

---

## 🧪 Voice Verification & Commands

1. Launch the bot (`python bot.py`).
2. Send a voice message to the bot -> receives both text & voice answer.
3. Type `/voice Привет, это проверка синтеза речи!` -> receives generated voice note.
4. Click **«🔊 Озвучить ответ»** under any message to listen to it.

---

## 🏷 Release History

- **`v1.4`** — Google Speech-to-Text & Text-to-Speech Voice Engine (Voice-to-Voice support, `/voice` command & TTS button).
- **`v1.3`** — Google Calendar Integration & Multi-stage Telegram Reminders.
- **`v1.2`** — Auto Keyboard Layout Correction (`ghbdtn` ➡️ `привет`).
- **`v1.1`** — Voice Messages Multimodal Processing.
- **`v1.0`** — Initial Asynchronous Telegram AI Bot release.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for details.
