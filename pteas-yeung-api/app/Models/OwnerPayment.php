<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OwnerPayment extends Model
{
    use HasFactory;

    protected $table = 'owner_payments';

    protected $fillable = [
        'owner_id',
        'property_id',
        'invoice_number',
        'title',
        'plan_type',
        'amount',
        'payment_status',
        'payment_method',
        'payment_proof_url',
        'due_date',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('payment_status', '!=', 'paid');
    }

    public function scopeBetweenDates(Builder $query, ?string $start, ?string $end): Builder
    {
        return $query
            ->when($start, fn ($q) => $q->whereDate('created_at', '>=', $start))
            ->when($end, fn ($q) => $q->whereDate('created_at', '<=', $end));
    }

    public static function generateInvoiceNumber(): string
    {
        $prefix = 'INV-OWN-' . date('Ym') . '-';
        $latest = self::where('invoice_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latest && preg_match('/-(\d+)$/', $latest->invoice_number, $matches)) {
            $nextSeq = intval($matches[1]) + 1;
        } else {
            $nextSeq = 1;
        }

        return $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }
}
