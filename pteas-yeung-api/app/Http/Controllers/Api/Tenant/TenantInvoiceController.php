<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantInvoiceController extends Controller
{
    /**
     * Display a listing of invoices belonging to the authenticated tenant.
     */
    public function myInvoices(Request $request): JsonResponse
    {
        $tenantId = $request->user()->id;

        $invoices = Invoice::whereHas('booking', function ($query) use ($tenantId) {
            $query->where('tenant_id', $tenantId);
        })
            ->with([
                'booking.room.property.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions',
                'booking.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions',
                'booking.tenant:id,name,phone,email'
            ])
            ->when($request->filled('payment_status'), function ($query) use ($request) {
                $query->where('payment_status', $request->payment_status);
            })
            ->latest('due_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $invoices,
            'stats' => [
                'total_amount' => (float) $invoices->sum('total_amount'),
                'unpaid_amount' => (float) $invoices->where('payment_status', 'unpaid')->sum('total_amount'),
                'paid_amount' => (float) $invoices->where('payment_status', 'paid')->sum('total_amount'),
            ],
        ]);
    }

    /**
     * Display the specified invoice for the authenticated tenant.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $tenantId = $request->user()->id;

        $invoice = Invoice::where('id', $id)
            ->whereHas('booking', function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId);
            })
            ->with([
                'booking.room.property.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions',
                'booking.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions',
                'booking.tenant:id,name,phone,email'
            ])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ]);
    }

    /**
     * Submit payment proof for an invoice.
     *
     * This endpoint does NOT mark the invoice as paid directly.
     * The tenant submits a payment note / reference number and the invoice
     * is set to "pending_verification". The owner or staff must then confirm
     * receipt of payment via their dashboard before the invoice is marked paid.
     */
    public function pay(Request $request, $id): JsonResponse
    {
        $tenantId = $request->user()->id;

        $invoice = Invoice::where('id', $id)
            ->whereHas('booking', function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId);
            })
            ->with(['booking.room.property.owner', 'booking.owner', 'booking.tenant'])
            ->firstOrFail();

        // Only allow submission if the invoice is currently unpaid
        if ($invoice->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'វិក្កយបត្រនេះត្រូវបានទូទាត់រួចរាល់ហើយ។',
            ], 422);
        }

        $request->validate([
            'payment_note' => 'nullable|string|max:500',
        ]);

        // Set to pending_verification — owner/staff must confirm
        $invoice->payment_status = 'pending_verification';
        $invoice->payment_note   = $request->input('payment_note');
        $invoice->submitted_at   = now();
        $invoice->save();

        $paymentNote  = $request->input('payment_note') ? " (សម្គាល់៖ " . $request->input('payment_note') . ")" : "";
        $roomNumber   = $invoice->booking->room->room_number ?? 'បន្ទប់';

        // 🔔 Notify Property Owner to verify and confirm payment
        $ownerId = $invoice->booking->owner_id ?? $invoice->booking->room->property->owner_id ?? null;
        if ($ownerId) {
            \App\Models\Notification::sendToUser(
                $ownerId,
                'ការស្នើសុំបញ្ជាក់ការទូទាត់ (Payment Verification Required)',
                "អ្នកជួល {$request->user()->name} បានដាក់ស្នើការទូទាត់វិក្កយបត្រ #{$invoice->id} ចំនួន $" . number_format($invoice->total_amount, 2) . " សម្រាប់បន្ទប់ {$roomNumber}{$paymentNote}។ សូមផ្ទៀងផ្ទាត់ និងបញ្ជាក់ការទូទាត់។",
                'payment',
                '/dashboard/owner/invoices'
            );
        }

        // 🔔 Notify Super Admin
        \App\Models\Notification::sendToRole(
            'super_admin',
            'ការស្នើការទូទាត់ (Payment Submitted)',
            "វិក្កយបត្រ #{$invoice->id} ចំនួន $" . number_format($invoice->total_amount, 2) . " ត្រូវបានដាក់ស្នើដោយអ្នកជួល {$request->user()->name} សម្រាប់បន្ទប់ {$roomNumber} — កំពុងរង់ចាំការបញ្ជាក់ពីម្ចាស់ផ្ទះ។",
            'payment',
            '/dashboard/admin/income'
        );

        return response()->json([
            'success' => true,
            'message' => 'ការដាក់ស្នើការទូទាត់ទទួលបានជោគជ័យ! ម្ចាស់ផ្ទះនឹងផ្ទៀងផ្ទាត់ និងបញ្ជាក់ការទូទាត់ក្នុងពេលឆាប់ៗ។',
            'data'    => $invoice->fresh(),
        ]);
    }

    /**
     * Get the tenant's current occupied room and this month's payment status.
     */
    public function currentMonthlyPayment(Request $request): JsonResponse
    {
        $tenantId = $request->user()->id;
        $currentMonth = $request->input('month', date('Y-m'));

        $booking = \App\Models\Booking::where('tenant_id', $tenantId)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->with([
                'room.property.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions',
                'owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions',
                'tenant:id,name,phone,email',
                'invoices'
            ])
            ->latest('id')
            ->first();

        if (! $booking) {
            return response()->json([
                'success' => true,
                'has_active_stay' => false,
                'data' => null,
            ]);
        }

        $startOfMonth = \Carbon\Carbon::parse($currentMonth . '-01')->startOfMonth()->toDateString();
        $endOfMonth = \Carbon\Carbon::parse($currentMonth . '-01')->endOfMonth()->toDateString();

        // Check if there is an invoice for this month
        $currentMonthInvoice = $booking->invoices->first(function ($inv) use ($startOfMonth, $endOfMonth) {
            $dueDate = substr((string) $inv->due_date, 0, 10);
            $createdAt = substr((string) $inv->created_at, 0, 10);
            return ($dueDate >= $startOfMonth && $dueDate <= $endOfMonth)
                || ($createdAt >= $startOfMonth && $createdAt <= $endOfMonth);
        });

        if ($currentMonthInvoice) {
            $currentMonthInvoice->load([
                'booking.room.property.owner',
                'booking.owner',
                'booking.tenant',
            ]);
        }

        return response()->json([
            'success' => true,
            'has_active_stay' => true,
            'current_month' => $currentMonth,
            'booking' => $booking,
            'current_month_invoice' => $currentMonthInvoice,
            'is_paid_for_current_month' => $currentMonthInvoice ? $currentMonthInvoice->payment_status === 'paid' : false,
        ]);
    }
}
