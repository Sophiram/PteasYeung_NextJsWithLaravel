<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\OwnerPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    /**
     * Display a listing of owner payments and subscriptions with summary statistics.
     */
    public function index(Request $request): JsonResponse
    {
        // 1. Overall Summary Statistics for Platform Revenue from Owners
        $totalCollected = (float) OwnerPayment::where('payment_status', 'paid')->sum('amount');
        $pendingAmount = (float) OwnerPayment::where('payment_status', 'pending')->sum('amount');
        $overdueAmount = (float) OwnerPayment::where('payment_status', '!=', 'paid')
            ->where('due_date', '<', now()->toDateString())
            ->sum('amount');

        $paidCount = OwnerPayment::where('payment_status', 'paid')->count();
        $pendingCount = OwnerPayment::where('payment_status', 'pending')->count();
        $totalOwners = OwnerPayment::distinct('owner_id')->count('owner_id');

        // 2. Query with Filters
        $query = OwnerPayment::with([
            'owner:id,name,email,phone,status,profile_picture',
            'property:id,title,address',
        ])->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'overdue') {
                $query->where('payment_status', '!=', 'paid')
                    ->where('due_date', '<', now()->toDateString());
            } else {
                $query->where('payment_status', $request->status);
            }
        }

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->owner_id);
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

        $payments = $query->get();

        // 3. Registered Owners List for Modal Dropdown
        $owners = User::where('role', 'owner')
            ->select('id', 'name', 'email', 'phone', 'status')
            ->withCount('properties')
            ->get();

        return response()->json([
            'success' => true,
            'summary' => [
                'total_collected' => $totalCollected,
                'pending_amount' => $pendingAmount,
                'overdue_amount' => $overdueAmount,
                'paid_count' => $paidCount,
                'pending_count' => $pendingCount,
                'total_owners' => $totalOwners,
            ],
            'payments' => $payments,
            'owners' => $owners,
        ]);
    }

    /**
     * Store a newly created bill / payment request for an Owner.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'owner_id' => 'required|exists:users,id',
            'property_id' => 'nullable|exists:properties,id',
            'title' => 'required|string|max:255',
            'plan_type' => 'required|string|in:subscription,listing_fee,activation,commission,custom',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'payment_status' => 'required|in:paid,pending,overdue,cancelled',
            'payment_method' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validated['invoice_number'] = OwnerPayment::generateInvoiceNumber();
        if ($validated['payment_status'] === 'paid') {
            $validated['paid_at'] = now();
        }

        $payment = OwnerPayment::create($validated);

        // Notify Owner
        Notification::sendToUser(
            $payment->owner_id,
            'វិក្កយបត្រសេវាប្រព័ន្ធថ្មី (New Platform Invoice)',
            "វិក្កយបត្រ #{$payment->invoice_number} សម្រាប់ '{$payment->title}' ចំនួន $" . number_format($payment->amount, 2) . " ត្រូវបានបង្កើត។",
            'info',
            '/dashboard/owner'
        );

        return response()->json([
            'success' => true,
            'message' => 'បានបង្កើតវិក្កយបត្រម្ចាស់ផ្ទះជោគជ័យ!',
            'data' => $payment->load(['owner:id,name,email,phone', 'property:id,title']),
        ], 201);
    }

    /**
     * Display the specified owner payment.
     */
    public function show($id): JsonResponse
    {
        $payment = OwnerPayment::with([
            'owner:id,name,email,phone,status,bank_name,bank_account_number',
            'property:id,title,address',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $payment,
        ]);
    }

    /**
     * Update the specified owner payment.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $payment = OwnerPayment::findOrFail($id);

        $validated = $request->validate([
            'owner_id' => 'sometimes|required|exists:users,id',
            'property_id' => 'nullable|exists:properties,id',
            'title' => 'sometimes|required|string|max:255',
            'plan_type' => 'sometimes|required|string|in:subscription,listing_fee,activation,commission,custom',
            'amount' => 'sometimes|required|numeric|min:0',
            'due_date' => 'sometimes|required|date',
            'payment_status' => 'sometimes|required|in:paid,pending,overdue,cancelled',
            'payment_method' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        if (isset($validated['payment_status']) && $validated['payment_status'] === 'paid' && !$payment->isPaid()) {
            $validated['paid_at'] = now();
        }

        $payment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'បានធ្វើបច្ចុប្បន្នភាពវិក្កយបត្រជោគជ័យ!',
            'data' => $payment->load(['owner:id,name,email,phone', 'property:id,title']),
        ]);
    }

    /**
     * Mark an owner payment as paid / confirm collection.
     */
    public function markCollected(Request $request, $id): JsonResponse
    {
        $payment = OwnerPayment::with(['owner'])->findOrFail($id);
        $payment->payment_status = 'paid';
        $payment->paid_at = now();
        if ($request->filled('payment_method')) {
            $payment->payment_method = $request->payment_method;
        }
        if ($request->filled('notes')) {
            $payment->notes = $request->notes;
        }
        $payment->save();

        // 🔔 Notify owner that platform payment is confirmed
        if ($payment->owner) {
            // Auto activate owner account if it was pending
            if ($payment->owner->status === 'pending') {
                $payment->owner->status = 'active';
                $payment->owner->save();
            }

            Notification::sendToUser(
                $payment->owner->id,
                'ការទូទាត់ត្រូវបានបញ្ជាក់ជោគជ័យ (Platform Payment Confirmed)',
                "វិក្កយបត្រ #{$payment->invoice_number} ចំនួន $" . number_format($payment->amount, 2) . " ត្រូវបានរដ្ឋបាលបញ្ជាក់ថាបានបង់រួចរាល់! អរគុណសម្រាប់ការគាំទ្រប្រព័ន្ធ Pteas Yeung។",
                'success',
                '/dashboard/owner'
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'ការទូទាត់របស់ម្ចាស់ផ្ទះត្រូវបានបញ្ជាក់ជោគជ័យ!',
            'data' => $payment->load(['owner:id,name,email,phone', 'property:id,title']),
        ]);
    }

    /**
     * Remove the specified owner payment.
     */
    public function destroy($id): JsonResponse
    {
        $payment = OwnerPayment::findOrFail($id);
        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'បានលុបវិក្កយបត្រជោគជ័យ!',
        ]);
    }
}