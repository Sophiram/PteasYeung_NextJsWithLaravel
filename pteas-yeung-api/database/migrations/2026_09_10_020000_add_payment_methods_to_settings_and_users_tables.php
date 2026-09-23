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
        // 1. Add admin payment method & secondary contact fields to settings table
        Schema::table('settings', function (Blueprint $table) {
            $table->string('admin_bank_name')->default('ABA Bank')->nullable()->after('receipt_accent_color');
            $table->string('admin_bank_account_name')->default('PTEAS YEUNG PLATFORM')->nullable()->after('admin_bank_name');
            $table->string('admin_bank_account_number')->default('001 234 567')->nullable()->after('admin_bank_account_name');
            $table->string('admin_bank_qr_url')->nullable()->after('admin_bank_account_number');
            $table->string('admin_hotline_secondary')->default('+855 98 765 432')->nullable()->after('admin_bank_qr_url');
            $table->text('admin_payment_notes_kh')->nullable()->after('admin_hotline_secondary');
            $table->text('admin_payment_notes_en')->nullable()->after('admin_payment_notes_kh');
        });

        // 2. Add landlord/owner payment method fields to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('profile_picture');
            $table->string('bank_account_name')->nullable()->after('bank_name');
            $table->string('bank_account_number')->nullable()->after('bank_account_name');
            $table->string('bank_qr_code')->nullable()->after('bank_account_number');
            $table->text('payment_instructions')->nullable()->after('bank_qr_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'admin_bank_name',
                'admin_bank_account_name',
                'admin_bank_account_number',
                'admin_bank_qr_url',
                'admin_hotline_secondary',
                'admin_payment_notes_kh',
                'admin_payment_notes_en',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'bank_name',
                'bank_account_name',
                'bank_account_number',
                'bank_qr_code',
                'payment_instructions',
            ]);
        });
    }
};
