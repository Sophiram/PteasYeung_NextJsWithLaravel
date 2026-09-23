<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\OwnerPayment;
use App\Models\Property;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OwnerPaymentSeeder extends Seeder
{
    public function run(): void
    {
        $owners = User::where('role', 'owner')->get();
        if ($owners->isEmpty()) {
            return;
        }

        $admin = User::where('role', 'super_admin')->first();

        // 1. Seed Owner Payments (Income for Admin)
        $paymentPlans = [
            [
                'title' => 'ថ្លៃសេវាប្រព័ន្ធប្រចាំខែ (Monthly Platform Subscription)',
                'plan_type' => 'subscription',
                'amount' => 45.00,
                'status' => 'paid',
                'method' => 'ABA Bank',
                'days_ago' => 2,
            ],
            [
                'title' => 'ថ្លៃចុះបញ្ជីអចលនទ្រព្យ (Property Listing & Verification Fee)',
                'plan_type' => 'listing_fee',
                'amount' => 20.00,
                'status' => 'paid',
                'method' => 'KHQR',
                'days_ago' => 15,
            ],
            [
                'title' => 'ថ្លៃសេវាប្រព័ន្ធប្រចាំខែបន្ទាប់ (Upcoming Monthly Subscription)',
                'plan_type' => 'subscription',
                'amount' => 45.00,
                'status' => 'pending',
                'method' => 'ABA Bank',
                'days_ago' => -10, // due in 10 days
            ],
        ];

        foreach ($owners as $owner) {
            $prop = Property::where('owner_id', $owner->id)->first();
            foreach ($paymentPlans as $idx => $plan) {
                $date = Carbon::now()->subDays($plan['days_ago']);
                $invNumber = 'INV-OWN-' . $date->format('Ym') . '-' . str_pad((string) ($owner->id * 10 + $idx + 1), 4, '0', STR_PAD_LEFT);

                OwnerPayment::updateOrCreate(
                    ['invoice_number' => $invNumber],
                    [
                        'owner_id' => $owner->id,
                        'property_id' => $prop ? $prop->id : null,
                        'title' => $plan['title'],
                        'plan_type' => $plan['plan_type'],
                        'amount' => $plan['amount'],
                        'payment_status' => $plan['status'],
                        'payment_method' => $plan['method'],
                        'due_date' => $plan['status'] === 'pending' ? Carbon::now()->addDays(10)->toDateString() : $date->toDateString(),
                        'paid_at' => $plan['status'] === 'paid' ? $date : null,
                        'notes' => 'ការទូទាត់ថ្លៃសេវាប្រព័ន្ធសម្រាប់ម្ចាស់ផ្ទះ ' . $owner->name,
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]
                );
            }
        }

        // 2. Seed Admin Platform Expenses (if none exist)
        if ($admin && Expense::where('owner_id', $admin->id)->count() === 0) {
            $adminExpenses = [
                [
                    'title' => 'Cloud Server Hosting & Database (AWS / DigitalOcean)',
                    'amount' => 35.00,
                    'date' => Carbon::now()->subDays(5)->toDateString(),
                    'description' => 'ថ្លៃម៉ាស៊ីនបម្រើ និងមូលដ្ឋានទិន្នន័យលើក្លោដប្រចាំខែ',
                ],
                [
                    'title' => 'Domain & SSL Certificate Renewal',
                    'amount' => 15.00,
                    'date' => Carbon::now()->subDays(18)->toDateString(),
                    'description' => 'ថ្លៃឈ្មោះដូមេន pteasyeung.com និងសុវត្ថិភាព SSL',
                ],
                [
                    'title' => 'Telegram Bot & SMS Gateway Notification Credits',
                    'amount' => 12.50,
                    'date' => Carbon::now()->subDays(25)->toDateString(),
                    'description' => 'ថ្លៃសេវាផ្ញើសារជូនដំណឹងប្រព័ន្ធស្វ័យប្រវត្តិ',
                ],
            ];

            foreach ($adminExpenses as $item) {
                Expense::create([
                    'owner_id' => $admin->id,
                    'property_id' => null, // null means platform-wide system expense
                    'title' => $item['title'],
                    'amount' => $item['amount'],
                    'date' => $item['date'],
                    'description' => $item['description'],
                ]);
            }
        }
    }
}
