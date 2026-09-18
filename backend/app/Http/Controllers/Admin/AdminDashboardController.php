<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Paper;
use App\Models\AiJob;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $total = Paper::count();
        $analyzed = Paper::where('status', 'ANALYZED')->count();
        $processing = Paper::where('status', 'PROCESSING')->count();
        $failed = Paper::where('status', 'FAILED')->count();
        $avgScore = DB::table('paper_scores')->avg('overall_score') ?? 0;

        $domains = DB::table('paper_analyses')
            ->select('research_domain', DB::raw('count(*) as count'))
            ->whereNotNull('research_domain')
            ->groupBy('research_domain')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->research_domain,
                    'count' => $item->count
                ];
            });

        $failedJobs = AiJob::with('paper')
            ->where('status', 'FAILED')
            ->orderBy('id', 'desc')
            ->take(5)
            ->get();

        $papersForChart = Paper::select('id', 'created_at', 'status')->get();
        $uploadsByMonth = $papersForChart->groupBy(function($date) {
            return \Carbon\Carbon::parse($date->created_at)->format('M Y');
        })->map(function ($row) {
            return count($row);
        });
        
        $uploadsPerMonth = [];
        foreach($uploadsByMonth as $month => $count) {
            $uploadsPerMonth[] = ['month' => $month, 'count' => $count];
        }

        // Limit to last 6 months to avoid overcrowding
        $uploadsPerMonth = array_slice($uploadsPerMonth, -6);

        $statusChart = [
            ['name' => 'Berhasil (Analyzed)', 'value' => $analyzed],
            ['name' => 'Gagal (Failed)', 'value' => $failed],
            ['name' => 'Diproses (Processing)', 'value' => $processing],
        ];

        return Inertia::render('AdminDashboard', [
            'stats' => [
                'total' => $total,
                'analyzed' => $analyzed,
                'processing' => $processing,
                'failed' => $failed,
                'avgScore' => round($avgScore, 1)
            ],
            'domains' => $domains,
            'failedJobs' => collect($failedJobs)->values()->all(),
            'uploadsPerMonth' => $uploadsPerMonth,
            'statusChart' => $statusChart
        ]);
    }
}
