<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Paper;
use Inertia\Inertia;

class PaperManagementController extends Controller
{
    public function index()
    {
        $papers = Paper::with(['authors', 'latestJob', 'uploader'])
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Admin/MasterPaper', [
            'papers' => $papers
        ]);
    }
}
