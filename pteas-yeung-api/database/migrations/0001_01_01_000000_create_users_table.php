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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable(); // បន្ថែមលេខទូរស័ព្ទ
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // បន្ថែម Role និង Status
            $table->enum('role', ['super_admin', 'owner', 'staff', 'tenant'])->default('tenant');
            $table->enum('status', ['active', 'inactive', 'pending'])->default('active'); // status សម្រាប់គ្រប់គ្រង User

            $table->string('id_card_number')->nullable(); // សំខាន់សម្រាប់ Owner/Tenant
            $table->string('profile_picture')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
