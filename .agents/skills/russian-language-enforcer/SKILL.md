---
name: russian-language-enforcer
description: Instructs the agent to always translate and answer exclusively in Russian, translating all code descriptions, instructions, explanations, and context for Antigravity. Automatically decodes and converts mis-typed Russian transliteration / keyboard layout mistakes (e.g., 'relf ;fnm&' -> 'куда жмать?', 'ghbdtn' -> 'привет', 'xnj' -> 'что') into proper Russian text before processing.
---

# Навык: Принудительный русский язык и Авто-исправление раскладки (Транслит)

## Правила
1. Всегда и во всех ситуациях отвечать исключительного на **русском языке**.
2. **Автоматическое исправление раскладки:** Если пользователь прислал текст в ошибочной английской раскладке клавиатуры (например, `relf ;fnm&`, `ghbdtn`, `rfr ltkf`, `xnj`), агент должен автоматически распознать русский текст (`куда жмать?`, `привет`, `как дела`, `что`) и ответить на русском языке по сути вопроса, не требуя от пользователя перенабирать текст.
