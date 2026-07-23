# Telegram AI Assistant Bot (Aiogram 3 + Gemini API + Voice Provider Switcher + Main Menu)

An asynchronous Telegram bot built with Python, **Aiogram 3**, **Google Gemini AI**, **ElevenLabs API**, **Microsoft Azure Speech Services**, **Google Cloud Neural2**, and **Google Calendar API**. It features an interactive Main Menu structure with inline navigation, Voice Synthesis Provider Selector (Auto, ElevenLabs, Azure, Google), bidirectional voice interactions (Speech-to-Text & Text-to-Speech), a dynamic response mode toggle (Text vs Voice), automatic keyboard layout correction, proxy/VPN capabilities, event scheduling in Google Calendar, and multi-stage Telegram reminders.

---

## 🌟 Key Features

- **📱 Единое Главное Меню (`/menu`, `/start`):**
  - Интерактивное бесшовное навигационное меню без мусорных сообщений.
  - Подменю: `📅 Календарь`, `🎙️ Голосовые настройки`, `⚙️ Настройки профиля`, `ℹ️ Помощь`.
- **🎙 Выбор провайдера озвучки (Voice Provider Switcher):**
  - **🤖 Авто (auto):** Каскадная цепочка резервирования (`ElevenLabs` ➔ `Azure` ➔ `Google` ➔ `gTTS`).
  - **🎭 ElevenLabs:** Ручной выбор только ElevenLabs (`eleven_multilingual_v2`).
  - **☁️ Azure:** Ручной выбор только Microsoft Azure (`ru-RU-DmitryNeural`).
  - **🔷 Google:** Ручной выбор только Google Cloud (`ru-RU-Neural2-C`).
  - **▶️ Прослушать пример:** Тестовая озвучка выбранным диктором из меню.
- **🔍 Автономная диагностика озвучки (`python scripts/check_tts.py`):**
  - Независимый скрипт проверки всех 3 профессиональных голосовых сервисов с генерацией отчета.
- **🎛 Response Mode Toggle (Text / Voice):**
  - Быстрое переключение формата ответов (`🔊 Режим: ГОЛОС 🎙` / `📝 Режим: ТЕКСТ 💬`).
- **📅 Google Calendar & Smart Reminders:** Планирование встреч и отправка адаптивных уведомлений за 1 день, 1 час и минуту в минуту.

---

## 🔍 Диагностика провайдеров озвучки (`scripts/check_tts.py`)

В проект включен независимый автономный инструмент проверки всех 3 профессиональных TTS-сервисов (ElevenLabs, Azure Speech, Google Neural2), который можно запускать **без запуска самого бота**.

### Команда запуска из консоли:
```bash
python scripts/check_tts.py
```

### Что делает скрипт:
1. Проверяет наличие ключей в `.env` и файла `google_keys.json`.
2. Опрашивает API каждого провайдера и проверяет баланс/остаток символов лимита.
3. Совершает тестовую генерацию аудиофайла фразы *"Тестовая озвучка"*.
4. Выводит сводную таблицу статусов и точные пошаговые инструкции при обнаружении ошибок.
5. Возвращает код `sys.exit(0)` при успехе или `sys.exit(1)` если хотя бы 1 провайдер сбоит.

---

## 🗺 Схема Главного Меню и Вложенности (Menu Hierarchy)

```text
/menu или /start
 ├── 📅 Календарь
 │    ├── ➕ Новое событие (Инструкция по созданию)
 │    ├── 📋 Мои события (Список активных записей из БД)
 │    ├── 🗑️ Удалить событие (Очистить активные напоминания)
 │    └── ◀️ Назад в Главное меню
 │
 ├── 🎙️ Голосовые настройки
 │    ├── 🔊/📝 Формат ответов: [ГОЛОС / ТЕКСТ] (Переключатель)
 │    ├── 🎭 Провайдер: [Авто / ElevenLabs / Azure / Google] (Переход в выбор диктора)
 │    │    ├── 🤖 Авто
 │    │    ├── 🎭 ElevenLabs
 │    │    ├── ☁️ Azure
 │    │    ├── 🔷 Google
 │    │    └── ◀️ Назад в Голосовые настройки
 │    ├── ▶️ Прослушать пример (Озвучка тестовой фразы)
 │    └── ◀️ Назад в Главное меню
 │
 ├── ⚙️ Настройки профиля
 │    ├── 🌐 Язык интерфейса: Русский 🇷🇺
 │    └── ◀️ Назад в Главное меню
 │
 └── ℹ️ Помощь и о боте
      └── ◀️ Назад в Главное меню
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
