<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class OwnerBackupController extends Controller
{
    /**
     * Get isolated backup directory for this specific owner.
     */
    protected function getOwnerBackupDir(int $ownerId): string
    {
        $dir = storage_path('app/backups/owner_' . $ownerId);
        if (! File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        return $dir;
    }

    /**
     * Get statistics for the authenticated owner's rental business data.
     */
    public function stats(): JsonResponse
    {
        $ownerId = auth()->id();
        $snapshots = $this->getSnapshotsList($ownerId);
        $totalSize = array_sum(array_column($snapshots, 'size_bytes'));
        $latestSnapshot = ! empty($snapshots) ? $snapshots[0]['created_at'] : null;

        $stats = [
            'counts' => [
                'properties' => Property::where('owner_id', $ownerId)->count(),
                'rooms' => Room::whereHas('property', fn ($q) => $q->where('owner_id', $ownerId))->count(),
                'bookings' => Booking::where('owner_id', $ownerId)->count(),
                'invoices' => Invoice::whereHas('booking', fn ($q) => $q->where('owner_id', $ownerId))->count(),
                'expenses' => Expense::where('owner_id', $ownerId)->count(),
                'staff' => User::where('owner_id', $ownerId)->where('role', 'staff')->count(),
            ],
            'snapshots' => [
                'count' => count($snapshots),
                'total_size' => $this->formatBytes($totalSize),
                'total_size_bytes' => $totalSize,
                'latest' => $latestSnapshot,
            ],
            'last_generated' => Carbon::now()->toIso8601String(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * List all saved business snapshots for this owner.
     */
    public function index(): JsonResponse
    {
        $ownerId = auth()->id();
        $snapshots = $this->getSnapshotsList($ownerId);

        return response()->json([
            'success' => true,
            'data' => $snapshots,
        ]);
    }

    /**
     * Create a server-side business backup snapshot for this owner.
     */
    public function create(Request $request): JsonResponse
    {
        $owner = auth()->user();
        $ownerId = $owner->id;
        $dir = $this->getOwnerBackupDir($ownerId);

        $payload = $this->compileOwnerData($owner, 'all');

        $filename = 'pteasyeung_owner_' . $ownerId . '_backup_' . Carbon::now()->format('Y-m-d_His') . '.json';
        $fullPath = $dir . DIRECTORY_SEPARATOR . $filename;

        File::put($fullPath, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $fileSize = File::size($fullPath);

        return response()->json([
            'success' => true,
            'message' => 'Business backup snapshot saved successfully.',
            'data' => [
                'filename' => $filename,
                'size' => $this->formatBytes($fileSize),
                'size_bytes' => $fileSize,
                'created_at' => Carbon::now()->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Download an owner's saved server snapshot.
     */
    public function download(string $filename, Request $request)
    {
        $ownerId = auth()->id();
        $filename = basename($filename);
        $dir = $this->getOwnerBackupDir($ownerId);
        $fullPath = $dir . DIRECTORY_SEPARATOR . $filename;

        if (! File::exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Requested business backup snapshot does not exist.',
            ], 404);
        }

        return response(File::get($fullPath), 200, [
            'Content-Type' => 'application/json; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Delete an owner's saved server snapshot.
     */
    public function destroy(string $filename, Request $request): JsonResponse
    {
        $ownerId = auth()->id();
        $filename = basename($filename);
        $dir = $this->getOwnerBackupDir($ownerId);
        $fullPath = $dir . DIRECTORY_SEPARATOR . $filename;

        if (! File::exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Requested business backup snapshot does not exist.',
            ], 404);
        }

        File::delete($fullPath);

        return response()->json([
            'success' => true,
            'message' => 'Business backup snapshot deleted successfully.',
        ]);
    }

    /**
     * Export all rental properties, rooms, tenants, bookings, invoices, and expenses for this owner.
     */
    public function export(Request $request)
    {
        $owner = auth()->user();
        $type = $request->query('type', 'all');
        $format = strtolower($request->query('format', 'json'));

        // Format CSV for landlord spreadsheets
        if ($format === 'csv') {
            return $this->exportCsv($owner, $type);
        }

        // Format JSON (default)
        $data = $this->compileOwnerData($owner, $type);
        $filename = 'pteasyeung_owner_backup_' . $type . '_' . Carbon::now()->format('Y-m-d_His') . '.json';

        return response()->json($data, 200, [
            'Content-Type' => 'application/json; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Restore owner data from a previous backup file or saved snapshot.
     */
    public function restore(Request $request): JsonResponse
    {
        $owner = auth()->user();
        $ownerId = $owner->id;
        $content = null;

        if ($request->hasFile('backup_file')) {
            $file = $request->file('backup_file');
            if (! $file->isValid()) {
                return response()->json(['success' => false, 'message' => 'Invalid backup file uploaded.'], 422);
            }
            $content = file_get_contents($file->getRealPath());
        } elseif ($request->filled('filename')) {
            $filename = basename($request->input('filename'));
            $dir = $this->getOwnerBackupDir($ownerId);
            $fullPath = $dir . DIRECTORY_SEPARATOR . $filename;
            if (! File::exists($fullPath)) {
                return response()->json(['success' => false, 'message' => 'Backup snapshot not found on server.'], 404);
            }
            $content = File::get($fullPath);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a backup file or select a saved snapshot to restore.',
            ], 422);
        }

        $decoded = json_decode($content, true);
        if (! is_array($decoded) || (! isset($decoded['properties']) && ! isset($decoded['invoices']) && ! isset($decoded['expenses']))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid backup file format. Expected a valid Pteas Yeung rental business backup.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $restored = [
                'properties' => 0,
                'rooms' => 0,
                'expenses' => 0,
                'invoices' => 0,
            ];

            // 1. Properties & Rooms
            if (! empty($decoded['properties']) && is_array($decoded['properties'])) {
                foreach ($decoded['properties'] as $prop) {
                    $property = Property::updateOrCreate(
                        [
                            'owner_id' => $ownerId,
                            'title' => $prop['title'] ?? 'Restored Property',
                        ],
                        [
                            'description' => $prop['description'] ?? null,
                            'address' => $prop['address'] ?? 'Phnom Penh',
                            'city' => $prop['city'] ?? 'Phnom Penh',
                            'location_map_link' => $prop['location_map_link'] ?? null,
                        ]
                    );
                    $restored['properties']++;

                    if (! empty($prop['rooms']) && is_array($prop['rooms'])) {
                        foreach ($prop['rooms'] as $rm) {
                            $roomType = ucfirst(strtolower($rm['type'] ?? 'Single'));
                            $roomStatus = ucfirst(strtolower($rm['status'] ?? 'Available'));
                            Room::updateOrCreate(
                                [
                                    'property_id' => $property->id,
                                    'room_number' => $rm['room_number'] ?? 'R-01',
                                ],
                                [
                                    'price' => $rm['price'] ?? 50.00,
                                    'deposit' => $rm['deposit'] ?? 0.00,
                                    'type' => in_array($roomType, ['Single', 'Double', 'Studio', 'Apartment']) ? $roomType : 'Single',
                                    'status' => in_array($roomStatus, ['Available', 'Occupied', 'Maintenance']) ? $roomStatus : 'Available',
                                    'floor' => $rm['floor'] ?? null,
                                    'amenities' => $rm['amenities'] ?? [],
                                    'description' => $rm['description'] ?? null,
                                ]
                            );
                            $restored['rooms']++;
                        }
                    }
                }
            }

            // 2. Expenses
            if (! empty($decoded['expenses']) && is_array($decoded['expenses'])) {
                foreach ($decoded['expenses'] as $exp) {
                    Expense::create([
                        'owner_id' => $ownerId,
                        'property_id' => $exp['property_id'] ?? null,
                        'title' => $exp['title'] ?? 'Business Expense',
                        'amount' => $exp['amount'] ?? 0.00,
                        'description' => $exp['description'] ?? null,
                        'date' => $exp['date'] ?? date('Y-m-d'),
                    ]);
                    $restored['expenses']++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Business data restored successfully.',
                'data' => [
                    'restored_counts' => $restored,
                    'restored_at' => Carbon::now()->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore business data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Compile owner data array.
     */
    protected function compileOwnerData(User $owner, string $type): array
    {
        $ownerId = $owner->id;

        $data = [
            'meta' => [
                'platform' => 'Pteas Yeung Rental Platform',
                'owner' => [
                    'id' => $ownerId,
                    'name' => $owner->name,
                    'email' => $owner->email,
                    'phone' => $owner->phone,
                    'bank_name' => $owner->bank_name,
                    'bank_account_name' => $owner->bank_account_name,
                    'bank_account_number' => $owner->bank_account_number,
                ],
                'backup_type' => $type,
                'generated_at' => Carbon::now()->toIso8601String(),
                'version' => '2.0',
            ],
        ];

        switch ($type) {
            case 'properties':
                $data['properties'] = Property::where('owner_id', $ownerId)
                    ->with(['rooms', 'images'])
                    ->get();
                break;

            case 'invoices':
                $data['invoices'] = Invoice::whereHas('booking', fn ($q) => $q->where('owner_id', $ownerId))
                    ->with(['booking.tenant:id,name,email,phone', 'booking.room:id,room_number,price'])
                    ->latest()
                    ->get();
                break;

            case 'expenses':
                $data['expenses'] = Expense::where('owner_id', $ownerId)
                    ->with('property:id,title')
                    ->latest()
                    ->get();
                break;

            case 'bookings':
                $data['bookings'] = Booking::where('owner_id', $ownerId)
                    ->with(['tenant:id,name,email,phone', 'room:id,room_number,price,property:id,title'])
                    ->latest()
                    ->get();
                break;

            case 'all':
            default:
                $data['properties'] = Property::where('owner_id', $ownerId)
                    ->with(['rooms', 'images'])
                    ->get();

                $data['bookings'] = Booking::where('owner_id', $ownerId)
                    ->with(['tenant:id,name,email,phone', 'room:id,room_number,price,property:id,title'])
                    ->get();

                $data['invoices'] = Invoice::whereHas('booking', fn ($q) => $q->where('owner_id', $ownerId))
                    ->with(['booking.tenant:id,name,email,phone', 'booking.room:id,room_number,price'])
                    ->latest()
                    ->get();

                $data['expenses'] = Expense::where('owner_id', $ownerId)
                    ->with('property:id,title')
                    ->latest()
                    ->get();

                $data['staff'] = User::where('owner_id', $ownerId)
                    ->where('role', 'staff')
                    ->select('id', 'name', 'email', 'phone', 'status', 'created_at')
                    ->get();
                break;
        }

        return $data;
    }

    /**
     * Export owner dataset as CSV spreadsheet.
     */
    protected function exportCsv(User $owner, string $type)
    {
        $ownerId = $owner->id;
        $filename = 'pteasyeung_owner_' . $type . '_' . Carbon::now()->format('Y-m-d_His') . '.csv';

        $output = fopen('php://temp', 'r+');
        fputs($output, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel

        switch ($type) {
            case 'invoices':
                fputcsv($output, ['Invoice ID', 'Booking ID', 'Tenant Name', 'Tenant Phone', 'Room Number', 'Electricity Units', 'Water Units', 'Total Amount ($)', 'Payment Status', 'Due Date', 'Created At']);
                $invoices = Invoice::whereHas('booking', fn ($q) => $q->where('owner_id', $ownerId))
                    ->with(['booking.tenant', 'booking.room'])
                    ->latest()
                    ->get();

                foreach ($invoices as $inv) {
                    $elec = max(0, ($inv->electricity_end_unit ?? 0) - ($inv->electricity_start_unit ?? 0));
                    fputcsv($output, [
                        $inv->id,
                        $inv->booking_id,
                        $inv->booking?->tenant?->name ?? 'N/A',
                        $inv->booking?->tenant?->phone ?? 'N/A',
                        $inv->booking?->room?->room_number ?? 'N/A',
                        $elec,
                        $inv->water_unit ?? 0,
                        $inv->total_amount,
                        $inv->payment_status,
                        $inv->due_date,
                        $inv->created_at,
                    ]);
                }
                break;

            case 'expenses':
                fputcsv($output, ['Expense ID', 'Property Title', 'Expense Title', 'Amount ($)', 'Date', 'Description']);
                $expenses = Expense::where('owner_id', $ownerId)
                    ->with('property:id,title')
                    ->latest()
                    ->get();

                foreach ($expenses as $e) {
                    fputcsv($output, [
                        $e->id,
                        $e->property?->title ?? 'General',
                        $e->title,
                        $e->amount,
                        $e->date,
                        $e->description,
                    ]);
                }
                break;

            case 'bookings':
                fputcsv($output, ['Booking ID', 'Property', 'Room Number', 'Tenant Name', 'Tenant Phone', 'Check-in Date', 'Check-out Date', 'Deposit ($)', 'Status']);
                $bookings = Booking::where('owner_id', $ownerId)
                    ->with(['tenant', 'room.property'])
                    ->latest()
                    ->get();

                foreach ($bookings as $b) {
                    fputcsv($output, [
                        $b->id,
                        $b->room?->property?->title ?? 'N/A',
                        $b->room?->room_number ?? 'N/A',
                        $b->tenant?->name ?? 'N/A',
                        $b->tenant?->phone ?? 'N/A',
                        $b->check_in_date,
                        $b->check_out_date,
                        $b->deposit_amount,
                        $b->status,
                    ]);
                }
                break;

            case 'properties':
            default:
                fputcsv($output, ['Property ID', 'Property Title', 'Address', 'City', 'Total Rooms', 'Created At']);
                $properties = Property::where('owner_id', $ownerId)
                    ->withCount('rooms')
                    ->get();

                foreach ($properties as $p) {
                    fputcsv($output, [
                        $p->id,
                        $p->title,
                        $p->address,
                        $p->city,
                        $p->rooms_count,
                        $p->created_at,
                    ]);
                }
                break;
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Get list of snapshot files in owner backup directory.
     */
    protected function getSnapshotsList(int $ownerId): array
    {
        $dir = $this->getOwnerBackupDir($ownerId);
        $files = File::files($dir);
        $snapshots = [];

        foreach ($files as $file) {
            if ($file->getExtension() !== 'json') {
                continue;
            }

            $filename = $file->getFilename();
            $sizeBytes = $file->getSize();
            $createdAt = Carbon::createFromTimestamp($file->getMTime())->toIso8601String();

            $snapshots[] = [
                'filename' => $filename,
                'size' => $this->formatBytes($sizeBytes),
                'size_bytes' => $sizeBytes,
                'created_at' => $createdAt,
                'type' => 'Owner Business Snapshot',
            ];
        }

        usort($snapshots, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return $snapshots;
    }

    /**
     * Format bytes to human readable format.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
