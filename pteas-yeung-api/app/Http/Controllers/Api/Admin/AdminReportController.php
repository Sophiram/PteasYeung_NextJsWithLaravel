<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\OwnerPayment;
use Illuminate\Http\Request;
use Rap2hpoutre\FastExcel\FastExcel;

class AdminReportController extends Controller
{
    /**
     * Export system reports as Excel or return JSON ledger.
     * Business Logic: Admin Income is exclusively from Property Owners (Subscriptions/Fees).
     * Admin Expenses are Platform/System Operational Expenses.
     */
    public function export(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $type = $request->input('type', 'all');

        // 1. Admin Platform Income (From Property Owners)
        $paymentsQuery = OwnerPayment::with(['owner', 'property'])
            ->where('payment_status', 'paid');

        if ($startDate) {
            $paymentsQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $paymentsQuery->whereDate('created_at', '<=', $endDate);
        }
        $payments = ($type === 'all' || $type === 'income') ? $paymentsQuery->get() : collect();

        // 2. Admin Platform Expenses (System Operational Expenses)
        $expensesQuery = Expense::with(['property', 'owner'])
            ->where(function ($q) {
                $q->whereHas('owner', function ($ownerQuery) {
                    $ownerQuery->where('role', 'super_admin');
                })->orWhereNull('property_id');
            });

        if ($startDate) {
            $expensesQuery->whereDate('date', '>=', $startDate);
        }
        if ($endDate) {
            $expensesQuery->whereDate('date', '<=', $endDate);
        }
        $expenses = ($type === 'all' || $type === 'expense') ? $expensesQuery->get() : collect();

        $exportData = collect();

        // Map Owner Payments to Ledger Entries
        foreach ($payments as $payment) {
            $ownerName = optional($payment->owner)->name ?? 'Owner';
            $ownerPhone = optional($payment->owner)->phone ? ' (' . optional($payment->owner)->phone . ')' : '';
            $propertyName = optional($payment->property)->title ? ' - ' . optional($payment->property)->title : '';

            $exportData->push([
                'ថ្ងៃខែ' => optional($payment->paid_at ?? $payment->created_at)->format('Y-m-d'),
                'ប្រភេទ' => 'ចំណូលពីម្ចាស់ផ្ទះ (Owner Income)',
                'ប្រភព/ការពិពណ៌នា' => "#{$payment->invoice_number} - {$payment->title} | ម្ចាស់ផ្ទះ: {$ownerName}{$ownerPhone}{$propertyName}",
                'ទឹកប្រាក់ ($)' => (float) $payment->amount,
                'ស្ថានភាព' => 'paid',
            ]);
        }

        // Map Platform Expenses to Ledger Entries
        foreach ($expenses as $expense) {
            $adminName = optional($expense->owner)->name ?? 'System Admin';

            $exportData->push([
                'ថ្ងៃខែ' => optional($expense->date)->format('Y-m-d') ?? optional($expense->created_at)->format('Y-m-d'),
                'ប្រភេទ' => 'ចំណាយប្រតិបត្តិការប្រព័ន្ធ (Platform Expense)',
                'ប្រភព/ការពិពណ៌នា' => $expense->title . ($expense->description ? ' - ' . $expense->description : '') . " [{$adminName}]",
                'ទឹកប្រាក់ ($)' => -(float) $expense->amount,
                'ស្ថានភាព' => 'paid',
            ]);
        }

        if ($request->query('format') === 'json' || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'summary' => [
                    'total_income' => (float) $payments->sum('amount'),
                    'total_expense' => (float) $expenses->sum('amount'),
                    'net_profit' => (float) ($payments->sum('amount') - $expenses->sum('amount')),
                ],
                'data' => $exportData->sortByDesc('ថ្ងៃខែ')->values(),
            ]);
        }

        return (new FastExcel($exportData->sortByDesc('ថ្ងៃខែ')))->download('admin_platform_financial_report.xlsx');
    }
}