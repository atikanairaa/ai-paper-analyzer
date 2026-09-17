<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paper;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReviewerDashboardController extends Controller
{
    public function index()
    {
        $userId = auth()->id();
        
        // Get papers assigned to this reviewer
        $papers = Paper::with(['authors', 'analyses'])
            ->whereHas('reviews', function($query) use ($userId) {
                $query->where('reviewer_id', $userId);
            })
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('ReviewerDashboard', [
            'papers' => $papers
        ]);
    }
}
