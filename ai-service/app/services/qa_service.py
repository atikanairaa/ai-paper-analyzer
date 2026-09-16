from app.services.gemini_service import GeminiService
from app.schemas.paper_schemas import QADataResponse

class QAService:
    SYSTEM_PROMPT = """Anda adalah asisten riset akademik cerdas. Jawablah pertanyaan pengguna HANYA berdasarkan dokumen paper penelitian terlampir.

ATURAN MUTLAK SISTEM (STRICT GROUNDING & EXACT EVIDENCE):
1. DUKUNGAN BILINGUAL: Dokumen dapat berbahasa INDONESIA atau INGGRIS.
2. DILARANG menggunakan pengetahuan luar/internet. Jawab hanya apa yang tertulis di dalam paper.
3. JIKA INFORMASI TIDAK TERCANTUM, Anda WAJIB mengisi "answer" PERSIS dengan kalimat:
   "Informasi tersebut tidak ditemukan dalam paper."
   serta ubah "found_in_paper" menjadi false dan kosongkan "evidence_sources" menjadi [].
4. JIKA INFORMASI DITEMUKAN:
   - Tulis jawaban yang padat, jelas, dan akurat dalam BAHASA INDONESIA pada field "answer".
   - WAJIB mencantumkan rujukan sumber ilmiah pada "evidence_sources":
     * "page": Tulis nomor halaman persis (misal: "Page 1" atau "Page 2").
     * "section": SALIN PERSIS nama judul bab/heading yang tertera di dokumen (misal: "Abstract" atau "1. Introduction" atau "2. Methodology"). Jangan digabung-gabung.
     * "exact_quote": Salin persis kalimat bukti pendukung aslinya dari teks paper.
5. Output HANYA berupa format JSON valid murni tanpa teks pengantar dan tanpa teks penutup."""

    @classmethod
    def answer_question(cls, paper_text: str, question: str) -> QADataResponse:
        user_prompt = f"""Jawab pertanyaan berikut berdasarkan teks paper yang diberikan:

TEKS PAPER:
\"\"\"
{paper_text}
\"\"\"

PERTANYAAN PENGGUNA:
"{question}"

TARGET SKEMA JSON:
{{
  "user_question": "{question}",
  "found_in_paper": true,
  "answer": "Penjelasan jawaban dalam bahasa Indonesia",
  "evidence_sources": [
    {{
      "page": "Page 1",
      "section": "Nama judul bab persis sesuai dokumen",
      "exact_quote": "Kutipan kalimat asli dari paper"
    }}
  ]
}}
"""

        validated_result: QADataResponse = GeminiService.call_gemini_with_repair(
            prompt=user_prompt,
            system_instruction=cls.SYSTEM_PROMPT,
            schema_class=QADataResponse,
            max_retries=2
        )
        
        return validated_result