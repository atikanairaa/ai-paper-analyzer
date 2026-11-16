<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Paper;
use Inertia\Inertia;

class PublishedPapersController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        $domain = $request->query('domain', '');
        $perPage = 10;

        $query = Paper::with(['authors', 'uploader', 'analyses'])
            ->where('submission_status', 'PUBLISHED');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('authors', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($domain) {
            $query->whereHas('analyses', function ($q) use ($domain) {
                $q->where('research_domain', $domain);
            });
        }

        $papers = $query->orderBy('updated_at', 'desc')->paginate($perPage)->withQueryString();

        // Get all distinct domains for filter
        $domains = \DB::table('paper_analyses')
            ->join('papers', 'papers.id', '=', 'paper_analyses.paper_id')
            ->where('papers.submission_status', 'PUBLISHED')
            ->whereNotNull('paper_analyses.research_domain')
            ->select('paper_analyses.research_domain')
            ->distinct()
            ->pluck('research_domain')
            ->values();

        return Inertia::render('Admin/PublishedPapers', [
            'papers'  => $papers,
            'domains' => $domains,
            'filters' => [
                'search' => $search,
                'domain' => $domain,
            ],
        ]);
    }
}
