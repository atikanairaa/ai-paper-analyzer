import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")

if not INTERNAL_SERVICE_TOKEN:
    raise ValueError("KRITIKAL: INTERNAL_SERVICE_TOKEN belum diset di file .env!")