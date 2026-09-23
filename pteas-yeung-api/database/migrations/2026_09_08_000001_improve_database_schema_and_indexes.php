<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add foreign key to expenses.property_id and composite indexes
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreign('property_id')
                ->references('id')
                ->on('properties')
                ->nullOnDelete();

            $table->index(['owner_id', 'date'], 'expenses_owner_date_index');
            $table->index(['property_id', 'date'], 'expenses_property_date_index');
        });

        // 2. Improve bookings table indexes and status flexibility
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('status', 30)->default('pending')->change();
            $table->index(['room_id', 'status'], 'bookings_room_status_index');
            $table->index(['tenant_id', 'status'], 'bookings_tenant_status_index');
            $table->index(['owner_id', 'status'], 'bookings_owner_status_index');
        });

        // 3. Improve rooms table indexes
        Schema::table('rooms', function (Blueprint $table) {
            $table->index(['property_id', 'status'], 'rooms_property_status_index');
        });

        // 4. Improve invoices table indexes
        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['booking_id', 'payment_status'], 'invoices_booking_status_index');
        });

        // 5. Improve properties table indexes
        Schema::table('properties', function (Blueprint $table) {
            $table->index('city', 'properties_city_index');
        });

        // 6. Improve users table indexes
        Schema::table('users', function (Blueprint $table) {
            $table->index('google_id', 'users_google_id_index');
            $table->index(['role', 'status'], 'users_role_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_google_id_index');
            $table->dropIndex('users_role_status_index');
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex('properties_city_index');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_booking_status_index');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropIndex('rooms_property_status_index');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex('bookings_room_status_index');
            $table->dropIndex('bookings_tenant_status_index');
            $table->dropIndex('bookings_owner_status_index');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->dropIndex('expenses_owner_date_index');
            $table->dropIndex('expenses_property_date_index');
        });
    }
};
