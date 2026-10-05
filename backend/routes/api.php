<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Paper;
use Illuminate\Support\Facades\Log;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('papers')->group(function () {
        Route::get('/', [\App\Http\Controllers\PaperController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\PaperController::class, 'upload']);
        Route::get('/{id}', [\App\Http\Controllers\PaperController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\PaperController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\PaperController::class, 'destroy']);
        Route::post('/{id}/qa', [\App\Http\Controllers\PaperController::class, 'qa']);
        Route::post('/compare', [\App\Http\Controllers\PaperController::class, 'compareProcess']);
        Route::post('/{id}/submit', [\App\Http\Controllers\PaperController::class, 'submitToJournal']);
        Route::post('/{id}/withdraw', [\App\Http\Controllers\PaperController::class, 'withdrawSubmission']);
        
        Route::post('/{paperId}/reviews', [\App\Http\Controllers\ReviewController::class, 'store']);
    });

    Route::prefix('admin')->group(function () {
        Route::post('/jobs/{id}/retry', [\App\Http\Controllers\AdminJobController::class, 'retry']);
        Route::get('/audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index']);


        Route::post('/reviewers/{paperId}/recommend', [\App\Http\Controllers\Admin\ReviewerManagementController::class, 'recommend']);
        Route::post('/reviewers/{paperId}/orcid', [\App\Http\Controllers\Admin\ReviewerManagementController::class, 'orcidRecommend']);
        Route::post('/reviewers/assign', [\App\Http\Controllers\Admin\ReviewerManagementController::class, 'assign']);

        Route::post('/expertises', [\App\Http\Controllers\Admin\ExpertiseController::class, 'store']);
        Route::put('/expertises/{id}', [\App\Http\Controllers\Admin\ExpertiseController::class, 'update']);
        Route::delete('/expertises/{id}', [\App\Http\Controllers\Admin\ExpertiseController::class, 'destroy']);
    });
});



// ====================================================
// INTERNAL ROUTE: Untuk Python AI Service (Tanpa Sanctum)
// Dipanggil oleh Python untuk "GET kriteria yang switch/checklist-nya true"
// ====================================================
Route::get('/internal/criteria', function (Request $request) {
    $endpoint = $request->query('endpoint', 'analyze');
    
    // Pastikan input aman
    $validEndpoints = ['analyze', 'review', 'qa'];
    if (!in_array($endpoint, $validEndpoints)) {
        return response()->json(['error' => 'Endpoint tidak valid'], 400);
    }

    // Hanya ambil kriteria yang 'is_active' = true, DAN endpoint terkait = true
    $columnName = 'is_' . $endpoint;
    $criteria = \App\Models\EvaluationCriterion::where('is_active', true)
        ->where($columnName, true)
        ->get(['name', 'instruction', 'weight']);

    return response()->json([
        'success' => true,
        'data' => $criteria
    ]);
});

// ====================================================
// WEBHOOK LISTENER DOKU — Bebas auth/CSRF, dipanggil oleh server DOKU
// ====================================================
Route::post('/payment/doku-webhook', function (Request $request) {
    // Log setiap request masuk untuk debugging
    Log::info('[DOKU Webhook] Request diterima', [
        'ip'      => $request->ip(),
        'headers' => $request->headers->all(),
        'body'    => $request->all(),
    ]);

    $payload           = $request->all();
    $invoiceNumber     = $payload['order']['invoice_number'] ?? null;
    $transactionStatus = $payload['transaction']['status'] ?? null;

    Log::info('[DOKU Webhook] Parsed payload', [
        'invoice_number'     => $invoiceNumber,
        'transaction_status' => $transactionStatus,
    ]);

    // Jika status pembayaran SUCCESS
    if (strtoupper((string) $transactionStatus) === 'SUCCESS' && $invoiceNumber) {
        preg_match('/INV-APC-(\d+)-/', $invoiceNumber, $matches);
        $paperId = $matches[1] ?? null;

        if ($paperId) {
            $paper = Paper::find($paperId);
            if ($paper) {
                // Tandai LUNAS — researcher masih perlu klik "Publikasikan"
                $paper->update(['payment_status' => 'PAID']);
                Log::info("[DOKU Webhook] Paper #{$paperId} berhasil ditandai PAID.");
            } else {
                Log::warning("[DOKU Webhook] Paper #{$paperId} tidak ditemukan di database.");
            }
        } else {
            Log::warning('[DOKU Webhook] Tidak bisa ekstrak paperId dari invoice: ' . $invoiceNumber);
        }
    } else {
        Log::info('[DOKU Webhook] Status bukan SUCCESS, tidak ada perubahan.', [
            'status'  => $transactionStatus,
            'invoice' => $invoiceNumber,
        ]);
    }

    // Wajib balas HTTP 200 agar DOKU tidak retry
    return response()->json(['message' => 'OK'], 200);

})->withoutMiddleware([
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \Illuminate\Auth\Middleware\Authenticate::class,
]);
