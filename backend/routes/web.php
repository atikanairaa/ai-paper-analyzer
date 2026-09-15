<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Rute untuk Admin 
// Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
//     Route::get('/dashboard', [AdminController::class, 'dashboard']);
// });

// Rute untuk Researcher saja
// Route::middleware(['auth', 'role:researcher'])->prefix('researcher')->group(function () {
//     Route::get('/my-papers', [PaperController::class, 'index']);
// });

Route::get('/upload', fn() => Inertia::render('Upload'));
Route::get('/detail', fn() => Inertia::render('PaperDetail'));
Route::get('/compare', fn() => Inertia::render('Compare'));

require __DIR__ . '/auth.php';

