<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // បង្កើត Admin តែម្តង
        User::updateOrCreate(
            ['email' => 'admin@pteasyeung.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
            ]
        );

        // បង្កើត Test User ធម្មតា
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'tenant',
        ]);
    }
}
