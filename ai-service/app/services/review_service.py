from app.services.gemini_service import GeminiService
from app.schemas.paper_schemas import ReviewDataResponse

class ReviewService:
    SYSTEM_PROMPT = """Bertindaklah sebagai Senior Academic Peer-Reviewer untuk jurnal internasional terindeks.
Evaluasi dokumen paper penelitian terlampir secara kritis dan objektif, lalu susun Laporan Reviewer resmi HANYA dalam format JSON valid.

ATURAN WAJIB SISTEM:
1. DUKUNGAN BILINGUAL: Dokumen dapat berbahasa Indonesia atau Inggris.
2. DILARANG HALUSINASI: Evaluasi hanya apa yang tertulis di paper.
3. BAHASA ULASAN: Seluruh teks ringkasan, ulasan, poin evaluasi, dan alasan vonis WAJIB ditulis dalam BAHASA INDONESIA akademik formal.
4. KONSISTENSI VONIS (Pilih salah satu secara tegas):
   - "ACCEPT": Paper berkualitas tinggi, tidak ada kelemahan mayor.
   - "MINOR_REVISION": Paper solid, hanya butuh perbaikan kecil (akurasi, sitasi, visualisasi).
   - "MAJOR_REVISION": Paper memiliki kelemahan metodologi/eksperimen signifikan yang wajib dirombak.
   - "REJECT": Paper cacat ilmiah fatal atau tidak memenuhi standar publikasi.
5. PURE JSON ONLY: Jangan sertakan teks pengantar atau penutup apapun di luar JSON."""

    @classmethod
    def generate_review_report(cls, paper_text: str) -> ReviewDataResponse:
        user_prompt = f"""Evaluasi dokumen paper penelitian terlampir secara kritis dan objektif, lalu susun Laporan Reviewer resmi HANYA dalam format JSON valid.

TEKS PAPER:
\"\"\"
{paper_text}
\"\"\"

TARGET SKEMA JSON:
{{
  "summary": "Ringkasan kontribusi utama dan metodologi yang diajukan dalam bahasa Indonesia",
  "strengths": [
    "Poin kekuatan dan keunggulan utama penelitian 1",
    "Poin kekuatan dan keunggulan utama penelitian 2"
  ],
  "major_concerns": [
    "Kelemahan fatal atau metodologi krusial yang wajib diperbaiki penulis"
  ],
  "minor_concerns": [
    "Kekurangan minor seperti kelengkapan daftar pustaka, perbaikan grafik, atau typo"
  ],
  "section_reviews": {{
    "methodology_review": "Ulasan kritis terhadap desain penelitian, data, dan teknik eksperimen dalam bahasa Indonesia",
    "novelty_review": "Ulasan terhadap aspek kebaruan riset dibanding studi terdahulu dalam bahasa Indonesia",
    "result_review": "Ulasan apakah bukti eksperimen benar-benar mendukung klaim kesimpulan dalam bahasa Indonesia",
    "reproducibility_review": "Ulasan mengenai kejelasan langkah riset untuk dapat diulang peneliti lain dalam bahasa Indonesia"
  }},
  "recommendation": "ACCEPT | MINOR_REVISION | MAJOR_REVISION | REJECT",
  "recommendation_reason": "Alasan editorial tegas dan profesional di balik vonis keputusan yang dipilih dalam bahasa Indonesia"
}}
"""

        validated_result: ReviewDataResponse = GeminiService.call_gemini_with_repair(
            prompt=user_prompt,
            system_instruction=cls.SYSTEM_PROMPT,
            schema_class=ReviewDataResponse,
            max_retries=2
        )
        
        return validated_result