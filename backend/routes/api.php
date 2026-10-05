<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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
// PUBLIC ROUTE: DOKU Payment Webhook (Server-to-Server)
// Tidak memerlukan auth karena dipanggil langsung oleh
// server DOKU. Validasi keamanan via Signature di controller.
// ====================================================
Route::post('/payment/doku/webhook', [\App\Http\Controllers\PaymentController::class, 'handleWebhook']);

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
