<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Permission;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityAndRbacTest extends TestCase
{
    use RefreshDatabase;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        if (! extension_loaded('pdo_sqlite')) {
            self::markTestSkipped('pdo_sqlite extension is not available on this PHP CLI.');
        }
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
    }

    public function test_super_admin_has_full_permissions_bypass(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);

        $this->assertTrue($superAdmin->hasPermission('rooms.view'));
        $this->assertTrue($superAdmin->hasPermission('users.change_role'));
        $this->assertTrue($superAdmin->hasPermission('non_existent_permission'));
    }

    public function test_owner_can_delegate_permissions_to_staff(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $staff = User::factory()->create([
            'role' => 'staff',
            'owner_id' => $owner->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($owner, 'sanctum')->putJson("/api/owner/staff/{$staff->id}/permissions", [
            'permissions' => ['rooms.view', 'rooms.status_update'],
        ]);

        $response->assertStatus(200);
        $this->assertTrue($staff->fresh()->hasPermission('rooms.status_update'));
        $this->assertFalse($staff->fresh()->hasPermission('invoices.collect_payment'));
    }

    public function test_staff_cannot_access_unassigned_features(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $staff = User::factory()->create([
            'role' => 'staff',
            'owner_id' => $owner->id,
            'status' => 'active',
        ]);

        // Staff without invoices.view permission tries to view invoices
        $response = $this->actingAs($staff, 'sanctum')->getJson('/api/staff/invoices');
        $response->assertStatus(403);

        // Verify security rejection was logged to AuditLog
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'security.access_denied',
            'severity' => 'danger',
        ]);
    }

    public function test_staff_with_permission_can_update_room_status(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $staff = User::factory()->create([
            'role' => 'staff',
            'owner_id' => $owner->id,
            'status' => 'active',
        ]);
        $staff->syncPermissions(['rooms.view', 'rooms.status_update']);

        $property = Property::create([
            'owner_id' => $owner->id,
            'title' => 'Sunshine Condos',
            'address' => 'St 51',
            'city' => 'Phnom Penh',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '201',
            'price' => 200.00,
            'type' => 'Single',
            'status' => 'Available',
        ]);

        $response = $this->actingAs($staff, 'sanctum')->patchJson("/api/staff/rooms/{$room->id}/status", [
            'status' => 'maintenance',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Maintenance', $room->fresh()->status);

        // Audit log created for room status update
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'room.status_updated_by_staff',
            'category' => 'rooms',
        ]);
    }

    public function test_admin_can_change_user_role_and_it_generates_audit_log(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);
        $targetUser = User::factory()->create(['role' => 'tenant', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/users/{$targetUser->id}/role", [
            'role' => 'owner',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('owner', $targetUser->fresh()->role);

        $this->assertDatabaseHas('audit_logs', [
            'event' => 'user.role_changed',
            'user_id' => $admin->id,
        ]);
    }

    public function test_admin_can_update_system_settings_without_validation_errors(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')->post('/api/admin/settings', [
            '_method' => 'PUT',
            'system_name' => 'Pteas Yeung Platform',
            'admin_email' => 'admin@system.com',
            'receipt_show_water_electricity' => 'true',
            'receipt_show_signatures' => '1',
            'receipt_khr_exchange_rate' => '4100',
            'admin_profile_picture' => 'profiles/sample.png',
            'footer_email' => '',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', [
            'id' => 1,
            'system_name' => 'Pteas Yeung Platform',
            'receipt_show_water_electricity' => true,
            'receipt_khr_exchange_rate' => 4100,
        ]);
    }
}
