<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('papers')->group(function () {
    Route::get('/', [\App\Http\Controllers\PaperController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\PaperController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\PaperController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\PaperController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\PaperController::class, 'destroy']);
    
    Route::post('/{paperId}/reviews', [\App\Http\Controllers\ReviewController::class, 'store']);
});

Route::prefix('admin/jobs')->group(function () {
    Route::post('/{id}/retry', [\App\Http\Controllers\AdminJobController::class, 'retry']);
});
