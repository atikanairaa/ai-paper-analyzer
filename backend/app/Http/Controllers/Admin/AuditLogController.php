<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index()
    {
        $logs = AuditLog::with(['user:id,name', 'paper:id,title'])
            ->latest()
            ->take(50) // limit for dashboard
            ->get();
            
        return response()->json($logs);
    }
}
