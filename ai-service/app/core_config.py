import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")

if not INTERNAL_SERVICE_TOKEN:
    raise ValueError("KRITIKAL: INTERNAL_SERVICE_TOKEN belum diset di file .env!")

# Pembacaan Kredensial DOKU
DOKU_CLIENT_ID = os.getenv("DOKU_CLIENT_ID")
DOKU_SECRET_KEY = os.getenv("DOKU_SECRET_KEY")
DOKU_API_URL = os.getenv("DOKU_API_URL", "https://api-sandbox.doku.com")

if not DOKU_CLIENT_ID or not DOKU_SECRET_KEY:
    # Peringatkan jika developer lupa isi .env
    pass