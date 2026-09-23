<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Paper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MagicLinkController extends Controller
{
    /**
     * Handle the Magic Link for Reviewers.
     * URL must be signed and not expired.
     */
    public function directAccess(Request $request)
    {
        if (!$request->hasValidSignature()) {
            abort(401, 'Link ini tidak valid atau sudah kedaluwarsa.');
        }

        $reviewerEmail = $request->query('reviewer_email');
        $paperId = $request->query('paper_id');

        $user = User::where('email', $reviewerEmail)->first();

        if (!$user) {
            abort(404, 'Akun Reviewer tidak ditemukan.');
        }

        // Login automatically without password
        Auth::login($user);

        // Redirect to the assigned paper detail
        return redirect()->route('paper.detail.show', ['id' => $paperId])
            ->with('status', 'Berhasil login secara otomatis melalui Magic Link.');
    }
}
