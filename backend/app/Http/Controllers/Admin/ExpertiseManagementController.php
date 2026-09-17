<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpertiseManagementController extends Controller
{
    public function index()
    {
        $expertises = \App\Models\Expertise::orderBy('name')->get();
        return Inertia::render('Admin/ManageExpertises', [
            'expertises' => $expertises,
        ]);
    }
}
