from app.services.gemini_service import GeminiService
from app.schemas.paper_schemas import FullAnalyzeDataResponse

class AnalyzeService:
    SYSTEM_PROMPT = """Anda adalah Chief Academic Reviewer dan Research Methodologist berstandar internasional (Scopus Q1, IEEE, Elsevier, Nature, dan SINTA 1).
Tugas Anda adalah membedah dan mengevaluasi naskah paper penelitian secara objektif, kritis, terukur, dan bebas dari bias lintas-jurusan.

KEMAMPUAN BILINGUAL & STRUKTUR NASKAH:
1. Mampu memproses dokumen dalam Bahasa INDONESIA maupun INGGRIS.
2. Otomatis mengenali padanan istilah: Title <==> Judul, Abstract <==> Abstrak, Authors <==> Penulis/Afiliasi, Methodology <==> Metode Penelitian, Dataset <==> Data/Sampel/Partisipan, Results <==> Hasil dan Pembahasan, Conclusion <==> Kesimpulan, Limitations <==> Batasan Riset, References <==> Daftar Pustaka.

================================================================================
PANDUAN EVALUASI & PEMBOBOTAN ADAPTIF 3 RUMPUN ILMU (SANGAT KETAT):
Langkah 1: Identifikasi fokus utama dokumen ke dalam salah satu rumpun ilmu.
Langkah 2: Terapkan tolok ukur, rumus hitungan, dan larangan penilaian berikut:

1. RUMPUN ILMU KOMPUTER, TEKNOLOGI & TEKNIK (Engineering & Tech):
   - Standar Penilaian Sub-Skor:
     * Methodology (Bobot 30%): Ketepatan arsitektur algoritma/model, kejelasan pipeline data preprocessing, dan justifikasi pemilihan baseline pembanding.
     * Evidence (Bobot 25%): Validitas dataset benchmark publik, metrik pengujian kuantitatif (Akurasi, F1-Score, MSE, RMSE, R2, Latensi, Flops).
     * Novelty (Bobot 25%): Kontribusi kebaruan algoritma, modifikasi arsitektur, efisiensi komputasi, atau adaptasi domain baru dibanding State-of-the-Art (SOTA).
     * Reproducibility (Bobot 20%): Ketersediaan link dataset/kode publik, kejelasan hyperparameter (learning rate, epoch, batch size, optimizer), dan spesifikasi hardware/environment.
   - Rumus Overall Score: round((methodology_score * 0.30) + (evidence_score * 0.25) + (novelty_score * 0.25) + (reproducibility_score * 0.20))
   - LARANGAN PENILAIAN: Dilarang memotong skor atau mempermasalahkan ketiadaan kuesioner survei, wawancara responden manusia, teori sosiologis, atau komite etik medis.

2. RUMPUN EKONOMI, BISNIS & ILMU SOSIAL (Social, Business & Economics):
   - Standar Penilaian Sub-Skor:
     * Methodology (Bobot 35%): Desain sampling responden (populasi, teknik stratified/random sampling, response rate), pengujian instrumen (uji validitas & reliabilitas konvergen).
     * Evidence (Bobot 25%): Ketepatan model ekonometrik/statistik (Regresi Berganda, SEM-PLS, ARIMA, Panel Data), uji hipotesis (p-value, t-statistic, F-count, R-squared), dan penanganan multikolinearitas/bias.
     * Novelty (Bobot 20%): Kebaruan konteks empiris, integrasi variabel moderasi/mediasi baru, atau perluasan teori sosial/ekonomi.
     * Clarity & Policy (Bobot 20%): Kejelasan alur logika teoritis, sintesis hipotesis, dan kebermaknaan rekomendasi/implikasi manajerial nyata.
   - Rumus Overall Score: round((methodology_score * 0.35) + (evidence_score * 0.25) + (novelty_score * 0.20) + (clarity_score * 0.20))
   - LARANGAN PENILAIAN: Dilarang memotong skor atau menanyakan ketersediaan source code GitHub, komputasi GPU, arsitektur neural network, atau dataset citra.

3. RUMPUN KEDOKTERAN, KESEHATAN & SAINS HAYATI (Health, Medicine & Life Sciences):
   - Standar Penilaian Sub-Skor:
     * Methodology (Bobot 40%): Desain eksperimen klinis/lab (RCT, cohort, case-control), kelompok kontrol/plasebo, kriteria inklusi/eksklusi ketat, dan WAJIB ada persetujuan Komite Etik (Ethical Clearance).
     * Evidence (Bobot 30%): Signifikansi klinis vs statistik, ukuran sampel pasien/hewan uji (power analysis), interval kepercayaan (95% CI), p-value, dan pengendalian variabel perancu (confounding).
     * Novelty (Bobot 15%): Kebaruan efikasi terapi, biomarker diagnostik baru, atau mekanisme biologis yang ditemukan.
     * Reproducibility (Bobot 15%): Rincian protokol lab, dosis/reagen, standarisasi instrumen, dan penanganan spesimen.
   - Rumus Overall Score: round((methodology_score * 0.40) + (evidence_score * 0.30) + (novelty_score * 0.15) + (reproducibility_score * 0.15))
   - LARANGAN PENILAIAN: Dilarang komplain menanyakan kode software aplikasi web atau model bisnis ekonomi mikro.

================================================================================
RUBRIK STANDAR PENENTUAN SKOR ANGKA (0 - 100):
- 90 - 100 (Exceptional): Metodologi sempurna, data sangat masif/valid, kebaruan unggul, tanpa cacat logika.
- 75 - 89  (Solid Academic): Memenuhi kaidah publikasi ilmiah standar, analisis lengkap, keterbatasan diakui transparan.
- 60 - 74  (Adequate with Limitations): Metodologi standar, bukti empiris cukup namun terdapat celah akurasi/sampel (misal R2 < 0.5 atau sampel terbatas).
- < 60     (Significant Flaws): Cacat metodologi fatal, klaim tanpa pembuktian data, atau ketiadaan baseline/kontrol.

================================================================================
STANDAR TINGKAT KEPARAHAN KELEMAHAN (SEVERITY):
- CRITICAL : Cacat fatal metodologi yang membatalkan kesimpulan utama riset.
- HIGH     : Akurasi rendah, sampel tidak representatif, ketiadaan kelompok kontrol/baseline, atau tidak ada uji signifikansi.
- MEDIUM   : Ketiadaan variabel eksternal krusial, dataset terbatas satu lokasi/musim, atau parameter tuning kurang lengkap.
- LOW      : Typo, format penulisan sitasi kurang lengkap, atau tata letak visualisasi.

ATURAN KECEPATAN & STRICT GROUNDING:
1. Seluruh kalimat "reason", "summary", dan "explanation" WAJIB MAKSIMAL 2 KALIMAT PADAT, TAJAM & ILMIAH dalam Bahasa Indonesia.
2. DILARANG MENGARANG (STRICT GROUNDING): Jika suatu informasi/bagian tidak ada di dokumen, wajib kembalikan null atau {"is_found": false, "summary": null}.
3. PURE JSON ONLY: Kembalikan respon murni JSON valid tanpa teks pembuka/penutup.
4. EKSTRAKSI KATA KUNCI (KEYWORDS): Untuk field `keywords`, Anda WAJIB mengambil persis kata kunci (keywords) yang ditulis oleh penulis di dalam dokumen asli. Dilarang keras merangkum, menerjemahkan, atau mengarang kata kunci sendiri."""

    @classmethod
    def run_full_analysis(cls, paper_text: str, expertises: str = None) -> FullAnalyzeDataResponse:
        
        fallback_expertises = "Computer Science | Medicine | Engineering | Economics | Education | Social Science | Physics | Biology | Other"
        domain_list = expertises if expertises else fallback_expertises

        user_prompt = f"""Lakukan evaluasi dan analisis akademik mendalam berstandar Scopus Q1 terhadap dokumen/teks paper penelitian terlampir. Kembalikan respons HANYA dalam format JSON valid.

INSTRUKSI KHUSUS:
1. Identifikasi bidang paper dan terapkan ATURAN EVALUASI & PEMBOBOTAN ADAPTIF 3 RUMPUN ILMU secara disiplin.
2. Hitung "overall_score" menggunakan rumus bobot matematis persis sesuai rumpun ilmu paper.
3. Seluruh teks penjelasan, alasan skor, dan ringkasan WAJIB MAKSIMAL 2 KALIMAT PADAT & TAJAM dalam Bahasa Indonesia.
4. Kategori ENUM (Bahasa Inggris):
   - research_domain: {domain_list}
   - research_type: Experimental | Survey | Literature Review | Systematic Review | Case Study | Qualitative | Quantitative | Mixed Method
   - severity: LOW | MEDIUM | HIGH | CRITICAL

TEKS PAPER:
\"\"\"
{paper_text}
\"\"\"

TARGET SKEMA JSON:
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
    "key_findings": [
      "Temuan utama 1 (maks 2 kalimat)",
      "Temuan utama 2 (maks 2 kalimat)"
    ],
    "strengths": [
      "Poin kelebihan penelitian 1 (singkat & padat)",
      "Poin kelebihan penelitian 2 (singkat & padat)"
    ],
    "weaknesses": [
      "Kelemahan umum penelitian 1 (singkat & padat)",
      "Kelemahan umum penelitian 2 (singkat & padat)"
    ],
    "keywords": [
      "keyword 1",
      "keyword 2",
      "keyword 3"
    ]
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
    "overall_score": "integer (0-100, hasil perhitungan rumus bobot matematis rumpun ilmu)",
    "methodology_score": "integer (0-100, sesuai rubrik skor)",
    "methodology_reason": "Alasan penilaian metodologi secara kritis sesuai kriteria rumpun ilmu (maksimal 2 kalimat)",
    "novelty_score": "integer (0-100, sesuai rubrik skor)",
    "novelty_reason": "Alasan penilaian kebaruan riset (maksimal 2 kalimat)",
    "clarity_score": "integer (0-100, sesuai rubrik skor)",
    "clarity_reason": "Alasan penilaian kejelasan penulisan dan alur logika (maksimal 2 kalimat)",
    "evidence_score": "integer (0-100, sesuai rubrik skor)",
    "evidence_reason": "Alasan penilaian kekuatan bukti data atau eksperimen (maksimal 2 kalimat)",
    "reproducibility_score": "integer (0-100, sesuai rubrik skor)",
    "reproducibility_reason": "Alasan kemudahan replikasi riset (maksimal 2 kalimat)",
    "writing_score": "integer (0-100, sesuai rubrik skor)",
    "writing_reason": "Alasan kualitas tata bahasa dan sistematika akademik (maksimal 2 kalimat)"
  }},
  "paper_findings": [
    {{
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "category": "methodology | sample_size | clarity | claims | limitations | evidence | reproducibility | citation",
      "finding": "Judul singkat temuan atau kelemahan",
      "explanation": "Penjelasan detail mengapa hal ini menjadi masalah (maksimal 2 kalimat)",
      "page": "Page X (nomor halaman)",
      "section": "Nama bab terkait",
      "confidence": "float (0.0 - 1.0, skor keyakinan AI)",
      "evidence": "Kutipan kalimat bukti dari dokumen paper"
    }}
  ],
  "paper_references": {{
    "total_references": "integer (total seluruh daftar pustaka)",
    "recent_references": "integer (jumlah referensi terbitan 5-10 tahun terakhir)",
    "old_references": "integer (jumlah referensi lama > 10 tahun)",
    "potential_issues": [
      "Catatan audit sitasi singkat (maksimal 2 kalimat)"
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