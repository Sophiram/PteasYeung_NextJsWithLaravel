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
        // 1. System Permissions Table
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Human-readable name (e.g. "Create Property")
            $table->string('slug')->unique(); // Slug identifier (e.g. "properties.create")
            $table->string('group')->index(); // Group (e.g. "properties", "rooms", "invoices")
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. User-specific Permission Override / Assignment (Pivot)
        Schema::create('permission_user', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->primary(['user_id', 'permission_id']);
        });

        // 3. Default Role Permissions Template (Pivot)
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->string('role')->index(); // super_admin, owner, staff, tenant
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->primary(['role', 'permission_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permission_user');
        Schema::dropIfExists('permissions');
    }
};
