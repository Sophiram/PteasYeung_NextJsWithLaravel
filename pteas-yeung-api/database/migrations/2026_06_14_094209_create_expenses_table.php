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
        Schema::create('expenses', function (Blueprint $table) {
        $table->id();
        $table->foreignId('owner_id')->constrained('users')->onDelete('cascade'); // ភ្ជាប់ទៅម្ចាស់ផ្ទះ
        $table->string('title');        // ចំណងជើងនៃការចំណាយ
        $table->decimal('amount', 12, 2); // ចំនួនទឹកប្រាក់
        $table->text('description')->nullable(); // ការពណ៌នា
        $table->date('date');           // កាលបរិច្ឆេទ
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
