<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class BackupTest extends TestCase
{
    use RefreshDatabase;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        if (! extension_loaded('pdo_sqlite')) {
            self::markTestSkipped('pdo_sqlite extension is not available on this PHP CLI.');
        }
    }

    public function test_super_admin_can_view_backup_stats(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/backup/stats');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'database' => ['driver', 'name', 'status'],
                    'counts' => ['users', 'properties', 'rooms', 'bookings', 'invoices', 'expenses', 'audit_logs'],
                    'snapshots' => ['count', 'total_size'],
                    'environment' => ['php_version', 'laravel_version', 'server_time'],
                ],
            ]);
    }

    public function test_super_admin_can_create_list_and_delete_server_snapshot(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);

        // Create snapshot
        $createRes = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/backup/create');
        $createRes->assertStatus(201)
            ->assertJsonPath('success', true);

        $filename = $createRes->json('data.filename');
        $this->assertNotEmpty($filename);

        // List snapshots
        $listRes = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/backup/list');
        $listRes->assertStatus(200)
            ->assertJsonPath('success', true);
        $this->assertGreaterThanOrEqual(1, count($listRes->json('data')));

        // Download snapshot
        $downRes = $this->actingAs($admin, 'sanctum')->get('/api/admin/backup/download/' . $filename);
        $downRes->assertStatus(200);

        // Delete snapshot
        $delRes = $this->actingAs($admin, 'sanctum')->deleteJson('/api/admin/backup/' . $filename);
        $delRes->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_super_admin_can_export_backup_in_json_csv_and_sql(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);

        // JSON export
        $jsonRes = $this->actingAs($admin, 'sanctum')->get('/api/admin/backup/export?type=all&format=json');
        $jsonRes->assertStatus(200);
        $this->assertStringContainsString('application/json', $jsonRes->headers->get('content-type'));

        // CSV export
        $csvRes = $this->actingAs($admin, 'sanctum')->get('/api/admin/backup/export?type=users&format=csv');
        $csvRes->assertStatus(200);
        $this->assertStringContainsString('text/csv', $csvRes->headers->get('content-type'));

        // SQL export
        $sqlRes = $this->actingAs($admin, 'sanctum')->get('/api/admin/backup/export?type=all&format=sql');
        $sqlRes->assertStatus(200);
        $this->assertStringContainsString('application/sql', $sqlRes->headers->get('content-type'));
    }

    public function test_super_admin_can_restore_from_backup_file(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);

        $backupPayload = [
            'meta' => ['platform' => 'Pteas Yeung Platform', 'version' => '2.0'],
            'users' => [
                [
                    'name' => 'Restored Landlord',
                    'email' => 'restored_landlord@example.com',
                    'phone' => '012999888',
                    'role' => 'owner',
                    'status' => 'active',
                ],
            ],
            'properties' => [
                [
                    'title' => 'Restored Villa Residence',
                    'address' => 'Street 2004, Phnom Penh',
                    'city' => 'Phnom Penh',
                    'rooms' => [
                        [
                            'room_number' => 'V-101',
                            'price' => 120.00,
                            'status' => 'available',
                        ],
                    ],
                ],
            ],
        ];

        $tmpFile = UploadedFile::fake()->createWithContent('backup.json', json_encode($backupPayload));

        $res = $this->actingAs($admin, 'sanctum')->post('/api/admin/backup/restore', [
            'backup_file' => $tmpFile,
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', ['email' => 'restored_landlord@example.com']);
        $this->assertDatabaseHas('properties', ['title' => 'Restored Villa Residence']);
        $this->assertDatabaseHas('rooms', ['room_number' => 'V-101']);
    }

    public function test_owner_can_manage_and_export_business_backups(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $prop = Property::create([
            'owner_id' => $owner->id,
            'title' => 'My Rental Building',
            'address' => 'St 123',
            'city' => 'Phnom Penh',
        ]);

        // 1. Stats
        $statsRes = $this->actingAs($owner, 'sanctum')->getJson('/api/owner/backup/stats');
        $statsRes->assertStatus(200)
            ->assertJsonPath('data.counts.properties', 1);

        // 2. Create snapshot
        $createRes = $this->actingAs($owner, 'sanctum')->postJson('/api/owner/backup/create');
        $createRes->assertStatus(201);
        $filename = $createRes->json('data.filename');

        // 3. List
        $listRes = $this->actingAs($owner, 'sanctum')->getJson('/api/owner/backup/list');
        $listRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($listRes->json('data')));

        // 4. Export CSV
        $csvRes = $this->actingAs($owner, 'sanctum')->get('/api/owner/backup/export?type=properties&format=csv');
        $csvRes->assertStatus(200);
        $this->assertStringContainsString('text/csv', $csvRes->headers->get('content-type'));

        // 5. Delete snapshot
        $delRes = $this->actingAs($owner, 'sanctum')->deleteJson('/api/owner/backup/' . $filename);
        $delRes->assertStatus(200);
    }

    public function test_tenant_cannot_access_backup_endpoints(): void
    {
        $tenant = User::factory()->create(['role' => 'tenant', 'status' => 'active']);

        $adminRes = $this->actingAs($tenant, 'sanctum')->getJson('/api/admin/backup/stats');
        $adminRes->assertStatus(403);

        $ownerRes = $this->actingAs($tenant, 'sanctum')->getJson('/api/owner/backup/stats');
        $ownerRes->assertStatus(403);
    }
}
