<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaperScore extends Model
{
    protected $guarded = [];

    protected $casts = [
        'dynamic_scores' => 'array',
    ];
}
