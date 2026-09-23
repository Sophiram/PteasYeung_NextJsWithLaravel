<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuditLogger
{
    /**
     * Sensitive fields that must NEVER appear in audit logs.
     */
    protected static array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'access_token',
        'refresh_token',
        'remember_token',
        'secret',
        'api_key',
        'credit_card',
        'card_number',
        'cvv',
    ];

    /**
     * Record a generic audit log entry.
     */
    public static function log(
        string $event,
        string $category,
        string $description,
        string $severity = 'info',
        ?array $newValues = null,
        ?array $oldValues = null,
        ?User $user = null,
        ?string $attemptedEmail = null,
        ?Request $request = null
    ): ?AuditLog {
        try {
            $req = $request ?: request();

            // Resolve acting user
            $activeUser = $user ?: ($req ? $req->user() : null);

            $userId = $activeUser?->id;
            $userEmail = $activeUser?->email ?: $attemptedEmail;
            $userRole = $activeUser?->role ?: ($activeUser ? 'user' : 'guest');

            $ip = $req ? $req->ip() : null;
            $userAgent = $req ? substr((string) $req->userAgent(), 0, 500) : null;
            $route = $req ? $req->path() : null;
            $method = $req ? $req->method() : null;

            return AuditLog::create([
                'user_id' => $userId,
                'user_email' => $userEmail,
                'user_role' => $userRole,
                'event' => $event,
                'category' => $category,
                'severity' => in_array($severity, ['info', 'warning', 'danger', 'critical'], true) ? $severity : 'info',
                'description' => $description,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'route' => $route,
                'method' => $method,
                'old_values' => $oldValues ? self::sanitize($oldValues) : null,
                'new_values' => $newValues ? self::sanitize($newValues) : null,
            ]);
        } catch (\Throwable $e) {
            // Never break main user flow if logging fails
            Log::error('AuditLogger error: ' . $e->getMessage(), ['exception' => $e]);
            return null;
        }
    }

    /**
     * Record successful login event.
     */
    public static function authLogin(User $user, ?Request $request = null): ?AuditLog
    {
        return self::log(
            event: 'auth.login',
            category: 'auth',
            description: "User {$user->name} ({$user->email}) successfully logged in.",
            severity: 'info',
            newValues: ['user_id' => $user->id, 'role' => $user->role],
            user: $user,
            request: $request
        );
    }

    /**
     * Record failed login attempt (crucial for detecting brute-force / password spraying attacks).
     */
    public static function authFailedLogin(string $email, ?Request $request = null, string $reason = 'Invalid credentials'): ?AuditLog
    {
        $req = $request ?: request();
        $ip = $req ? $req->ip() : 'unknown';

        return self::log(
            event: 'auth.failed_login',
            category: 'auth',
            description: "Failed login attempt for email '{$email}' from IP {$ip}. Reason: {$reason}.",
            severity: 'danger',
            newValues: ['attempted_email' => $email, 'reason' => $reason],
            attemptedEmail: $email,
            request: $request
        );
    }

    /**
     * Record logout event.
     */
    public static function authLogout(?User $user = null, ?Request $request = null): ?AuditLog
    {
        $email = $user?->email ?: 'Unknown user';
        return self::log(
            event: 'auth.logout',
            category: 'auth',
            description: "User {$email} logged out.",
            severity: 'info',
            user: $user,
            request: $request
        );
    }

    /**
     * Record user registration event.
     */
    public static function authRegister(User $user, ?Request $request = null): ?AuditLog
    {
        return self::log(
            event: 'auth.register',
            category: 'auth',
            description: "New user registered: {$user->name} ({$user->email}) with role '{$user->role}'.",
            severity: 'info',
            newValues: ['id' => $user->id, 'role' => $user->role, 'email' => $user->email],
            user: $user,
            request: $request
        );
    }

    /**
     * Record unauthorized / forbidden access attempt (privilege escalation attempt).
     */
    public static function securityAccessDenied(?User $user, string $route, string $requiredRole, ?Request $request = null): ?AuditLog
    {
        $userName = $user ? "{$user->name} ({$user->email}, role: {$user->role})" : 'Guest / Unauthenticated';

        return self::log(
            event: 'security.access_denied',
            category: 'security',
            description: "Unauthorized access blocked: {$userName} attempted to access route '{$route}' requiring role '{$requiredRole}'.",
            severity: 'danger',
            newValues: [
                'required_roles' => $requiredRole,
                'user_role' => $user?->role,
                'target_route' => $route,
            ],
            user: $user,
            request: $request
        );
    }

    /**
     * Record user status change by Admin.
     */
    public static function userStatusChanged(User $admin, User $targetUser, string $oldStatus, string $newStatus): ?AuditLog
    {
        return self::log(
            event: 'user.status_changed',
            category: 'user_management',
            description: "Admin {$admin->name} changed status of user {$targetUser->name} ({$targetUser->email}) from '{$oldStatus}' to '{$newStatus}'.",
            severity: $newStatus === 'inactive' ? 'warning' : 'info',
            newValues: ['new_status' => $newStatus, 'user_id' => $targetUser->id],
            oldValues: ['old_status' => $oldStatus],
            user: $admin
        );
    }

    /**
     * Record user role change by Admin.
     */
    public static function userRoleChanged(User $admin, User $targetUser, string $oldRole, string $newRole): ?AuditLog
    {
        return self::log(
            event: 'user.role_changed',
            category: 'user_management',
            description: "Admin {$admin->name} changed role of user {$targetUser->name} ({$targetUser->email}) from '{$oldRole}' to '{$newRole}'.",
            severity: 'warning',
            newValues: ['new_role' => $newRole, 'user_id' => $targetUser->id],
            oldValues: ['old_role' => $oldRole],
            user: $admin
        );
    }

    /**
     * Record settings update by Admin.
     */
    public static function settingsUpdated(User $admin, array $oldSettings, array $newSettings): ?AuditLog
    {
        return self::log(
            event: 'settings.updated',
            category: 'settings',
            description: "Admin {$admin->name} updated platform system settings.",
            severity: 'warning',
            newValues: $newSettings,
            oldValues: $oldSettings,
            user: $admin
        );
    }

    /**
     * Sanitize array to strip sensitive values before logging.
     */
    public static function sanitize(array $data): array
    {
        $clean = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            if (in_array($lowerKey, self::$sensitiveKeys, true)) {
                $clean[$key] = '[REDACTED_SECRET]';
            } elseif (is_array($value)) {
                $clean[$key] = self::sanitize($value);
            } else {
                $clean[$key] = $value;
            }
        }

        return $clean;
    }
}
