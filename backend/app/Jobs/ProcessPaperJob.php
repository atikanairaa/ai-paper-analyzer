<?php

namespace App\Jobs;

use App\Models\Paper;
use App\Models\AiJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessPaperJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120;

    protected $paper;
    protected $aiJobId;

    /**
     * Create a new job instance.
     */
    public function __construct(Paper $paper)
    {
        $this->paper = $paper;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Record AI Job start
        $aiJob = AiJob::create([
            'paper_id' => $this->paper->id,
            'status' => 'PROCESSING',
            'started_at' => now(),
            'retry_count' => $this->attempts(),
        ]);
        $this->aiJobId = $aiJob->id;
        
        \App\Helpers\AuditLogger::log('AI started', $this->paper->id);

        $secret = env('INTERNAL_SERVICE_TOKEN');
        $fastApiUrl = env('FASTAPI_URL', 'http://localhost:8000') . '/api/analyze';

        // Send to FastAPI
        $response = Http::withToken($secret)
            ->timeout(115) // Slightly less than queue timeout
            ->post($fastApiUrl, [
                'paper_id' => $this->paper->id,
                'file_path' => $this->paper->file_path,
            ]);

        // Record request & response for auditing (optional based on ai_requests/ai_responses tables)
        $aiRequest = $aiJob->requests()->create([
            'endpoint' => $fastApiUrl,
            'payload' => json_encode(['paper_id' => $this->paper->id, 'file_path' => $this->paper->file_path]),
        ]);

        if ($response->successful()) {
            $data = $response->json();

            // Save to paper_analyses
            if (isset($data['analysis'])) {
                $this->paper->analyses()->create([
                    'research_domain' => $data['analysis']['research_domain'] ?? 'Unknown',
                    'research_type' => $data['analysis']['research_type'] ?? 'Unknown',
                    'key_findings' => json_encode($data['analysis']['key_findings'] ?? []),
                    'strengths' => json_encode($data['analysis']['strengths'] ?? []),
                    'weaknesses' => json_encode($data['analysis']['weaknesses'] ?? []),
                    'keywords' => json_encode($data['analysis']['keywords'] ?? []),
                ]);
            }

            // Save to paper_scores
            if (isset($data['scores'])) {
                $this->paper->scores()->create([
                    'overall_score' => $data['scores']['overall_score'] ?? 0,
                    'methodology_score' => $data['scores']['methodology_score'] ?? 0,
                    'methodology_reason' => $data['scores']['methodology_reason'] ?? '',
                    'novelty_score' => $data['scores']['novelty_score'] ?? 0,
                    'novelty_reason' => $data['scores']['novelty_reason'] ?? '',
                    'clarity_score' => $data['scores']['clarity_score'] ?? 0,
                    'clarity_reason' => $data['scores']['clarity_reason'] ?? '',
                    'evidence_score' => $data['scores']['evidence_score'] ?? 0,
                    'evidence_reason' => $data['scores']['evidence_reason'] ?? '',
                    'reproducibility_score' => $data['scores']['reproducibility_score'] ?? 0,
                    'reproducibility_reason' => $data['scores']['reproducibility_reason'] ?? '',
                    'writing_score' => $data['scores']['writing_score'] ?? 0,
                    'writing_reason' => $data['scores']['writing_reason'] ?? '',
                ]);
            }

            // Save to paper_findings
            if (isset($data['findings']) && is_array($data['findings'])) {
                foreach ($data['findings'] as $finding) {
                    $this->paper->findings()->create([
                        'severity' => $finding['severity'] ?? 'LOW',
                        'category' => $finding['category'] ?? 'General',
                        'finding' => $finding['finding'] ?? '',
                        'explanation' => $finding['explanation'] ?? '',
                        'evidence' => $finding['evidence'] ?? '',
                    ]);
                }
            }

            $this->paper->update(['status' => 'ANALYZED']);
            
            \App\Helpers\AuditLogger::log('AI completed', $this->paper->id);
            
            $aiJob->update([
                'status' => 'COMPLETED',
                'completed_at' => now(),
                'duration_seconds' => now()->diffInSeconds($aiJob->started_at),
            ]);

            $aiRequest->responses()->create([
                'status_code' => $response->status(),
                'raw_response' => $response->body(),
            ]);

        } else {
            // Throw exception to trigger retry
            $aiRequest->responses()->create([
                'status_code' => $response->status(),
                'raw_response' => $response->body(),
            ]);
            throw new \Exception('FastAPI analysis failed: ' . $response->body());
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Throwable $exception): void
    {
        $this->paper->update(['status' => 'FAILED']);

        if ($this->aiJobId) {
            $aiJob = AiJob::find($this->aiJobId);
            if ($aiJob) {
                $aiJob->update([
                    'status' => 'FAILED',
                    'error_message' => $exception->getMessage(),
                    'completed_at' => now(),
                    'duration_seconds' => now()->diffInSeconds($aiJob->started_at),
                ]);
            }
        } else {
            AiJob::create([
                'paper_id' => $this->paper->id,
                'status' => 'FAILED',
                'error_message' => $exception->getMessage(),
                'started_at' => now(),
                'completed_at' => now(),
                'retry_count' => $this->attempts(),
            ]);
        }
    }
}
