<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\Room;
use App\Models\RoomImage;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class AdminBackupController extends Controller
{
    protected string $backupDir;

    public function __construct()
    {
        $this->backupDir = storage_path('app/backups/admin');
        if (! File::exists($this->backupDir)) {
            File::makeDirectory($this->backupDir, 0755, true);
        }
    }

    /**
     * Get platform database statistics and backup telemetry.
     */
    public function stats(): JsonResponse
    {
        try {
            $connection = DB::connection();
            $driver = $connection->getDriverName();
            $dbName = $connection->getDatabaseName();
        } catch (\Throwable $e) {
            $driver = 'unknown';
            $dbName = 'unknown';
        }

        // Server snapshots summary
        $snapshots = $this->getSnapshotsList();
        $totalSize = array_sum(array_column($snapshots, 'size_bytes'));
        $latestSnapshot = ! empty($snapshots) ? $snapshots[0]['created_at'] : null;

        $stats = [
            'database' => [
                'driver' => $driver,
                'name' => $dbName,
                'status' => 'connected',
            ],
            'counts' => [
                'users' => User::count(),
                'properties' => Property::count(),
                'rooms' => Room::count(),
                'bookings' => Booking::count(),
                'invoices' => Invoice::count(),
                'expenses' => Expense::count(),
                'audit_logs' => AuditLog::count(),
                'settings' => Setting::count(),
            ],
            'snapshots' => [
                'count' => count($snapshots),
                'total_size' => $this->formatBytes($totalSize),
                'total_size_bytes' => $totalSize,
                'latest' => $latestSnapshot,
            ],
            'environment' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server_time' => Carbon::now()->toIso8601String(),
                'timezone' => config('app.timezone', 'UTC'),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * List all saved snapshots stored on the server.
     */
    public function index(): JsonResponse
    {
        $snapshots = $this->getSnapshotsList();

        return response()->json([
            'success' => true,
            'data' => $snapshots,
        ]);
    }

    /**
     * Create a server snapshot file.
     */
    public function create(Request $request): JsonResponse
    {
        $user = auth()->user();
        $payload = $this->compilePlatformData('all');

        $filename = 'pteasyeung_admin_backup_' . Carbon::now()->format('Y-m-d_His') . '.json';
        $fullPath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;

        File::put($fullPath, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $fileSize = File::size($fullPath);

        $this->recordAudit($user, 'backup.created', "Admin {$user?->name} created server database snapshot ({$filename})", $request);

        return response()->json([
            'success' => true,
            'message' => 'Database snapshot created successfully on server.',
            'data' => [
                'filename' => $filename,
                'size' => $this->formatBytes($fileSize),
                'size_bytes' => $fileSize,
                'created_at' => Carbon::now()->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Download a saved server snapshot.
     */
    public function download(string $filename, Request $request)
    {
        $filename = basename($filename);
        $fullPath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;

        if (! File::exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Requested backup snapshot does not exist.',
            ], 404);
        }

        $user = auth()->user();
        $this->recordAudit($user, 'backup.downloaded', "Admin {$user?->name} downloaded server snapshot {$filename}", $request);

        return response(File::get($fullPath), 200, [
            'Content-Type' => 'application/json; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Delete a saved server snapshot.
     */
    public function destroy(string $filename, Request $request): JsonResponse
    {
        $filename = basename($filename);
        $fullPath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;

        if (! File::exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Requested backup snapshot does not exist.',
            ], 404);
        }

        File::delete($fullPath);

        $user = auth()->user();
        $this->recordAudit($user, 'backup.deleted', "Admin {$user?->name} deleted server snapshot {$filename}", $request);

        return response()->json([
            'success' => true,
            'message' => 'Backup snapshot deleted successfully.',
        ]);
    }

    /**
     * Export platform database backup in JSON, CSV, or SQL format.
     */
    public function export(Request $request)
    {
        $type = $request->query('type', 'all');
        $format = strtolower($request->query('format', 'json'));
        $user = auth()->user();

        // Audit log event
        $this->recordAudit($user, 'backup.exported', "Admin {$user?->name} exported platform data ({$type}, format: {$format})", $request);

        // Format CSV
        if ($format === 'csv') {
            return $this->exportCsv($type);
        }

        // Format SQL
        if ($format === 'sql') {
            return $this->exportSql($type);
        }

        // Format JSON (default)
        $data = $this->compilePlatformData($type);
        $filename = 'pteasyeung_admin_backup_' . $type . '_' . Carbon::now()->format('Y-m-d_His') . '.json';

        return response()->json($data, 200, [
            'Content-Type' => 'application/json; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Restore platform database from server snapshot or uploaded file.
     */
    public function restore(Request $request): JsonResponse
    {
        $user = auth()->user();

        $content = null;

        // Option A: Uploaded file
        if ($request->hasFile('backup_file')) {
            $file = $request->file('backup_file');
            if (! $file->isValid()) {
                return response()->json(['success' => false, 'message' => 'Invalid backup file uploaded.'], 422);
            }
            $content = file_get_contents($file->getRealPath());
        }
        // Option B: Server snapshot filename
        elseif ($request->filled('filename')) {
            $filename = basename($request->input('filename'));
            $fullPath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;
            if (! File::exists($fullPath)) {
                return response()->json(['success' => false, 'message' => 'Backup snapshot not found on server.'], 404);
            }
            $content = File::get($fullPath);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Please provide either a backup file or a server snapshot filename to restore.',
            ], 422);
        }

        $decoded = json_decode($content, true);
        if (! is_array($decoded) || (! isset($decoded['meta']) && ! isset($decoded['users']) && ! isset($decoded['properties']))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid backup format. Expected a valid Pteas Yeung platform JSON backup.',
            ], 422);
        }

        // Execute restore inside database transaction
        DB::beginTransaction();
        try {
            $restoredCounts = [
                'users' => 0,
                'settings' => 0,
                'properties' => 0,
                'rooms' => 0,
                'bookings' => 0,
                'invoices' => 0,
                'expenses' => 0,
            ];

            // 1. Settings
            if (! empty($decoded['settings'])) {
                $settingData = $decoded['settings'];
                unset($settingData['id'], $settingData['created_at'], $settingData['updated_at']);
                Setting::updateOrCreate(['id' => 1], $settingData);
                $restoredCounts['settings']++;
            }

            // 2. Users
            if (! empty($decoded['users']) && is_array($decoded['users'])) {
                foreach ($decoded['users'] as $u) {
                    if (empty($u['email'])) {
                        continue;
                    }
                    $userData = [
                        'name' => $u['name'] ?? 'Restored User',
                        'phone' => $u['phone'] ?? null,
                        'role' => $u['role'] ?? 'tenant',
                        'status' => $u['status'] ?? 'active',
                        'bank_name' => $u['bank_name'] ?? null,
                        'bank_account_name' => $u['bank_account_name'] ?? null,
                        'bank_account_number' => $u['bank_account_number'] ?? null,
                    ];
                    // Keep existing password if present, otherwise default
                    $existing = User::where('email', $u['email'])->first();
                    if (! $existing) {
                        $userData['password'] = bcrypt('PteasYeung@' . date('Y'));
                    }
                    User::updateOrCreate(['email' => $u['email']], $userData);
                    $restoredCounts['users']++;
                }
            }

            // 3. Properties & Rooms
            if (! empty($decoded['properties']) && is_array($decoded['properties'])) {
                foreach ($decoded['properties'] as $prop) {
                    $propData = [
                        'owner_id' => $prop['owner_id'] ?? $user->id,
                        'title' => $prop['title'] ?? 'Restored Property',
                        'description' => $prop['description'] ?? null,
                        'address' => $prop['address'] ?? 'Phnom Penh',
                        'city' => $prop['city'] ?? 'Phnom Penh',
                        'location_map_link' => $prop['location_map_link'] ?? null,
                    ];

                    $propCriteria = ! empty($prop['id']) ? ['id' => $prop['id']] : ['title' => $prop['title'] ?? 'Restored Property', 'owner_id' => $prop['owner_id'] ?? $user->id];
                    $property = Property::updateOrCreate($propCriteria, $propData);
                    $restoredCounts['properties']++;

                    // Rooms for this property
                    if (! empty($prop['rooms']) && is_array($prop['rooms'])) {
                        foreach ($prop['rooms'] as $rm) {
                            $roomType = ucfirst(strtolower($rm['type'] ?? 'Single'));
                            $roomStatus = ucfirst(strtolower($rm['status'] ?? 'Available'));
                            $roomData = [
                                'property_id' => $property->id,
                                'room_number' => $rm['room_number'] ?? 'R-01',
                                'price' => $rm['price'] ?? 50.00,
                                'deposit' => $rm['deposit'] ?? 0.00,
                                'type' => in_array($roomType, ['Single', 'Double', 'Studio', 'Apartment']) ? $roomType : 'Single',
                                'status' => in_array($roomStatus, ['Available', 'Occupied', 'Maintenance']) ? $roomStatus : 'Available',
                                'floor' => $rm['floor'] ?? null,
                                'amenities' => $rm['amenities'] ?? [],
                                'description' => $rm['description'] ?? null,
                            ];
                            $roomCriteria = ! empty($rm['id']) ? ['id' => $rm['id']] : ['property_id' => $property->id, 'room_number' => $rm['room_number'] ?? 'R-01'];
                            Room::updateOrCreate($roomCriteria, $roomData);
                            $restoredCounts['rooms']++;
                        }
                    }
                }
            }

            // 4. Bookings
            if (! empty($decoded['bookings']) && is_array($decoded['bookings'])) {
                foreach ($decoded['bookings'] as $bk) {
                    if (empty($bk['room_id']) || empty($bk['tenant_id'])) {
                        continue;
                    }
                    // Validate referenced room and tenant exist
                    if (Room::find($bk['room_id']) && User::find($bk['tenant_id'])) {
                        $bkCriteria = ! empty($bk['id']) ? ['id' => $bk['id']] : ['room_id' => $bk['room_id'], 'tenant_id' => $bk['tenant_id']];
                        Booking::updateOrCreate(
                            $bkCriteria,
                            [
                                'room_id' => $bk['room_id'],
                                'tenant_id' => $bk['tenant_id'],
                                'owner_id' => $bk['owner_id'] ?? $user->id,
                                'check_in_date' => $bk['check_in_date'] ?? date('Y-m-d'),
                                'check_out_date' => $bk['check_out_date'] ?? null,
                                'deposit_amount' => $bk['deposit_amount'] ?? 0.00,
                                'status' => $bk['status'] ?? 'active',
                            ]
                        );
                        $restoredCounts['bookings']++;
                    }
                }
            }

            // 5. Invoices
            if (! empty($decoded['invoices']) && is_array($decoded['invoices'])) {
                foreach ($decoded['invoices'] as $inv) {
                    if (empty($inv['booking_id']) || ! Booking::find($inv['booking_id'])) {
                        continue;
                    }
                    $invCriteria = ! empty($inv['id']) ? ['id' => $inv['id']] : ['booking_id' => $inv['booking_id'], 'due_date' => $inv['due_date'] ?? date('Y-m-d', strtotime('+7 days'))];
                    Invoice::updateOrCreate(
                        $invCriteria,
                        [
                            'booking_id' => $inv['booking_id'],
                            'electricity_start_unit' => $inv['electricity_start_unit'] ?? 0,
                            'electricity_end_unit' => $inv['electricity_end_unit'] ?? 0,
                            'water_unit' => $inv['water_unit'] ?? 0,
                            'total_amount' => $inv['total_amount'] ?? 0.00,
                            'payment_status' => $inv['payment_status'] ?? 'pending',
                            'due_date' => $inv['due_date'] ?? date('Y-m-d', strtotime('+7 days')),
                        ]
                    );
                    $restoredCounts['invoices']++;
                }
            }

            // 6. Expenses
            if (! empty($decoded['expenses']) && is_array($decoded['expenses'])) {
                foreach ($decoded['expenses'] as $exp) {
                    $expCriteria = ! empty($exp['id']) ? ['id' => $exp['id']] : ['owner_id' => $exp['owner_id'] ?? $user->id, 'title' => $exp['title'] ?? 'Expense', 'date' => $exp['date'] ?? date('Y-m-d')];
                    Expense::updateOrCreate(
                        $expCriteria,
                        [
                            'owner_id' => $exp['owner_id'] ?? $user->id,
                            'property_id' => $exp['property_id'] ?? null,
                            'title' => $exp['title'] ?? 'Expense',
                            'amount' => $exp['amount'] ?? 0.00,
                            'description' => $exp['description'] ?? null,
                            'date' => $exp['date'] ?? date('Y-m-d'),
                        ]
                    );
                    $restoredCounts['expenses']++;
                }
            }

            DB::commit();

            $this->recordAudit(
                $user,
                'backup.restored',
                "Admin {$user?->name} restored platform database (" . json_encode($restoredCounts) . ')',
                $request,
                'warning'
            );

            return response()->json([
                'success' => true,
                'message' => 'Platform database restored successfully.',
                'data' => [
                    'restored_counts' => $restoredCounts,
                    'restored_at' => Carbon::now()->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore database: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Compile structured platform dataset.
     */
    protected function compilePlatformData(string $type): array
    {
        $user = auth()->user();

        $data = [
            'meta' => [
                'platform' => 'Pteas Yeung Platform',
                'environment' => config('app.env'),
                'backup_type' => $type,
                'generated_at' => Carbon::now()->toIso8601String(),
                'exported_by' => [
                    'id' => $user?->id,
                    'name' => $user?->name,
                    'email' => $user?->email,
                    'role' => $user?->role,
                ],
                'version' => '2.0',
            ],
        ];

        switch ($type) {
            case 'users':
                $data['users'] = User::select('id', 'name', 'email', 'phone', 'role', 'status', 'bank_name', 'bank_account_name', 'bank_account_number', 'created_at')->get();
                break;

            case 'properties':
                $data['properties'] = Property::with(['rooms', 'images'])->get();
                break;

            case 'invoices':
                $data['invoices'] = Invoice::with(['booking.tenant:id,name,email,phone', 'booking.room:id,room_number,price'])->latest()->get();
                break;

            case 'expenses':
                $data['expenses'] = Expense::with(['property:id,title'])->latest()->get();
                break;

            case 'audit_logs':
                $data['audit_logs'] = AuditLog::latest()->take(2500)->get();
                break;

            case 'all':
            default:
                $data['users'] = User::select('id', 'name', 'email', 'phone', 'role', 'status', 'bank_name', 'bank_account_name', 'bank_account_number', 'created_at')->get();
                $data['properties'] = Property::with(['rooms', 'images'])->get();
                $data['bookings'] = Booking::with(['tenant:id,name,email,phone', 'room:id,room_number,price'])->get();
                $data['invoices'] = Invoice::with(['booking.tenant:id,name,email,phone', 'booking.room:id,room_number,price'])->get();
                $data['expenses'] = Expense::with(['property:id,title'])->get();
                $data['settings'] = Setting::first();
                $data['audit_logs'] = AuditLog::latest()->take(1000)->get();
                break;
        }

        return $data;
    }

    /**
     * Export data formatted as CSV.
     */
    protected function exportCsv(string $type)
    {
        $filename = 'pteasyeung_admin_' . $type . '_' . Carbon::now()->format('Y-m-d_His') . '.csv';

        $output = fopen('php://temp', 'r+');
        fputs($output, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel Khmer/English

        switch ($type) {
            case 'users':
                fputcsv($output, ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Bank Name', 'Account Name', 'Created At']);
                $users = User::select('id', 'name', 'email', 'phone', 'role', 'status', 'bank_name', 'bank_account_name', 'created_at')->get();
                foreach ($users as $u) {
                    fputcsv($output, [$u->id, $u->name, $u->email, $u->phone, $u->role, $u->status, $u->bank_name, $u->bank_account_name, $u->created_at]);
                }
                break;

            case 'properties':
                fputcsv($output, ['ID', 'Owner ID', 'Title', 'Address', 'City', 'Total Rooms', 'Created At']);
                $props = Property::withCount('rooms')->get();
                foreach ($props as $p) {
                    fputcsv($output, [$p->id, $p->owner_id, $p->title, $p->address, $p->city, $p->rooms_count, $p->created_at]);
                }
                break;

            case 'invoices':
                fputcsv($output, ['ID', 'Booking ID', 'Tenant Name', 'Tenant Phone', 'Room', 'Electricity Units', 'Water Units', 'Total Amount ($)', 'Status', 'Due Date', 'Created At']);
                $invs = Invoice::with(['booking.tenant', 'booking.room'])->latest()->get();
                foreach ($invs as $inv) {
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
                fputcsv($output, ['ID', 'Owner ID', 'Property', 'Title', 'Amount ($)', 'Date', 'Description']);
                $expenses = Expense::with('property:id,title')->latest()->get();
                foreach ($expenses as $e) {
                    fputcsv($output, [$e->id, $e->owner_id, $e->property?->title ?? 'Platform General', $e->amount, $e->date, $e->description]);
                }
                break;

            case 'audit_logs':
            default:
                fputcsv($output, ['ID', 'Event', 'Category', 'Severity', 'User Email', 'Role', 'IP Address', 'Description', 'Timestamp']);
                $logs = AuditLog::latest()->take(2500)->get();
                foreach ($logs as $l) {
                    fputcsv($output, [$l->id, $l->event, $l->category, $l->severity, $l->user_email, $l->user_role, $l->ip_address, $l->description, $l->created_at]);
                }
                break;
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Export data formatted as standard SQL insert script.
     */
    protected function exportSql(string $type)
    {
        $filename = 'pteasyeung_admin_backup_' . $type . '_' . Carbon::now()->format('Y-m-d_His') . '.sql';

        $sql = "-- ========================================================\n";
        $sql .= "-- Pteas Yeung Platform Database Backup\n";
        $sql .= "-- Generated: " . Carbon::now()->toIso8601String() . "\n";
        $sql .= "-- Export Type: " . strtoupper($type) . "\n";
        $sql .= "-- ========================================================\n\n";

        // Export Users
        if (in_array($type, ['all', 'users'])) {
            $sql .= "-- Users Table\n";
            $users = User::select('id', 'name', 'email', 'phone', 'role', 'status', 'bank_name', 'bank_account_name')->get();
            foreach ($users as $u) {
                $name = addslashes($u->name);
                $email = addslashes($u->email);
                $phone = addslashes($u->phone ?? '');
                $role = addslashes($u->role);
                $status = addslashes($u->status);
                $sql .= "INSERT INTO users (id, name, email, phone, role, status) VALUES ({$u->id}, '{$name}', '{$email}', '{$phone}', '{$role}', '{$status}') ON CONFLICT (id) DO NOTHING;\n";
            }
            $sql .= "\n";
        }

        // Export Properties
        if (in_array($type, ['all', 'properties'])) {
            $sql .= "-- Properties Table\n";
            $props = Property::all();
            foreach ($props as $p) {
                $title = addslashes($p->title);
                $addr = addslashes($p->address ?? '');
                $city = addslashes($p->city ?? '');
                $sql .= "INSERT INTO properties (id, owner_id, title, address, city) VALUES ({$p->id}, {$p->owner_id}, '{$title}', '{$addr}', '{$city}') ON CONFLICT (id) DO NOTHING;\n";
            }
            $sql .= "\n";
        }

        // Export Rooms
        if (in_array($type, ['all', 'properties'])) {
            $sql .= "-- Rooms Table\n";
            $rooms = Room::all();
            foreach ($rooms as $r) {
                $rNum = addslashes($r->room_number);
                $sql .= "INSERT INTO rooms (id, property_id, room_number, price, deposit, status) VALUES ({$r->id}, {$r->property_id}, '{$rNum}', {$r->price}, {$r->deposit}, '{$r->status}') ON CONFLICT (id) DO NOTHING;\n";
            }
            $sql .= "\n";
        }

        // Export Invoices
        if (in_array($type, ['all', 'invoices'])) {
            $sql .= "-- Invoices Table\n";
            $invoices = Invoice::all();
            foreach ($invoices as $inv) {
                $sql .= "INSERT INTO invoices (id, booking_id, total_amount, payment_status, due_date) VALUES ({$inv->id}, {$inv->booking_id}, {$inv->total_amount}, '{$inv->payment_status}', '{$inv->due_date}') ON CONFLICT (id) DO NOTHING;\n";
            }
            $sql .= "\n";
        }

        return response($sql, 200, [
            'Content-Type' => 'application/sql; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Get list of snapshot files in backup directory.
     */
    protected function getSnapshotsList(): array
    {
        $files = File::files($this->backupDir);
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
                'type' => 'Full Platform Snapshot',
            ];
        }

        // Sort latest first
        usort($snapshots, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return $snapshots;
    }

    /**
     * Helper to format byte counts into human-readable strings.
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

    /**
     * Helper to record audit logs.
     */
    protected function recordAudit(?User $user, string $event, string $description, Request $request, string $severity = 'info'): void
    {
        try {
            AuditLog::create([
                'user_id' => $user?->id,
                'user_email' => $user?->email,
                'user_role' => $user?->role ?? 'super_admin',
                'event' => $event,
                'category' => 'system',
                'severity' => $severity,
                'description' => $description,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => $request->path(),
                'method' => $request->method(),
            ]);
        } catch (\Throwable $e) {
            // Suppress audit log failures during backup
        }
    }
}
