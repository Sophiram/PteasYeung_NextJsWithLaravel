<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Properties
            ['name' => 'View Properties', 'slug' => 'properties.view', 'group' => 'properties', 'description' => 'View listed properties and their details.'],
            ['name' => 'Create Properties', 'slug' => 'properties.create', 'group' => 'properties', 'description' => 'Create and publish new rental properties.'],
            ['name' => 'Edit Properties', 'slug' => 'properties.edit', 'group' => 'properties', 'description' => 'Edit property details, photos, and information.'],
            ['name' => 'Delete Properties', 'slug' => 'properties.delete', 'group' => 'properties', 'description' => 'Remove properties from the platform.'],

            // Rooms
            ['name' => 'View Rooms', 'slug' => 'rooms.view', 'group' => 'rooms', 'description' => 'View room lists, prices, and amenities.'],
            ['name' => 'Create Rooms', 'slug' => 'rooms.create', 'group' => 'rooms', 'description' => 'Add new rooms to properties.'],
            ['name' => 'Edit Rooms', 'slug' => 'rooms.edit', 'group' => 'rooms', 'description' => 'Modify room information and prices.'],
            ['name' => 'Delete Rooms', 'slug' => 'rooms.delete', 'group' => 'rooms', 'description' => 'Delete rooms from properties.'],
            ['name' => 'Update Room Status', 'slug' => 'rooms.status_update', 'group' => 'rooms', 'description' => 'Update room availability (Available, Occupied, Maintenance).'],

            // Bookings
            ['name' => 'View Bookings', 'slug' => 'bookings.view', 'group' => 'bookings', 'description' => 'View booking requests and stay records.'],
            ['name' => 'Create Bookings', 'slug' => 'bookings.create', 'group' => 'bookings', 'description' => 'Submit a new room booking request.'],
            ['name' => 'Approve Bookings', 'slug' => 'bookings.approve', 'group' => 'bookings', 'description' => 'Approve or confirm pending bookings.'],
            ['name' => 'Cancel Bookings', 'slug' => 'bookings.cancel', 'group' => 'bookings', 'description' => 'Reject or cancel bookings.'],

            // Invoices & Billing
            ['name' => 'View Invoices', 'slug' => 'invoices.view', 'group' => 'invoices', 'description' => 'View rental and utility invoices.'],
            ['name' => 'Create Invoices', 'slug' => 'invoices.create', 'group' => 'invoices', 'description' => 'Generate water, electricity, and room rental invoices.'],
            ['name' => 'Edit Invoices', 'slug' => 'invoices.edit', 'group' => 'invoices', 'description' => 'Adjust invoice line items and balances.'],
            ['name' => 'Delete Invoices', 'slug' => 'invoices.delete', 'group' => 'invoices', 'description' => 'Delete invoices.'],
            ['name' => 'Collect Payments', 'slug' => 'invoices.collect_payment', 'group' => 'invoices', 'description' => 'Mark invoices as paid and record payments.'],

            // Expenses
            ['name' => 'View Expenses', 'slug' => 'expenses.view', 'group' => 'expenses', 'description' => 'View property maintenance and utility expenses.'],
            ['name' => 'Create Expenses', 'slug' => 'expenses.create', 'group' => 'expenses', 'description' => 'Record new maintenance and operational expenses.'],
            ['name' => 'Delete Expenses', 'slug' => 'expenses.delete', 'group' => 'expenses', 'description' => 'Delete expense entries.'],

            // Staff Management (Owner)
            ['name' => 'View Staff', 'slug' => 'staff.view', 'group' => 'staff', 'description' => 'View staff members under property owner.'],
            ['name' => 'Create Staff', 'slug' => 'staff.create', 'group' => 'staff', 'description' => 'Create new staff login accounts.'],
            ['name' => 'Edit Staff', 'slug' => 'staff.edit', 'group' => 'staff', 'description' => 'Update staff details and permissions.'],
            ['name' => 'Delete Staff', 'slug' => 'staff.delete', 'group' => 'staff', 'description' => 'Remove staff accounts.'],

            // User Management (Admin)
            ['name' => 'View Users', 'slug' => 'users.view', 'group' => 'users', 'description' => 'View registered platform users.'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'group' => 'users', 'description' => 'Create user accounts directly.'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'group' => 'users', 'description' => 'Modify user information.'],
            ['name' => 'Change User Roles', 'slug' => 'users.change_role', 'group' => 'users', 'description' => 'Assign or change user roles.'],
            ['name' => 'Change User Status', 'slug' => 'users.change_status', 'group' => 'users', 'description' => 'Approve, suspend, or activate user accounts.'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'group' => 'users', 'description' => 'Permanently delete user accounts.'],

            // Reports & Analytics
            ['name' => 'View Reports', 'slug' => 'reports.view', 'group' => 'reports', 'description' => 'Access revenue and occupancy analytics.'],
            ['name' => 'Export Reports', 'slug' => 'reports.export', 'group' => 'reports', 'description' => 'Download Excel / PDF business reports.'],

            // Settings
            ['name' => 'View Settings', 'slug' => 'settings.view', 'group' => 'settings', 'description' => 'View system configurations.'],
            ['name' => 'Edit Settings', 'slug' => 'settings.edit', 'group' => 'settings', 'description' => 'Update system brand and contact settings.'],

            // Audit Logs & Security
            ['name' => 'View Audit Logs', 'slug' => 'audit_logs.view', 'group' => 'audit_logs', 'description' => 'Access system security and activity telemetry.'],
        ];

        foreach ($permissions as $perm) {
            Permission::updateOrCreate(['slug' => $perm['slug']], $perm);
        }

        // Default Role Permissions Mapping
        $roleDefaults = [
            'owner' => [
                'properties.view', 'properties.create', 'properties.edit', 'properties.delete',
                'rooms.view', 'rooms.create', 'rooms.edit', 'rooms.delete', 'rooms.status_update',
                'bookings.view', 'bookings.approve', 'bookings.cancel',
                'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.collect_payment',
                'expenses.view', 'expenses.create', 'expenses.delete',
                'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
                'reports.view', 'reports.export',
            ],
            'staff' => [
                'properties.view',
                'rooms.view',
            ],
            'tenant' => [
                'bookings.create', 'bookings.view',
                'invoices.view',
            ],
        ];

        // Clear existing role permissions and insert new ones
        DB::table('role_permissions')->truncate();

        foreach ($roleDefaults as $role => $slugs) {
            $permissionIds = Permission::whereIn('slug', $slugs)->pluck('id');
            foreach ($permissionIds as $permId) {
                DB::table('role_permissions')->insert([
                    'role' => $role,
                    'permission_id' => $permId,
                ]);
            }
        }
    }
}
