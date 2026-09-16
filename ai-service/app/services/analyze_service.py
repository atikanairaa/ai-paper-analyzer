from app.services.gemini_service import GeminiService
from app.schemas.paper_schemas import FullAnalyzeDataResponse

class AnalyzeService:
    SYSTEM_PROMPT = """Anda adalah seorang analis riset ilmiah dan reviewer jurnal akademik senior berstandar Scopus Q1 dan SINTA 1. Tugas Anda adalah membedah dan mengevaluasi dokumen paper/jurnal ilmiah secara objektif, kritis, dan mendalam.

KEMAMPUAN BILINGUAL & PEMETAAN ISTILAH:
Dokumen input dapat berbahasa INDONESIA atau INGGRIS. Kenali pemetaan bagian berikut secara otomatis:
- Title <==> Judul
- Authors / Affiliations <==> Penulis / Afiliasi / Institusi / Program Studi
- Abstract <==> Abstrak
- Keywords <==> Kata Kunci
- Introduction / Background <==> Pendahuluan / Latar Belakang / Rumusan Masalah
- Research Objective / Questions <==> Tujuan Penelitian / Pertanyaan Riset
- Literature Review / Related Works <==> Tinjauan Pustaka / Kajian Teori
- Methodology / Materials & Methods <==> Metodologi / Metode Penelitian / Desain Riset / Kerangka Kerja
- Dataset / Sample / Population <==> Dataset / Sampel / Data Penelitian / Partisipan
- Results & Discussion <==> Hasil dan Pembahasan / Temuan Riset
- Conclusion & Future Works <==> Kesimpulan dan Saran / Penutup
- Limitations <==> Batasan Penelitian / Keterbatasan
- References / Bibliography <==> Daftar Pustaka / Rujukan / Bibliografi

ATURAN MUTLAK SISTEM:
1. STRICT GROUNDING (DILARANG HALUSINASI): Evaluasi HANYA fakta yang tertulis di dokumen. Jika suatu bagian (misal: hipotesis/dataset) tidak ditulis oleh penulis, kembalikan null atau {"is_found": false, "summary": null}. DILARANG menebak atau mengarang.
2. STANDAR ISTILAH KATEGORI: Nilai untuk "research_domain", "research_type", dan "severity" WAJIB menggunakan istilah baku Bahasa Inggris.
3. BAHASA PENJELASAN: Seluruh teks ringkasan, analisis, alasan skor (reason), dan temuan kelemahan WAJIB ditulis dalam BAHASA INDONESIA akademik yang formal.
4. PURE JSON ONLY: Respon HANYA berupa JSON valid sesuai skema yang diminta, tanpa teks pengantar, tanpa teks penutup."""

    @classmethod
    def run_full_analysis(cls, paper_text: str) -> FullAnalyzeDataResponse:
        user_prompt = f"""Lakukan analisis mendalam terhadap dokumen/teks paper penelitian terlampir dan berikan respon HANYA dalam format JSON valid.

INSTRUKSI KHUSUS & ATURAN SISTEM:
1. DUKUNGAN BILINGUAL: Dokumen dapat berbahasa INDONESIA atau INGGRIS.
2. DILARANG HALUSINASI: Jika data/bagian tidak ditemukan di teks dokumen, kembalikan null atau {{"is_found": false, "summary": null}}.
3. NILAI KATEGORI (WAJIB PILIH DARI OPSI BERIKUT):
   - research_domain: Computer Science | Medicine | Engineering | Economics | Education | Social Science | Physics | Biology | Other
   - research_type: Experimental | Survey | Literature Review | Systematic Review | Case Study | Qualitative | Quantitative | Mixed Method
   - severity: LOW | MEDIUM | HIGH | CRITICAL
4. BAHASA PENJELASAN: Seluruh teks ulasan, ringkasan, alasan skor, dan kelemahan WAJIB ditulis dalam BAHASA INDONESIA yang baku dan ilmiah.

TEKS PAPER:
\"\"\"
{paper_text}
\"\"\"

TARGET SKEMA JSON:
{{
  "paper": {{
    "title": "Judul asli paper / dokumen",
    "abstract": "Teks lengkap abstrak",
    "publication_year": "integer (tahun terbit, misal: 2024 atau null)",
    "journal": "Nama Jurnal / Prosiding Konferensi atau null",
    "doi": "Nomor DOI atau null"
  }},
  "authors": [
    {{
      "name": "Nama Lengkap Penulis"
    }}
  ],
  "paper_analyses": {{
    "research_domain": "Computer Science | Medicine | Engineering | Economics | Education | Social Science | Physics | Biology | Other",
    "research_type": "Experimental | Survey | Literature Review | Systematic Review | Case Study | Qualitative | Quantitative | Mixed Method",
    "key_findings": [
      "Temuan utama 1",
      "Temuan utama 2"
    ],
    "strengths": [
      "Poin kelebihan penelitian 1",
      "Poin kelebihan penelitian 2"
    ],
    "weaknesses": [
      "Kelemahan umum penelitian 1",
      "Kelemahan umum penelitian 2"
    ],
    "keywords": [
      "keyword 1",
      "keyword 2",
      "keyword 3"
    ]
  }},
  "paper_sections": [
    {{"section_name": "Research Problem", "is_found": boolean, "summary": "Penjelasan rumusan masalah atau null"}},
    {{"section_name": "Research Question", "is_found": boolean, "summary": "Teks pertanyaan penelitian atau null"}},
    {{"section_name": "Research Objective", "is_found": boolean, "summary": "Tujuan penelitian atau null"}},
    {{"section_name": "Hypothesis", "is_found": boolean, "summary": "Penjelasan hipotesis jika ada atau null"}},
    {{"section_name": "Methodology", "is_found": boolean, "summary": "Penjelasan metode penelitian atau null"}},
    {{"section_name": "Dataset", "is_found": boolean, "summary": "Nama dataset dan jumlah sampel data atau null"}},
    {{"section_name": "Experiment", "is_found": boolean, "summary": "Ringkasan pengujian / eksperimen atau null"}},
    {{"section_name": "Results", "is_found": boolean, "summary": "Ringkasan hasil penelitian atau null"}},
    {{"section_name": "Conclusion", "is_found": boolean, "summary": "Ringkasan kesimpulan atau null"}},
    {{"section_name": "Limitations", "is_found": boolean, "summary": "Poin-poin batasan riset atau null"}}
  ],
  "paper_scores": {{
    "overall_score": "integer (0-100, nilai rata-rata keseluruhan)",
    "methodology_score": "integer (0-100)",
    "methodology_reason": "Alasan penilaian metodologi secara detail dalam bahasa Indonesia",
    "novelty_score": "integer (0-100)",
    "novelty_reason": "Alasan penilaian kebaruan dalam bahasa Indonesia",
    "clarity_score": "integer (0-100)",
    "clarity_reason": "Alasan penilaian kejelasan penulisan dalam bahasa Indonesia",
    "evidence_score": "integer (0-100)",
    "evidence_reason": "Alasan penilaian kekuatan bukti/data dalam bahasa Indonesia",
    "reproducibility_score": "integer (0-100)",
    "reproducibility_reason": "Alasan penilaian kemudahan replikasi dalam bahasa Indonesia",
    "writing_score": "integer (0-100)",
    "writing_reason": "Alasan penilaian kualitas tata bahasa dan sistematika dalam bahasa Indonesia"
  }},
  "paper_findings": [
    {{
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "category": "methodology | sample_size | clarity | claims | limitations | evidence | reproducibility | citation",
      "finding": "Judul singkat temuan atau kelemahan",
      "explanation": "Penjelasan lengkap mengapa hal ini menjadi masalah",
      "evidence": "Kutipan atau rujukan halaman/bagian dari paper"
    }}
  ],
  "paper_references": {{
    "total_references": "integer (total seluruh daftar pustaka)",
    "recent_references": "integer (jumlah referensi terbitan 5-10 tahun terakhir)",
    "old_references": "integer (jumlah referensi lama > 10 tahun)",
    "potential_issues": [
      "Catatan audit daftar pustaka / anomali sitasi"
    ]
  }}
}}
"""

        validated_result: FullAnalyzeDataResponse = GeminiService.call_gemini_with_repair(
            prompt=user_prompt,
            system_instruction=cls.SYSTEM_PROMPT,
            schema_class=FullAnalyzeDataResponse,
            max_retries=2
        )
        
        return validated_result