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
        Schema::create('owner_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->string('title');
            $table->string('plan_type')->default('subscription');
            $table->decimal('amount', 10, 2);
            $table->string('payment_status')->default('pending');
            $table->string('payment_method')->nullable()->default('ABA Bank');
            $table->string('payment_proof_url')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'payment_status']);
            $table->index('payment_status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('owner_payments');
    }
};
