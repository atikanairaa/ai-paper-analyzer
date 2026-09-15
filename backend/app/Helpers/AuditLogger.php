<?php

namespace App\Helpers;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    public static function log($action, $paperId = null, $userId = null)
    {
        if (!$userId && auth()->check()) {
            $userId = auth()->id();
        }

        AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'paper_id' => $paperId,
            'ip_address' => Request::ip(),
        ]);
    }
}
