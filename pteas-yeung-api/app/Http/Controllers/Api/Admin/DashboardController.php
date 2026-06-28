<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\{User, Property, Room, Invoice, Expense};
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $userCount = User::count();
        $propertyCount = Property::count();
        $roomCount = Room::count();

        // 📊 ការរៀបចំទិន្នន័យសម្រាប់ Donut Chart
        $donutData = [
            'series' => [$userCount, $propertyCount, $roomCount],
            'labels' => ['សមាជិកសរុប', 'អចលនទ្រព្យ', 'បន្ទប់ជួលសរុប']
        ];

        // 📈 ការរៀបចំទិន្នន័យសម្រាប់ Bar Chart
        $categories = [];
        $values = [];
        $hasAnyExpense = false;

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $categories[] = $date->format('d/m');

            $dailyExpense = Expense::whereDate('created_at', $date->toDateString())->sum('amount');
            if ($dailyExpense > 0) {
                $hasAnyExpense = true;
            }
            $values[] = (float) $dailyExpense;
        }

        // 💡 ដំណោះស្រាយ៖ ប្រសិនបើគ្មានទិន្នន័យការចំណាយសោះក្នុង DB ៧ ថ្ងៃនេះ ត្រូវយកទិន្នន័យគំរូជំនួស
        if (!$hasAnyExpense) {
            $values = [65, 45, 75, 50, 85, 30, 45]; // ចំនួនគំរូស្រដៀង Sneat Template
        }

        $weeklyData = [
            'categories' => $categories,
            'values' => $values,
            'is_sample' => !$hasAnyExpense // ប្រាប់ Frontend ថាជាទិន្នន័យគំរូ ឬពិត
        ];

        return response()->json([
            'stats' => [
                'total_users'      => $userCount,
                'total_properties' => $propertyCount,
                'total_rooms'      => $roomCount,
                'total_revenue'    => Invoice::where('payment_status', 'paid')->sum('total_amount'),
                'total_expenses'   => Expense::sum('amount'),
            ],
            'chart_data' => [
                'donut'  => $donutData,
                'weekly' => $weeklyData
            ],
            'latest_data' => [
                'recent_users' => User::latest()->take(5)->get(['id', 'name', 'email', 'created_at']),
                'recent_invoices' => Invoice::latest()->take(5)->with('user:id,name')->get(),
                'pending_properties' => Property::latest()->take(5)->get(),
            ],
            'system_info' => [
                'server_time' => now(),
                'app_version' => '1.0.0'
            ]
        ]);
    }
}
