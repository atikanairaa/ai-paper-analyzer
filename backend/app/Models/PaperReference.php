<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaperReference extends Model
{
    protected $fillable = [
        'paper_id',
        'total_references',
        'recent_references',
        'old_references',
        'potential_issues',
    ];

    protected $casts = [
        'potential_issues' => 'array',
    ];

    public function paper()
    {
        return $this->belongsTo(Paper::class);
    }
}
