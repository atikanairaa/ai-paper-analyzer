<?php

namespace App\Http\Controllers;

use App\Models\Paper;
use App\Models\PaperAuthor;
use App\Jobs\ProcessPaperJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class PaperController extends Controller
{
    public function index()
    {
        $userId = auth()->id();
        $query = Paper::with('authors')->orderBy('id', 'desc');
        
        if ($userId) {
            $query->where('uploaded_by', $userId);
        }
        
        $papers = $query->get();
        return response()->json($papers);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:pdf|max:20480', // Maks 20MB
            'is_submission' => 'nullable|boolean',
        ]);

        // 1. Simpan file PDF fisik ke storage
        $path = $request->file('file')->store('papers');

        // 2. Buat data awal paper dengan status PROCESSING
        $paper = Paper::create([
            'uploaded_by'   => auth()->id() ?? 1, // ID user yang login
            'title'         => $request->file('file')->getClientOriginalName(),
            'file_path'     => $path,
            'status'        => 'PROCESSING',
            'is_submission' => $request->boolean('is_submission', false),
        ]);

        // 3. Catat audit log
        DB::table('audit_logs')->insert([
            'user_id'    => auth()->id() ?? 1,
            'action'     => 'UPLOAD_PAPER',
            'paper_id'   => $paper->id,
            'created_at' => now(),
        ]);

        // 4. LEMPAR KE QUEUE (Async Background Job)!
        \App\Jobs\AnalyzePaperJob::dispatch($paper->id);

        // 5. LANGSUNG RESPONS KE FRONTEND (Sesuai Brief Halaman 6!)
        return response()->json([
            'status'   => 'processing',
            'paper_id' => $paper->id,
            'message'  => 'Paper berhasil diunggah dan sedang dianalisis oleh AI.',
        ], 202);
    }

    public function show($id)
    {
        $paper = Paper::with(['authors', 'analyses', 'scores', 'findings'])->findOrFail($id);
        return response()->json($paper);
    }

    public function showWeb($id)
    {
        $paper = Paper::with(['authors', 'analyses', 'scores', 'findings', 'sections', 'references', 'latestJob', 'reviews.reviewer'])->findOrFail($id);
        
        if (auth()->user() && auth()->user()->hasRole('reviewer')) {
            return \Inertia\Inertia::render('ReviewDetail', ['paper' => $paper]);
        }

        return \Inertia\Inertia::render('PaperDetail', ['paper' => $paper]);
    }

    public function exportReview($id)
    {
        $paper = Paper::findOrFail($id);
        $review = \App\Models\Review::with('reviewer')->where('paper_id', $id)->first();
        return view('export-review', compact('paper', 'review'));
    }

    public function update(Request $request, $id)
    {
        $paper = Paper::findOrFail($id);
        
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'authors' => 'sometimes|array',
            'authors.*.name' => 'required_with:authors|string'
        ]);

        if ($request->has('title')) {
            $paper->update(['title' => $request->title]);
        }

        if ($request->has('authors')) {
            // Delete old authors and insert new ones
            $paper->authors()->delete();
            foreach ($request->authors as $author) {
                $paper->authors()->create(['name' => $author['name']]);
            }
        }

        return response()->json($paper->load('authors'));
    }

    public function destroy($id)
    {
        $paper = Paper::findOrFail($id);
        
        if (Storage::exists($paper->file_path)) {
            Storage::delete($paper->file_path);
        }
        
        \App\Helpers\AuditLogger::log('Delete paper', $paper->id);
        
        $paper->delete();

        return response()->json(['message' => 'Paper deleted']);
    }

    public function qa(Request $request, $id)
    {
        $request->validate([
            'question' => 'required|string',
        ]);

        $paper = Paper::findOrFail($id);
        $filePath = Storage::path($paper->file_path);
        
        $fastApiUrl = config('services.fastapi.url');
        $token = config('services.fastapi.token');

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(180)
                ->withToken($token)
                ->attach('file', file_get_contents($filePath), basename($filePath))
                ->post("{$fastApiUrl}/api/v1/qa", [
                    'paper_id' => $paper->id,
                    'question' => $request->question,
                    'request_id' => (string) \Illuminate\Support\Str::uuid(),
                ]);

            if ($response->failed()) {
                return response()->json(['error' => 'Gagal menghubungi AI Server'], 500);
            }

            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id() ?? 1,
                'action' => 'QA_ANALYSIS',
                'paper_id' => $paper->id,
                'created_at' => now(),
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function submitToJournal($id)
    {
        $paper = Paper::where('uploaded_by', auth()->id())->findOrFail($id);
        
        if ($paper->status !== 'ANALYZED' || !$paper->is_submission) {
            return response()->json(['error' => 'Paper tidak memenuhi syarat untuk disubmit.'], 400);
        }

        $paper->update(['submission_status' => 'SUBMITTED']);

        \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
            'user_id' => auth()->id(),
            'action' => 'SUBMIT_TO_JOURNAL',
            'paper_id' => $paper->id,
            'created_at' => now(),
        ]);

        $admins = \App\Models\User::role('admin')->get();
        \Illuminate\Support\Facades\Notification::send($admins, new \App\Notifications\JournalSubmittedNotification($paper->id, $paper->title, auth()->user()->name));

        return response()->json(['message' => 'Paper berhasil disubmit ke Jurnal', 'paper' => $paper]);
    }

    public function withdrawSubmission($id)
    {
        $paper = Paper::where('uploaded_by', auth()->id())->findOrFail($id);
        
        if ($paper->submission_status !== 'DRAFT') {
            return response()->json(['error' => 'Hanya paper DRAFT yang dapat ditarik.'], 400);
        }

        $paper->update([
            'is_submission' => false,
            'submission_status' => 'DRAFT'
        ]);

        \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
            'user_id' => auth()->id(),
            'action' => 'WITHDRAW_SUBMISSION',
            'paper_id' => $paper->id,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Paper berhasil ditarik untuk studi mandiri', 'paper' => $paper]);
    }

    public function compareView()
    {
        $papers = Paper::where('uploaded_by', auth()->id())
            ->where('status', 'ANALYZED')
            ->orderBy('id', 'desc')
            ->get();
            
        return \Inertia\Inertia::render('Compare', [
            'papers' => $papers
        ]);
    }

    public function compareProcess(Request $request)
    {
        $request->validate([
            'file_a' => 'required|file|mimes:pdf|max:10240',
            'file_b' => 'required|file|mimes:pdf|max:10240'
        ]);

        $fileA = $request->file('file_a');
        $fileB = $request->file('file_b');

        $fastApiUrl = config('services.fastapi.url');
        $token = config('services.fastapi.token');

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(300)
                ->withToken($token)
                ->attach('file_a', file_get_contents($fileA->getRealPath()), $fileA->getClientOriginalName())
                ->attach('file_b', file_get_contents($fileB->getRealPath()), $fileB->getClientOriginalName())
                ->post("{$fastApiUrl}/api/v1/compare", [
                    'paper_a_title' => $fileA->getClientOriginalName(),
                    'paper_b_title' => $fileB->getClientOriginalName()
                ]);

            if ($response->failed()) {
                \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                    'user_id' => auth()->id() ?? 1,
                    'action' => 'COMPARE_FAILED',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                return response()->json(['error' => 'Gagal menghubungi AI Server untuk membandingkan paper', 'details' => $response->body()], 500);
            }

            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id() ?? 1,
                'action' => 'COMPARE_PAPERS',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id() ?? 1,
                'action' => 'COMPARE_FAILED',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function submitRevision(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240'
        ]);

        $paper = Paper::where('uploaded_by', auth()->id())->findOrFail($id);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            // Hapus file lama
            if (\Illuminate\Support\Facades\Storage::exists($paper->file_path)) {
                \Illuminate\Support\Facades\Storage::delete($paper->file_path);
            }

            $path = $file->store('papers');
            
            $paper->update([
                'file_path' => $path,
                'status' => 'PROCESSING',
                'submission_status' => 'IN_REVIEW' // Kembalikan statusnya ke review
            ]);

            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id(),
                'action' => 'SUBMIT_REVISION',
                'paper_id' => $paper->id,
                'created_at' => now(),
            ]);

            // Bersihkan analisis lama
            $paper->aiJob()->delete();
            $paper->analyses()->delete();
            $paper->findings()->delete();

            // Jalankan ulang AI
            dispatch(new \App\Jobs\AnalyzePaperJob($paper));

            // Notifikasi ulang ke Reviewer lama
            $reviews = \Illuminate\Support\Facades\DB::table('reviews')
                        ->where('paper_id', $paper->id)
                        ->get();
            
            foreach ($reviews as $review) {
                $reviewer = \App\Models\User::find($review->reviewer_id);
                if ($reviewer) {
                    $reviewer->notify(new \App\Notifications\PaperAssignedNotification($paper->id, $paper->title . " (Revisi)"));
                }
            }

            return response()->json(['message' => 'File revisi berhasil diunggah, paper sedang dianalisis ulang dan ditugaskan kembali.']);
        }
        
        return response()->json(['message' => 'Gagal mengunggah file revisi.'], 400);
    }

    public function viewPdf($id)
    {
        $paper = Paper::findOrFail($id);
        $filePath = $paper->file_path;

        // Bersihkan prefix jika tersimpan 'storage/' atau 'public/' di database
        $cleanPath = ltrim(preg_replace('#^(public/|storage/)#', '', $filePath), '/');

        $candidatePaths = [
            // Storage public disk
            Storage::disk('public')->path($cleanPath),
            storage_path('app/public/' . $cleanPath),
            // Storage local/private disk (Laravel 11 default)
            storage_path('app/private/' . $cleanPath),
            storage_path('app/' . $cleanPath),
            Storage::disk('local')->path($cleanPath),
            // Public path langsung
            public_path('storage/' . $cleanPath),
            public_path($cleanPath),
        ];

        foreach ($candidatePaths as $path) {
            if (file_exists($path) && is_file($path)) {
                return response()->file($path, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="' . basename($path) . '"'
                ]);
            }
        }
        
        return response("
          <html><body style='margin:0;display:flex;height:100vh;align-items:center;justify-content:center;font-family:sans-serif;background:#faf8f5;color:#78716c;text-align:center;padding:24px;'>
            <div style='max-width:420px;background:white;padding:32px;border-radius:16px;border:1px solid #e8e4dc;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);'>
              <div style='font-size:36px;margin-bottom:12px;'>📄</div>
              <h3 style='color:#1c1917;margin:0 0 8px 0;font-size:18px;font-weight:700;'>Pratinjau PDF Belum Tersedia</h3>
              <p style='font-size:13px;line-height:1.6;margin:0;color:#57534e;'>Paper ini merupakan data contoh dari seeder sehingga file dokumen .pdf aslinya belum tersimpan di disk lokal Anda.<br><br>Untuk melihat dokumen PDF asli di penampil ini, silakan unggah file paper baru melalui menu <b>Unggah Paper</b>.</p>
            </div>
          </body></html>
        ", 200, ['Content-Type' => 'text/html']);
    }
}
