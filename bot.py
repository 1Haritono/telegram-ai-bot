import asyncio
import logging
import os
import sys
import json
import sqlite3
import re
import requests
from datetime import datetime, timedelta
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.types import FSInputFile, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand
from google import genai
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from gtts import gTTS

from menu import (
    CB_MAIN_MENU, CB_CALENDAR_MENU, CB_VOICE_MENU, CB_SETTINGS_MENU, CB_HELP_MENU,
    CB_CAL_ADD, CB_CAL_LIST, CB_CAL_DELETE,
    CB_TOGGLE_MODE, CB_PROV_MENU, CB_SET_PROV_AUTO, CB_SET_PROV_ELEVEN,
    CB_SET_PROV_AZURE, CB_SET_PROV_GOOGLE, CB_SAMPLE_VOICE,
    get_main_menu_keyboard, get_calendar_menu_keyboard, get_voice_menu_keyboard,
    get_provider_selector_keyboard, get_settings_menu_keyboard, get_back_to_main_keyboard
)

from google.cloud import texttospeech
from google.oauth2 import service_account
from googleapiclient.discovery import build

try:
    import azure.cognitiveservices.speech as speechsdk
except ImportError:
    speechsdk = None

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PROXY_URL = os.getenv("PROXY_URL")
GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "westeurope")

if not BOT_TOKEN or not GEMINI_API_KEY:
    raise ValueError("Необходимо заполнить BOT_TOKEN и GEMINI_API_KEY в файле .env!")

dp = Dispatcher()
ai_client = genai.Client(api_key=GEMINI_API_KEY)
scheduler = AsyncIOScheduler()

logging.basicConfig(level=logging.INFO)

MODELS_FALLBACK = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemma-4-31b-it",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite"
]

TEMP_DIR = Path("temp_audio")
TEMP_DIR.mkdir(exist_ok=True)
DB_PATH = Path("reminders.db")

TEXT_CACHE = {}

ENG_TO_RUS = str.maketrans(
    "`qwertzuiop[]asdfghjkl;'zxcvbnm,./~QWERTZUIOP{}ASDFGHJKL:\"ZXCVBNM<>?qwertyuiop[]asdfghjkl;'zxcvbnm,./QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?",
    "ёйцукенгшщзхъфывапролджэячсмитьбю.ЁЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,"
)

def fix_keyboard_layout(text: str) -> str:
    if not text:
        return text
    has_cyrillic = any('а' <= c.lower() <= 'я' or c.lower() == 'ё' for c in text)
    has_latin = any('a' <= c.lower() <= 'z' for c in text)
    if has_latin and not has_cyrillic:
        return text.translate(ENG_TO_RUS)
    return text

def clean_text_for_speech(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'[*_`#~]', '', text)
    clean_str = "".join(c for c in text if c.isalnum() or c in " .,!?-:\n")
    return clean_str.strip()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            event_time TEXT,
            remind_time TEXT,
            stage TEXT,
            is_sent INTEGER DEFAULT 0
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER PRIMARY KEY,
            response_mode TEXT DEFAULT 'text',
            voice_provider TEXT DEFAULT 'auto'
        )
    """)
    try:
        cursor.execute("ALTER TABLE user_settings ADD COLUMN voice_provider TEXT DEFAULT 'auto'")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()

init_db()

def get_user_response_mode(user_id: int) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT response_mode FROM user_settings WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row and row[0]:
        return row[0]
    return "text"

def set_user_response_mode(user_id: int, mode: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_settings (user_id, response_mode)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET response_mode = excluded.response_mode
    """, (user_id, mode))
    conn.commit()
    conn.close()
    return mode

def get_user_voice_provider(user_id: int) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT voice_provider FROM user_settings WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row and row[0]:
        return row[0]
    return "auto"

