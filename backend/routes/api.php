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
