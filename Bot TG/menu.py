"""
Модуль навигации и клавиатур главного меню Telegram-бота Antigravity.
Содержит константы callback_data и функции построения интерактивных Inline-меню.
"""

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# Константы callback_data для чистой навигации
CB_MAIN_MENU = "menu_main"
CB_CALENDAR_MENU = "menu_calendar"
CB_VOICE_MENU = "menu_voice"
CB_SETTINGS_MENU = "menu_settings"
CB_HELP_MENU = "menu_help"

# Календарные действия
CB_CAL_ADD = "cal_add"
CB_CAL_LIST = "cal_list"
CB_CAL_DELETE = "cal_delete"

# Голосовые действия
CB_TOGGLE_MODE = "voice_toggle_mode"
CB_PROV_MENU = "voice_prov_menu"
CB_SET_PROV_AUTO = "set_prov_auto"
CB_SET_PROV_ELEVEN = "set_prov_elevenlabs"
CB_SET_PROV_AZURE = "set_prov_azure"
CB_SET_PROV_GOOGLE = "set_prov_google"
CB_SAMPLE_VOICE = "sample_voice"

def get_main_menu_keyboard() -> InlineKeyboardMarkup:
    """Главное меню бота."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📅 Календарь", callback_data=CB_CALENDAR_MENU)],
        [InlineKeyboardButton(text="🎙️ Голосовые настройки", callback_data=CB_VOICE_MENU)],
        [InlineKeyboardButton(text="⚙️ Настройки профиля", callback_data=CB_SETTINGS_MENU)],
        [InlineKeyboardButton(text="ℹ️ Помощь и о боте", callback_data=CB_HELP_MENU)]
    ])

def get_calendar_menu_keyboard() -> InlineKeyboardMarkup:
    """Подменю работы с Календарем."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="➕ Новое событие", callback_data=CB_CAL_ADD)],
        [InlineKeyboardButton(text="📋 Мои события", callback_data=CB_CAL_LIST)],
        [InlineKeyboardButton(text="🗑️ Удалить событие", callback_data=CB_CAL_DELETE)],
        [InlineKeyboardButton(text="◀️ Назад в Главное меню", callback_data=CB_MAIN_MENU)]
    ])

def get_voice_menu_keyboard(response_mode: str, voice_provider: str) -> InlineKeyboardMarkup:
    """
    Подменю Голосовых настроек с уникальными динамическими эмодзи:
    - Формат ответов: 🎙️ Голос / 🔊 Текст
    - Стиль озвучки: 👤 ElevenLabs / 🚗 Google / Gemini / 🤖 Авто
    """
    mode_icon = "🎙️" if response_mode == "voice" else "🔊"
    mode_label = "Голос" if response_mode == "voice" else "Текст"
    mode_text = f"{mode_icon} Формат ответов: {mode_label}"
    
    # Динамические иконки для стилей озвучки (👤 ElevenLabs / 🚗 Google / Gemini / 🤖 Авто)
    if voice_provider == "elevenlabs":
        style_icon = "👤"
        prov_label = "ElevenLabs"
    elif voice_provider == "google":
        style_icon = "🚗"
        prov_label = "Google / Gemini"
    else:
        style_icon = "🤖"
        prov_label = "Авто"
        
    prov_text = f"{style_icon} Стиль озвучки: {prov_label}"
    
    return InlineKeyboardMarkup(inline_keyboard=[
        # Группа 1: настройки-переключатели
        [InlineKeyboardButton(text=mode_text, callback_data=CB_TOGGLE_MODE)],
        [InlineKeyboardButton(text=prov_text, callback_data=CB_PROV_MENU)],
        # Группа 2: действия
        [InlineKeyboardButton(text="▶️ Прослушать пример", callback_data=CB_SAMPLE_VOICE)],
        [InlineKeyboardButton(text="◀️ Назад в Главное меню", callback_data=CB_MAIN_MENU)]
    ])

def get_provider_selector_keyboard(current_provider: str) -> InlineKeyboardMarkup:
    """
    Подменю выбора стиля озвучки:
    - 1 строка: 👤 ElevenLabs | 🚗 Google / Gemini
    - 2 строка: 🤖 Авто (на всю ширину)
    """
    p_eleven = "👤 ElevenLabs ✅" if current_provider == "elevenlabs" else "👤 ElevenLabs"
    p_google = "🚗 Google / Gemini ✅" if current_provider == "google" else "🚗 Google / Gemini"
    p_auto = "🤖 Авто ✅" if current_provider == "auto" else "🤖 Авто"
    
    return InlineKeyboardMarkup(inline_keyboard=[
        # Строка 1: Голоса дикторов (👤 ElevenLabs и 🚗 Google/Gemini)
        [InlineKeyboardButton(text=p_eleven, callback_data=CB_SET_PROV_ELEVEN),
         InlineKeyboardButton(text=p_google, callback_data=CB_SET_PROV_GOOGLE)],
        # Строка 2: Автоматический режим (🤖 Авто)
        [InlineKeyboardButton(text=p_auto, callback_data=CB_SET_PROV_AUTO)],
        # Назад
        [InlineKeyboardButton(text="◀️ Назад в Голосовые настройки", callback_data=CB_VOICE_MENU)]
    ])

def get_settings_menu_keyboard() -> InlineKeyboardMarkup:
    """Подменю Настроек профиля и языка."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🌐 Язык интерфейса: Русский 🇷🇺", callback_data="lang_ru")],
        [InlineKeyboardButton(text="◀️ Назад в Главное меню", callback_data=CB_MAIN_MENU)]
    ])

def get_back_to_main_keyboard() -> InlineKeyboardMarkup:
    """Простая кнопка возврата в Главное меню."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="◀️ Назад в Главное меню", callback_data=CB_MAIN_MENU)]
    ])
