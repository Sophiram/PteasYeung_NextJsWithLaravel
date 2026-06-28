<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    // មើលបញ្ជីវិក្កយបត្រទាំងអស់របស់ Owner
    public function index(Request $request) {
        return Invoice::where('owner_id', $request->user()->id)->get();
    }

    // ចេញវិក្កយបត្រថ្មី
    public function store(Request $request) {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount'     => 'required|numeric',
            'status'     => 'required|in:paid,unpaid',
            'due_date'   => 'required|date',
        ]);

        $data = $request->all();
        $data['owner_id'] = $request->user()->id; // ភ្ជាប់ទៅម្ចាស់ផ្ទះ

        return Invoice::create($data);
    }

    // មើលវិក្កយបត្រជាក់លាក់
    public function show($id, Request $request) {
        return Invoice::where('id', $id)
                      ->where('owner_id', $request->user()->id)
                      ->firstOrFail();
    }
    // កែសម្រួលស្ថានភាពវិក្កយបត្រ (ពី Unpaid ទៅ Paid)
    public function update(Request $request, $id) {
        $invoice = Invoice::where('id', $id)
                          ->where('owner_id', $request->user()->id)
                          ->firstOrFail();

        $request->validate([
            'status' => 'required|in:paid,unpaid,partial',
        ]);

        $invoice->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Invoice status updated to ' . $request->status,
            'data' => $invoice
        ]);
    }
}
