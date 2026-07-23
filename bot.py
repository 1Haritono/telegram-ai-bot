import asyncio
import logging
import os
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.client.session.aiohttp import AiohttpSession
from google import genai

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PROXY_URL = os.getenv("PROXY_URL")

if not BOT_TOKEN or not GEMINI_API_KEY:
    raise ValueError("Необходимо заполнить BOT_TOKEN и GEMINI_API_KEY в файле .env!")

dp = Dispatcher()
ai_client = genai.Client(api_key=GEMINI_API_KEY)

logging.basicConfig(level=logging.INFO)

# Таблица декодирования с английской раскладки QWERTY на русскую ЙЦУКЕН
ENG_TO_RUS = str.maketrans(
    "`qwertzuiop[]asdfghjkl;'zxcvbnm,./~QWERTZUIOP{}ASDFGHJKL:\"ZXCVBNM<>?qwertyuiop[]asdfghjkl;'zxcvbnm,./QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?",
    "ёйцукенгшщзхъфывапролджэячсмитьбю.ЁЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,"
)

def fix_keyboard_layout(text: str) -> str:
    """Если текст похож на набранный в неверной раскладке (например ghbdtn), конвертирует его в русский."""
    if not text:
        return text
    # Если в тексте нет русских букв, но есть английские — заменяем раскладку
    has_cyrillic = any('а' <= c.lower() <= 'я' or c.lower() == 'ё' for c in text)
    has_latin = any('a' <= c.lower() <= 'z' for c in text)
    
    if has_latin and not has_cyrillic:
        return text.translate(ENG_TO_RUS)
    return text

MODELS_FALLBACK = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-latest"
]

TEMP_DIR = Path("temp_audio")
TEMP_DIR.mkdir(exist_ok=True)

@dp.message(CommandStart())
async def start_cmd(message: types.Message):
    await message.answer(
        "👋 Привет! Я твой личный AI-ассистент Antigravity.\n\n"
        "Задай мне любой вопрос текстом, случайным мискликом раскладки (`ghbdtn`) или **отправь голосовое сообщение** — я со всем помогу!"
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
        
        response = None
        for model_name in MODELS_FALLBACK:
            try:
                response = ai_client.models.generate_content(
                    model=model_name,
                    contents=[
                        "Послушай это голосовое сообщение и ответь на него подробно и вежливо на русском языке.",
                        audio_file
                    ]
                )
                if response and response.text:
                    break
            except Exception as e:
                continue

        if file_path.exists():
            file_path.unlink()

        if response and response.text:
            reply_text = response.text
            if len(reply_text) > 4000:
                for i in range(0, len(reply_text), 4000):
                    await message.answer(reply_text[i:i+4000])
            else:
                await message.answer(reply_text)
        else:
            await message.answer("⚠️ Не удалось распознать голосовое сообщение. Попробуйте еще раз!")

    except Exception as e:
        logging.error(f"Ошибка обработки голосового: {e}")
        if file_path.exists():
            file_path.unlink()
        await message.answer(f"⚠️ Ошибка при обработке аудио: {e}")

@dp.message()
async def handle_text_message(message: types.Message):
    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    
    # Авто-исправление ошибочной раскладки клавиатуры (ghbdtn -> привет)
    original_text = message.text
    corrected_text = fix_keyboard_layout(original_text)
    
    system_prompt = (
        "Ты — вежливый AI-помощник. Пользователь может случайно набрать русские слова в английской раскладке "
        "(например 'ghbdtn' означает 'привет', 'rfr ltkf' означает 'как дела'). Всегда давай полезный ответ на русском языке!"
    )

    response = None
    for model_name in MODELS_FALLBACK:
        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=f"{system_prompt}\n\nСообщение пользователя: {corrected_text}"
            )
            if response and response.text:
                break
        except Exception as e:
            continue
    
    if response and response.text:
        reply_text = response.text
        if len(reply_text) > 4000:
            for i in range(0, len(reply_text), 4000):
                await message.answer(reply_text[i:i+4000])
        else:
            await message.answer(reply_text)
    else:
        await message.answer("⏳ Лимит запросов временно превышен. Подождите 30 секунд!")

async def main():
    global bot
    if PROXY_URL:
        print(f"📡 Подключение к Telegram через прокси: {PROXY_URL}")
        session = AiohttpSession(proxy=PROXY_URL)
        bot = Bot(token=BOT_TOKEN, session=session)
    else:
        bot = Bot(token=BOT_TOKEN)

    print("🚀 Бот Antigravity (Текст + Голос + Авто-раскладка) успешно запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
