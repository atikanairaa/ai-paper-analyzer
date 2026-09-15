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

        $review = Review::create([
            'paper_id' => $paperId,
            'reviewer_id' => auth()->id() ?? 1, // Fallback for now
            'recommendation' => $request->recommendation,
            'score' => $request->score,
            'comments' => $request->comments,
        ]);

        AuditLogger::log('Reviewer submit review', $paperId);

        return response()->json($review);
    }
}
