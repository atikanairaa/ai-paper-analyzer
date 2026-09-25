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

    public function recommendOrcid(Request $request, $paperId)
    {
        $paper = Paper::with('analyses')->findOrFail($paperId);
        $keywords = $paper->analyses->first()->keywords ?? $paper->title; // fallback if keywords missing
        $domain = $paper->analyses->first()->research_domain ?? '';
        
        $fastApiUrl = config('services.fastapi.url', 'http://127.0.0.1:8001');
        $token = config('services.fastapi.token');

        try {
            $response = Http::asForm()
                ->withToken($token)
                ->post("{$fastApiUrl}/api/v1/recommend-reviewers", [
                    'keywords' => $keywords,
                    'domain' => $domain
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gagal panggil FastAPI ORCID: ' . $e->getMessage());
        }

        return response()->json(['error' => 'Gagal mendapatkan rekomendasi ORCID.'], 500);
    }

    public function assign(Request $request)
    {
        $request->validate([
            'paper_id' => 'required|exists:papers,id',
            'reviewer_id' => 'nullable|exists:users,id',
            'orcid_email' => 'nullable|email',
            'orcid_name' => 'nullable|string',
        ]);

        $paper = Paper::findOrFail($request->paper_id);
        
        // Cek apakah reviewer dari DB internal atau dari ORCID
        if ($request->reviewer_id) {
            $reviewer = User::findOrFail($request->reviewer_id);
        } else if ($request->orcid_email && $request->orcid_name) {
            $reviewer = User::firstOrCreate(
                ['email' => $request->orcid_email],
                [
                    'name' => $request->orcid_name,
                    'password' => bcrypt(\Illuminate\Support\Str::random(16)),
                ]
            );
            // Ensure they have the reviewer role
            if (!$reviewer->hasRole('reviewer')) {
                $reviewer->assignRole('reviewer');
            }
        } else {
            return response()->json(['message' => 'Reviewer ID atau Data ORCID dibutuhkan.'], 400);
        }

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
            'user_id' => \Illuminate\Support\Facades\Auth::id(),
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
