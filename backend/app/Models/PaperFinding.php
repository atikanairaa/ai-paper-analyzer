<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaperFinding extends Model
{
    protected $fillable = [
        'paper_id', 'severity', 'category', 'finding', 'explanation', 
        'evidence', 'page', 'section', 'confidence'
    ];

    public function paper()
    {
        return $this->belongsTo(Paper::class);
    }
}
