<?php

namespace App\Http\Controllers;

use App\Models\AiJob;
use App\Models\Paper;
use App\Jobs\ProcessPaperJob;
use Illuminate\Http\Request;

class AdminJobController extends Controller
{
    public function retry($id)
    {
        $job = AiJob::findOrFail($id);
        $paper = Paper::findOrFail($job->paper_id);

        if ($job->status !== 'FAILED' && $job->status !== 'PENDING') {
            return response()->json(['message' => 'Job cannot be retried in its current state'], 400);
        }

        // Increment retry count manually if we want to track overall manual retries, or just let the job reset it
        $job->update(['status' => 'PENDING', 'retry_count' => $job->retry_count + 1]);
        $paper->update(['status' => 'PROCESSING']);

        \App\Helpers\AuditLogger::log('Admin retry', $paper->id);

        // Dispatch job again
        ProcessPaperJob::dispatch($paper);

        return response()->json(['message' => 'Job retried successfully', 'job' => $job]);
    }
}
