<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paper extends Model
{
    //
    public function authors() { return $this->hasMany(PaperAuthor::class); }
    public function analyses() { return $this->hasMany(PaperAnalysis::class); }
    public function scores() { return $this->hasOne(PaperScore::class); }
    public function findings() { return $this->hasMany(PaperFinding::class); }
}

