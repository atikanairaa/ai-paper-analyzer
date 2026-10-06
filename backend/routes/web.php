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
            $defaultTemplate = "<div style=\"font-family: 'Times New Roman', Times, serif; color: #1c1917; line-height: 1.6;\">     <div style=\"display:flex; justify-content:space-between; border-bottom: 2px solid #881337; padding-bottom: 8px; font-size: 11px; color: #881337; margin-bottom: 24px;\">         <span><strong>Transactions on AI &amp; Software Engineering</strong> | e-ISSN: 2985-XXXX</span>         <span>Vol. 1, No. 1 ({article.year}) | pp. 1-10</span>     </div>      <div style=\"text-align:center; margin-bottom: 30px; background-color: #fff1f2; padding: 20px; border-radius: 8px; border: 1px dashed #fda4af;\">         <h4 style=\"margin: 0 0 5px 0; color: #881337; font-size: 18px; font-weight: 800; letter-spacing: 2px;\">? AI RESEARCH PAPER PUBLISHING ?</h4>         <p style=\"margin: 0; font-size: 11px; color: #9f1239; letter-spacing: 1px; text-transform: uppercase; font-weight: bold;\">International Journal of Computational Intelligence &amp; Software</p>     </div>      <h1 style=\"text-align:center; font-size: 22px; color: #881337; margin-bottom: 15px; font-weight: 900; line-height: 1.3;\">         {article.title}     </h1>      <p style=\"text-align:center; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #1c1917;\">         {article.author}     </p>     <p style=\"text-align:center; font-size: 11px; color: #57534e; margin-bottom: 4px; font-style: italic;\">         1 Department of Computer Science, Faculty of Engineering, University Name, City, Country     </p>     <p style=\"text-align:center; font-size: 11px; color: #e11d48; font-style: italic; margin-bottom: 25px;\">         * Penulis Korespondensi: <u>email@university.ac.id</u>     </p>      <figure class=\"table\">         <table style=\"width:100%; border: 1px solid #9f1239; border-collapse: collapse;\">             <tbody>                 <tr style=\"background-color: #fff1f2;\">                     <td style=\"width:15%; font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Received:</td>                     <td style=\"width:35%; color: #57534e; border: 1px solid #fda4af; padding: 8px;\">[Diisi oleh Editor]</td>                     <td style=\"width:15%; font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Revised:</td>                     <td style=\"width:35%; color: #57534e; border: 1px solid #fda4af; padding: 8px;\">[Diisi oleh Editor]</td>                 </tr>                 <tr style=\"background-color: #fff1f2;\">                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Accepted:</td>                     <td style=\"color: #57534e; border: 1px solid #fda4af; padding: 8px;\">[Diisi oleh Editor]</td>                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Published:</td>                     <td style=\"color: #57534e; border: 1px solid #fda4af; padding: 8px;\">[Diisi oleh Editor]</td>                 </tr>                 <tr>                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px; background-color: #fff1f2;\">How to cite:</td>                     <td colspan=\"3\" style=\"border: 1px solid #fda4af; padding: 8px; font-size: 10px; color: #57534e;\">                         [Diisi oleh Editor] {article.author}. (2026). {article.title}. Transactions on AI &amp; Software Engineering, 1(1), 1-10.                     </td>                 </tr>             </tbody>         </table>     </figure>      <div style=\"border: 2px solid #881337; background-color: #fff1f2; padding: 20px; margin: 30px 0; border-radius: 8px;\">         <p style=\"margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #881337; text-align: center; text-transform: uppercase;\">             ABSTRAK / ABSTRACT         </p>         <p style=\"margin: 0 0 15px 0; font-size: 11px; text-align: justify; color: #1c1917;\">             {article.abstract}         </p>         <p style=\"margin: 0; font-size: 11px; color: #1c1917;\">             <strong style=\"color: #881337;\">Keywords:</strong> {article.keywords}         </p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">1. Introduction</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.introduction}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">2. Methods</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.methodology}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">3. Results and Discussion</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.results}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">4. Conclusion</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.conclusion}</p>     </div> </div>";
            $template = \Illuminate\Support\Facades\Storage::exists('journal_template.html') 
                ? \Illuminate\Support\Facades\Storage::get('journal_template.html') 
                : $defaultTemplate;
            return Inertia::render('Admin/JournalTemplate', ['initialTemplate' => $template]);
        })->name('admin.journal-template');

        Route::post('/journal-template', function (\Illuminate\Http\Request $request) {
            $request->validate(['template' => 'required|string']);
            \Illuminate\Support\Facades\Storage::put('journal_template.html', $request->template);
            return redirect()->back();
        })->name('admin.journal-template.save');
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
Route::get('/storage/papers/{filename}', function ($filename) {
    $path = storage_path('app/papers/' . $filename);
    if (!file_exists($path)) {
        $path = storage_path('app/private/papers/' . $filename);
    }
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
})->name('serve.papers');

Route::get('/katalog', [\App\Http\Controllers\GuestPaperController::class, 'index'])->name('guest.catalog');
Route::get('/katalog/{id}', [\App\Http\Controllers\GuestPaperController::class, 'show'])->name('guest.catalog.show');
