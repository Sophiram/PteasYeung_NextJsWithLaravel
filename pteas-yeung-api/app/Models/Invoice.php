<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'electricity_start_unit',
        'electricity_end_unit',
        'water_unit',
        'total_amount',
        'payment_status',
        'due_date',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'due_date' => 'date',
        'electricity_start_unit' => 'integer',
        'electricity_end_unit' => 'integer',
        'water_unit' => 'integer',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    /**
     * Get the tenant who owns this invoice via booking.
     */
    public function tenant(): HasOneThrough
    {
        return $this->hasOneThrough(
            User::class,
            Booking::class,
            'id',          // Foreign key on bookings table (id)
            'id',          // Foreign key on users table (id)
            'booking_id',  // Local key on invoices table
            'tenant_id'    // Local key on bookings table
        );
    }

    /**
     * Get the room associated with this invoice via booking.
     */
    public function room(): HasOneThrough
    {
        return $this->hasOneThrough(
            Room::class,
            Booking::class,
            'id',          // Foreign key on bookings table (id)
            'id',          // Foreign key on rooms table (id)
            'booking_id',  // Local key on invoices table
            'room_id'      // Local key on bookings table
        );
    }

    /**
     * Get the owner associated with this invoice via booking.
     */
    public function owner(): HasOneThrough
    {
        return $this->hasOneThrough(
            User::class,
            Booking::class,
            'id',          // Foreign key on bookings table (id)
            'id',          // Foreign key on users table (id)
            'booking_id',  // Local key on invoices table
            'owner_id'     // Local key on bookings table
        );
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function isUnpaid(): bool
    {
        return $this->payment_status === 'unpaid';
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopeUnpaid(Builder $query): Builder
    {
        return $query->where('payment_status', 'unpaid');
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('payment_status', '!=', 'paid')
            ->where('due_date', '<', now()->toDateString());
    }
}
