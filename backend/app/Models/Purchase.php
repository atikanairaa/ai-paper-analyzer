<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $fillable = [
        'user_id',
        'paper_id',
        'guest_name',
        'guest_email',
        'amount',
        'invoice_number',
        'payment_status',
        'payment_url',
        'access_token'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function paper()
    {
        return $this->belongsTo(Paper::class);
    }
}
