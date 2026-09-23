<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    /**
     * Display a paginated list of audit logs with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 25), 100);

        $query = AuditLog::with('user:id,name,email,role,profile_picture')
            ->filter($request->all())
            ->latest('created_at');

        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Get security telemetry & health stats for dashboard widgets.
     */
    public function stats(): JsonResponse
    {
        $last24Hours = Carbon::now()->subHours(24);
        $last7Days = Carbon::now()->subDays(7);

        // Failed logins in the last 24 hours
        $failedLogins24h = AuditLog::where('event', 'auth.failed_login')
            ->where('created_at', '>=', $last24Hours)
            ->count();

        // Total security alerts (warning, danger, critical) in last 7 days
        $securityAlerts7d = AuditLog::whereIn('severity', ['warning', 'danger', 'critical'])
            ->where('created_at', '>=', $last7Days)
            ->count();

        // Unauthorized access blocked in last 7 days
        $unauthorizedAccessCount = AuditLog::where('event', 'security.access_denied')
            ->where('created_at', '>=', $last7Days)
            ->count();

        // Total logs count
        $totalLogs = AuditLog::count();

        // Breakdown by severity
        $severityCounts = AuditLog::select('severity', DB::raw('count(*) as count'))
            ->groupBy('severity')
            ->pluck('count', 'severity');

        // Breakdown by category
        $categoryCounts = AuditLog::select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->pluck('count', 'category');

        // Top 5 suspicious IPs (highest failed logins / security alerts)
        $suspiciousIps = AuditLog::select('ip_address', DB::raw('count(*) as incident_count'))
            ->whereNotNull('ip_address')
            ->whereIn('severity', ['warning', 'danger', 'critical'])
            ->where('created_at', '>=', $last7Days)
            ->groupBy('ip_address')
            ->orderByDesc('incident_count')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_events' => $totalLogs,
                'failed_logins_24h' => $failedLogins24h,
                'security_alerts_7d' => $securityAlerts7d,
                'unauthorized_blocked_7d' => $unauthorizedAccessCount,
                'system_health' => $failedLogins24h > 15 ? 'warning' : 'healthy',
                'severity_breakdown' => [
                    'info' => $severityCounts['info'] ?? 0,
                    'warning' => $severityCounts['warning'] ?? 0,
                    'danger' => $severityCounts['danger'] ?? 0,
                    'critical' => $severityCounts['critical'] ?? 0,
                ],
                'category_breakdown' => $categoryCounts,
                'suspicious_ips' => $suspiciousIps,
            ],
        ]);
    }

    /**
     * Display the specified audit log entry.
     */
    public function show(int $id): JsonResponse
    {
        $log = AuditLog::with('user:id,name,email,role,phone,profile_picture')->find($id);

        if (! $log) {
            return response()->json([
                'success' => false,
                'message' => 'Audit log record not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $log,
        ]);
    }
}
