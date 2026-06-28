<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'user_id', 'id_card_number', 'nationality', 'occupation', 'emergency_contact', 'current_address', 'status'
    ];

    public function user() { return $this->belongsTo(User::class); }
}
