<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_email',
        'user_role',
        'event',
        'category',
        'severity',
        'description',
        'ip_address',
        'user_agent',
        'route',
        'method',
        'old_values',
        'new_values',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The user associated with the audit event (if authenticated).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter logs by severity, category, event, or search term.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('description', 'like', $term)
                  ->orWhere('user_email', 'like', $term)
                  ->orWhere('ip_address', 'like', $term)
                  ->orWhere('event', 'like', $term);
            });
        }

        if (! empty($filters['severity']) && $filters['severity'] !== 'all') {
            $query->where('severity', $filters['severity']);
        }

        if (! empty($filters['category']) && $filters['category'] !== 'all') {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['event'])) {
            $query->where('event', $filters['event']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (! empty($filters['ip_address'])) {
            $query->where('ip_address', $filters['ip_address']);
        }

        if (! empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        return $query;
    }

    /**
     * Scope for security-specific alert events.
     */
    public function scopeSecurityAlerts(Builder $query): Builder
    {
        return $query->whereIn('severity', ['warning', 'danger', 'critical'])
                     ->whereIn('category', ['auth', 'security']);
    }

    /**
     * Scope for the most recent events.
     */
    public function scopeRecent(Builder $query, int $limit = 50): Builder
    {
        return $query->latest('created_at')->limit($limit);
    }
}
