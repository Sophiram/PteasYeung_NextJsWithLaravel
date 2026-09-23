<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display dashboard analytics for the authenticated owner.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $ownerId = Auth::id();
            if (! $ownerId) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $propertyId = $request->query('property_id');
            $month = $request->query('month');
            $year = $request->query('year', date('Y'));

            // Normalize month (support both 0-11 JS format and 1-12 standard format)
            $normalizedMonth = null;
            if ($month !== null && $month !== '') {
                $monthInt = (int) $month;
                // If 0-11, convert to 1-12
                $normalizedMonth = ($monthInt >= 0 && $monthInt <= 11) ? $monthInt + 1 : $monthInt;
            }

            $propertiesList = Property::where('owner_id', $ownerId)->select('id', 'title as name')->get();

            $totalProperties = Property::where('owner_id', $ownerId)->count();

            $roomsQuery = Room::whereHas('property', function ($query) use ($ownerId, $propertyId) {
                $query->where('owner_id', $ownerId);
                if ($propertyId) {
                    $query->where('id', $propertyId);
                }
            });

            $totalRooms = (clone $roomsQuery)->count();
            $availableRooms = (clone $roomsQuery)->whereRaw('LOWER(status) = ?', ['available'])->count();
            $occupiedRooms = (clone $roomsQuery)->whereRaw('LOWER(status) = ?', ['occupied'])->count();
            $maintenanceRooms = (clone $roomsQuery)->whereRaw('LOWER(status) = ?', ['maintenance'])->count();

            $totalBookings = Booking::where('owner_id', $ownerId)
                ->when($propertyId, function ($query) use ($propertyId) {
                    return $query->whereHas('room', fn ($q) => $q->where('property_id', $propertyId));
                })
                ->when($year, fn ($q) => $q->whereYear('created_at', $year))
                ->when($normalizedMonth, fn ($q) => $q->whereMonth('created_at', $normalizedMonth))
                ->count();

            $totalExpense = Expense::where('owner_id', $ownerId)
                ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
                ->when($year, fn ($q) => $q->whereYear('date', $year))
                ->when($normalizedMonth, fn ($q) => $q->whereMonth('date', $normalizedMonth))
                ->sum('amount');

            $totalRevenue = Invoice::whereHas('booking', function ($q) use ($ownerId, $propertyId) {
                $q->where('owner_id', $ownerId);
                if ($propertyId) {
                    $q->whereHas('room', fn ($r) => $r->where('property_id', $propertyId));
                }
            })
                ->where('payment_status', 'paid')
                ->when($year, fn ($q) => $q->whereYear('created_at', $year))
                ->when($normalizedMonth, fn ($q) => $q->whereMonth('created_at', $normalizedMonth))
                ->sum('total_amount');

            // Donut chart: Rooms distribution per property (optimized with withCount to avoid N+1)
            $propertiesForChart = Property::where('owner_id', $ownerId)
                ->when($propertyId, fn ($q) => $q->where('id', $propertyId))
                ->withCount('rooms')
                ->get();

            $propertiesRoomsData = $propertiesForChart->map(fn ($property) => [
                'property_name' => $property->title,
                'rooms_count' => $property->rooms_count,
            ]);

            // Bar chart: Monthly revenue and expense trends
            $barChartData = $this->getMonthlyRevenueExpense($ownerId, $propertyId, $year);

            return response()->json([
                'success' => true,
                'properties' => $propertiesList,
                'stats' => [
                    'total_properties' => $totalProperties,
                    'total_rooms' => $totalRooms,
                    'available_rooms' => $availableRooms,
                    'occupied_rooms' => $occupiedRooms,
                    'maintenance_rooms' => $maintenanceRooms,
                    'total_bookings' => $totalBookings,
                    'total_revenue' => (float) $totalRevenue,
                    'total_expense' => (float) $totalExpense,
                    'net_profit' => (float) ($totalRevenue - $totalExpense),
                ],
                'donut_chart' => $propertiesRoomsData,
                'bar_chart' => $barChartData,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'កំហុស Dashboard: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Compute monthly revenue and expense trends with cross-database compatibility (Postgres, SQLite, MySQL).
     */
    private function getMonthlyRevenueExpense($ownerId, $propertyId, $year): array
    {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $barChartData = [];

        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            $monthExpenseExpr = "cast(strftime('%m', date) as integer)";
            $monthInvoiceExpr = "cast(strftime('%m', invoices.created_at) as integer)";
        } elseif ($driver === 'pgsql') {
            $monthExpenseExpr = 'cast(extract(month from date) as integer)';
            $monthInvoiceExpr = 'cast(extract(month from invoices.created_at) as integer)';
        } else {
            $monthExpenseExpr = 'MONTH(date)';
            $monthInvoiceExpr = 'MONTH(invoices.created_at)';
        }

        $expenses = Expense::where('owner_id', $ownerId)
            ->whereYear('date', $year)
            ->when($propertyId, function ($query) use ($propertyId) {
                return $query->where('property_id', $propertyId);
            })
            ->select(DB::raw("{$monthExpenseExpr} as month"), DB::raw('SUM(amount) as total'))
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        $revenues = DB::table('invoices')
            ->join('bookings', 'invoices.booking_id', '=', 'bookings.id')
            ->join('rooms', 'bookings.room_id', '=', 'rooms.id')
            ->join('properties', 'rooms.property_id', '=', 'properties.id')
            ->where('properties.owner_id', $ownerId)
            ->where('invoices.payment_status', 'paid')
            ->whereYear('invoices.created_at', $year)
            ->when($propertyId, function ($query) use ($propertyId) {
                return $query->where('properties.id', $propertyId);
            })
            ->select(DB::raw("{$monthInvoiceExpr} as month"), DB::raw('SUM(invoices.total_amount) as total'))
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        foreach ($months as $index => $monthName) {
            $monthNum = $index + 1;
            $barChartData[] = [
                'name' => $monthName,
                'revenue' => (float) ($revenues[$monthNum] ?? 0),
                'expense' => (float) ($expenses[$monthNum] ?? 0),
            ];
        }

        return $barChartData;
    }
}
