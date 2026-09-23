<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingAndAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        if (! extension_loaded('pdo_sqlite')) {
            self::markTestSkipped('pdo_sqlite extension is not available on this PHP CLI.');
        }
    }

    public function test_owner_cannot_create_room_under_another_owners_property(): void
    {
        $owner1 = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $owner2 = User::factory()->create(['role' => 'owner', 'status' => 'active']);

        $propertyOfOwner2 = Property::create([
            'owner_id' => $owner2->id,
            'title' => 'Building B',
            'address' => 'St 200',
            'city' => 'Phnom Penh',
        ]);

        $response = $this->actingAs($owner1, 'sanctum')->postJson('/api/owner/rooms', [
            'property_id' => $propertyOfOwner2->id,
            'room_number' => '101',
            'price' => 150.00,
            'type' => 'Single',
        ]);

        $response->assertStatus(403);
    }

    public function test_tenant_cannot_book_an_already_occupied_room(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $tenant1 = User::factory()->create(['role' => 'tenant', 'status' => 'active']);
        $tenant2 = User::factory()->create(['role' => 'tenant', 'status' => 'active']);

        $property = Property::create([
            'owner_id' => $owner->id,
            'title' => 'Paradise Condos',
            'address' => 'St 123',
            'city' => 'Phnom Penh',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '201',
            'price' => 200.00,
            'type' => 'Single',
            'status' => 'Available',
        ]);

        // Tenant 1 books room for next week
        $checkIn = now()->addDays(5)->toDateString();
        $checkOut = now()->addDays(10)->toDateString();

        $response1 = $this->actingAs($tenant1, 'sanctum')->postJson('/api/bookings', [
            'room_id' => $room->id,
            'check_in_date' => $checkIn,
            'check_out_date' => $checkOut,
        ]);

        $response1->assertStatus(201);
        $this->assertEquals('Occupied', $room->fresh()->status);

        // Tenant 2 tries to book same room
        $response2 = $this->actingAs($tenant2, 'sanctum')->postJson('/api/bookings', [
            'room_id' => $room->id,
            'check_in_date' => $checkIn,
            'check_out_date' => $checkOut,
        ]);

        $response2->assertStatus(422);
    }

    public function test_cancelling_booking_restores_room_availability(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $tenant = User::factory()->create(['role' => 'tenant', 'status' => 'active']);

        $property = Property::create([
            'owner_id' => $owner->id,
            'title' => 'Paradise Condos',
            'address' => 'St 123',
            'city' => 'Phnom Penh',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '301',
            'price' => 250.00,
            'type' => 'Double',
            'status' => 'Available',
        ]);

        $booking = Booking::create([
            'room_id' => $room->id,
            'tenant_id' => $tenant->id,
            'owner_id' => $owner->id,
            'check_in_date' => now()->toDateString(),
            'deposit_amount' => 50.00,
            'status' => 'active',
        ]);
        $room->update(['status' => 'Occupied']);

        // Owner marks booking as ended
        $response = $this->actingAs($owner, 'sanctum')->patchJson("/api/owner/bookings/{$booking->id}/status", [
            'status' => 'ended',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Available', $room->fresh()->status);
    }

    public function test_staff_cannot_modify_rooms_of_another_owner(): void
    {
        $owner1 = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $owner2 = User::factory()->create(['role' => 'owner', 'status' => 'active']);
        $staffOfOwner1 = User::factory()->create(['role' => 'staff', 'owner_id' => $owner1->id, 'status' => 'active']);

        $propertyOfOwner2 = Property::create([
            'owner_id' => $owner2->id,
            'title' => 'Owner 2 Place',
            'address' => 'St 99',
            'city' => 'Siem Reap',
        ]);

        $roomOfOwner2 = Room::create([
            'property_id' => $propertyOfOwner2->id,
            'room_number' => '909',
            'price' => 120.00,
            'type' => 'Single',
            'status' => 'Available',
        ]);

        // Staff of Owner 1 tries to change room status of Owner 2
        $response = $this->actingAs($staffOfOwner1, 'sanctum')->patchJson("/api/staff/rooms/{$roomOfOwner2->id}/status", [
            'status' => 'Maintenance',
        ]);

        $this->assertTrue(in_array($response->status(), [403, 404]));
    }

    public function test_public_room_details_includes_owner_information(): void
    {
        $owner = User::factory()->create([
            'name' => 'Lok Kru Heng',
            'phone' => '012999888',
            'email' => 'heng@landlord.com',
            'role' => 'owner',
            'status' => 'active',
        ]);

        $property = Property::create([
            'owner_id' => $owner->id,
            'title' => 'Heng Apartment',
            'address' => 'St 271',
            'city' => 'Phnom Penh',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '101A',
            'price' => 160.00,
            'deposit' => 80.00,
            'type' => 'Studio',
            'status' => 'Available',
        ]);

        $response = $this->getJson("/api/rooms/{$room->id}");
        $response->assertStatus(200);
        $response->assertJsonPath('data.room_number', '101A');
        $response->assertJsonPath('data.property.owner.name', 'Lok Kru Heng');
        $response->assertJsonPath('data.property.owner.phone', '012999888');
    }

    public function test_user_can_send_inquiry_message_to_room_owner(): void
    {
        $owner = User::factory()->create([
            'name' => 'Landlord Sok',
            'role' => 'owner',
            'status' => 'active',
        ]);

        $property = Property::create([
            'owner_id' => $owner->id,
            'title' => 'Sok Building',
            'address' => 'St 63',
            'city' => 'Phnom Penh',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '202',
            'price' => 200.00,
            'type' => 'Studio',
            'status' => 'Available',
        ]);

        $response = $this->postJson("/api/rooms/{$room->id}/contact", [
            'name' => 'Chantha Tenant',
            'phone' => '098111222',
            'email' => 'chantha@gmail.com',
            'message' => 'Is this room available for move-in this week?',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // Assert Notification was created for owner
        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'info',
        ]);
    }
}
