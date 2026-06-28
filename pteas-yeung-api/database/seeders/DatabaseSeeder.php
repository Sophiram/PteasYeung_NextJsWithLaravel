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
            ['email' => 'admin@pteasyeung.com'], // ឆែកមើលអ៊ីមែលនេះ បើមានហើយវានឹង Update បើអត់ទេវានឹងបង្កើតថ្មី
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('password123'), // ដាក់លេខសម្ងាត់តាមចិត្តចង់
                'role'     => 'super_admin', // ប្រាកដថា Field 'role' មាននៅក្នុងតារាង users
            ]
        );

        // បង្កើត Test User ធម្មតា
        User::factory()->create([
            'name'  => 'Test User',
            'email' => 'test@example.com',
            'role'  => 'tenant',
        ]);
    }
}
