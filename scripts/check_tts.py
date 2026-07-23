"""
Независимый диагностический скрипт проверки 3 провайдеров озвучки (ElevenLabs, Azure Speech, Google Neural2).
Запускается командой: python scripts/check_tts.py
Возвращает sys.exit(0) если все работают, sys.exit(1) если хотя бы один сбоит.
"""

import os
import sys
import requests
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "westeurope")
GOOGLE_KEYS_PATH = Path("google_keys.json")

TEMP_DIR = Path("temp_audio")
TEMP_DIR.mkdir(exist_ok=True)

results = {
    "elevenlabs": {"key": False, "api": False, "audio": False, "status": "❌ Не работает", "reason": ""},
    "azure": {"key": False, "api": False, "audio": False, "status": "❌ Не работает", "reason": ""},
    "google": {"key": False, "api": False, "audio": False, "status": "❌ Не работает", "reason": ""}
}

print("=" * 70)
print("🔍 ДИАГНОСТИКА И ПРОВЕРКА ПРО-ПРОВАЙДЕРОВ СИНТЕЗА РЕЧИ (TTS)")
print("=" * 70)

# 1. ELEVENLABS
print("\n[1/3] Проверка ElevenLabs API...")
if not ELEVENLABS_API_KEY:
    results["elevenlabs"]["reason"] = "Ключ ELEVENLABS_API_KEY отсутствует в файле .env"
else:
    results["elevenlabs"]["key"] = True
    try:
        sub_url = "https://api.elevenlabs.io/v1/user/subscription"
        sub_res = requests.get(sub_url, headers={"xi-api-key": ELEVENLABS_API_KEY}, timeout=7)
        if sub_res.status_code == 200:
            sub_data = sub_res.json()
            limit = sub_data.get("character_limit", 0)
            count = sub_data.get("character_count", 0)
            remaining = limit - count
            results["elevenlabs"]["api"] = True
            
            if remaining <= 0:
                results["elevenlabs"]["status"] = "⚠️ Частично"
                results["elevenlabs"]["reason"] = f"Исчерпан лимит символов: осталось {remaining} из {limit}"
            else:
                # Используем дефолтный базовый голос J.Fx ( или Rachel )
                voice_id = "JBFqnCBsd6RMkjVDRZzb" # George / Стандартный дефолтный голос
                tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                payload = {"text": "Тестовая озвучка ElevenLabs", "model_id": "eleven_multilingual_v2"}
                tts_res = requests.post(tts_url, json=payload, headers={"xi-api-key": ELEVENLABS_API_KEY, "Accept": "audio/mpeg"}, timeout=12)
                if tts_res.status_code == 200:
                    results["elevenlabs"]["audio"] = True
                    results["elevenlabs"]["status"] = "✅ Работает"
                    results["elevenlabs"]["reason"] = f"Доступно символов: {remaining} из {limit}"
                else:
                    results["elevenlabs"]["reason"] = f"TTS HTTP {tts_res.status_code}: {tts_res.text[:120]}"
        elif sub_res.status_code == 401:
            results["elevenlabs"]["reason"] = "Недействительный API-ключ (HTTP 401 Unauthorized)"
        else:
            results["elevenlabs"]["reason"] = f"API error HTTP {sub_res.status_code}"
    except Exception as e:
        results["elevenlabs"]["reason"] = f"Сетевая ошибка / timeout: {e}"

# 2. AZURE SPEECH
print("\n[2/3] Проверка Microsoft Azure Speech Services...")
if not AZURE_SPEECH_KEY:
    results["azure"]["reason"] = "Ключ AZURE_SPEECH_KEY отсутствует в файле .env"