def set_user_voice_provider(user_id: int, provider: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_settings (user_id, voice_provider)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET voice_provider = excluded.voice_provider
    """, (user_id, provider))
    conn.commit()
    conn.close()
    return provider

def get_elevenlabs_character_limit() -> int:
    if not ELEVENLABS_API_KEY:
        return 0
    try:
        url = "https://api.elevenlabs.io/v1/user/subscription"
        headers = {"xi-api-key": ELEVENLABS_API_KEY}
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json()
            remaining = data.get("character_limit", 0) - data.get("character_count", 0)
            return max(0, remaining)
    except Exception as e:
        logging.error(f"Ошибка проверки остатка символов ElevenLabs: {e}")
    return 0

def synthesize_elevenlabs(clean_speech: str, file_path: Path) -> bool:
    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY не задан в .env")
    voice_id = "JBFqnCBsd6RMkjVDRZzb" # George (стандартный дефолтный голос)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": clean_speech,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    res = requests.post(url, json=data, headers=headers, timeout=12)
    if res.status_code == 200:
        with open(file_path, "wb") as f:
            f.write(res.content)
        return True
    else:
        raise RuntimeError(f"ElevenLabs HTTP {res.status_code}: {res.text}")

def synthesize_azure(clean_speech: str, file_path: Path) -> bool:
    if not AZURE_SPEECH_KEY or not speechsdk:
        raise ValueError("AZURE_SPEECH_KEY или SDK не настроены")
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    speech_config.speech_synthesis_voice_name = "ru-RU-DmitryNeural"
    speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3)
    
    audio_config = speechsdk.audio.AudioOutputConfig(filename=str(file_path))
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
    result = synthesizer.speak_text_async(clean_speech).get()
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        return True
    else:
        raise RuntimeError(f"Azure Speech Error: {result.reason}")

def synthesize_google(clean_speech: str, file_path: Path) -> bool:
    key_path = Path("google_keys.json")
    if not key_path.exists():
        raise ValueError("google_keys.json не найден")
    creds = service_account.Credentials.from_service_account_file(str(key_path))
    client = texttospeech.TextToSpeechClient(credentials=creds)
    
    s_input = texttospeech.SynthesisInput(text=clean_speech)
    voice = texttospeech.VoiceSelectionParams(
        language_code="ru-RU",
        name="ru-RU-Neural2-C",
        ssml_gender=texttospeech.SsmlVoiceGender.MALE
    )
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3, speaking_rate=1.05)
    response = client.synthesize_speech(input=s_input, voice=voice, audio_config=audio_config)
    with open(file_path, "wb") as out:
        out.write(response.audio_content)
    return True

def generate_voice(text: str, filename_prefix: str = "voice", user_id: int = None, force_provider: str = None) -> Path:
    clean_speech = clean_text_for_speech(text)
    if not clean_speech:
        clean_speech = "Готово"
        
    file_path = TEMP_DIR / f"{filename_prefix}_{int(datetime.now().timestamp())}.mp3"
    provider = force_provider or (get_user_voice_provider(user_id) if user_id else "auto")

    if provider == "elevenlabs":
        try:
            synthesize_elevenlabs(clean_speech, file_path)
            return file_path
        except Exception as e:
            logging.warning(f"ElevenLabs недоступен ({e}), переход на резерв...")
            try:
                synthesize_google(clean_speech, file_path)
                return file_path
            except Exception:
                tts = gTTS(text=clean_speech, lang='ru', tld='com')
                tts.save(str(file_path))
                return file_path

    elif provider == "azure":
        try:
            synthesize_azure(clean_speech, file_path)
            return file_path
        except Exception as e:
            logging.warning(f"Azure не настроен ({e}), переход на ElevenLabs / Google / gTTS...")
            if ELEVENLABS_API_KEY:
                try:
                    synthesize_elevenlabs(clean_speech, file_path)
                    return file_path
                except Exception:
                    pass
            try:
                synthesize_google(clean_speech, file_path)
                return file_path
            except Exception:
                tts = gTTS(text=clean_speech, lang='ru', tld='com')
                tts.save(str(file_path))
                return file_path

    elif provider == "google":
        try:
            synthesize_google(clean_speech, file_path)
            return file_path
        except Exception as e:
            logging.warning(f"Google недоступен: {e}. Переход на gTTS")
            tts = gTTS(text=clean_speech, lang='ru', tld='com')
            tts.save(str(file_path))
            return file_path

    # Режим AUTO: ElevenLabs -> Azure -> Google -> gTTS
    if ELEVENLABS_API_KEY:
        try:
            synthesize_elevenlabs(clean_speech, file_path)
            return file_path
        except Exception as e:
            logging.warning(f"ElevenLabs error ({e}), try Azure / Google!")

    if AZURE_SPEECH_KEY and speechsdk:
        try:
            synthesize_azure(clean_speech, file_path)
            return file_path
        except Exception as e:
            logging.warning(f"Azure error ({e}), try Google!")

    key_path = Path("google_keys.json")
    if key_path.exists():
        try:
            synthesize_google(clean_speech, file_path)
            return file_path
        except Exception as e:
            logging.warning(f"Google error ({e}), try gTTS!")

    tts = gTTS(text=clean_speech, lang='ru', tld='com')
    tts.save(str(file_path))
    return file_path

async def send_reply(message: types.Message, text: str, parse_mode: str = None, reply_markup: types.InlineKeyboardMarkup = None):
    user_id = message.chat.id
    mode = get_user_response_mode(user_id)
    
    if mode == "voice":
        # 1. Сначала ВСЕГДА отправляем текстовый ответ в чат
        await message.answer(text, parse_mode=parse_mode, reply_markup=reply_markup)
        
        # 2. Затем генерируем и высылаем голосовую озвучку
        try:
            speech_part = text
            if len(text) > 400:
                speech_part = text[:380] + "..."
                
            audio_path = generate_voice(speech_part, filename_prefix="reply_voice", user_id=user_id)
            await message.answer_voice(voice=FSInputFile(str(audio_path)))
            if audio_path.exists():
                audio_path.unlink()
            return
        except Exception as e:
            logging.error(f"Ошибка при озвучке ответа: {e}")
            return

    cache_id = str(hash(text))
    TEXT_CACHE[cache_id] = text
    
    final_markup = reply_markup
    if not final_markup:
        final_markup = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔊 Озвучить ответ", callback_data=f"tts_{cache_id}")]
        ])
        
    await message.answer(text, parse_mode=parse_mode, reply_markup=final_markup)

def get_user_events(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, event_time, stage FROM reminders
        WHERE user_id = ? AND is_sent = 0
        ORDER BY event_time ASC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def save_reminder_stages(user_id: int, title: str, event_time: datetime, explicit_remind_time: datetime = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now_dt = datetime.now()
    
    if explicit_remind_time:
        if explicit_remind_time > now_dt and explicit_remind_time <= event_time:
            cursor.execute("""
                INSERT INTO reminders (user_id, title, event_time, remind_time, stage)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, title, event_time.isoformat(), explicit_remind_time.isoformat(), "custom_time"))
        
        if event_time > now_dt:
            cursor.execute("""
                INSERT INTO reminders (user_id, title, event_time, remind_time, stage)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, title, event_time.isoformat(), event_time.isoformat(), "exact_time"))
            
        conn.commit()
        conn.close()
        return

    prev_day_evening = (event_time - timedelta(days=1)).replace(hour=22, minute=0, second=0, microsecond=0)
    same_day_morning = event_time.replace(hour=10, minute=0, second=0, microsecond=0)
    hour_before = event_time - timedelta(hours=1)
    exact_time = event_time
    
    raw_stages = [
        ("evening_before", prev_day_evening, "🌙 Накануне вечером (в 22:00)"),
        ("morning_of", same_day_morning, "☀️ Утром в день события (в 10:00)"),
        ("hour_before", hour_before, "⏳ За 1 час до события"),
        ("exact_time", exact_time, "🔔 Минута в минуту")
    ]
    
    saved_count = 0
    for stage_name, r_time, label in raw_stages:
        if r_time > now_dt and r_time <= event_time:
            cursor.execute("""
                INSERT INTO reminders (user_id, title, event_time, remind_time, stage)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, title, event_time.isoformat(), r_time.isoformat(), stage_name))
            saved_count += 1
            
    if saved_count == 0 and event_time > now_dt:
        cursor.execute("""
            INSERT INTO reminders (user_id, title, event_time, remind_time, stage)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, title, event_time.isoformat(), event_time.isoformat(), "exact_time"))

    conn.commit()
    conn.close()

def get_calendar_service():
    key_path = Path("google_keys.json")
    if not key_path.exists():
        return None
    try:
        scopes = ['https://www.googleapis.com/auth/calendar']
        creds = service_account.Credentials.from_service_account_file(str(key_path), scopes=scopes)
        return build('calendar', 'v3', credentials=creds)
    except Exception as e:
        logging.error(f"Ошибка Google Calendar API: {e}")
        return None

def add_google_calendar_event(title: str, start_dt: datetime, end_dt: datetime):
    service = get_calendar_service()
    if not service:
        return False, "Файл google_keys.json не привязан."
    
    event = {
        'summary': title,
        'description': 'Автоматическое событие Antigravity Telegram Bot',
        'start': {'dateTime': start_dt.isoformat(), 'timeZone': 'UTC'},
        'end': {'dateTime': end_dt.isoformat(), 'timeZone': 'UTC'},
    }
    try:
        created_event = service.events().insert(calendarId=GOOGLE_CALENDAR_ID, body=event).execute()
        return True, created_event.get('htmlLink')
    except Exception as e:
        logging.error(f"Ошибка Google Calendar: {e}")
        return False, str(e)

def extract_event_details(text_or_prompt: str) -> dict:
    now_dt = datetime.now()
    current_time_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
    prompt = f"""
Ты — умный планировщик задач. 
Текущее точное время сервера: {current_time_str}. День недели: {now_dt.strftime('%A')}.

Проанализируй запрос пользователя: "{text_or_prompt}"
Определи, есть ли в нем просьба о создании события или напоминания.

Важно:
1. Вычисли время самого СОБЫТИЯ (`event_datetime` в ISO формате YYYY-MM-DDTHH:MM:SS).
   - Если указано только время (например "в 17:40" или "в 18:00") и это время позже текущего ({now_dt.strftime('%H:%M')}), считай событие СЕГОДНЯ {now_dt.strftime('%Y-%m-%d')}.
   - Если время уже прошло сегодня, считай на ЗАВТРА.
2. Если пользователь попросил напомнить за конкретное время (например "напомни за 10 минут", "напомни за 2 часа"), вычисли `explicit_remind_datetime`. Если такой явной просьбы нет, установи `explicit_remind_datetime`: null.

Ответь СТРОГО в формате JSON без markdown:
{{
    "is_event": true/false,
    "title": "Краткое название (например: Дела)",
    "event_datetime": "YYYY-MM-DDTHH:MM:SS",
    "explicit_remind_datetime": "YYYY-MM-DDTHH:MM:SS" или null
}}
If not an event, return {{"is_event": false}}.
"""
    
    for model_name in MODELS_FALLBACK:
        try:
            res = ai_client.models.generate_content(model=model_name, contents=prompt)
            if res and res.text:
                clean_json = res.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                parsed = json.loads(clean_json)
                if parsed.get("is_event"):
                    return parsed
        except Exception as e:
            continue
    return {"is_event": False}

async def check_and_send_reminders():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    
    cursor.execute("""
        SELECT id, user_id, title, event_time, stage FROM reminders
        WHERE is_sent = 0 AND remind_time <= ?
    """, (now_iso,))
    
    rows = cursor.fetchall()
    for row in rows:
        rem_id, user_id, title, event_time_str, stage = row
        event_dt = datetime.fromisoformat(event_time_str)
        formatted_event_time = event_dt.strftime("%d.%m.%Y в %H:%M")
        
        if stage == "evening_before":
            msg_prefix = "🌙 **НАПОМИНАНИЕ (НАКАНУНЕ ВЕЧЕРОМ)!**"
        elif stage == "morning_of":
            msg_prefix = "☀️ **НАПОМИНАНИЕ (УТРОМ В ДЕНЬ СОБЫТИЯ)!**"
        elif stage == "hour_before":
            msg_prefix = "⏳ **НАПОМИНАНИЕ (ЗА 1 ЧАС)!**"
        elif stage == "custom_time":
            msg_prefix = "🔔 **НАПОМИНАНИЕ ПО ЗАПРОСУ!**"
        else:
            msg_prefix = "🔔 **СОБЫТИЕ НАСТУПИЛО ПРЯМО СЕЙЧАС!**"
            
        text_msg = f"{msg_prefix}\n\n📌 **Событие:** {title}\n⏰ **Время события:** {formatted_event_time}"
        
        try:
            await bot.send_message(chat_id=user_id, text=text_msg)
            
            speech_text = f"Напоминание. {title}. Назначено на {formatted_event_time}"
            audio_path = generate_voice(speech_text, user_id=user_id)
            await bot.send_voice(chat_id=user_id, voice=FSInputFile(str(audio_path)))
            if audio_path.exists():
                audio_path.unlink()
                
            cursor.execute("UPDATE reminders SET is_sent = 1 WHERE id = ?", (rem_id,))
            conn.commit()
        except Exception as e:
            logging.error(f"Ошибка отправки пользователю {user_id}: {e}")
            
    conn.close()

async def render_main_menu(message_or_callback):
    text = (
        "🚀 **Добро пожаловать в Antigravity AI Bot!**\n\n"
        "📌 **Интерактивные команды (нажмите на команду для вызова):**\n"
        "• /menu — 📱 Открыть Главное меню\n"
        "• /settings — 🎙️ Настройки озвучки и стиля\n"
        "• /voiceon — 🔊 Включить голосовой режим ответов\n"
        "• /voiceoff — 📝 Включить текстовый режим ответов\n"
        "• `/voice <текст>` — 🗣️ Быстрый синтез речи по тексту\n\n"
        "✨ **Возможности Antigravity:**\n"
        "1. 📅 **Умный Календарь:** Напишите или наговорите голосом *'Встреча завтра в 15:30'*, и бот установит событие с напоминаниями.\n"
        "2. 🎙️ **Спектр озвучки:** Поддержка нейросетей ElevenLabs и Google / Gemini.\n"
        "3. 🧠 **Свободный AI-чат:** Понимает голос, автоисправляет раскладку (*'ghbdtn'* ➔ *'привет'*).\n\n"
        "👇 **Выберите интересующий раздел в интерактивном меню:**"
    )
    kb = get_main_menu_keyboard()
    
    if isinstance(message_or_callback, types.CallbackQuery):
        try:
            await message_or_callback.message.edit_text(text, reply_markup=kb, parse_mode="Markdown")
        except Exception:
            await message_or_callback.message.answer(text, reply_markup=kb, parse_mode="Markdown")
    else:
        await message_or_callback.answer(text, reply_markup=kb, parse_mode="Markdown")

@dp.message(CommandStart())
@dp.message(Command("menu"))
async def command_menu_handler(message: types.Message):
    await render_main_menu(message)

@dp.message(Command("settings"))
async def command_settings_handler(message: types.Message):
    user_id = message.chat.id
    mode = get_user_response_mode(user_id)
    provider = get_user_voice_provider(user_id)
    kb = get_voice_menu_keyboard(mode, provider)
    await message.answer("🎙️ **Голосовые настройки и выбор диктора**", reply_markup=kb, parse_mode="Markdown")

@dp.message(Command("voice_on"))
@dp.message(Command("voiceon"))
async def voice_on_cmd(message: types.Message):
    set_user_response_mode(message.chat.id, "voice")
    await message.answer("🔊 **Голосовой режим ответов ВКЛЮЧЕН!**")

@dp.message(Command("voice_off"))
@dp.message(Command("voiceoff"))
async def voice_off_cmd(message: types.Message):
    set_user_response_mode(message.chat.id, "text")
    await message.answer("📝 **Текстовый режим ответов ВКЛЮЧЕН!**")

@dp.callback_query()
async def global_callback_router(callback: types.CallbackQuery):
    data = callback.data
    user_id = callback.message.chat.id

    try:
        if data == CB_MAIN_MENU:
            await render_main_menu(callback)
            await callback.answer()

        elif data == CB_CALENDAR_MENU:
            text = (
                "📅 **Управление Календарем и Задачами**\n\n"
                "Вы можете просто наговорить или написать задачу напрямую в чат (например: *'напомни сходить в зал завтра в 18:00'*), и бот автоматически создаст событие!\n\n"
                "Выберите действие ниже:"
            )
            await callback.message.edit_text(text, reply_markup=get_calendar_menu_keyboard(), parse_mode="Markdown")
            await callback.answer()

        elif data == CB_CAL_ADD:
            await callback.message.edit_text(
                "➕ **Создание нового события**\n\n"
                "Напишите или наговорите голосом событие, например:\n"
                "• *'Встреча с клиентом в 15:30'*\n"
                "• *'Купить продукты завтра в 10:00'*",
                reply_markup=get_back_to_main_keyboard(),
                parse_mode="Markdown"
            )
            await callback.answer()

        elif data == CB_CAL_LIST:
            events = get_user_events(user_id)
            if not events:
                list_text = "📋 **Мои события**\n\nУ вас пока нет предстоящих запланированных событий."
            else:
                list_text = "📋 **Ваши предстоящие события:**\n\n"
                for ev in events[:10]:
                    ev_id, title, ev_time, stage = ev
                    dt_fmt = datetime.fromisoformat(ev_time).strftime("%d.%m.%Y в %H:%M")
                    list_text += f"• **{title}** — ⏰ {dt_fmt}\n"
            await callback.message.edit_text(list_text, reply_markup=get_calendar_menu_keyboard(), parse_mode="Markdown")
            await callback.answer()

        elif data == CB_CAL_DELETE:
            events = get_user_events(user_id)
            if not events:
                await callback.answer("У вас нет активных событий для удаления.", show_alert=True)
            else:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("UPDATE reminders SET is_sent = 1 WHERE user_id = ?", (user_id,))
                conn.commit()
                conn.close()
                await callback.answer("Все предстоящие события очищены!")
                await callback.message.edit_text(
                    "🗑️ **Все ваши предстоящие события очищены.**",
                    reply_markup=get_calendar_menu_keyboard(),
                    parse_mode="Markdown"
                )

        elif data == CB_VOICE_MENU:
            mode = get_user_response_mode(user_id)
            provider = get_user_voice_provider(user_id)
            text = (
                "🎙️ **Настройки озвучки**\n"
                "Нажми на пункт, чтобы изменить значение"
            )
            await callback.message.edit_text(text, reply_markup=get_voice_menu_keyboard(mode, provider), parse_mode="Markdown")
            await callback.answer()

        elif data == "ignore":
            await callback.answer()

        elif data == CB_TOGGLE_MODE:
            current_mode = get_user_response_mode(user_id)
            new_mode = "voice" if current_mode == "text" else "text"
            set_user_response_mode(user_id, new_mode)
            
            provider = get_user_voice_provider(user_id)
            mode_lbl = "Голос" if new_mode == "voice" else "Текст"
            
            await callback.answer()
            await callback.message.edit_reply_markup(reply_markup=get_voice_menu_keyboard(new_mode, provider))
            await callback.message.answer(f"⚙️ **Формат ответов изменён на: {mode_lbl}**", parse_mode="Markdown")

        elif data == CB_PROV_MENU:
            provider = get_user_voice_provider(user_id)
            text = "🎭 **Выбор стиля озвучки (TTS):**"
            await callback.message.edit_text(text, reply_markup=get_provider_selector_keyboard(provider), parse_mode="Markdown")
            await callback.answer()

        elif data in [CB_SET_PROV_AUTO, CB_SET_PROV_ELEVEN, CB_SET_PROV_AZURE, CB_SET_PROV_GOOGLE]:
            target_map = {
                CB_SET_PROV_AUTO: "auto",
                CB_SET_PROV_ELEVEN: "elevenlabs",
                CB_SET_PROV_AZURE: "azure",
                CB_SET_PROV_GOOGLE: "google"
            }
            target_prov = target_map[data]
            set_user_voice_provider(user_id, target_prov)
            
            lbl_map = {
                "elevenlabs": "👤 ElevenLabs",
                "google": "🚗 Google / Gemini",
                "auto": "🤖 Авто"
            }
            display_name = lbl_map.get(target_prov, target_prov.upper())
            await callback.answer(f"Стиль озвучки изменён на: {display_name}")
            await callback.message.edit_reply_markup(reply_markup=get_provider_selector_keyboard(target_prov))

        elif data == CB_SAMPLE_VOICE:
            provider = get_user_voice_provider(user_id)
            await callback.answer("▶️ Озвучиваю тестовый пример...")
            sample_text = f"Привет! Так звучит голос через провайдер {provider.upper()}."
            try:
                audio_path = generate_voice(sample_text, filename_prefix="sample", user_id=user_id)
                await callback.message.reply_voice(voice=FSInputFile(str(audio_path)))
                if audio_path.exists():
                    audio_path.unlink()
            except Exception as e:
                await callback.message.answer(f"⚠️ Не удалось озвучить пример через {provider.upper()}: {e}")

        elif data == CB_SETTINGS_MENU:
            text = (
                "⚙️ **Настройки профиля**\n\n"
                "• **Язык интерфейса:** Русский 🇷🇺\n"
                "• **Статус подписки:** Активна"
            )
            await callback.message.edit_text(text, reply_markup=get_settings_menu_keyboard(), parse_mode="Markdown")
            await callback.answer()

        elif data == "lang_ru":
            await callback.answer("Язык интерфейса установленным: Русский 🇷🇺", show_alert=True)

        elif data == CB_HELP_MENU:
            text = (
                "ℹ️ **Полный список команд и возможностей Antigravity Bot**\n\n"
                "📌 **Команды бота:**\n"
                "• `/menu` — 📱 Открыть Главное меню\n"
                "• `/start` — 🚀 Перезапустить и открыть Главное меню\n"
                "• `/settings` — 🎙️ Настройки озвучки и стиля\n"
                "• `/voice_on` — 🔊 Включить голосовой режим ответов\n"
                "• `/voice_off` — 📝 Включить текстовый режим ответов\n"
                "• `/voice <текст>` — 🗣️ Быстрый синтез речи по тексту\n\n"
                "✨ **Основные функции:**\n"
                "1. **Календарь & Напоминания:** Напишите или наговорите голосом *'Встреча завтра в 15:30'*. Бот пришлет напоминания за 1 день, 1 час и в точную минуту.\n"
                "2. **Распознавание речи:** Отправляйте голосовые сообщения — бот их расшифрует и ответит голосом или текстом.\n"
                "3. **Стили озвучки:** Выбирайте среди нейросетей ElevenLabs, Google / Gemini или режимом Авто.\n"
                "4. **Коррекция раскладки:** Набрали *'ghbdtn'*? Бот автоматически поймет как *'привет'*."
            )
            await callback.message.edit_text(text, reply_markup=get_back_to_main_keyboard(), parse_mode="Markdown")
            await callback.answer()

        elif data.startswith("tts_"):
            cache_id = data.removeprefix("tts_")
            text_to_speak = TEXT_CACHE.get(cache_id)
            if not text_to_speak:
                await callback.answer("⚠️ Текст не найден.", show_alert=True)
                return
            provider = get_user_voice_provider(user_id)
            await callback.answer(f"🔊 Озвучиваю через {provider.upper()}...")
            try:
                audio_path = generate_voice(text_to_speak, filename_prefix="btn_voice", user_id=user_id)
                await callback.message.reply_voice(voice=FSInputFile(str(audio_path)))
                if audio_path.exists():
                    audio_path.unlink()
            except Exception as e:
                await callback.message.answer(f"⚠️ {e}")

        else:
            await callback.answer("Меню было обновлено.", show_alert=True)
            await render_main_menu(callback)

    except Exception as e:
        logging.error(f"Ошибка в роутере callback_query: {e}")
        try:
            await callback.answer(f"⚠️ {str(e)[:100]}", show_alert=True)
        except Exception:
            await render_main_menu(callback)

@dp.message(Command("voice"))
async def voice_command_handler(message: types.Message):
    command_args = message.text.removeprefix("/voice").strip()
    if not command_args:
        await message.answer("Укажите текст после команды `/voice`, например:\n`/voice Привет, как дела?`")
        return
        
    await bot.send_chat_action(chat_id=message.chat.id, action="record_voice")
    try:
        audio_path = generate_voice(command_args, filename_prefix="cmd_voice", user_id=message.chat.id)
        await message.answer_voice(voice=FSInputFile(str(audio_path)))
        if audio_path.exists():
            audio_path.unlink()
    except Exception as e:
        logging.error(f"Ошибка /voice: {e}")
        await message.answer(f"⚠️ Ошибка генерации речи: {e}")

@dp.message(F.voice)
async def handle_voice_message(message: types.Message):
    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    file_id = message.voice.file_id
    file_path = TEMP_DIR / f"{file_id}.ogg"
    
    try:
        file = await bot.get_file(file_id)
        await bot.download_file(file.file_path, file_path)
        audio_file = ai_client.files.upload(file=str(file_path))
        
        transcription_res = None
        for model in MODELS_FALLBACK:
            try:
                transcription_res = ai_client.models.generate_content(
                    model=model,
                    contents=["Расшифруй это аудио сообщение на русском языке.", audio_file]
                )
                if transcription_res and transcription_res.text:
                    break
            except:
                continue
                
        if file_path.exists():
            file_path.unlink()

        if transcription_res and transcription_res.text:
            text_prompt = transcription_res.text
            await process_event_or_chat(message, text_prompt)
        else:
            await send_reply(message, "Не удалось разобрать голос, попробуйте еще раз.")

    except Exception as e:
        logging.error(f"Ошибка Speech-to-Text: {e}")
        if file_path.exists():
            file_path.unlink()
        await message.answer(f"⚠️ Ошибка при обработке аудио: {e}")

@dp.message()
async def handle_text_message(message: types.Message):
    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    corrected_text = fix_keyboard_layout(message.text)
    await process_event_or_chat(message, corrected_text)

async def process_event_or_chat(message: types.Message, raw_text: str):
    extracted = extract_event_details(raw_text)
    
    if extracted.get("is_event"):
        title = extracted.get("title", "Дела/Событие")
        event_dt_str = extracted.get("event_datetime")
        explicit_remind_str = extracted.get("explicit_remind_datetime")
        
        try:
            event_dt = datetime.fromisoformat(event_dt_str)
            explicit_remind_dt = datetime.fromisoformat(explicit_remind_str) if explicit_remind_str else None
            end_dt = event_dt + timedelta(hours=1)
            
            save_reminder_stages(message.chat.id, title, event_dt, explicit_remind_dt)
            cal_success, cal_link_or_err = add_google_calendar_event(title, event_dt, end_dt)
            cal_info = f"\n📅 [В Календаре]({cal_link_or_err})" if cal_success else ""
            
            reply_text = (
                f"Запланировано: **{title}**\n"
                f"⏰ Время: {event_dt.strftime('%d.%m.%Y в %H:%M')}{cal_info}\n"
                f"Напоминания установлены!"
            )
            
            await send_reply(message, reply_text, parse_mode="Markdown")
            return
        except Exception as e:
            logging.error(f"Ошибка обработки даты: {e}")
    
    system_prompt = (
        "Ты — живой собеседник и помощник. Отвечай кратко, емко, естественным разговорным языком, "
        "как реальный человек в мессенджере. "
        "НЕ ИСПОЛЬЗУЙ фразы вроде 'Привет! Я ваш AI-помощник Antigravity. Рад вас приветствовать!', 'Чем я могу вам помочь сегодня?'. "
        "Пиши просто, без пафоса и без заученных скриптов. Если тебя просто приветствуют ('привет', 'здарова'), ответь коротко и тепло, например 'Привет! Как дела?' или 'Привет! Что нового?'."
    )
    for model_name in MODELS_FALLBACK:
        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=f"{system_prompt}\n\nПользователь пишет: {raw_text}"
            )
            if response and response.text:
                resp_text = response.text
                await send_reply(message, resp_text)
                return
        except Exception as e:
            logging.error(f"Модель {model_name} ошибка: {e}")
            continue
    await message.answer("Секунду, я перепроверял данные. Спроси еще раз!")

async def main():
    global bot
    if PROXY_URL:
        print(f"📡 Подключение к Telegram через прокси: {PROXY_URL}")
        session = AiohttpSession(proxy=PROXY_URL)
        bot = Bot(token=BOT_TOKEN, session=session)
    else:
        bot = Bot(token=BOT_TOKEN)

    await bot.set_my_commands([
        BotCommand(command="menu", description="📱 Открыть главное меню"),
        BotCommand(command="start", description="🚀 Перезапустить и открыть меню"),
        BotCommand(command="settings", description="🎙️ Голосовые настройки и стиль озвучки"),
        BotCommand(command="voice_on", description="🔊 Включить голосовой режим ответов"),
        BotCommand(command="voice_off", description="📝 Включить текстовый режим ответов"),
        BotCommand(command="voice", description="🗣️ Озвучить введенный текст")
    ])

    scheduler.add_job(check_and_send_reminders, 'interval', seconds=3)
    scheduler.start()

    print("🚀 Бот Antigravity запущен с поддержкой ElevenLabs (Голос George)!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
