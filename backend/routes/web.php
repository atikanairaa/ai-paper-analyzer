<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Halaman Publik ───────────────────────────────────────────────────────────
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

// ─── Halaman Terproteksi (Butuh Login) ───────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard utama: arahkan ke halaman sesuai role
    Route::get('/dashboard', function () {
        $user = auth()->user();

        if ($user->hasRole('admin')) {
            return Inertia::render('AdminDashboard');
        }

        if ($user->hasRole('reviewer')) {
            return Inertia::render('Reviewer');
        }

        // Default: peneliti
        return Inertia::render('Upload');
    })->name('dashboard');

    // ── Rute halaman Peneliti ──
    Route::get('/upload',  fn () => Inertia::render('Upload'))->name('upload');
    Route::get('/detail',  fn () => Inertia::render('PaperDetail'))->name('paper.detail');
    Route::get('/compare', fn () => Inertia::render('Compare'))->name('compare');

    // ── Rute halaman Reviewer ──
    Route::get('/reviewer', fn () => Inertia::render('Reviewer'))->name('reviewer');

    // ── Rute halaman Admin ──
    Route::get('/admin', fn () => Inertia::render('AdminDashboard'))->name('admin.dashboard');

    // ── Profile (bawaan Breeze) ──
    Route::get('/profile',    [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile',  [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