else:
    results["azure"]["key"] = True
    try:
        import azure.cognitiveservices.speech as speechsdk
        speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
        speech_config.speech_synthesis_voice_name = "ru-RU-DmitryNeural"
        speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3)
        
        azure_out_path = TEMP_DIR / "check_azure.mp3"
        audio_config = speechsdk.audio.AudioOutputConfig(filename=str(azure_out_path))
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
        
        result = synthesizer.speak_text_async("Тестовая озвучка Azure Speech").get()
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            results["azure"]["api"] = True
            results["azure"]["audio"] = True
            results["azure"]["status"] = "✅ Работает"
            results["azure"]["reason"] = f"Голос ru-RU-DmitryNeural (Регион: {AZURE_SPEECH_REGION})"
        else:
            results["azure"]["reason"] = f"Azure SDK отказ: {result.reason}"
    except ImportError:
        results["azure"]["reason"] = "Библиотека azure-cognitiveservices-speech не установлена"
    except Exception as e:
        results["azure"]["reason"] = f"Ошибка подключения Azure: {e}"

# 3. GOOGLE NEURAL2
print("\n[3/3] Проверка Google Cloud Text-to-Speech (Neural2)...")
if not GOOGLE_KEYS_PATH.exists():
    results["google"]["reason"] = "Файл google_keys.json отсутствует в корне проекта"
else:
    results["google"]["key"] = True
    try:
        from google.cloud import texttospeech
        from google.oauth2 import service_account
        creds = service_account.Credentials.from_service_account_file(str(GOOGLE_KEYS_PATH))
        client = texttospeech.TextToSpeechClient(credentials=creds)
        
        s_input = texttospeech.SynthesisInput(text="Тестовая озвучка Google Neural2")
        voice = texttospeech.VoiceSelectionParams(
            language_code="ru-RU",
            name="ru-RU-Neural2-C",
            ssml_gender=texttospeech.SsmlVoiceGender.MALE
        )
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
        response = client.synthesize_speech(input=s_input, voice=voice, audio_config=audio_config)
        
        g_out_path = TEMP_DIR / "check_google.mp3"
        with open(g_out_path, "wb") as out:
            out.write(response.audio_content)
            
        results["google"]["api"] = True
        results["google"]["audio"] = True
        results["google"]["status"] = "✅ Работает"
        results["google"]["reason"] = "Голос ru-RU-Neural2-C активен"
    except Exception as e:
        err_str = str(e)
        if "403" in err_str or "has not been used" in err_str or "disabled" in err_str:
            results["google"]["reason"] = "Cloud Text-to-Speech API отключен в Google Cloud Console"
        else:
            results["google"]["reason"] = f"Ошибка API: {err_str[:120]}"

print("\n" + "=" * 70)
print("📊 СВОДНЫЙ ОТЧЕТ СОСТОЯНИЯ ПРОВАЙДЕРОВ ОЗВУЧКИ")
print("=" * 70)
print(f"{'Провайдер':<15} | {'Ключ найден':<12} | {'API отвечает':<13} | {'Аудио создано':<14} | {'Статус':<15}")
print("-" * 75)

for p_name, data in [("ElevenLabs", results["elevenlabs"]), ("Azure Speech", results["azure"]), ("Google Neural2", results["google"])]:
    k_icon = "✅ Да" if data["key"] else "❌ Нет"
    a_icon = "✅ Да" if data["api"] else "❌ Нет"
    au_icon = "✅ Да" if data["audio"] else "❌ Нет"
    print(f"{p_name:<15} | {k_icon:<12} | {a_icon:<13} | {au_icon:<14} | {data['status']:<15}")

print("-" * 75)

all_ok = all(d["status"] == "✅ Работает" for d in results.values())

if not all_ok:
    print("\n🔍 ДЕТАЛЬНАЯ ПРИЧИНА СБОЕВ / 💡 ИНСТРУКЦИЯ ПО АКТИВАЦИИ:")
    for p_name, data in [("ElevenLabs", results["elevenlabs"]), ("Microsoft Azure", results["azure"]), ("Google Neural2", results["google"])]:
        if data["status"] != "✅ Работает":
            print(f"\n❌ [{p_name}]: {data['reason']}")

print("=" * 70)

sys.exit(0 if all_ok else 1)
