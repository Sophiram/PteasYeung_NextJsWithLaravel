<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\OwnerPayment;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get admin dashboard analytics and statistics.
     * Business Logic: Revenue comes exclusively from Property Owners (Subscriptions/Platform fees).
     */
    public function index(): JsonResponse
    {
        $userCount = User::count();
        $ownerCount = User::where('role', 'owner')->count();
        $tenantCount = User::where('role', 'tenant')->count();
        $staffCount = User::where('role', 'staff')->count();

        $propertyCount = Property::count();
        $roomCount = Room::count();
        $activeBookingsCount = Booking::where('status', 'active')->count();

        // Donut Chart: Users by role
        $donutData = [
            'series' => [$ownerCount, $tenantCount, $staffCount],
            'labels' => ['ម្ចាស់ផ្ទះ (Owners)', 'អ្នកជួល (Tenants)', 'បុគ្គលិក (Staff)'],
        ];

        // Bar Chart: Last 7 days platform operational expenses
        $categories = [];
        $values = [];
        $hasAnyExpense = false;

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $categories[] = $date->format('d/m');

            $dailyExpense = Expense::where(function ($q) {
                $q->whereHas('owner', fn($sq) => $sq->where('role', 'super_admin'))
                  ->orWhereNull('property_id');
            })->whereDate('date', $date->toDateString())->sum('amount');

            if ($dailyExpense > 0) {
                $hasAnyExpense = true;
            }
            $values[] = (float) $dailyExpense;
        }

        if (! $hasAnyExpense) {
            $values = [35, 15, 20, 10, 45, 12, 25];
        }

        $weeklyData = [
            'categories' => $categories,
            'values' => $values,
            'is_sample' => ! $hasAnyExpense,
        ];

        $totalRevenue = (float) OwnerPayment::where('payment_status', 'paid')->sum('amount');
        $totalExpenses = (float) Expense::where(function ($q) {
            $q->whereHas('owner', fn($sq) => $sq->where('role', 'super_admin'))
              ->orWhereNull('property_id');
        })->sum('amount');

        return response()->json([
            'success' => true,
            'stats' => [
                'total_users' => $userCount,
                'total_owners' => $ownerCount,
                'total_tenants' => $tenantCount,
                'total_staff' => $staffCount,
                'total_properties' => $propertyCount,
                'total_rooms' => $roomCount,
                'active_bookings' => $activeBookingsCount,
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'net_profit' => $totalRevenue - $totalExpenses,
            ],
            'chart_data' => [
                'donut' => $donutData,
                'weekly' => $weeklyData,
            ],
            'latest_data' => [
                'recent_users' => User::latest()->take(5)->get(['id', 'name', 'email', 'role', 'status', 'created_at']),
                'recent_invoices' => OwnerPayment::latest()->take(5)->with('owner:id,name,email,phone')->get(),
                'recent_properties' => Property::with('owner:id,name,email')->latest()->take(5)->get(),
            ],
            'system_info' => [
                'server_time' => now(),
                'app_version' => '1.2.0',
            ],
        ]);
    }
}