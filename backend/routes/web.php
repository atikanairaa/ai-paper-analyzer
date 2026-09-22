<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Halaman Publik ───────────────────────────────────────────────────────────
Route::get('/', function () {
    return redirect()->route('login');
});

// ─── Halaman Terproteksi (Butuh Login) ───────────────────────────────────────
Route::middleware(['auth'])->group(function () {

    // Dashboard utama: arahkan ke halaman sesuai role
    Route::get('/dashboard', function () {
        $user = auth()->user();

        if ($user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->hasRole('reviewer')) {
            return redirect()->route('reviewer');
        }

        // Default: peneliti
        return redirect()->route('upload');
    })->name('dashboard');

    // ── Rute halaman Peneliti ──
    Route::get('/upload',  fn () => Inertia::render('Upload'))->name('upload');
    Route::get('/upload/{id}', [\App\Http\Controllers\PaperController::class, 'showWeb'])->name('upload.detail');
    Route::get('/detail',  fn () => Inertia::render('MyPapers'))->name('paper.detail');
    Route::get('/detail/{id}', [\App\Http\Controllers\PaperController::class, 'showWeb'])->name('paper.detail.show');
    Route::get('/papers/{id}/export-review', [\App\Http\Controllers\PaperController::class, 'exportReview'])->name('paper.export-review');
    Route::get('/compare', [\App\Http\Controllers\PaperController::class, 'compareView'])->name('compare');

    // ── Rute halaman Reviewer ──
    Route::get('/reviewer', [\App\Http\Controllers\ReviewerDashboardController::class, 'index'])->name('reviewer');

    // ── Rute halaman Admin ──
    Route::prefix('admin')->middleware(['role:admin'])->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');
        Route::get('/papers', [\App\Http\Controllers\Admin\PaperManagementController::class, 'index'])->name('admin.papers');
        Route::get('/assign-paper', [\App\Http\Controllers\Admin\ReviewerManagementController::class, 'assignIndex'])->name('admin.assign');
        Route::get('/audit', fn () => Inertia::render('AdminAuditLog'))->name('admin.audit');
        Route::get('/users', [\App\Http\Controllers\Admin\UserManagementController::class, 'index'])->name('admin.users');
        Route::post('/users', [\App\Http\Controllers\Admin\UserManagementController::class, 'store'])->name('admin.users.store');
        Route::put('/users/{id}', [\App\Http\Controllers\Admin\UserManagementController::class, 'update'])->name('admin.users.update');
        Route::delete('/users/{id}', [\App\Http\Controllers\Admin\UserManagementController::class, 'destroy'])->name('admin.users.destroy');
        Route::get('/expertises', [\App\Http\Controllers\Admin\ExpertiseManagementController::class, 'index'])->name('admin.expertises');
    });

    // ── Profile (bawaan Breeze) ──
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

    // ── Notifikasi ──
    Route::post('/notifications/mark-read', function (Illuminate\Http\Request $request) {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    })->name('notifications.markRead');
});

require __DIR__ . '/auth.php';
