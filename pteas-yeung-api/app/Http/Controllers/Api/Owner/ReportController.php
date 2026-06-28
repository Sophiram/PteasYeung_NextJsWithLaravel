<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Expense;
use Illuminate\Support\Facades\DB;
use Rap2hpoutre\FastExcel\FastExcel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'សូមទោស! Token របស់បងមិនត្រឹមត្រូវ ឬមិនទាន់បានផ្ញើមក (Unauthenticated).'
                ], 401);
            }

            $ownerId = $request->user()->id;
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $type = $request->input('type', 'all'); // 'all', 'income', or 'expense'

            // ១. ទាញយកចំណូល (Invoices)
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
                    'rooms.room_number'
                );

            if ($startDate) $invoicesQuery->whereDate('invoices.created_at', '>=', $startDate);
            if ($endDate) $invoicesQuery->whereDate('invoices.created_at', '<=', $endDate);

            $invoices = ($type === 'all' || $type === 'income') ? $invoicesQuery->get() : collect();

            // ២. ទាញយកចំណាយ (Expenses)
            $expensesQuery = DB::table('expenses')
                ->where('owner_id', $ownerId)
                ->select(
                    'id',
                    'amount',
                    'created_at',
                    'description'
                );

            if ($startDate) $expensesQuery->whereDate('created_at', '>=', $startDate);
            if ($endDate) $expensesQuery->whereDate('created_at', '<=', $endDate);

            $expenses = ($type === 'all' || $type === 'expense') ? $expensesQuery->get() : collect();

            // ៣. គណនាផលសរុប (Summary)
            $totalIncome = $invoices->sum('total_amount');
            $totalExpense = $expenses->sum('amount');
            $netProfit = $totalIncome - $totalExpense;

            // ៤. ធ្វើ Format ទិន្នន័យបញ្ចូលគ្នា
            $formattedTransactions = collect();

            foreach ($invoices as $invoice) {
                $formattedTransactions->push([
                    'id' => $invoice->id,
                    'type' => 'income',
                    'amount' => (float) $invoice->total_amount,
                    'status' => $invoice->payment_status,
                    'created_at' => $invoice->created_at,
                    'description' => 'វិក្កយបត្របន្ទប់: ' . ($invoice->room_number ?? 'N/A')
                ]);
            }

            foreach ($expenses as $expense) {
                $formattedTransactions->push([
                    'id' => $expense->id,
                    'type' => 'expense',
                    'amount' => (float) $expense->amount,
                    'status' => 'paid',
                    'created_at' => $expense->created_at,
                    'description' => $expense->description ?? 'ចំណាយផ្សេងៗ'
                ]);
            }

            $sortedTransactions = $formattedTransactions->sortByDesc('created_at')->values();

            // ៥. ធ្វើការបែងចែកទំព័រ (Manual Pagination)
            $perPage = 10;
            $page = (int) $request->input('page', 1);
            $pagedData = $sortedTransactions->forPage($page, $perPage)->values();

            return response()->json([
                'success' => true,
                'summary' => [
                    'total_income' => (float)$totalIncome,
                    'total_expense' => (float)$totalExpense,
                    'net_profit' => (float)$netProfit
                ],
                'data' => [
                    'current_page' => $page,
                    'data' => $pagedData,
                    'last_page' => (int)ceil($sortedTransactions->count() / $perPage),
                    'total' => $sortedTransactions->count()
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'កំហុស Database (Debug): ' . $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $ownerId = $request->user()->id;
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $type = $request->input('type', 'all');

            // Invoices Filter
            $invoicesQuery = Invoice::whereHas('booking.room.property', function ($q) use ($ownerId) {
                $q->where('owner_id', $ownerId);
            });

            if ($startDate) $invoicesQuery->whereDate('created_at', '>=', $startDate);
            if ($endDate) $invoicesQuery->whereDate('created_at', '<=', $endDate);

            $invoices = ($type === 'all' || $type === 'income') ? $invoicesQuery->get() : collect();

            // Expenses Filter
            $expensesQuery = Expense::where('owner_id', $ownerId);

            if ($startDate) $expensesQuery->whereDate('created_at', '>=', $startDate);
            if ($endDate) $expensesQuery->whereDate('created_at', '<=', $endDate);

            $expenses = ($type === 'all' || $type === 'expense') ? $expensesQuery->get() : collect();

            $exportData = collect();

            foreach ($invoices as $invoice) {
                $exportData->push([
                    'ថ្ងៃខែ' => $invoice->created_at->format('Y-m-d'),
                    'ប្រភេទ' => 'ចំណូល (Income)',
                    'ប្រភព/ការពិពណ៌នា' => 'វិក្កយបត្របន្ទប់: ' . (optional(optional($invoice->booking)->room)->room_number ?? 'N/A'),
                    'ទឹកប្រាក់ ($)' => $invoice->total_amount,
                    'ស្ថានភាព' => $invoice->payment_status,
                ]);
            }

            foreach ($expenses as $expense) {
                $exportData->push([
                    'ថ្ងៃខែ' => $expense->created_at->format('Y-m-d'),
                    'ប្រភេទ' => 'ចំណាយ (Expense)',
                    'ប្រភព/ការពិពណ៌នា' => $expense->description ?? 'ចំណាយផ្សេងៗ',
                    'ទឹកប្រាក់ ($)' => -$expense->amount,
                    'ស្ថានភាព' => 'paid',
                ]);
            }

            return (new FastExcel($exportData->sortByDesc('ថ្ងៃខែ')))->download('financial_report.xlsx');

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
