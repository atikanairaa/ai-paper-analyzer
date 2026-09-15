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

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:pdf|max:20480', // max 20MB
        ]);

        $file = $request->file('file');
        $path = $file->store('papers');

        // Create paper record
        $paper = Paper::create([
            'uploaded_by' => $request->user() ? $request->user()->id : 1, // Fallback if no auth
            'title' => $file->getClientOriginalName(),
            'file_path' => $path,
            'status' => 'PROCESSING',
        ]);

        // Dispatch Job
        ProcessPaperJob::dispatch($paper);
        
        \App\Helpers\AuditLogger::log('Upload paper', $paper->id, $paper->uploaded_by);

        return response()->json([
            'status' => 'processing',
            'paper' => $paper
        ]);
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
