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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            // ភ្ជាប់ទៅនឹង User account ដើម្បីឱ្យគាត់អាច Login បាន
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // ព័ត៌មានលម្អិតរបស់អ្នកជួល
            $table->string('id_card_number')->unique(); // អត្តសញ្ញាណប័ណ្ណ
            $table->string('nationality')->default('Cambodian');
            $table->string('occupation')->nullable(); // មុខរបរ
            $table->string('emergency_contact')->nullable(); // លេខទំនាក់ទំនងបន្ទាន់
            $table->text('current_address')->nullable(); // អាសយដ្ឋានបច្ចុប្បន្ន

            // ស្ថានភាពការស្នាក់នៅ
            $table->enum('status', ['active', 'inactive', 'moved_out'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
