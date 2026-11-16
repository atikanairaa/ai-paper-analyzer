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
            $reviewersQuery->where('expertise', 'like', "%{$expertiseFilter}%");
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

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:reviewer,researcher',
            'expertise' => 'nullable|array'
        ]);

        $expertiseStr = $request->expertise && is_array($request->expertise) ? implode(', ', $request->expertise) : null;

        $user = new User();
        $user->name = $request->name;
        $user->email = $request->email;
        $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
        $user->expertise = $expertiseStr;
        $user->save();

        $user->assignRole($request->role);

        return redirect()->back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'expertise' => 'nullable|array'
        ]);

        $expertiseStr = $request->expertise && is_array($request->expertise) ? implode(', ', $request->expertise) : null;

        $user->name = $request->name;
        $user->email = $request->email;
        if ($request->password) {
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
        }
        $user->expertise = $expertiseStr;
        $user->save();

        return redirect()->back()->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return redirect()->back()->with('success', 'Pengguna berhasil dihapus.');
    }
}
