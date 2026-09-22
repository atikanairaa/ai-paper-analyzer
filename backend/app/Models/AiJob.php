<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiJob extends Model
{
    protected $fillable = [
        'paper_id',
        'status',
        'retry_count',
        'duration_seconds',
        'error_message',
        'started_at',
        'completed_at'
    ];

    public function requests() { return $this->hasMany(AiRequest::class); }
    public function paper() { return $this->belongsTo(Paper::class); }
}

