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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_email')->nullable()->index();
            $table->string('user_role')->nullable()->index();
            $table->string('event')->index(); // e.g. auth.login, auth.failed_login, security.access_denied
            $table->string('category', 50)->default('system')->index(); // auth, security, user_management, property, billing, settings, system
            $table->string('severity', 20)->default('info')->index(); // info, warning, danger, critical
            $table->text('description');
            $table->string('ip_address', 45)->nullable()->index();
            $table->text('user_agent')->nullable();
            $table->string('route')->nullable();
            $table->string('method', 10)->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamps();

            // Composite indexes for fast telemetry queries
            $table->index(['severity', 'created_at']);
            $table->index(['event', 'created_at']);
            $table->index(['category', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
