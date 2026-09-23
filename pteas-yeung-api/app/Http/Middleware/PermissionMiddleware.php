<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Handle an incoming request and check if user has the required permission(s).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Super Admin bypasses all checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $requiredPermissions = [];
        foreach ($permissions as $perm) {
            foreach (explode(',', (string) $perm) as $subPerm) {
                $requiredPermissions[] = trim($subPerm);
            }
        }

        if (! $user->hasAnyPermission($requiredPermissions)) {
            $requiredString = implode(', ', $requiredPermissions);

            AuditLogger::securityAccessDenied(
                $user,
                $request->path(),
                "Permission required: [{$requiredString}]",
                $request
            );

            return response()->json([
                'message' => "Forbidden. You do not have the required permission: [{$requiredString}].",
            ], 403);
        }

        return $next($request);
    }
}
