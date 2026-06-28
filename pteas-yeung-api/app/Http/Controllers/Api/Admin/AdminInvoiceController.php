<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;

class AdminInvoiceController extends Controller
{
    // 🟢 GET: /api/admin/invoices (មើលបញ្ជីវិក្កយបត្រទាំងអស់ក្នុងប្រព័ន្ធ)
    public function index()
    {
        // ទាញយកវិក្កយបត្រទាំងអស់ រួមទាំងព័ត៌មាន Tenant ឬ Booking បើមាន (ឧទាហរណ៍៖ជាមួយ 'user')
        $invoices = Invoice::orderBy('created_at', 'desc')->get();
        return response()->json($invoices);
    }

    // 🟢 POST: /api/admin/invoices (បង្កើតវិក្កយបត្រថ្មីដោយ Admin)
   public function store(Request $request)
{
    // ១. កែ Validation ឱ្យត្រូវនឹង Table
    $validated = $request->validate([
        'booking_id' => 'required|exists:bookings,id',
        'electricity_start_unit' => 'required|numeric',
        'electricity_end_unit'   => 'required|numeric',
        'water_unit' => 'required|numeric',
        'total_amount' => 'required|numeric',
        'payment_status' => 'required|in:paid,unpaid,partial',
        'due_date'   => 'required|date',
    ]);

    // ២. បញ្ចូលទិន្នន័យទៅតាម Column ពិតប្រាកដ
    $invoice = Invoice::create([
        'booking_id'             => $request->booking_id,
        'electricity_start_unit' => $request->electricity_start_unit,
        'electricity_end_unit'   => $request->electricity_end_unit,
        'water_unit'             => $request->water_unit,
        'total_amount'           => $request->total_amount,
        'payment_status'         => $request->payment_status,
        'due_date'               => $request->due_date,
    ]);

    return response()->json([
        'message' => 'បង្កើតវិក្កយបត្របានជោគជ័យ!',
        'data' => $invoice
    ], 201);
}

    // 🟡 PUT: /api/admin/invoices/{id} (កែប្រែព័ត៌មានវិក្កយបត្រ)
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        // កែសម្រួលលក្ខខណ្ឌឱ្យត្រូវនឹងទិន្នន័យពិតប្រាកដដែលផ្ញើមកពី Next.js
        $validated = $request->validate([
            'booking_id'             => 'sometimes|required|exists:bookings,id',
            'electricity_start_unit' => 'sometimes|required|numeric',
            'electricity_end_unit'   => 'sometimes|required|numeric',
            'water_unit'             => 'sometimes|required|numeric',
            'total_amount'           => 'sometimes|required|numeric',
            'payment_status'         => 'sometimes|required|in:paid,unpaid,partial',
            'due_date'               => 'sometimes|required|date',
        ]);

        // ធ្វើបច្ចុប្បន្នភាពទិន្នន័យដែលបានផ្ទៀងផ្ទាត់រួច
        $invoice->update($validated);

        return response()->json([
            'message' => 'ធ្វើបច្ចុប្បន្នភាពបានជោគជ័យ!',
            'data' => $invoice
        ]);
    }

    // 🔴 DELETE: /api/admin/invoices/{id} (លុបវិក្កយបត្រ)
    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        return response()->json([
            'message' => 'លុបវិក្កយបត្របានជោគជ័យ!'
        ]);
    }
}
