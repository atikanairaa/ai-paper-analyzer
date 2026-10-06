<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationCriterion extends Model
{
    use HasFactory;

    protected $table = 'evaluation_criteria';

    protected $fillable = [
        'name',
        'instruction',
        'weight',
        'is_active',
        'is_analyze',
        'is_review',
        'is_qa',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'is_analyze' => 'boolean',
        'is_review'  => 'boolean',
        'is_qa'      => 'boolean',
        'weight'     => 'integer',
    ];
}
