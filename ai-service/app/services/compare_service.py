from app.services.gemini_service import GeminiService
from app.schemas.paper_schemas import CompareDataResponse

class CompareService:
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
3. PURE JSON ONLY: Kembalikan respon murni JSON valid tanpa teks pembuka/penutup."""

    @classmethod
    def compare_papers(
        cls, 
        paper_a_title: str, 
        paper_a_text: str, 
        paper_b_title: str, 
        paper_b_text: str
    ) -> CompareDataResponse:
        user_prompt = f"""Anda adalah Chief Academic Reviewer dan Research Methodologist senior.
Lakukan evaluasi dan perbandingan akademik yang objektif, kritis, dan mendalam antara dua dokumen penelitian (Paper A dan Paper B) berikut HANYA dalam format JSON valid.

================================================================================
ATURAN KOMPARASI & EVALUASI HEAD-TO-HEAD (SANGAT KETAT):

1. DUKUNGAN BILINGUAL: Dokumen dapat berbahasa INDONESIA maupun INGGRIS. Analisislah sesuai bahasa asli masing-masing dokumen.
2. KOMPARASI 7 ASPEK UTAMA: Bandingkan secara adil 7 dimensi riset berikut secara berdampingan (side-by-side):
   - Research Topic, Methodology, Dataset, Sample, Main Finding, Limitation, Novelty.
3. KEPUTUSAN EVALUASI (VERDICT 3 PERTANYAAN RESMI):
   Jawab 3 pertanyaan pamungkas dan tentukan pemenang ("Paper A" | "Paper B" | "Seimbang") beserta alasan komparasi yang tajam dan berbobot:
   - "Which paper has stronger methodology?" (Evaluasi ketepatan desain riset & alur metode).
   - "Which paper has stronger evidence?" (Evaluasi validitas data, ukuran sampel, & metrik pengujian).
   - "Which paper is more reproducible?" (Evaluasi transparansi dataset publik, kode, & parameter).
4. ATURAN KECEPATAN (SPEED OPTIMIZATION):
   - Seluruh penjelasan per aspek dan alasan vonis pemenang WAJIB MAKSIMAL 2 KALIMAT PADAT & TAJAM dalam Bahasa Indonesia.
5. FORMAT PURE JSON ONLY:
   - Respon HANYA berupa JSON valid murni tanpa teks pembuka dan tanpa teks penutup.
================================================================================

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
      "aspect": "Research Topic",
      "paper_a": "Penjelasan fokus topik Paper A dalam bahasa Indonesia (maks 2 kalimat)",
      "paper_b": "Penjelasan fokus topik Paper B dalam bahasa Indonesia (maks 2 kalimat)"
    }},
    {{
      "aspect": "Methodology",
      "paper_a": "Penjelasan metode & desain riset Paper A dalam bahasa Indonesia (maks 2 kalimat)",
      "paper_b": "Penjelasan metode & desain riset Paper B dalam bahasa Indonesia (maks 2 kalimat)"
    }},
    {{
      "aspect": "Dataset",
      "paper_a": "Nama/sumber dataset Paper A dalam bahasa Indonesia",
      "paper_b": "Nama/sumber dataset Paper B dalam bahasa Indonesia"
    }},
    {{
      "aspect": "Sample",
      "paper_a": "Jumlah sampel/data Paper A dalam bahasa Indonesia",
      "paper_b": "Jumlah sampel/data Paper B dalam bahasa Indonesia"
    }},
    {{
      "aspect": "Main Finding",
      "paper_a": "Temuan utama Paper A dalam bahasa Indonesia (maks 2 kalimat)",
      "paper_b": "Temuan utama Paper B dalam bahasa Indonesia (maks 2 kalimat)"
    }},
    {{
      "aspect": "Limitation",
      "paper_a": "Batasan penelitian Paper A dalam bahasa Indonesia (maks 2 kalimat)",
      "paper_b": "Batasan penelitian Paper B dalam bahasa Indonesia (maks 2 kalimat)"
    }},
    {{
      "aspect": "Novelty",
      "paper_a": "Aspek kebaruan Paper A dalam bahasa Indonesia (maks 2 kalimat)",
      "paper_b": "Aspek kebaruan Paper B dalam bahasa Indonesia (maks 2 kalimat)"
    }}
  ],
  "verdict": {{
    "stronger_methodology": {{
      "question": "Which paper has stronger methodology?",
      "winner": "Paper A | Paper B | Seimbang",
      "reason": "Alasan perbandingan kekuatan metodologi dalam bahasa Indonesia (maks 2 kalimat)"
    }},
    "stronger_evidence": {{
      "question": "Which paper has stronger evidence?",
      "winner": "Paper A | Paper B | Seimbang",
      "reason": "Alasan perbandingan kekuatan bukti data dan eksperimen dalam bahasa Indonesia (maks 2 kalimat)"
    }},
    "more_reproducible": {{
      "question": "Which paper is more reproducible?",
      "winner": "Paper A | Paper B | Seimbang",
      "reason": "Alasan perbandingan transparansi dan kemudahan replikasi dalam bahasa Indonesia (maks 2 kalimat)"
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