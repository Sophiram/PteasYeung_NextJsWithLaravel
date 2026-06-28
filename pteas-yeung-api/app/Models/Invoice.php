<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'booking_id',
        'electricity_start_unit',
        'electricity_end_unit',
        'water_unit',
        'total_amount',
        'payment_status',
        'due_date'
    ];

    public function booking() {
        return $this->belongsTo(Booking::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); // ឬ 'tenant_id' អាស្រ័យលើឈ្មោះ Column របស់បង
    }

 }
