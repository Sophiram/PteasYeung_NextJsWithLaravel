<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'owner_id',
        'google_id',
        'id_card_number',
        'profile_picture',
        'bank_name',
        'bank_account_name',
        'bank_account_number',
        'bank_qr_code',
        'payment_instructions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Properties owned by this user (if owner).
     */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'owner_id');
    }

    /**
     * Bookings made by this user as tenant.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'tenant_id');
    }

    /**
     * Bookings received by this user as owner.
     */
    public function ownerBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'owner_id');
    }

    /**
     * Invoices received by this tenant across their bookings.
     */
    public function tenantInvoices(): HasManyThrough
    {
        return $this->hasManyThrough(
            Invoice::class,
            Booking::class,
            'tenant_id',  // Foreign key on bookings table
            'booking_id', // Foreign key on invoices table
            'id',         // Local key on users table
            'id'          // Local key on bookings table
        );
    }

    /**
     * Invoices billed by this owner across their bookings.
     */
    public function ownerInvoices(): HasManyThrough
    {
        return $this->hasManyThrough(
            Invoice::class,
            Booking::class,
            'owner_id',   // Foreign key on bookings table
            'booking_id', // Foreign key on invoices table
            'id',         // Local key on users table
            'id'          // Local key on bookings table
        );
    }

    /**
     * Platform payments and subscriptions made by this owner to admin.
     */
    public function ownerPayments(): HasMany
    {
        return $this->hasMany(OwnerPayment::class, 'owner_id');
    }

    /**
     * Expenses recorded by this user.
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'owner_id');
    }

    /**
     * Staff members managed by this owner.
     */
    public function staff(): HasMany
    {
        return $this->hasMany(User::class, 'owner_id');
    }

    /**
     * The owner managing this staff account.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Tenant profile details.
     */
    public function tenantProfile(): HasOne
    {
        return $this->hasOne(Tenant::class, 'user_id');
    }

    /**
     * Check if user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if user is a property owner.
     */
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    /**
     * Check if user is a staff member.
     */
    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    /**
     * Check if user is a tenant.
     */
    public function isTenant(): bool
    {
        return $this->role === 'tenant';
    }

    /**
     * Check if user account is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Scope query to only active users.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope query to only owners.
     */
    public function scopeOwners(Builder $query): Builder
    {
        return $query->where('role', 'owner');
    }

    /**
     * Scope query to only tenants.
     */
    public function scopeTenants(Builder $query): Builder
    {
        return $query->where('role', 'tenant');
    }

    /**
     * Scope query to staff belonging to a specific owner.
     */
    public function scopeStaffOf(Builder $query, int $ownerId): Builder
    {
        return $query->where('role', 'staff')->where('owner_id', $ownerId);
    }

    /**
     * Custom permissions directly assigned to this user.
     */
    public function permissions(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_user');
    }

    /**
     * Get all effective permission slugs for this user (Role defaults + Direct assignments).
     * Super Admin bypasses all checks and receives all system permissions.
     */
    public function getAllPermissions(): array
    {
        if ($this->isSuperAdmin()) {
            return Permission::pluck('slug')->toArray();
        }

        // 1. Role-based default permissions
        $rolePermissionIds = \Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('role', $this->role)
            ->pluck('permission_id')
            ->toArray();

        // 2. Direct user permissions
        $directPermissionIds = $this->permissions()->pluck('permissions.id')->toArray();

        // Merge IDs
        $allIds = array_unique(array_merge($rolePermissionIds, $directPermissionIds));

        if (empty($allIds)) {
            return [];
        }

        return Permission::whereIn('id', $allIds)->pluck('slug')->toArray();
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $all = $this->getAllPermissions();
        return in_array($permissionSlug, $all, true);
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissionSlugs): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $all = $this->getAllPermissions();
        return ! empty(array_intersect($permissionSlugs, $all));
    }

    /**
     * Sync user direct permissions by an array of slugs.
     */
    public function syncPermissions(array $permissionSlugs): void
    {
        $ids = Permission::whereIn('slug', $permissionSlugs)->pluck('id')->toArray();
        $this->permissions()->sync($ids);
    }
}
