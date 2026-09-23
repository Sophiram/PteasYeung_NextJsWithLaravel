<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminInvoiceController extends Controller
{
    /**
     * Display a listing of all invoices in the system.
     */
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::with(['booking.room.property.owner', 'booking.tenant', 'booking.owner'])
            ->when($request->filled('payment_status'), function ($q) use ($request) {
                $q->where('payment_status', $request->payment_status);
            })
            ->latest()
            ->get();

        return response()->json($invoices);
    }

    /**
     * Store a newly created invoice by Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'electricity_start_unit' => 'required|numeric|min:0',
            'electricity_end_unit' => 'required|numeric|min:0',
            'water_unit' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|in:paid,unpaid,partial',
            'due_date' => 'required|date',
        ]);

        $invoice = Invoice::create($validated);

        return response()->json([
            'message' => 'បង្កើតវិក្កយបត្របានជោគជ័យ!',
            'data' => $invoice->load(['booking.room.property.owner', 'booking.tenant', 'booking.owner']),
        ], 201);
    }

    /**
     * Display the specified invoice.
     */
    public function show($id): JsonResponse
    {
        $invoice = Invoice::with(['booking.room.property.owner', 'booking.tenant', 'booking.owner'])->findOrFail($id);

        return response()->json($invoice);
    }

    /**
     * Update the specified invoice.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'booking_id' => 'sometimes|required|exists:bookings,id',
            'electricity_start_unit' => 'sometimes|required|numeric|min:0',
            'electricity_end_unit' => 'sometimes|required|numeric|min:0',
            'water_unit' => 'sometimes|required|numeric|min:0',
            'total_amount' => 'sometimes|required|numeric|min:0',
            'payment_status' => 'sometimes|required|in:paid,unpaid,partial',
            'due_date' => 'sometimes|required|date',
        ]);

        $invoice->update($validated);

        return response()->json([
            'message' => 'ធ្វើបច្ចុប្បន្នភាពបានជោគជ័យ!',
            'data' => $invoice->load(['booking.room.property', 'booking.tenant']),
        ]);
    }

    /**
     * Remove the specified invoice.
     */
    public function destroy($id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        return response()->json([
            'message' => 'លុបវិក្កយបត្របានជោគជ័យ!',
        ]);
    }
}
