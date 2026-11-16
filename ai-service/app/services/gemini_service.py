import time
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
import google.generativeai as genai
import json
from typing import Type, TypeVar
from pydantic import BaseModel, ValidationError
from app.core_config import GEMINI_API_KEY
from app.logger import logger

genai.configure(api_key=GEMINI_API_KEY)

T = TypeVar("T", bound=BaseModel)

class GeminiService:
    MODEL_NAME = "models/gemini-3-flash-preview"

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
                logger.gemini_call(
                    model_name=cls.MODEL_NAME,
                    attempt=attempts,
                    max_retries=max_retries,
                    prompt_chars=len(current_prompt)
                )

                t_start = time.time()
                response = model.generate_content(current_prompt)
                duration = time.time() - t_start
                raw_json_text = response.text.strip()

                if raw_json_text.startswith("```"):
                    raw_json_text = raw_json_text.split("```")[1]
                    if raw_json_text.startswith("json"):
                        raw_json_text = raw_json_text[4:]
                    raw_json_text = raw_json_text.strip()

                # Pydantic schema validation
                validated_data = schema_class.model_validate_json(raw_json_text)
                logger.step(
                    "GEMINI-AI", 
                    f"Response received ({duration:.2f}s) and passed '{schema_class.__name__}' schema validation"
                )
                return validated_data

            except Exception as e:
                err_str = str(e)
                
                # RATE LIMIT (429): Automatic backoff sleep
                if "429" in err_str or "ResourceExhausted" in err_str:
                    if attempts <= max_retries:
                        sleep_time = 30 * attempts
                        logger.gemini_retry(
                            reason=f"Rate limit / 429 ResourceExhausted detected: {err_str[:120]}...",
                            sleep_seconds=sleep_time,
                            next_attempt=attempts + 1
                        )
                        time.sleep(sleep_time)
                        continue

                # EXHAUSTED RETRIES
                if attempts > max_retries:
                    logger.step(
                        "GEMINI-FAILED", 
                        f"All retry attempts ({max_retries + 1}) exhausted: {err_str}"
                    )
                    raise ValueError(f"AI_PROCESSING_FAILED: {err_str}")

                # SCHEMA REPAIR LOOP
                logger.step(
                    "GEMINI-REPAIR", 
                    f"JSON schema validation failed (Attempt {attempts}/{max_retries + 1}). Requesting AI repair: {err_str[:150]}..."
                )
                current_prompt = (
                    f"PREVIOUS RESPONSE FAILED PYDANTIC VALIDATION!\n"
                    f"Error details: {err_str}\n\n"
                    f"Please REPAIR and return strictly valid JSON matching the schema."
                )
