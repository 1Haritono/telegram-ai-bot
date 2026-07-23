import asyncio
import logging
import os
import sys
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.client.session.aiohttp import AiohttpSession
from google import genai
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from google.oauth2 import service_account
from googleapiclient.discovery import build

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PROXY_URL = os.getenv("PROXY_URL")
GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")

if not BOT_TOKEN or not GEMINI_API_KEY:
    raise ValueError("Необходимо заполнить BOT_TOKEN и GEMINI_API_KEY в файле .env!")

dp = Dispatcher()
ai_client = genai.Client(api_key=GEMINI_API_KEY)
scheduler = AsyncIOScheduler()

logging.basicConfig(level=logging.INFO)

MODELS_FALLBACK = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-latest"
]

TEMP_DIR = Path("temp_audio")
TEMP_DIR.mkdir(exist_ok=True)
DB_PATH = Path("reminders.db")

# Таблица декодирования с английской раскладки QWERTY на русскую ЙЦУКЕН
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
    conn.commit()
    conn.close()

init_db()

def save_reminder_stages(user_id: int, title: str, event_time: datetime, explicit_remind_time: datetime = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now_dt = datetime.now()
    
    # Если пользователь явно попросил конкретное время напоминания (например: напомни за 10 минут)
    if explicit_remind_time:
        if explicit_remind_time > now_dt and explicit_remind_time <= event_time:
            cursor.execute("""
                INSERT INTO reminders (user_id, title, event_time, remind_time, stage)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, title, event_time.isoformat(), explicit_remind_time.isoformat(), "custom_time"))
        
        # Также добавляем сам момент наступления события
        if event_time > now_dt:
            cursor.execute("""
                INSERT INTO reminders (user_id, title, event_time, remind_time, stage)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, title, event_time.isoformat(), event_time.isoformat(), "exact_time"))
            
        conn.commit()
        conn.close()
        return

    # Динамическая линейка уведомлений:
    # 1. Вечером накануне (в 22:00 за день до события)
    prev_day_evening = (event_time - timedelta(days=1)).replace(hour=22, minute=0, second=0, microsecond=0)
    
    # 2. Утром в день события (в 10:00 утра)
    same_day_morning = event_time.replace(hour=10, minute=0, second=0, microsecond=0)
    
    # 3. За 1 час до события
    hour_before = event_time - timedelta(hours=1)
    
    # 4. Минута в минуту
    exact_time = event_time
    
    raw_stages = [
        ("evening_before", prev_day_evening, "🌙 Накануне вечером (в 22:00)"),
        ("morning_of", same_day_morning, "☀️ Утром в день события (в 10:00)"),
        ("hour_before", hour_before, "⏳ За 1 час до события"),
        ("exact_time", exact_time, "🔔 Минута в минуту")
    ]
    
    saved_count = 0
    for stage_name, r_time, label in raw_stages:
        # Уведомление ставится ТОЛЬКО если его время строго в будущем И строго до наступления события (или совпадает)
        if r_time > now_dt and r_time <= event_time:
            cursor.execute("""
                INSERT INTO reminders (user_id, title, event_time, remind_time, stage)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, title, event_time.isoformat(), r_time.isoformat(), stage_name))
            saved_count += 1
            
    # Если событие через 2 минуты, и все предварительные этапы уже в прошлом - ставим строго на момент события
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

# --- ОТПРАВКА ДИНАМИЧЕСКИХ НАПОМИНАНИЙ ---
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
            
        try:
            await bot.send_message(
                chat_id=user_id,
                text=f"{msg_prefix}\n\n"
                     f"📌 **Событие:** {title}\n"
                     f"⏰ **Время события:** {formatted_event_time}"
            )
            cursor.execute("UPDATE reminders SET is_sent = 1 WHERE id = ?", (rem_id,))
            conn.commit()
        except Exception as e:
            logging.error(f"Ошибка отправки пользователю {user_id}: {e}")
            
    conn.close()

@dp.message(CommandStart())
async def start_cmd(message: types.Message):
    await message.answer(
        "👋 **Привет! Я твой личный AI-планировщик Antigravity.**\n\n"
        "Я умею гибко выстраивать напоминания под текущее время:\n"
        "• 🌙 Накануне вечером в 22:00\n"
        "• ☀️ Утром в день события в 10:00\n"
        "• ⏳ За 1 час до события\n"
        "• 🔔 Минута в минуту!\n\n"
        "*(Если до события осталось пару минут — пришлю только минута в минуту!)*"
    )

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
            await process_event_or_chat(message, transcription_res.text)
        else:
            await message.answer("⚠️ Не удалось распознать голосовое сообщение.")

    except Exception as e:
        logging.error(f"Ошибка голосового сообщения: {e}")
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
            
            # Сохраняем умную линейку уведомлений
            save_reminder_stages(message.chat.id, title, event_dt, explicit_remind_dt)
            
            # Заносим в Google Календарь
            cal_success, cal_link_or_err = add_google_calendar_event(title, event_dt, end_dt)
            cal_info = f"\n📅 **Добавлено в Google Календарь!** [Ссылка]({cal_link_or_err})" if cal_success else ""
            
            await message.answer(
                f"✅ **Принято! Запланировано событие:**\n\n"
                f"📌 **Название:** {title}\n"
                f"⏰ **Время события:** {event_dt.strftime('%d.%m.%Y в %H:%M')}{cal_info}\n\n"
                f"🔔 *Напоминание сработает вовремя!*",
                parse_mode="Markdown"
            )
            return
        except Exception as e:
            logging.error(f"Ошибка обработки даты: {e}")
    
    system_prompt = (
        "Ты — вежливый AI-помощник Antigravity. Ты умеешь устанавливать любые напоминания в Telegram и Google Календарь. "
        "Пользователь может писать в неверной раскладке (ghbdtn = привет). Всегда давай полезный ответ на русском языке!"
    )
    for model_name in MODELS_FALLBACK:
        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=f"{system_prompt}\n\nПользователь пишет: {raw_text}"
            )
            if response and response.text:
                await message.answer(response.text)
                return
        except Exception as e:
            continue
    await message.answer("⏳ Лимит запросов временно превышен. Подождите 30 секунд!")

async def main():
    global bot
    if PROXY_URL:
        print(f"📡 Подключение к Telegram через прокси: {PROXY_URL}")
        session = AiohttpSession(proxy=PROXY_URL)
        bot = Bot(token=BOT_TOKEN, session=session)
    else:
        bot = Bot(token=BOT_TOKEN)

    scheduler.add_job(check_and_send_reminders, 'interval', seconds=3)
    scheduler.start()

    print("🚀 Бот Antigravity (Интеллектуальные напоминания с учетом текущего времени) запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
