<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Property;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices for the authenticated owner.
     */
    public function index(Request $request): JsonResponse
    {
        $ownerId = $request->user()->id;

        $invoices = Invoice::whereHas('booking', function ($query) use ($ownerId) {
            $query->where('owner_id', $ownerId);
        })
            ->with(['booking.room.property.owner', 'booking.tenant:id,name,phone,email', 'booking.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions'])
            ->when($request->filled('payment_status'), function ($query) use ($request) {
                $query->where('payment_status', $request->payment_status);
            })
            ->when($request->filled('booking_id'), function ($query) use ($request) {
                $query->where('booking_id', $request->booking_id);
            })
            ->when($request->filled('due_date'), function ($query) use ($request) {
                $query->whereDate('due_date', $request->due_date);
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $invoices,
            'stats' => [
                'total_amount' => (float) $invoices->sum('total_amount'),
                'paid_amount' => (float) $invoices->where('payment_status', 'paid')->sum('total_amount'),
                'unpaid_amount' => (float) $invoices->where('payment_status', 'unpaid')->sum('total_amount'),
            ],
        ]);
    }

    /**
     * Store a newly created invoice by the owner.
     */
    public function store(Request $request): JsonResponse
    {
        $ownerId = $request->user()->id;

        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'electricity_start_unit' => 'nullable|numeric|min:0',
            'electricity_end_unit' => 'nullable|numeric|min:0',
            'water_unit' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'amount' => 'nullable|numeric|min:0', // Support alias
            'payment_status' => 'nullable|in:paid,unpaid,partial',
            'status' => 'nullable|in:paid,unpaid,partial', // Support alias
            'due_date' => 'required|date',
        ]);

        // Ensure the booking belongs to this owner
        $booking = Booking::where('id', $validated['booking_id'])
            ->where('owner_id', $ownerId)
            ->first();

        if (! $booking) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: This booking does not belong to your properties.',
            ], 403);
        }

        $totalAmount = $validated['total_amount'] ?? $validated['amount'] ?? 0;
        $paymentStatus = $validated['payment_status'] ?? $validated['status'] ?? 'unpaid';

        $invoice = Invoice::create([
            'booking_id' => $validated['booking_id'],
            'electricity_start_unit' => (int) ($validated['electricity_start_unit'] ?? 0),
            'electricity_end_unit' => (int) ($validated['electricity_end_unit'] ?? 0),
            'water_unit' => (int) ($validated['water_unit'] ?? 0),
            'total_amount' => $totalAmount,
            'payment_status' => $paymentStatus,
            'due_date' => $validated['due_date'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice created successfully',
            'data' => $invoice->load(['booking.room.property.owner', 'booking.tenant', 'booking.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions']),
        ], 201);
    }

    /**
     * Display the specified invoice details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $ownerId = $request->user()->id;

        $invoice = Invoice::where('id', $id)
            ->whereHas('booking', function ($query) use ($ownerId) {
                $query->where('owner_id', $ownerId);
            })
            ->with(['booking.room.property.owner', 'booking.tenant', 'booking.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ]);
    }

    /**
     * Update the invoice payment status or details.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $ownerId = $request->user()->id;

        $invoice = Invoice::where('id', $id)
            ->whereHas('booking', function ($query) use ($ownerId) {
                $query->where('owner_id', $ownerId);
            })
            ->firstOrFail();

        $validated = $request->validate([
            'electricity_start_unit' => 'nullable|numeric|min:0',
            'electricity_end_unit' => 'nullable|numeric|min:0',
            'water_unit' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'amount' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:paid,unpaid,partial',
            'status' => 'nullable|in:paid,unpaid,partial',
            'due_date' => 'nullable|date',
        ]);

        $updateData = [];

        if (isset($validated['payment_status'])) {
            $updateData['payment_status'] = $validated['payment_status'];
        } elseif (isset($validated['status'])) {
            $updateData['payment_status'] = $validated['status'];
        }

        if (isset($validated['total_amount'])) {
            $updateData['total_amount'] = $validated['total_amount'];
        } elseif (isset($validated['amount'])) {
            $updateData['total_amount'] = $validated['amount'];
        }

        if (array_key_exists('electricity_start_unit', $validated)) {
            $updateData['electricity_start_unit'] = (int) $validated['electricity_start_unit'];
        }
        if (array_key_exists('electricity_end_unit', $validated)) {
            $updateData['electricity_end_unit'] = (int) $validated['electricity_end_unit'];
        }
        if (array_key_exists('water_unit', $validated)) {
            $updateData['water_unit'] = (int) $validated['water_unit'];
        }
        if (isset($validated['due_date'])) {
            $updateData['due_date'] = $validated['due_date'];
        }

        $invoice->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Invoice updated successfully',
            'data' => $invoice->load(['booking.room.property', 'booking.tenant']),
        ]);
    }

    /**
     * Remove the specified invoice from storage.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $ownerId = $request->user()->id;

        $invoice = Invoice::where('id', $id)
            ->whereHas('booking', function ($query) use ($ownerId) {
                $query->where('owner_id', $ownerId);
            })
            ->firstOrFail();

        $invoice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Invoice deleted successfully',
        ]);
    }

    /**
     * Track monthly payments for all tenants living in owner's rooms.
     */
    public function monthlyTracker(Request $request): JsonResponse
    {
        $ownerId = $request->user()->id;
        $selectedMonth = $request->input('month', date('Y-m')); // e.g. "2026-09"
        $propertyId = $request->input('property_id');
        $statusFilter = $request->input('status', 'all'); // 'all', 'paid', 'unpaid', 'not_billed'

        $startOfMonth = Carbon::parse($selectedMonth . '-01')->startOfMonth()->toDateString();
        $endOfMonth = Carbon::parse($selectedMonth . '-01')->endOfMonth()->toDateString();

        // 1. Get properties owned by this owner
        $properties = Property::where('owner_id', $ownerId)
            ->select('id', 'title', 'address', 'city')
            ->get();
        $propertyIds = $properties->pluck('id');

        // 2. Query active/confirmed bookings occupying rooms in owner properties
        $bookingsQuery = Booking::whereIn('status', ['active', 'confirmed', 'approved', 'pending'])
            ->where(function ($q) use ($ownerId, $propertyIds) {
                $q->where('owner_id', $ownerId)
                  ->orWhereHas('room', function ($rq) use ($propertyIds) {
                      $rq->whereIn('property_id', $propertyIds);
                  });
            })
            ->with([
                'room.property',
                'tenant:id,name,phone,email,profile_picture',
                'invoices'
            ]);

        if ($propertyId) {
            $bookingsQuery->whereHas('room', function ($q) use ($propertyId) {
                $q->where('property_id', $propertyId);
            });
        }

        $bookings = $bookingsQuery->get();

        $items = [];
        $totalExpected = 0;
        $totalCollected = 0;
        $totalUnpaid = 0;
        $paidCount = 0;
        $unpaidCount = 0;
        $notBilledCount = 0;

        foreach ($bookings as $b) {
            $room = $b->room;
            $prop = $room ? $room->property : null;
            $tenant = $b->tenant;
            $roomRent = (float) ($room->price ?? 0);

            // Find invoice matching the selected month (due_date or created_at within month)
            $invoice = $b->invoices->first(function ($inv) use ($startOfMonth, $endOfMonth) {
                $dueDate = substr((string) $inv->due_date, 0, 10);
                $createdAt = substr((string) $inv->created_at, 0, 10);
                return ($dueDate >= $startOfMonth && $dueDate <= $endOfMonth)
                    || ($createdAt >= $startOfMonth && $createdAt <= $endOfMonth);
            });

            $status = 'not_billed';
            $amount = $roomRent;
            $dueDate = null;
            $isOverdue = false;
            $invoiceId = null;
            $electricityUsage = 0;
            $waterUnit = 0;

            if ($invoice) {
                $status = $invoice->payment_status; // 'paid', 'unpaid', 'partial'
                $amount = (float) $invoice->total_amount;
                $dueDate = substr((string) $invoice->due_date, 0, 10);
                $isOverdue = $invoice->payment_status === 'unpaid' && $dueDate < date('Y-m-d');
                $invoiceId = $invoice->id;
                $electricityUsage = max(0, (int) $invoice->electricity_end_unit - (int) $invoice->electricity_start_unit);
                $waterUnit = (int) $invoice->water_unit;
            }

            if ($status === 'paid') {
                $paidCount++;
                $totalCollected += $amount;
                $totalExpected += $amount;
            } elseif ($status === 'unpaid' || $status === 'partial') {
                $unpaidCount++;
                $totalUnpaid += $amount;
                $totalExpected += $amount;
            } else {
                $notBilledCount++;
                $totalExpected += $amount;
            }

            // Check status filter
            if ($statusFilter !== 'all' && $status !== $statusFilter) {
                continue;
            }

            $items[] = [
                'booking_id' => $b->id,
                'booking_status' => $b->status,
                'check_in_date' => $b->check_in_date,
                'room' => [
                    'id' => $room->id ?? null,
                    'room_number' => $room->room_number ?? 'N/A',
                    'price' => $roomRent,
                    'type' => $room->type ?? 'Standard',
                ],
                'property' => [
                    'id' => $prop->id ?? null,
                    'title' => $prop->title ?? 'N/A',
                    'address' => $prop->address ?? '',
                ],
                'tenant' => [
                    'id' => $tenant->id ?? null,
                    'name' => $tenant->name ?? 'N/A',
                    'phone' => $tenant->phone ?? 'N/A',
                    'email' => $tenant->email ?? '',
                    'profile_picture' => $tenant->profile_picture ?? null,
                ],
                'month' => $selectedMonth,
                'invoice_id' => $invoiceId,
                'invoice' => $invoice ? $invoice->load(['booking.room.property', 'booking.tenant', 'booking.owner']) : null,
                'payment_status' => $status,
                'total_amount' => $amount,
                'due_date' => $dueDate,
                'is_overdue' => $isOverdue,
                'electricity_usage' => $electricityUsage,
                'water_unit' => $waterUnit,
            ];
        }

        $totalRooms = count($bookings);
        $collectionRate = $totalExpected > 0 ? round(($totalCollected / $totalExpected) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'month' => $selectedMonth,
            'properties' => $properties,
            'summary' => [
                'total_occupied_rooms' => $totalRooms,
                'paid_count' => $paidCount,
                'unpaid_count' => $unpaidCount,
                'not_billed_count' => $notBilledCount,
                'total_expected' => (float) $totalExpected,
                'total_collected' => (float) $totalCollected,
                'total_unpaid' => (float) $totalUnpaid,
                'collection_rate' => $collectionRate,
            ],
            'items' => $items,
        ]);
    }

    /**
     * Send payment reminder notification to tenant for an unpaid monthly invoice.
     */
    public function sendReminder(Request $request, $id): JsonResponse
    {
        $ownerId = $request->user()->id;

        $invoice = Invoice::where('id', $id)
            ->whereHas('booking', function ($query) use ($ownerId) {
                $query->where('owner_id', $ownerId);
            })
            ->with(['booking.tenant', 'booking.room'])
            ->firstOrFail();

        $tenant = $invoice->booking->tenant;
        $room = $invoice->booking->room;

        if ($tenant) {
            Notification::sendToUser(
                $tenant->id,
                'រំលឹកការទូទាត់ថ្លៃបន្ទប់ (Room Payment Reminder)',
                "សូមជម្រាបជូនអ្នកជួល {$tenant->name} វិក្កយបត្រថ្លៃបន្ទប់ #{$room->room_number} ចំនួន $" . number_format($invoice->total_amount, 2) . " ដល់កាលកំណត់បង់ហើយ។ សូមចូលទៅទូទាត់ក្នុងប្រព័ន្ធ។",
                'payment',
                '/dashboard/tenant/invoices'
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'បានផ្ញើសាររំលឹកទៅកាន់អ្នកជួលដោយជោគជ័យ!',
        ]);
    }

    /**
     * Export monthly payment tracker as CSV.
     */
    public function exportMonthlyTracker(Request $request)
    {
        $month = $request->input('month', date('Y-m'));

        $data = $this->monthlyTracker($request)->getData(true);
        $items = $data['items'] ?? [];

        $filename = "monthly_payments_{$month}.csv";

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($items, $month) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, ['ខែ (Month)', 'បន្ទប់ (Room)', 'អចលនទ្រព្យ (Property)', 'អ្នកជួល (Tenant)', 'លេខទូរស័ព្ទ (Phone)', 'ថ្លៃបន្ទប់ ($)', 'ទឹកប្រាក់សរុប ($)', 'ថ្ងៃកំណត់បង់ (Due Date)', 'ស្ថានភាព (Status)']);

            foreach ($items as $item) {
                $st = $item['payment_status'] === 'paid' ? 'Paid' : ($item['payment_status'] === 'unpaid' ? 'Unpaid' : 'Not Billed');
                fputcsv($file, [
                    $month,
                    $item['room']['room_number'] ?? '',
                    $item['property']['title'] ?? '',
                    $item['tenant']['name'] ?? '',
                    $item['tenant']['phone'] ?? '',
                    $item['room']['price'] ?? 0,
                    $item['total_amount'] ?? 0,
                    $item['due_date'] ?? 'N/A',
                    $st,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
