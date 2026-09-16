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

                # Validasi Murni Pydantic
                validated_data = schema_class.model_validate_json(raw_json_text)
                return validated_data

            except (ValidationError, json.JSONDecodeError) as e:
                if attempts > max_retries:
                    raise ValueError(
                        f"AI_PROCESSING_FAILED: Gagal memvalidasi JSON setelah {max_retries}x percobaan perbaikan AI. Error: {str(e)}"
                    )

                current_prompt = (
                    f"PREVIOUS RESPONSE FAILED PYDANTIC VALIDATION!\n"
                    f"Error details: {str(e)}\n\n"
                    f"CRITICAL INSTRUCTION:\n"
                    f"- 'paper_findings' MUST be a list of OBJECTS with keys: severity, category, finding, explanation, evidence (NOT strings).\n"
                    f"- Scores must be integers between 0 and 100.\n"
                    f"Please RE-EVALUATE and strictly return the valid JSON matching the schema."
                )