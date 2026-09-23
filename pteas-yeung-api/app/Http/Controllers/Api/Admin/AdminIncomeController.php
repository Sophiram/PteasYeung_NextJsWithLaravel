<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\OwnerPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminIncomeController extends Controller
{
    /**
     * Display comprehensive platform income overview from Owners and transaction ledger.
     */
    public function index(Request $request): JsonResponse
    {
        // 1. Overall Summary Statistics for Platform Revenue from Owners
        $totalPaidIncome = (float) OwnerPayment::where('payment_status', 'paid')->sum('amount');
        $totalPendingIncome = (float) OwnerPayment::where('payment_status', 'pending')->sum('amount');
        $paidCount = OwnerPayment::where('payment_status', 'paid')->count();
        $unpaidCount = OwnerPayment::where('payment_status', '!=', 'paid')->count();

        // This Month Income
        $startOfMonth = Carbon::now()->startOfMonth();
        $thisMonthIncome = (float) OwnerPayment::where('payment_status', 'paid')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('amount');

        // Last Month Income for growth comparison
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();
        $lastMonthIncome = (float) OwnerPayment::where('payment_status', 'paid')
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('amount');

        $growthRate = 0;
        if ($lastMonthIncome > 0) {
            $growthRate = round((($thisMonthIncome - $lastMonthIncome) / $lastMonthIncome) * 100, 1);
        }

        // 2. Monthly Income Trend (Last 6 Months)
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = Carbon::now()->subMonths($i);
            $monthKey = $monthDate->format('Y-m');
            $monthLabel = $monthDate->format('M Y');

            $monthTotal = (float) OwnerPayment::where('payment_status', 'paid')
                ->whereYear('created_at', $monthDate->year)
                ->whereMonth('created_at', $monthDate->month)
                ->sum('amount');

            $monthlyTrend[] = [
                'month' => $monthKey,
                'label' => $monthLabel,
                'amount' => $monthTotal,
            ];
        }

        // 3. Breakdown by Property Owners (Top Contributing Landlords to Platform)
        $owners = User::where('role', 'owner')
            ->with(['properties:id,owner_id,title', 'ownerPayments'])
            ->get();

        $ownerBreakdown = [];
        foreach ($owners as $owner) {
            $paidPayments = $owner->ownerPayments->where('payment_status', 'paid');
            $totalCollected = (float) $paidPayments->sum('amount');
            $paymentCount = $paidPayments->count();

            $ownerBreakdown[] = [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
                'phone' => $owner->phone,
                'properties_count' => $owner->properties->count(),
                'total_collected' => $totalCollected,
                'invoice_count' => $paymentCount,
            ];
        }

        // Sort owners by highest paid first
        usort($ownerBreakdown, fn($a, $b) => $b['total_collected'] <=> $a['total_collected']);

        // 4. Invoices / Payments Query with Search & Filtering
        $query = OwnerPayment::with([
            'owner:id,name,email,phone,status,profile_picture',
            'property:id,title,address',
        ])->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('payment_status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhereHas('owner', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $invoices = $query->take(100)->get();

        return response()->json([
            'success' => true,
            'summary' => [
                'total_income' => $totalPaidIncome,
                'pending_income' => $totalPendingIncome,
                'this_month_income' => $thisMonthIncome,
                'growth_rate' => $growthRate,
                'paid_count' => $paidCount,
                'unpaid_count' => $unpaidCount,
            ],
            'monthly_trend' => $monthlyTrend,
            'property_breakdown' => $ownerBreakdown,
            'invoices' => $invoices,
        ]);
    }

    /**
     * Mark an owner payment as paid / collect payment from owner.
     */
    public function markCollected(Request $request, $id): JsonResponse
    {
        $payment = OwnerPayment::with(['owner'])->findOrFail($id);
        $payment->payment_status = 'paid';
        $payment->paid_at = now();
        $payment->save();

        // Send notification to owner & activate account if pending
        if ($payment->owner) {
            if ($payment->owner->status === 'pending') {
                $payment->owner->status = 'active';
                $payment->owner->save();
            }

            Notification::sendToUser(
                $payment->owner->id,
                'ការទូទាត់ត្រូវបានបញ្ជាក់ (Platform Payment Confirmed)',
                "វិក្កយបត្រថ្លៃសេវា #{$payment->invoice_number} ចំនួន $" . number_format($payment->amount, 2) . " ត្រូវបានបញ្ជាក់ថាបានបង់រួចរាល់!",
                'success',
                '/dashboard/owner'
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'ការទូទាត់ត្រូវបានកត់ត្រាជោគជ័យ!',
            'data' => $payment->load(['owner:id,name,email,phone', 'property:id,title']),
        ]);
    }
}