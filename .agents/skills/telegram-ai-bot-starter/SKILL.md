---
name: telegram-ai-bot-starter
description: Быстрое развертывание асинхронных Telegram-ботов на Python (Aiogram 3 + Google Gemini API) с поддержкой текста, голосовых сообщений (Voice), .env конфигурации, прокси и обработки ошибок кодировки Windows UTF-8.
---

# Навык: Создание Telegram AI-Бота (Текст + Голосовые сообщения)

Этот навык содержит готовые шаблоны для мгновенного развертывания Telegram-ботов с поддержкой **текстовых и голосовых сообщений** через мультимодальные модели Google Gemini AI.

## 1. Зависимости
```bash
python -m pip install aiogram google-genai python-dotenv aiohttp-socks
```

## 2. Структура бота с распознаванием голоса (`bot.py`)
- Скачивание голосового сообщения (`.ogg`).
- Загрузка в Gemini API через `ai_client.files.upload()`.
- Глубокий анализ аудио и ответ текстом.

