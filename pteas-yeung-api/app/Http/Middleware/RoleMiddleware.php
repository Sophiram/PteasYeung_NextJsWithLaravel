<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request and check if user has the allowed role(s).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $allowedRoles = [];
        foreach ($roles as $role) {
            foreach (explode(',', (string) $role) as $subRole) {
                $allowedRoles[] = trim($subRole);
            }
        }

        if (! in_array($user->role, $allowedRoles, true)) {
            \App\Services\AuditLogger::securityAccessDenied(
                $user,
                $request->path(),
                implode(', ', $allowedRoles),
                $request
            );

            return response()->json([
                'message' => 'Forbidden. You do not have the required permissions.',
            ], 403);
        }

        return $next($request);
    }
}
