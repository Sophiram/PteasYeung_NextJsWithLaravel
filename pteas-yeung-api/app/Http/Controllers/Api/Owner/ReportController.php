<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Rap2hpoutre\FastExcel\FastExcel;

class ReportController extends Controller
{
    /**
     * Get owner financial report summary with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $ownerId = $request->user()->id;
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $type = $request->input('type', 'all');

            // 1. Incomes (Paid Invoices)
            $invoicesQuery = DB::table('invoices')
                ->join('bookings', 'invoices.booking_id', '=', 'bookings.id')
                ->join('rooms', 'bookings.room_id', '=', 'rooms.id')
                ->join('properties', 'rooms.property_id', '=', 'properties.id')
                ->where('properties.owner_id', $ownerId)
                ->where('invoices.payment_status', 'paid')
                ->select(
                    'invoices.id',
                    'invoices.total_amount',
                    'invoices.payment_status',
                    'invoices.created_at',
                    'rooms.room_number',
                    'properties.title as property_title'
                );

            if ($startDate) {
                $invoicesQuery->whereDate('invoices.created_at', '>=', $startDate);
            }
            if ($endDate) {
                $invoicesQuery->whereDate('invoices.created_at', '<=', $endDate);
            }

            $invoices = ($type === 'all' || $type === 'income') ? $invoicesQuery->get() : collect();

            // 2. Expenses
            $expensesQuery = DB::table('expenses')
                ->leftJoin('properties', 'expenses.property_id', '=', 'properties.id')
                ->where('expenses.owner_id', $ownerId)
                ->select(
                    'expenses.id',
                    'expenses.amount',
                    'expenses.date',
                    'expenses.created_at',
                    'expenses.description',
                    'expenses.title',
                    'properties.title as property_title'
                );

            if ($startDate) {
                $expensesQuery->whereDate('expenses.date', '>=', $startDate);
            }
            if ($endDate) {
                $expensesQuery->whereDate('expenses.date', '<=', $endDate);
            }

            $expenses = ($type === 'all' || $type === 'expense') ? $expensesQuery->get() : collect();

            // 3. Totals
            $totalIncome = $invoices->sum('total_amount');
            $totalExpense = $expenses->sum('amount');
            $netProfit = $totalIncome - $totalExpense;

            // 4. Combine and Sort
            $formattedTransactions = collect();

            foreach ($invoices as $invoice) {
                $formattedTransactions->push([
                    'id' => $invoice->id,
                    'type' => 'income',
                    'amount' => (float) $invoice->total_amount,
                    'status' => $invoice->payment_status,
                    'date' => $invoice->created_at,
                    'created_at' => $invoice->created_at,
                    'description' => 'វិក្កយបត្របន្ទប់: '.($invoice->room_number ?? 'N/A').($invoice->property_title ? ' ('.$invoice->property_title.')' : ''),
                ]);
            }

            foreach ($expenses as $expense) {
                $formattedTransactions->push([
                    'id' => $expense->id,
                    'type' => 'expense',
                    'amount' => (float) $expense->amount,
                    'status' => 'paid',
                    'date' => $expense->date ?? $expense->created_at,
                    'created_at' => $expense->created_at,
                    'description' => ($expense->title ?? $expense->description ?? 'ចំណាយផ្សេងៗ').($expense->property_title ? ' ('.$expense->property_title.')' : ''),
                ]);
            }

            $sortedTransactions = $formattedTransactions->sortByDesc('date')->values();

            // 5. Pagination
            $perPage = (int) $request->input('per_page', 10);
            $page = (int) $request->input('page', 1);
            $pagedData = $sortedTransactions->forPage($page, $perPage)->values();

            return response()->json([
                'success' => true,
                'summary' => [
                    'total_income' => (float) $totalIncome,
                    'total_expense' => (float) $totalExpense,
                    'net_profit' => (float) $netProfit,
                ],
                'data' => [
                    'current_page' => $page,
                    'data' => $pagedData,
                    'last_page' => (int) ceil($sortedTransactions->count() / max($perPage, 1)),
                    'total' => $sortedTransactions->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'កំហុស Database: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export financial report to Excel with eager loading and paid income filter.
     */
    public function export(Request $request)
    {
        $ownerId = $request->user()->id;
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $type = $request->input('type', 'all');

        $propertyIds = DB::table('properties')->where('owner_id', $ownerId)->pluck('id');

        $invoicesQuery = Invoice::whereHas('booking', function ($q) use ($ownerId, $propertyIds) {
            $q->where('owner_id', $ownerId)
              ->orWhereHas('room', function ($rq) use ($propertyIds) {
                  $rq->whereIn('property_id', $propertyIds);
              });
        })
            ->where('payment_status', 'paid')
            ->with(['booking.room.property', 'booking.tenant']);

        if ($startDate) {
            $invoicesQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $invoicesQuery->whereDate('created_at', '<=', $endDate);
        }

        $invoices = ($type === 'all' || $type === 'income') ? $invoicesQuery->get() : collect();

        $expensesQuery = Expense::where(function ($q) use ($ownerId, $propertyIds) {
            $q->where('owner_id', $ownerId)
              ->orWhereIn('property_id', $propertyIds);
        })->with('property:id,title');

        if ($startDate) {
            $expensesQuery->whereDate('date', '>=', $startDate);
        }
        if ($endDate) {
            $expensesQuery->whereDate('date', '<=', $endDate);
        }

        $expenses = ($type === 'all' || $type === 'expense') ? $expensesQuery->get() : collect();

        $exportData = collect();

        foreach ($invoices as $invoice) {
            $roomNumber = optional(optional($invoice->booking)->room)->room_number ?? 'N/A';
            $propertyName = optional(optional(optional($invoice->booking)->room)->property)->title ?? '';
            $tenantName = optional(optional($invoice->booking)->tenant)->name ?? '';

            $exportData->push([
                'ថ្ងៃខែ' => optional($invoice->created_at)->format('Y-m-d'),
                'ប្រភេទ' => 'ចំណូល (Income)',
                'ប្រភព/ការពិពណ៌នា' => 'វិក្កយបត្របន្ទប់: '.$roomNumber.($propertyName ? " ($propertyName)" : '').($tenantName ? " - $tenantName" : ''),
                'ទឹកប្រាក់ ($)' => (float) $invoice->total_amount,
                'ស្ថានភាព' => $invoice->payment_status,
            ]);
        }

        foreach ($expenses as $expense) {
            $propertyName = optional($expense->property)->title ?? '';
            $exportData->push([
                'ថ្ងៃខែ' => optional($expense->date)->format('Y-m-d') ?? optional($expense->created_at)->format('Y-m-d'),
                'ប្រភេទ' => 'ចំណាយ (Expense)',
                'ប្រភព/ការពិពណ៌នា' => ($expense->title ?? $expense->description ?? 'ចំណាយផ្សេងៗ').($propertyName ? " ($propertyName)" : ''),
                'ទឹកប្រាក់ ($)' => -(float) $expense->amount,
                'ស្ថានភាព' => 'paid',
            ]);
        }

        $totalIncome = (float) $invoices->sum('total_amount');
        $totalExpense = (float) $expenses->sum('amount');
        $netProfit = $totalIncome - $totalExpense;

        if ($request->query('format') === 'json' || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'summary' => [
                    'total_income' => $totalIncome,
                    'total_expense' => $totalExpense,
                    'net_profit' => $netProfit,
                ],
                'data' => $exportData->sortByDesc('ថ្ងៃខែ')->values(),
            ]);
        }

        return (new FastExcel($exportData->sortByDesc('ថ្ងៃខែ')))->download('financial_report.xlsx');
    }
}
