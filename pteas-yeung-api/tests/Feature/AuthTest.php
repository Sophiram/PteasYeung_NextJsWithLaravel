<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        if (! extension_loaded('pdo_sqlite')) {
            self::markTestSkipped('pdo_sqlite extension is not available on this PHP CLI.');
        }
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'johndoe@example.com',
            'password' => 'password123',
            'role' => 'tenant',
            'phone' => '012345678',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'status',
                'user' => ['id', 'name', 'email', 'role'],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'johndoe@example.com',
            'role' => 'tenant',
        ]);
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'loginuser@example.com',
            'password' => bcrypt('secret123'),
            'role' => 'tenant',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'loginuser@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'user',
            ]);
    }

    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $user = User::factory()->create([
            'role' => 'tenant',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
            ]);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);
    }
}
