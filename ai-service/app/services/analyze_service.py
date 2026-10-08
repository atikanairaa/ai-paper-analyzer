from app.services.gemini_service import GeminiService
from app.schemas.paper_schemas import FullAnalyzeDataResponse

import requests
from app.services.gemini_service import GeminiService
from app.schemas.paper_schemas import FullAnalyzeDataResponse

class AnalyzeService:

    @classmethod
    def run_full_analysis(cls, paper_text: str, expertises: str = None) -> FullAnalyzeDataResponse:
        
        # 1. TARIK DATA KRITERIA DARI LARAVEL
        try:
            response = requests.get("http://127.0.0.1:8000/api/internal/criteria?endpoint=analyze", timeout=10)
            api_data = response.json()
            criteria_list = api_data.get("data", [])
        except Exception as e:
            raise Exception(f"Gagal terhubung ke Laravel API untuk mengambil kriteria: {str(e)}")
            
        if not criteria_list:
            raise Exception("Tidak ada kriteria evaluasi yang aktif di database untuk endpoint analyze!")

        # 2. SUSUN SYSTEM PROMPT DINAMIS BERDASARKAN DATABASE
        criteria_text = ""
        for c in criteria_list:
            criteria_text += f"- **{c['name']}** (Bobot {c['weight']}%):\n  {c['instruction']}\n\n"

        system_prompt = f"""Anda adalah Chief Academic Reviewer dan Research Methodologist berstandar internasional.
Tugas Anda adalah membedah dan mengevaluasi naskah paper penelitian secara objektif, kritis, terukur, dan bebas dari bias.

KEMAMPUAN BILINGUAL:
Mampu memproses dokumen dalam Bahasa INDONESIA maupun INGGRIS.

================================================================================
RUBRIK KRITERIA PENILAIAN & PEMBOBOTAN (DARI DATABASE):
{criteria_text}

ATURAN PENILAIAN:
1. Berikan skor 0-100 untuk setiap kriteria di atas.
2. Hitung 'overall_score' berdasarkan persentase bobot masing-masing kriteria.
3. JANGAN MERINGKAS TEKS! Khusus untuk bagian 'paper_sections' (Introduction, Methods, Results, Conclusion), Anda WAJIB MENYALIN 100% SELURUH TEKS ASLI dari dokumen ke dalam bagian yang sesuai tanpa ada kata yang dipotong atau disingkat sama sekali.
4. EKSTRAKSI KEYWORDS KETAT: DILARANG mengarang/halusinasi keyword. Ekstrak HANYA kata kunci persis seperti yang tertulis di teks dokumen (tepat setelah label "Kata Kunci", "Kata kunci:", atau "Keywords:"). Jika berbahasa Indonesia, salin sesuai aslinya. JANGAN mengarang bidang ilmu seperti Artificial Intelligence jika tidak tertulis.
5. PURE JSON ONLY: Kembalikan respon murni JSON valid tanpa teks pembuka/penutup."""

        # 3. SUSUN USER PROMPT DAN SKEMA JSON
        fallback_expertises = "Computer Science | Medicine | Engineering | Economics | Education | Social Science | Physics | Biology | Other"
        domain_list = expertises if expertises else fallback_expertises

        user_prompt = f"""Lakukan evaluasi akademik mendalam terhadap dokumen paper penelitian terlampir. Kembalikan respons HANYA dalam format JSON.

TEKS PAPER:
\"\"\"
{paper_text}
\"\"\"

TARGET SKEMA JSON (Wajib Patuhi Struktur Ini):
{{
  "paper": {{
    "title": "Judul asli paper / dokumen",
    "abstract": "Teks lengkap abstrak",
    "publication_year": "integer (tahun terbit atau null)",
    "journal": "Nama Jurnal / Prosiding Konferensi atau null",
    "doi": "Nomor DOI atau null"
  }},
  "authors": [
    {{
      "name": "Nama Lengkap Penulis"
    }}
  ],
  "paper_analyses": {{
    "research_domain": "{domain_list}",
    "research_type": "Experimental | Survey | Literature Review | Systematic Review | Case Study | Qualitative | Quantitative | Mixed Method",
    "key_findings": ["Temuan utama 1", "Temuan utama 2"],
    "strengths": ["Kelebihan 1", "Kelebihan 2"],
    "weaknesses": ["Kelemahan 1", "Kelemahan 2"],
    "keywords": ["keyword 1", "keyword 2"]
  }},
  "paper_sections": [
    {{"section_name": "Research Problem", "is_found": "boolean", "summary": "Ringkasan masalah (maks 2 kalimat) atau null"}},
    {{"section_name": "Research Question", "is_found": "boolean", "summary": "Teks pertanyaan penelitian atau null"}},
    {{"section_name": "Research Objective", "is_found": "boolean", "summary": "Tujuan riset (maks 2 kalimat) atau null"}},
    {{"section_name": "Hypothesis", "is_found": "boolean", "summary": "Penjelasan hipotesis jika ada atau null"}},
    {{"section_name": "Methodology", "is_found": "boolean", "summary": "Ringkasan metode (maks 2 kalimat) atau null"}},
    {{"section_name": "Dataset", "is_found": "boolean", "summary": "Nama dataset dan jumlah sampel data atau null"}},
    {{"section_name": "Experiment", "is_found": "boolean", "summary": "Ringkasan pengujian / eksperimen (maks 2 kalimat) atau null"}},
    {{"section_name": "Results", "is_found": "boolean", "summary": "Ringkasan hasil penelitian (maks 2 kalimat) atau null"}},
    {{"section_name": "Conclusion", "is_found": "boolean", "summary": "Ringkasan kesimpulan (maks 2 kalimat) atau null"}},
    {{"section_name": "Limitations", "is_found": "boolean", "summary": "Poin batasan riset (maks 2 kalimat) atau null"}}
  ],
  "paper_scores": {{
    "overall_score": "integer (0-100, dihitung dari total bobot kriteria)",
    "criteria_scores": [
      {{
        "criterion_name": "Nama Kriteria dari Rubrik di atas",
        "score": "integer (0-100)",
        "reason": "Alasan penilaian kritis (maks 2 kalimat)"
      }}
    ]
  }},
  "paper_findings": [
    {{
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "category": "methodology | sample_size | clarity | claims | evidence",
      "finding": "Judul singkat temuan atau kelemahan",
      "explanation": "Penjelasan detail (maksimal 2 kalimat)",
      "page": "Page X",
      "section": "Nama bab terkait",
      "confidence": "float (0.0 - 1.0)",
      "evidence": "Kutipan kalimat dari paper"
    }}
  ],
  "paper_references": {{
    "total_references": "integer",
    "recent_references": "integer",
    "old_references": "integer",
    "potential_issues": ["Catatan audit sitasi"]
  }}
}}
"""

        validated_result: FullAnalyzeDataResponse = GeminiService.call_gemini_with_repair(
            prompt=user_prompt,
            system_instruction=system_prompt,
            schema_class=FullAnalyzeDataResponse,
            max_retries=2
        )
        
        return validated_result