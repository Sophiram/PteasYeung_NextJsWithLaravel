<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Property;
use App\Models\Room;
use App\Models\Booking;
use App\Models\Expense;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
   public function index(Request $request)
    {
        try {
            $ownerId = Auth::id();
            if (!$ownerId) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            // Capture new filter parameters
            $propertyId = $request->query('property_id');
            $month = $request->query('month');
            $year = $request->query('year', date('Y')); // Default to current year if not provided

            $propertiesList = Property::where('owner_id', $ownerId)->select('id', 'title as name')->get();

            $totalProperties = Property::where('owner_id', $ownerId)->count();

            $totalRooms = Room::whereHas('property', function ($query) use ($ownerId, $propertyId) {
                $query->where('owner_id', $ownerId);
                if ($propertyId) $query->where('id', $propertyId);
            })->count();

            // Apply year/month filters to bookings if you want the stats cards to be reactive
            $totalBookings = Booking::where('owner_id', $ownerId)
                ->when($propertyId, function ($query) use ($propertyId) {
                    return $query->whereHas('room', fn($q) => $q->where('property_id', $propertyId));
                })
                ->when($year, fn($q) => $q->whereYear('created_at', $year))
                ->when($month !== null && $month !== '', fn($q) => $q->whereMonth('created_at', (int)$month + 1)) // JS months are 0-11, SQL is 1-12
                ->count();

            $totalExpense = Expense::where('owner_id', $ownerId)
                ->when($propertyId, fn($query) => $query->where('property_id', $propertyId))
                ->when($year, fn($q) => $q->whereYear('created_at', $year))
                ->when($month !== null && $month !== '', fn($q) => $q->whereMonth('created_at', (int)$month + 1))
                ->sum('amount');

            $propertiesRoomsData = [];
            $propertiesForChart = Property::where('owner_id', $ownerId)
                ->when($propertyId, fn($q) => $q->where('id', $propertyId))
                ->get();

            foreach ($propertiesForChart as $property) {
                $propertiesRoomsData[] = [
                    'property_name' => $property->title,
                    'rooms_count' => Room::where('property_id', $property->id)->count()
                ];
            }

            // Pass the selected year to the chart method
            $barChartData = $this->getMonthlyRevenueExpense($ownerId, $propertyId, $year);

            return response()->json([
                'success' => true,
                'properties' => $propertiesList,
                'stats' => [
                    'total_properties' => $totalProperties,
                    'total_rooms' => $totalRooms,
                    'total_bookings' => $totalBookings,
                    'total_expense' => (float)$totalExpense,
                ],
                'donut_chart' => $propertiesRoomsData,
                'bar_chart' => $barChartData
            ], 200);

       } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'កំហុស Dashboard: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    // Accept the dynamic $year parameter
    private function getMonthlyRevenueExpense($ownerId, $propertyId, $year)
    {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $barChartData = [];

        $expenses = Expense::where('owner_id', $ownerId)
            ->whereYear('created_at', $year) // Use dynamic year instead of hardcoded date('Y')
            ->when($propertyId, function ($query) use ($propertyId) {
                return $query->where('property_id', $propertyId);
            })
            ->select(DB::raw('MONTH(created_at) as month'), DB::raw('SUM(amount) as total'))
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        $revenues = DB::table('invoices')
            ->join('bookings', 'invoices.booking_id', '=', 'bookings.id')
            ->join('rooms', 'bookings.room_id', '=', 'rooms.id')
            ->join('properties', 'rooms.property_id', '=', 'properties.id')
            ->where('properties.owner_id', $ownerId)
            ->where('invoices.payment_status', 'paid')
            ->whereYear('invoices.created_at', $year) // Use dynamic year
            ->when($propertyId, function ($query) use ($propertyId) {
                return $query->where('properties.id', $propertyId);
            })
            ->select(DB::raw('MONTH(invoices.created_at) as month'), DB::raw('SUM(invoices.total_amount) as total'))
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        foreach ($months as $index => $monthName) {
            $monthNum = $index + 1;
            $barChartData[] = [
                'name' => $monthName,
                'revenue' => (float)($revenues[$monthNum] ?? 0),
                'expense' => (float)($expenses[$monthNum] ?? 0)
            ];
        }

        return $barChartData;
    }
}
