import time
import google.generativeai as genai
import json
from typing import Type, TypeVar
from pydantic import BaseModel, ValidationError
from app.core_config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

T = TypeVar("T", bound=BaseModel)

class GeminiService:
    MODEL_NAME = "gemini-3.6-flash"

    @classmethod
    def call_gemini_with_repair(
        cls, 
        prompt: str, 
        system_instruction: str, 
        schema_class: Type[T], 
        max_retries: int = 2
    ) -> T:
        model = genai.GenerativeModel(
            model_name=cls.MODEL_NAME,
            system_instruction=system_instruction,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        )

        current_prompt = prompt
        attempts = 0

        while attempts <= max_retries:
            try:
                attempts += 1
                response = model.generate_content(current_prompt)
                raw_json_text = response.text.strip()

                if raw_json_text.startswith("```"):
                    raw_json_text = raw_json_text.split("```")[1]
                    if raw_json_text.startswith("json"):
                        raw_json_text = raw_json_text[4:]
                    raw_json_text = raw_json_text.strip()

                # Validasi Pydantic
                validated_data = schema_class.model_validate_json(raw_json_text)
                return validated_data

            except Exception as e:
                err_str = str(e)
                
                # JIKA KENA LIMIT (429): Otomatis tidur dengan exponential backoff
                if "429" in err_str or "ResourceExhausted" in err_str:
                    if attempts <= max_retries:
                        sleep_time = 30 * attempts
                        time.sleep(sleep_time)  # Tunggu 30, 60 detik di background
                        continue

                # JIKA ERROR PYDANTIC ATAU LAINNYA: Jalankan repair loop
                if attempts > max_retries:
                    raise ValueError(f"AI_PROCESSING_FAILED: {err_str}")

                current_prompt = (
                    f"PREVIOUS RESPONSE FAILED PYDANTIC VALIDATION!\n"
                    f"Error details: {err_str}\n\n"
                    f"Please REPAIR and return strictly valid JSON matching the schema."
                )