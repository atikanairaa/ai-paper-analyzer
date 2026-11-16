<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaperSection extends Model
{
    protected $fillable = ['paper_id', 'section_name', 'is_found', 'summary'];

    protected $casts = [
        'is_found' => 'boolean',
    ];

    public function paper()
    {
        return $this->belongsTo(Paper::class);
    }
}
