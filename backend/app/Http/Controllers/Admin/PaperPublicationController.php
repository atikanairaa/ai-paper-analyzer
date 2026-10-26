<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Paper;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Helpers\AuditLogger;
use App\Notifications\PaperPublishedNotification;

class PaperPublicationController extends Controller
{
    /**
     * Tampilkan halaman kelola Publikasi Paper untuk Admin.
     */
    public function index(Request $request)
    {
        $search   = $request->query('search', '');
        $tab      = $request->query('tab', 'ready'); // default: ready
        $targetId = $request->query('paper_id');
        $perPage  = 10;

        // Query dasar berdasar tab: Jika tab 'published', tampilkan arsip naskah yang sudah terbit (PUBLISHED)
        if ($tab === 'published') {
            $query = Paper::with(['authors', 'uploader', 'analyses', 'reviews.reviewer'])
                ->where('submission_status', 'PUBLISHED');
        } else {
            $query = Paper::with(['authors', 'uploader', 'analyses', 'reviews.reviewer'])
                ->whereIn('submission_status', ['ACCEPTED', 'ACCEPT']);
        }

        // Jika ada filter khusus dari klik notifikasi (?paper_id=...)
        if ($targetId) {
            // Prioritaskan paper yang diklik dari notifikasi di paling atas
            $query->orderByRaw("CASE WHEN id = ? THEN 0 ELSE 1 END", [(int)$targetId]);
        }

        // Filter tab
        if ($tab === 'ready') {
            // Siap Diterbitkan: Closed Access ATAU Open Access Lunas (PAID)
            $query->where(function ($q) {
                $q->where('access_type', 'CLOSED_ACCESS')
                  ->orWhere(function ($sub) {
                      $sub->where('access_type', 'OPEN_ACCESS')
                          ->where('payment_status', 'PAID');
                  });
            });
        } elseif ($tab === 'open_access') {
            $query->where('access_type', 'OPEN_ACCESS');
        } elseif ($tab === 'closed_access') {
            $query->where('access_type', 'CLOSED_ACCESS');
        } elseif ($tab === 'unpaid') {
            $query->where('access_type', 'OPEN_ACCESS')
                  ->where(function ($q) {
                      $q->whereNull('payment_status')
                        ->orWhere('payment_status', '!=', 'PAID');
                  });
        }

        // Filter pencarian
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('authors', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('uploader', function ($q3) use ($search) {
                      $q3->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $papers = $query->orderBy('updated_at', 'desc')->paginate($perPage)->withQueryString();

        // Hitung statistik
        $totalReady = Paper::whereIn('submission_status', ['ACCEPTED', 'ACCEPT'])
            ->where(function ($q) {
                $q->where('access_type', 'CLOSED_ACCESS')
                  ->orWhere(function ($sub) {
                      $sub->where('access_type', 'OPEN_ACCESS')
                          ->where('payment_status', 'PAID');
                  });
            })->count();

        $totalUnpaid = Paper::whereIn('submission_status', ['ACCEPTED', 'ACCEPT'])
            ->where('access_type', 'OPEN_ACCESS')
            ->where(function ($q) {
                $q->whereNull('payment_status')
                  ->orWhere('payment_status', '!=', 'PAID');
            })->count();

        $totalPublished = Paper::where('submission_status', 'PUBLISHED')->count();

        return Inertia::render('Admin/PaperPublications', [
            'papers' => $papers,
            'stats'  => [
                'total_ready'     => $totalReady,
                'total_unpaid'    => $totalUnpaid,
                'total_published' => $totalPublished,
            ],
            'filters' => [
                'search'   => $search,
                'tab'      => $tab,
                'paper_id' => $targetId ? (int)$targetId : null,
            ],
        ]);
    }

    /**
     * Terbitkan paper ke katalog publik.
     */
    public function publish(Request $request, Paper $paper)
    {
        // 1. Otorisasi Admin
        if (!auth()->user()->hasRole('admin')) {
            return redirect()->back()->with('error', 'Akses ditolak. Hanya Admin yang berwenang menerbitkan paper.');
        }

        // 2. Validasi status
        if ($paper->submission_status !== 'ACCEPTED' && $paper->submission_status !== 'ACCEPT') {
            return redirect()->back()->with('error', 'Paper belum disetujui (ACCEPTED) oleh reviewer.');
        }

        // 3. Validasi pembayaran jika Open Access
        if ($paper->access_type === 'OPEN_ACCESS' && ($paper->payment_status ?? 'UNPAID') !== 'PAID') {
            return redirect()->back()->with('error', 'Paper Open Access belum diselesaikan pembayarannya oleh peneliti.');
        }

        // 4. Update status ke PUBLISHED dan set tahun terbit jurnal (tahun saat ini)
        $paper->update([
            'submission_status' => 'PUBLISHED',
            'publication_year'  => (int)date('Y'),
        ]);

        AuditLogger::log('Paper diterbitkan ke katalog jurnal publik oleh Admin', $paper->id);

        // 5. Kirim notifikasi ke Peneliti
        if ($paper->uploader) {
            $paper->uploader->notify(new PaperPublishedNotification($paper->id, $paper->title));
        }

        return redirect()->back()->with('success', "Naskah \"{$paper->title}\" berhasil dipublikasikan ke katalog jurnal!");
    }
}
