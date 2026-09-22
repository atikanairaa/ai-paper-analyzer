<?php

namespace App\Jobs;

use App\Models\Paper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AnalyzePaperJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;     // Sesuai brief Halaman 16 (Maksimal 3x Retry)
    public int $timeout = 180; // Tunggu respon AI max 3 menit

    protected int $paperId;

    public function __construct(int $paperId)
    {
        $this->paperId = $paperId;
    }

    public function handle(): void
    {
        $paper = Paper::findOrFail($this->paperId);
        
        // Pastikan status paper menjadi PROCESSING (penting jika ini adalah auto-retry dari Laravel Queue)
        $paper->update(['status' => 'PROCESSING']);

        $fastApiUrl = config('services.fastapi.url');
        $token = config('services.fastapi.token');

        // Catat di tabel ai_jobs bahwa proses dimulai
        $jobLog = DB::table('ai_jobs')->insertGetId([
            'paper_id'   => $paper->id,
            'status'     => 'PROCESSING',
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $filePath = Storage::path($paper->file_path);

        try {
            $expertises = \App\Models\Expertise::pluck('name')->implode(' | ');
            if (empty($expertises)) {
                $expertises = "Computer Science | Medicine | Engineering | Economics | Education | Social Science | Physics | Biology | Other";
            }

            // PANGGIL FASTAPI KAMU MENGGUNAKAN HTTP CLIENT + INTERNAL TOKEN
            $response = Http::timeout(180)
                ->withToken($token)
                ->attach('file', file_get_contents($filePath), basename($filePath))
                ->post("{$fastApiUrl}/api/v1/analyze", [
                    'paper_id'   => $paper->id,
                    'request_id' => (string) Str::uuid(),
                    'expertises' => $expertises,
                ]);

            if ($response->failed()) {
                throw new \Exception("FastAPI Error: " . $response->body());
            }

            $result = $response->json();
            
            if (isset($result['success']) && $result['success'] === false) {
                $errorMsg = $result['error']['message'] ?? 'Unknown AI Error';
                throw new \Exception("AI API Error: " . $errorMsg);
            }
            
            $data = $result['data'];

            // SIMPAN SEMUA DATA DARI FASTAPI KE TABEL-TABEL DATABASE
            DB::transaction(function () use ($paper, $data, $jobLog, $response) {
                // 1. Update Metadata Paper
                $paper->update([
                    'title'            => $data['paper']['title'] ?? $paper->title,
                    'abstract'         => $data['paper']['abstract'] ?? null,
                    'publication_year' => $data['paper']['publication_year'] ?? null,
                    'journal'          => $data['paper']['journal'] ?? null,
                    'doi'              => $data['paper']['doi'] ?? null,
                    'status'           => 'ANALYZED', // SUKSES!
                ]);

                // 2. Simpan Penulis
                if (!empty($data['authors'])) {
                    foreach ($data['authors'] as $author) {
                        DB::table('paper_authors')->insert([
                            'paper_id'   => $paper->id,
                            'name'       => $author['name'],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }

                // 3. Simpan Analisis Umum
                DB::table('paper_analyses')->insert([
                    'paper_id'        => $paper->id,
                    'research_domain' => $data['paper_analyses']['research_domain'],
                    'research_type'   => $data['paper_analyses']['research_type'],
                    'key_findings'    => json_encode($data['paper_analyses']['key_findings']),
                    'strengths'       => json_encode($data['paper_analyses']['strengths']),
                    'weaknesses'      => json_encode($data['paper_analyses']['weaknesses']),
                    'keywords'        => json_encode($data['paper_analyses']['keywords']),
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);

                // 4. Simpan Struktur 10 Elemen
                foreach ($data['paper_sections'] as $sec) {
                    DB::table('paper_sections')->insert([
                        'paper_id'     => $paper->id,
                        'section_name' => $sec['section_name'],
                        'is_found'     => $sec['is_found'],
                        'summary'      => $sec['summary'],
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ]);
                }

                // 5. Simpan Rapor Nilai & Alasan
                $scores = $data['paper_scores'];
                DB::table('paper_scores')->insert([
                    'paper_id'               => $paper->id,
                    'overall_score'          => $scores['overall_score'],
                    'methodology_score'      => $scores['methodology_score'],
                    'methodology_reason'     => $scores['methodology_reason'],
                    'novelty_score'          => $scores['novelty_score'],
                    'novelty_reason'         => $scores['novelty_reason'],
                    'clarity_score'          => $scores['clarity_score'],
                    'clarity_reason'         => $scores['clarity_reason'],
                    'evidence_score'         => $scores['evidence_score'],
                    'evidence_reason'        => $scores['evidence_reason'],
                    'reproducibility_score'  => $scores['reproducibility_score'],
                    'reproducibility_reason' => $scores['reproducibility_reason'],
                    'writing_score'          => $scores['writing_score'],
                    'writing_reason'         => $scores['writing_reason'],
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ]);

                // 6. Simpan Kelemahan & Risiko
                foreach ($data['paper_findings'] as $finding) {
                    DB::table('paper_findings')->insert([
                        'paper_id'    => $paper->id,
                        'severity'    => $finding['severity'],
                        'category'    => $finding['category'],
                        'finding'     => $finding['finding'],
                        'explanation' => $finding['explanation'],
                        'page'        => $finding['page'] ?? null,
                        'section'     => $finding['section'] ?? null,
                        'confidence'  => $finding['confidence'] ?? null,
                        'evidence'    => $finding['evidence'],
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }

                // 7. Simpan Analisis Sitasi
                $refs = $data['paper_references'];
                DB::table('paper_references')->insert([
                    'paper_id'          => $paper->id,
                    'total_references'  => $refs['total_references'],
                    'recent_references' => $refs['recent_references'],
                    'old_references'    => $refs['old_references'],
                    'potential_issues'  => json_encode($refs['potential_issues']),
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]);

                // Update log ai_jobs menjadi COMPLETED
                DB::table('ai_jobs')->where('id', $jobLog)->update([
                    'status'       => 'COMPLETED',
                    'completed_at' => now(),
                ]);

                // Catat di audit_logs
                DB::table('audit_logs')->insert([
                    'user_id'    => $paper->uploaded_by,
                    'action'     => 'FINISH_AI_ANALYSIS',
                    'paper_id'   => $paper->id,
                    'created_at' => now(),
                ]);
            });

        } catch (\Exception $e) {
            // JIKA GAGAL SETELAH RETRY: Ubah status jadi FAILED
            $paper->update(['status' => 'FAILED']);
            
            DB::table('ai_jobs')->where('id', $jobLog)->update([
                'status'        => 'FAILED',
                'error_message' => $e->getMessage(),
                'completed_at'  => now(),
            ]);

            throw $e; // Lempar agar Laravel Queue mencatat failed_jobs
        }
    }
}
