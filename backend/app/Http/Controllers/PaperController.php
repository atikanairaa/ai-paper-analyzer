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
        // For actual app we might filter by user
        $papers = Paper::with('authors')->get();
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

        return response()->json(['message' => 'Paper deleted successfully']);
    }
}
