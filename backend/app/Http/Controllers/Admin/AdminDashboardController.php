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
    public function index(Request $request)
    {
        $timeframe = $request->query('timeframe', 'daily');

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

        $trendData = [];
        $query = Paper::select('id', 'created_at');

        if ($timeframe === 'daily') {
            $startDate = now()->subDays(13)->startOfDay();
            $query->where('created_at', '>=', $startDate);
            $grouped = $query->get()->groupBy(function($date) {
                return \Carbon\Carbon::parse($date->created_at)->format('d M');
            });
            for ($i = 0; $i < 14; $i++) {
                $dateStr = now()->subDays(13 - $i)->format('d M');
                $trendData[] = [
                    'label' => $dateStr,
                    'count' => isset($grouped[$dateStr]) ? count($grouped[$dateStr]) : 0
                ];
            }
        } elseif ($timeframe === 'weekly') {
            $startDate = now()->subWeeks(7)->startOfWeek();
            $query->where('created_at', '>=', $startDate);
            $grouped = $query->get()->groupBy(function($date) {
                return 'Minggu ' . \Carbon\Carbon::parse($date->created_at)->format('W');
            });
            for ($i = 0; $i < 8; $i++) {
                $weekDate = now()->subWeeks(7 - $i);
                $weekStr = 'Minggu ' . $weekDate->format('W');
                $trendData[] = [
                    'label' => $weekStr,
                    'count' => isset($grouped[$weekStr]) ? count($grouped[$weekStr]) : 0
                ];
            }
        } elseif ($timeframe === 'monthly') {
            $startDate = now()->subMonths(5)->startOfMonth();
            $query->where('created_at', '>=', $startDate);
            $grouped = $query->get()->groupBy(function($date) {
                return \Carbon\Carbon::parse($date->created_at)->format('M Y');
            });
            for ($i = 0; $i < 6; $i++) {
                $monthStr = now()->subMonths(5 - $i)->format('M Y');
                $trendData[] = [
                    'label' => $monthStr,
                    'count' => isset($grouped[$monthStr]) ? count($grouped[$monthStr]) : 0
                ];
            }
        } elseif ($timeframe === 'yearly') {
            $startDate = now()->subYears(4)->startOfYear();
            $query->where('created_at', '>=', $startDate);
            $grouped = $query->get()->groupBy(function($date) {
                return \Carbon\Carbon::parse($date->created_at)->format('Y');
            });
            for ($i = 0; $i < 5; $i++) {
                $yearStr = now()->subYears(4 - $i)->format('Y');
                $trendData[] = [
                    'label' => $yearStr,
                    'count' => isset($grouped[$yearStr]) ? count($grouped[$yearStr]) : 0
                ];
            }
        }

        $statusChart = [
            ['name' => 'Berhasil (Analyzed)', 'value' => $analyzed],
            ['name' => 'Gagal (Failed)', 'value' => $failed],
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
            'uploadTrend' => $trendData,
            'filters' => [
                'timeframe' => $timeframe
            ],
            'statusChart' => $statusChart
        ]);
    }
}
