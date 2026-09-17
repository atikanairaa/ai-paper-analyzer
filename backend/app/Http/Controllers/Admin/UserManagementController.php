<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        // Parameter pencarian & filter untuk reviewer
        $expertiseFilter = $request->query('expertise');
        $search = $request->query('search');

        $researchersQuery = User::role('researcher')->orderBy('name');
        if ($search) {
            $researchersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        $researchers = $researchersQuery->paginate(10, ['*'], 'researchers_page')->withQueryString();

        $reviewersQuery = User::role('reviewer')->orderBy('name');
        
        if ($expertiseFilter) {
            $reviewersQuery->where('expertise', $expertiseFilter);
        }
        if ($search) {
            $reviewersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Include review count directly via withCount to see reviewer load
        $reviewersQuery->withCount(['reviews' => function ($query) {
            $query->whereHas('paper', function($q) {
                $q->whereIn('submission_status', ['IN_REVIEW', 'REVIEWED']);
            });
        }]);

        $reviewers = $reviewersQuery->paginate(10, ['*'], 'reviewers_page')->withQueryString();
        
        $expertises = \App\Models\Expertise::orderBy('name')->get();

        return Inertia::render('Admin/ManageUsers', [
            'researchers' => $researchers,
            'reviewers' => $reviewers,
            'expertises' => $expertises,
            'filters' => [
                'expertise' => $expertiseFilter,
                'search' => $search,
            ]
        ]);
    }
}
