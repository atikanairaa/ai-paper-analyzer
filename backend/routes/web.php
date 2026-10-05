<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// â”€â”€â”€ Halaman Publik â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Route::get('/', function () {
    return redirect()->route('login');
});

// â”€â”€â”€ Halaman Terproteksi (Butuh Login) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ Rute halaman Peneliti â”€â”€
    Route::get('/upload',  fn () => Inertia::render('Upload'))->name('upload');
    Route::get('/upload/{id}', [\App\Http\Controllers\PaperController::class, 'showWeb'])->name('upload.detail');
    Route::get('/detail',  fn () => Inertia::render('MyPapers'))->name('paper.detail');
    Route::get('/detail/{id}', [\App\Http\Controllers\PaperController::class, 'showWeb'])->name('paper.detail.show');
    Route::get('/papers/{id}/export-review', [\App\Http\Controllers\PaperController::class, 'exportReview'])->name('paper.export-review');
    Route::get('/papers/{id}/pdf-view', [\App\Http\Controllers\PaperController::class, 'viewPdf'])->name('papers.pdf.view');
    Route::get('/papers/{id}/watermark-pdf', [\App\Http\Controllers\PaperController::class, 'viewWatermarkedPdf'])->name('papers.pdf.watermark');
    Route::get('/compare', [\App\Http\Controllers\PaperController::class, 'compareView'])->name('compare');
    Route::post('/papers/{paper}/generate-payment', [\App\Http\Controllers\PaymentController::class, 'generateInvoice'])->name('payment.generate');
    Route::post('/papers/{paper}/publish', [\App\Http\Controllers\PaperController::class, 'publishPaper'])->name('paper.publish');

    // â”€â”€ [DEV ONLY] Simulasi konfirmasi pembayaran DOKU tanpa Ngrok â”€â”€
    Route::get('/simulasi-lunas/{id}', function ($id) {
        $paper = \App\Models\Paper::findOrFail($id);
        $paper->update(['payment_status' => 'PAID']);
        return redirect("/detail/{$id}")->with('success', 'Simulasi: Pembayaran DOKU berhasil dikonfirmasi!');
    })->name('payment.simulasi');

    // â”€â”€ Rute halaman Reviewer â”€â”€
    Route::get('/reviewer', [\App\Http\Controllers\ReviewerDashboardController::class, 'index'])->name('reviewer');

    // â”€â”€ Rute halaman Admin â”€â”€
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
        Route::get('/published-papers', [\App\Http\Controllers\Admin\PublishedPapersController::class, 'index'])->name('admin.published-papers');
        Route::get('/prompts', [\App\Http\Controllers\Admin\PromptController::class, 'index'])->name('admin.prompts.index');
        Route::post('/prompts', [\App\Http\Controllers\Admin\PromptController::class, 'store'])->name('admin.prompts.store');
        Route::put('/prompts/{criterion}', [\App\Http\Controllers\Admin\PromptController::class, 'update'])->name('admin.prompts.update');
        Route::delete('/prompts/{criterion}', [\App\Http\Controllers\Admin\PromptController::class, 'destroy'])->name('admin.prompts.destroy');
        
        Route::get('/journal-template', function () {
            return Inertia::render('Admin/JournalTemplate');
        })->name('admin.journal-template');
    });

    // â”€â”€ Profile (bawaan Breeze) â”€â”€
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

    // â”€â”€ Notifikasi â”€â”€
    Route::post('/notifications/mark-read', function (Illuminate\Http\Request $request) {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    })->name('notifications.markRead');
});

Route::post('/papers/{paperId}/reviews', [\App\Http\Controllers\ReviewController::class, 'store'])->name('reviewer.store')->middleware(['auth']);
require __DIR__ . '/auth.php';


// Magic Link (1-Klik Login)
Route::get('/magic-link/reviewer', [\App\Http\Controllers\MagicLinkController::class, 'directAccess'])->name('reviewer.direct-access');


Route::get('/admin/reviewers/recommend-orcid/{paperId}', [\App\Http\Controllers\Admin\ReviewerManagementController::class, 'recommendOrcid'])->name('admin.reviewers.recommend-orcid')->middleware(['auth', 'role:admin']);


Route::post('/papers/{id}/revision', [\App\Http\Controllers\PaperController::class, 'submitRevision'])->name('paper.revision')->middleware(['auth']);




// Katalog Publik
Route::get('/katalog', [\App\Http\Controllers\GuestPaperController::class, 'index'])->name('guest.catalog');
Route::get('/katalog/{id}', [\App\Http\Controllers\GuestPaperController::class, 'show'])->name('guest.catalog.show');
