<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Paper;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReviewerManagementController extends Controller
{
    public function index()
    {
        $reviewers = User::role('reviewer')->get();
        $expertises = \App\Models\Expertise::orderBy('name')->get();

        return Inertia::render('Admin/ManageReviewers', [
            'reviewers' => $reviewers,
            'expertises' => $expertises,
        ]);
    }

    public function assignIndex()
    {
        $papers = Paper::with(['authors', 'analyses'])
            ->where('is_submission', true)
            ->where('submission_status', 'SUBMITTED')
            ->orderBy('id', 'desc')
            ->get();

        $inReviewPapers = Paper::with(['reviews.reviewer', 'authors'])
            ->where('is_submission', true)
            ->whereIn('submission_status', ['IN_REVIEW', 'REVIEWED'])
            ->orderBy('updated_at', 'desc')
            ->paginate(10);

        $reviewers = User::role('reviewer')
            ->withCount(['reviews' => function ($query) {
                $query->whereHas('paper', function($q) {
                    $q->whereIn('submission_status', ['IN_REVIEW', 'REVIEWED']);
                });
            }])
            ->get();

        return Inertia::render('Admin/AssignPaper', [
            'papers' => $papers,
            'inReviewPapers' => $inReviewPapers,
            'reviewers' => $reviewers,
        ]);
    }

    public function recommend(Request $request, $paperId)
    {
        $paper = Paper::with('analyses')->findOrFail($paperId);
        $reviewers = User::role('reviewer')->get();

        if ($reviewers->isEmpty()) {
            return response()->json(['recommendations' => []]);
        }

        // We use Gemini API to do the matchmaking
        $domain = $paper->analyses->first()->research_domain ?? 'Umum';
        $abstract = $paper->abstract ?? $paper->title;

        $reviewersList = $reviewers->map(function($r) {
            return [
                'id' => $r->id,
                'name' => $r->name,
                'expertise' => $r->expertise ?? 'Belum ada data keahlian'
            ];
        })->toJson();

        $prompt = "You are an AI Matchmaker for an academic journal. 
Paper Title: {$paper->title}
Paper Domain: {$domain}
Paper Abstract: {$abstract}

Reviewers:
{$reviewersList}

Please analyze the match between the paper's domain/abstract and each reviewer's expertise. 
Return ONLY a valid JSON array of objects, where each object has:
- reviewer_id: (int)
- match_percentage: (int between 0 and 100)
- reasoning: (string) short explanation of why they match or don't match.

Do not include markdown blocks or any other text, just the raw JSON.";

        try {
            $geminiApiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$geminiApiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ]
                ]);

            if ($response->successful()) {
                $responseText = $response->json('candidates.0.content.parts.0.text');
                // Clean markdown if AI returned it
                $responseText = str_replace(['```json', '```'], '', $responseText);
                $recommendations = json_decode(trim($responseText), true);

                if (json_last_error() === JSON_ERROR_NONE && is_array($recommendations)) {
                    return response()->json(['recommendations' => $recommendations]);
                }
            }
        } catch (\Exception $e) {
            // Ignore and fallback
        }

        // Fallback dummy matchmaking if API fails or quota exceeded
        $fallback = $reviewers->map(function($r) {
            return [
                'reviewer_id' => $r->id,
                'match_percentage' => rand(30, 95),
                'reasoning' => 'Fallback matchmaking due to AI service unavailability.'
            ];
        });

        return response()->json(['recommendations' => $fallback]);
    }

    public function orcidRecommend(Request $request, $paperId)
    {
        $paper = Paper::with('analyses')->findOrFail($paperId);

        // Ambil keywords nyata dari hasil analisis AI
        $keywords = [];
        $domain    = null;

        if ($paper->analyses && $paper->analyses->count() > 0) {
            $analysis = $paper->analyses->first();
            $domain   = $analysis->research_domain ?? null;
            $kws      = json_decode($analysis->keywords ?? '[]', true);
            if (is_array($kws) && count($kws) > 0) {
                $keywords = array_slice($kws, 0, 6);
            }
        }

        // Fallback: gunakan kata-kata penting dari judul paper
        if (empty($keywords)) {
            $stopwords = ['dan', 'atau', 'untuk', 'pada', 'yang', 'dengan', 'dalam', 'of', 'the', 'a', 'an', 'in', 'on', 'for', 'to', 'by'];
            $words = preg_split('/\s+/', strtolower($paper->title ?? ''));
            $keywords = array_values(array_filter($words, fn($w) => strlen($w) > 3 && !in_array($w, $stopwords)));
            $keywords = array_slice($keywords, 0, 5);
        }

        $keywordsStr = implode(', ', $keywords);
        $fastApiUrl  = config('services.fastapi.url');
        $token       = config('services.fastapi.token');

        try {
            $response = Http::timeout(20)
                ->withToken($token)
                ->asForm()
                ->post("{$fastApiUrl}/api/v1/recommend-reviewers", [
                    'keywords' => $keywordsStr,
                    'domain'   => $domain ?? '',
                ]);

            if ($response->successful()) {
                $body = $response->json();
                // FastAPI returns { success, request_id, data: { reviewers, total_found, ... } }
                return response()->json($body['data'] ?? $body);
            }

            return response()->json(['reviewers' => [], 'total_found' => 0, 'keywords_searched' => $keywords, 'error' => $response->body()], 200);
        } catch (\Exception $e) {
            return response()->json(['reviewers' => [], 'total_found' => 0, 'keywords_searched' => $keywords, 'error' => $e->getMessage()], 200);
        }
    }


    public function assign(Request $request)
    {
        $request->validate([
            'paper_id' => 'required|exists:papers,id',
            'reviewer_id' => 'required|exists:users,id',
        ]);

        $paper = Paper::findOrFail($request->paper_id);
        $reviewer = User::findOrFail($request->reviewer_id);

        $exists = DB::table('reviews')
            ->where('paper_id', $paper->id)
            ->where('reviewer_id', $reviewer->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Reviewer ini sudah ditugaskan untuk paper ini.'], 400);
        }

        DB::table('reviews')->insert([
            'paper_id' => $paper->id,
            'reviewer_id' => $reviewer->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $paper->update(['submission_status' => 'IN_REVIEW']);

        DB::table('audit_logs')->insert([
            'user_id' => auth()->id(),
            'action' => 'ASSIGN_REVIEWER',
            'paper_id' => $paper->id,
            'created_at' => now(),
        ]);

        $reviewer->notify(new \App\Notifications\PaperAssignedNotification($paper->id, $paper->title));
        
        try {
            \Illuminate\Support\Facades\Mail::to($reviewer->email)->send(
                new \App\Mail\ReviewerInvitationMail($paper, $reviewer->name, $reviewer->email)
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gagal mengirim email undangan: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Berhasil menugaskan reviewer.']);
    }
}
