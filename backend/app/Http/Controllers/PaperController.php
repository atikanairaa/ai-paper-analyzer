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
        $paper = Paper::with(['authors', 'analyses', 'scores', 'findings', 'latestJob', 'reviews.reviewer'])->findOrFail($id);
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
                return response()->json(['error' => 'Gagal menghubungi AI Server untuk membandingkan paper', 'details' => $response->body()], 500);
            }

            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id() ?? 1,
                'action' => 'COMPARE_PAPERS',
                'created_at' => now(),
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
