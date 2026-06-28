<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'room_id',
        'tenant_id',
        'owner_id',        // <--- ត្រូវថែមបន្ទាត់នេះដាច់ខាត!
        'check_in_date',
        'check_out_date',
        'deposit_amount',
        'status',
    ];
    public function room() {
        return $this->belongsTo(Room::class);
    }
}
