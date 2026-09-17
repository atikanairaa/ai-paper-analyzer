from app.services.gemini_service import GeminiService
from app.schemas.paper_schemas import CompareDataResponse

class CompareService:
    SYSTEM_PROMPT = """Anda adalah analis riset ilmiah senior. Lakukan perbandingan akademik yang objektif, kritis, dan mendalam antara dua dokumen penelitian (Paper A dan Paper B) berikut HANYA dalam format JSON valid.

ATURAN SISTEM:
1. DUKUNGAN BILINGUAL: Dokumen dapat berbahasa INDONESIA atau INGGRIS.
2. KOMPARASI ASPEK: Bandingkan secara objektif 8 aspek utama (Judul Paper, Research Topic, Methodology, Dataset, Sample, Main Finding, Limitation, Novelty) secara berdampingan.
3. KEPUTUSAN EVALUASI (VERDICT): Jawab 3 pertanyaan evaluasi ilmiah dan tentukan pemenang ("Paper A" | "Paper B" | "Seimbang") beserta alasan analisis yang jelas dalam BAHASA INDONESIA:
   - Which paper has stronger methodology?
   - Which paper has stronger evidence?
   - Which paper is more reproducible?
4. FORMAT OUTPUT: Kembalikan HANYA format JSON valid murni tanpa teks pembuka atau penutup."""

    @classmethod
    def compare_papers(
        cls, 
        paper_a_title: str, 
        paper_a_text: str, 
        paper_b_title: str, 
        paper_b_text: str
    ) -> CompareDataResponse:
        user_prompt = f"""Lakukan perbandingan mendalam antara Paper A dan Paper B berikut:

--- PAPER A ---
Judul: {paper_a_title}
Teks:
\"\"\"
{paper_a_text}
\"\"\"

--- PAPER B ---
Judul: {paper_b_title}
Teks:
\"\"\"
{paper_b_text}
\"\"\"

TARGET SKEMA JSON:
{{
  "comparison_table": [
    {{
      "aspect": "Judul Paper",
      "paper_a": "Ekstrak dan tulis judul asli Paper A di sini (bahasa Indonesia/Asli)",
      "paper_b": "Ekstrak dan tulis judul asli Paper B di sini (bahasa Indonesia/Asli)"
    }},
    {{
      "aspect": "Research Topic",
      "paper_a": "Penjelasan topik Paper A dalam bahasa Indonesia",
      "paper_b": "Penjelasan topik Paper B dalam bahasa Indonesia"
    }},
    {{
      "aspect": "Methodology",
      "paper_a": "Penjelasan metode Paper A dalam bahasa Indonesia",
      "paper_b": "Penjelasan metode Paper B dalam bahasa Indonesia"
    }},
    {{
      "aspect": "Dataset",
      "paper_a": "Nama/sumber dataset Paper A dalam bahasa Indonesia",
      "paper_b": "Nama/sumber dataset Paper B dalam bahasa Indonesia"
    }},
    {{
      "aspect": "Sample",
      "paper_a": "Penjelasan sampel/data Paper A dalam bahasa Indonesia",
      "paper_b": "Penjelasan sampel/data Paper B dalam bahasa Indonesia"
    }},
    {{
      "aspect": "Main Finding",
      "paper_a": "Temuan utama Paper A dalam bahasa Indonesia",
      "paper_b": "Temuan utama Paper B dalam bahasa Indonesia"
    }},
    {{
      "aspect": "Limitation",
      "paper_a": "Batasan penelitian Paper A dalam bahasa Indonesia",
      "paper_b": "Batasan penelitian Paper B dalam bahasa Indonesia"
    }},
    {{
      "aspect": "Novelty",
      "paper_a": "Aspek kebaruan Paper A dalam bahasa Indonesia",
      "paper_b": "Aspek kebaruan Paper B dalam bahasa Indonesia"
    }}
  ],
  "verdict": {{
    "stronger_methodology": {{
      "question": "Which paper has stronger methodology?",
      "winner": "Paper A | Paper B | Seimbang",
      "reason": "Alasan mengapa salah satu paper memiliki metodologi yang lebih kuat dalam bahasa Indonesia"
    }},
    "stronger_evidence": {{
      "question": "Which paper has stronger evidence?",
      "winner": "Paper A | Paper B | Seimbang",
      "reason": "Alasan mengapa salah satu paper memiliki data dan bukti eksperimen yang lebih valid/meyakinkan dalam bahasa Indonesia"
    }},
    "more_reproducible": {{
      "question": "Which paper is more reproducible?",
      "winner": "Paper A | Paper B | Seimbang",
      "reason": "Alasan mengapa salah satu paper lebih transparan dan mudah diulang eksperimennya dalam bahasa Indonesia"
    }}
  }}
}}
"""

        validated_result: CompareDataResponse = GeminiService.call_gemini_with_repair(
            prompt=user_prompt,
            system_instruction=cls.SYSTEM_PROMPT,
            schema_class=CompareDataResponse,
            max_retries=2
        )
        
        return validated_result