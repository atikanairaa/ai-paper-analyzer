<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paper;
use Inertia\Inertia;

class GuestPaperController extends Controller
{
    /**
     * Mengambil semua paper yang status = 'PUBLISHED' untuk ditampilkan ke katalog publik.
     */
    public function index()
    {
        $papers = Paper::with('uploader')
            ->where('submission_status', 'PUBLISHED')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return Inertia::render('Guest/Catalog', [
            'papers' => $papers
        ]);
    }

    /**
     * Cek status paper. Jika OPEN_ACCESS, berikan akses link PDF. Jika CLOSED_ACCESS, kirimkan sinyal bahwa naskah terkunci (paywall).
     */
    public function show($id)
    {
        $paper = Paper::with('uploader')->where('submission_status', 'PUBLISHED')->findOrFail($id);
        
        $isLocked = $paper->access_type === 'CLOSED_ACCESS';

        return Inertia::render('Guest/PaperDetail', [
            'paper' => $paper,
            'isLocked' => $isLocked,
            'price' => $paper->price
        ]);
    }
}
