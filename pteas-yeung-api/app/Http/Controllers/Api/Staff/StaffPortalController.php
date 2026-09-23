<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\Room;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffPortalController extends Controller
{
    /**
     * Get staff dashboard overview & assigned owner context.
     */
    public function overview(Request $request): JsonResponse
    {
        $staff = $request->user();
        $ownerId = $staff->owner_id;

        if (! $ownerId) {
            return response()->json([
                'message' => 'Staff account is not linked to any property owner.',
            ], 400);
        }

        $owner = $staff->owner;

        $propertiesCount = Property::where('owner_id', $ownerId)->count();
        $roomsCount = Room::whereHas('property', fn ($q) => $q->where('owner_id', $ownerId))->count();
        $occupiedCount = Room::whereHas('property', fn ($q) => $q->where('owner_id', $ownerId))
            ->where('status', 'occupied')
            ->count();
        $availableCount = Room::whereHas('property', fn ($q) => $q->where('owner_id', $ownerId))
            ->where('status', 'available')
            ->count();

        $pendingBookingsCount = Booking::where('owner_id', $ownerId)
            ->where('status', 'pending')
            ->count();

        $unpaidInvoicesCount = Invoice::whereHas('booking', fn ($q) => $q->where('owner_id', $ownerId))
            ->where('payment_status', 'unpaid')
            ->count();

        return response()->json([
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'permissions' => $staff->getAllPermissions(),
            ],
            'owner' => [
                'id' => $owner?->id,
                'name' => $owner?->name,
                'email' => $owner?->email,
                'phone' => $owner?->phone,
            ],
            'stats' => [
                'total_properties' => $propertiesCount,
                'total_rooms' => $roomsCount,
                'occupied_rooms' => $occupiedCount,
                'available_rooms' => $availableCount,
                'pending_bookings' => $pendingBookingsCount,
                'unpaid_invoices' => $unpaidInvoicesCount,
            ],
        ]);
    }

    /**
     * List properties managed under this staff's owner.
     */
    public function properties(Request $request): JsonResponse
    {
        $staff = $request->user();
        $properties = Property::where('owner_id', $staff->owner_id)
            ->withCount('rooms')
            ->latest()
            ->get();

        return response()->json($properties);
    }

    /**
     * List rooms under staff's owner.
     */
    public function rooms(Request $request): JsonResponse
    {
        $staff = $request->user();
        $rooms = Room::whereHas('property', fn ($q) => $q->where('owner_id', $staff->owner_id))
            ->with(['property:id,title,address'])
            ->latest()
            ->get();

        return response()->json($rooms);
    }

    /**
     * Update room status (available, occupied, maintenance).
     */
    public function updateRoomStatus(Request $request, int $id): JsonResponse
    {
        $staff = $request->user();

        // Check permission
        if (! $staff->hasPermission('rooms.status_update')) {
            AuditLogger::securityAccessDenied($staff, $request->path(), 'rooms.status_update', $request);

            return response()->json([
                'message' => 'Forbidden. You do not have permission to update room status.',
            ], 403);
        }

        $request->validate([
            'status' => 'required|in:Available,Occupied,Maintenance,available,occupied,maintenance',
        ]);

        $room = Room::whereHas('property', fn ($q) => $q->where('owner_id', $staff->owner_id))
            ->findOrFail($id);

        $normalizedStatus = ucfirst(strtolower($request->status));
        $oldStatus = $room->status;
        $room->status = $normalizedStatus;
        $room->save();

        // 🛡️ Audit Log
        AuditLogger::log(
            event: 'room.status_updated_by_staff',
            category: 'rooms',
            description: "Staff {$staff->name} updated Room {$room->room_number} status from '{$oldStatus}' to '{$request->status}'.",
            severity: 'info',
            newValues: ['status' => $request->status, 'room_id' => $room->id],
            oldValues: ['status' => $oldStatus],
            user: $staff,
            request: $request
        );

        return response()->json([
            'message' => 'Room status updated successfully',
            'room' => $room,
        ]);
    }

    /**
     * List invoices for staff's owner.
     */
    public function invoices(Request $request): JsonResponse
    {
        $staff = $request->user();

        if (! $staff->hasPermission('invoices.view')) {
            AuditLogger::securityAccessDenied($staff, $request->path(), 'invoices.view', $request);

            return response()->json([
                'message' => 'Forbidden. You do not have permission to view invoices.',
            ], 403);
        }

        $invoices = Invoice::whereHas('booking', fn ($q) => $q->where('owner_id', $staff->owner_id))
            ->with(['booking.room.property.owner', 'booking.tenant', 'booking.owner:id,name,phone,email,bank_name,bank_account_name,bank_account_number,bank_qr_code,payment_instructions'])
            ->latest()
            ->paginate(25);

        return response()->json($invoices);
    }

    /**
     * Collect payment and mark invoice as paid.
     */
    public function collectPayment(Request $request, int $id): JsonResponse
    {
        $staff = $request->user();

        if (! $staff->hasPermission('invoices.collect_payment')) {
            AuditLogger::securityAccessDenied($staff, $request->path(), 'invoices.collect_payment', $request);

            return response()->json([
                'message' => 'Forbidden. You do not have permission to collect payments or mark invoices paid.',
            ], 403);
        }

        $invoice = Invoice::whereHas('booking', fn ($q) => $q->where('owner_id', $staff->owner_id))
            ->findOrFail($id);

        $oldStatus = $invoice->payment_status;
        $invoice->payment_status = 'paid';
        $invoice->paid_at = now();
        $invoice->save();

        // 🛡️ Audit Log
        AuditLogger::log(
            event: 'invoice.collected_by_staff',
            category: 'billing',
            description: "Staff {$staff->name} collected payment for Invoice #{$invoice->invoice_number} (Amount: {$invoice->total_amount}).",
            severity: 'info',
            newValues: ['payment_status' => 'paid', 'invoice_id' => $invoice->id, 'amount' => $invoice->total_amount],
            oldValues: ['payment_status' => $oldStatus],
            user: $staff,
            request: $request
        );

        return response()->json([
            'message' => 'Invoice marked as paid successfully',
            'invoice' => $invoice,
        ]);
    }

    /**
     * List bookings for staff's owner.
     */
    public function bookings(Request $request): JsonResponse
    {
        $staff = $request->user();

        if (! $staff->hasPermission('bookings.view')) {
            AuditLogger::securityAccessDenied($staff, $request->path(), 'bookings.view', $request);

            return response()->json([
                'message' => 'Forbidden. You do not have permission to view bookings.',
            ], 403);
        }

        $bookings = Booking::where('owner_id', $staff->owner_id)
            ->with(['room.property', 'tenant'])
            ->latest()
            ->paginate(25);

        return response()->json($bookings);
    }
}
