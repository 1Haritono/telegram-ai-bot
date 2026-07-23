# Telegram AI Assistant Bot (Aiogram 3 + Gemini API + Voice Provider Switcher + Main Menu)

An asynchronous Telegram bot built with Python, **Aiogram 3**, **Google Gemini AI**, **ElevenLabs API**, **Microsoft Azure Speech Services**, **Google Cloud Neural2**, and **Google Calendar API**. It features an interactive Main Menu structure with inline navigation, Voice Synthesis Provider Selector (Auto, ElevenLabs, Azure, Google), bidirectional voice interactions (Speech-to-Text & Text-to-Speech), a dynamic response mode toggle (Text vs Voice), automatic keyboard layout correction, proxy/VPN capabilities, event scheduling in Google Calendar, and multi-stage Telegram reminders.

---

## 🌟 Key Features

- **📱 Single Main Menu (`/menu`, `/start`):**
  - Interactive seamless navigation menu without cluttering chat history.
  - Submenus: `📅 Calendar`, `🎙️ Voice Settings`, `⚙️ Profile Settings`, `ℹ️ Help`.
- **🎙 Voice Provider Switcher:**
  - **🤖 Auto (auto):** Cascading fallback pipeline (`ElevenLabs` ➔ `Azure` ➔ `Google` ➔ `gTTS`).
  - **🎭 ElevenLabs:** Manual selection for ElevenLabs only (`eleven_multilingual_v2`).
  - **☁️ Azure:** Manual selection for Microsoft Azure (`ru-RU-DmitryNeural` / `en-US`).
  - **🚗 Google / Gemini:** Manual selection for Google Cloud (`ru-RU-Neural2-C` / `en-US`).
  - **▶️ Listen to Sample:** Test voice generation with the selected speaker.
- **🔍 Autonomous Voice Diagnostics (`python scripts/check_tts.py`):**
  - Standalone verification script for all 3 professional voice services with execution report.
- **🎛 Response Mode Toggle (Text / Voice):**
  - Fast output format switching (`🔊 Mode: VOICE 🎙` / `📝 Mode: TEXT 💬`).
- **📅 Google Calendar & Smart Reminders:** Schedule events and send adaptive notifications 1 day, 1 hour, and exact-minute before the event.

---

## 🔍 Voice Provider Diagnostics (`scripts/check_tts.py`)

A standalone diagnostic tool is included to check all 3 professional TTS services (ElevenLabs, Azure Speech, Google Neural2) **without starting the Telegram bot**.

### Terminal Execution:
```bash
python scripts/check_tts.py
```

### Script Workflow:
1. Verifies API key presence in `.env` and `google_keys.json`.
2. Queries each provider's API to check character balance/quota remaining.
3. Generates a test audio sample for *"Sample Voice Test"*.
4. Displays a summary status table with step-by-step troubleshooting instructions upon error detection.
5. Returns exit code `sys.exit(0)` on success or `sys.exit(1)` if any provider fails.

---

## 🗺 Main Menu Hierarchy Structure

```text
/menu or /start
 ├── 📅 Calendar
 │    ├── ➕ New Event (Creation instructions)
 │    ├── 📋 My Events (List of active records from DB)
 │    ├── 🗑️ Delete Event (Clear active reminders)
 │    └── ◀️ Back to Main Menu
 │
 ├── 🎙️ Voice Settings
 │    ├── 🔊/📝 Response Format: [VOICE / TEXT] (Toggle)
 │    ├── 🎭 Voice Style: [Auto / ElevenLabs / Azure / Google] (Speaker selector)
 │    │    ├── 🤖 Auto
 │    │    ├── 👤 ElevenLabs
 │    │    ├── ☁️ Azure
 │    │    ├── 🚗 Google / Gemini
 │    │    └── ◀️ Back to Voice Settings
 │    ├── ▶️ Listen to Sample (Sample audio playback)
 │    └── ◀️ Back to Main Menu
 │
 ├── ⚙️ Profile Settings
 │    ├── 🌐 Interface Language: English 🇬🇧
 │    └── ◀️ Back to Main Menu
 │
 └── ℹ️ Help & About
      └── ◀️ Back to Main Menu
```

---

## 🛠 Detailed Setup & Installation

### 1. Requirements
- **Python:** `3.10` or higher
- **Operating System:** Windows, Linux, or macOS

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/1Haritono/telegram-ai-bot.git
cd telegram-ai-bot
pip install -r requirements.txt
```

### 3. Environment Configuration (`.env`)
```env
BOT_TOKEN=your_telegram_bot_token_from_botfather
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
GOOGLE_CALENDAR_ID=your_email@gmail.com

# Мультипровайдерная озвучка
ELEVENLABS_API_KEY=your_elevenlabs_api_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=westeurope
```

### 4. Run Diagnostic Tool
```bash
python scripts/check_tts.py
```

### 5. Run the Bot
```bash
python bot.py
```

---

## 🏷 Release History

- **`v1.9`** — Autonomous Speech Diagnostics Tool (`scripts/check_tts.py` with exit codes, character limit verification & execution guide).
- **`v1.8`** — Interactive Main Menu Architecture (Navigation module `menu.py`, Single Callback Router, Submenus for Calendar, Voice, Profile Settings & `/menu` command registration).
- **`v1.7`** — Voice Provider Selection UI (Auto, ElevenLabs, Azure, Google Neural2, `voice_provider` DB persistence & "▶️ Sample Voice" button).
- **`v1.6`** — Multi-Provider Text-to-Speech Engine (ElevenLabs Primary + Microsoft Azure Speech Fallback Pipeline & Character Limit Auto-Tracking).
- **`v1.5`** — Global Response Mode Switcher (Text vs Voice mode with `/settings`, `/voice_on`, `/voice_off` & SQLite persistence).
- **`v1.4`** — Google Speech-to-Text & Text-to-Speech Voice Engine (Neural2-C & Wavenet studio voices, `/voice` command & TTS button).
- **`v1.3`** — Google Calendar Integration & Multi-stage Telegram Reminders.
- **`v1.2`** — Auto Keyboard Layout Correction (`ghbdtn` ➡️ `привет`).
- **`v1.1`** — Voice Messages Multimodal Processing.
- **`v1.0`** — Initial Asynchronous Telegram AI Bot release.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for details.
