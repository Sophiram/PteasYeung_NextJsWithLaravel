<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'room_number',
        'price',
        'deposit',
        'type',
        'status',
        'floor',
        'amenities',
        'description',
        'image',
    ];

    protected $casts = [
        'amenities' => 'array',
        'price' => 'decimal:2',
        'deposit' => 'decimal:2',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(RoomImage::class, 'room_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'room_id');
    }

    /**
     * Active booking currently occupying the room, if any.
     */
    public function activeBooking(): HasOne
    {
        return $this->hasOne(Booking::class, 'room_id')
            ->where('status', 'active')
            ->latestOfMany();
    }

    /**
     * Invoices associated with this room via bookings.
     */
    public function invoices(): HasManyThrough
    {
        return $this->hasManyThrough(
            Invoice::class,
            Booking::class,
            'room_id',    // Foreign key on bookings table
            'booking_id', // Foreign key on invoices table
            'id',         // Local key on rooms table
            'id'          // Local key on bookings table
        );
    }

    /**
     * Scope query to available rooms.
     */
    public function scopeAvailable(Builder $query): Builder
    {
        return $query->whereRaw('LOWER(status) = ?', ['available']);
    }

    /**
     * Scope query to occupied rooms.
     */
    public function scopeOccupied(Builder $query): Builder
    {
        return $query->whereRaw('LOWER(status) = ?', ['occupied']);
    }

    /**
     * Scope query to rooms belonging to a specific owner.
     */
    public function scopeForOwner(Builder $query, int $ownerId): Builder
    {
        return $query->whereHas('property', fn ($q) => $q->where('owner_id', $ownerId));
    }
}
