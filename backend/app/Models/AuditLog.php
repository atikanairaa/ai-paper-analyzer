<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $guarded = [];
    public function user() { return $this->belongsTo(User::class); }
    public function paper() { return $this->belongsTo(Paper::class); }
}

