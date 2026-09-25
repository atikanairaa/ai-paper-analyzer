<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Review;
use App\Helpers\AuditLogger;

class ReviewController extends Controller
{
    public function store(Request $request, $paperId)
    {
        $request->validate([
            'recommendation' => 'required|in:ACCEPT,MINOR_REVISION,MAJOR_REVISION,REJECT',
            'score' => 'required|integer',
            'comments' => 'nullable|string',
        ]);

        $paper = \App\Models\Paper::with('uploader')->findOrFail($paperId);
        
        if ($paper->status !== 'ANALYZED') {
            return response()->json(['message' => 'Naskah masih diproses oleh AI. Silakan tunggu hingga selesai sebelum mengirim evaluasi.'], 403);
        }

        $review = Review::updateOrCreate(
            ['paper_id' => $paperId, 'reviewer_id' => auth()->id()],
            [
                'recommendation' => $request->recommendation,
                'score' => $request->score,
                'comments' => $request->comments,
            ]
        );

        if (in_array($request->recommendation, ['MINOR_REVISION', 'MAJOR_REVISION'])) {
            $paper->update(['submission_status' => 'REVISION']);
        } else {
            $paper->update(['submission_status' => 'REVIEWED']);
        }

        if ($paper->uploader) {
            $paper->uploader->notify(new \App\Notifications\PaperReviewedNotification($paper->id, $paper->title));
        }

        AuditLogger::log('Reviewer submit review', $paperId);

        return response()->json($review);
    }
}
