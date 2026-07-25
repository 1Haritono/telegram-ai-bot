import os
import json
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build

logging.basicConfig(level=logging.INFO)

def test_gmail():
    creds_path = "google_keys.json"
    if not os.path.exists(creds_path):
        print("[ERROR] Файл google_keys.json не найден!")
        return

    try:
        scopes = ['https://www.googleapis.com/auth/gmail.readonly']
        creds = service_account.Credentials.from_service_account_file(
            creds_path, scopes=scopes
        )
        service = build('gmail', 'v1', credentials=creds)
        print("[OK] Сервис Gmail API успешно инициализирован с ключами Service Account!")
    except Exception as e:
        print(f"[ERROR] Ошибка инициализации Gmail API: {e}")

if __name__ == "__main__":
    test_gmail()
