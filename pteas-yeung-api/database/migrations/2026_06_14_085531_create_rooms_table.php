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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->string('room_number');
            $table->decimal('price', 10, 2);
            $table->enum('type', ['Single', 'Double', 'Studio', 'Apartment']);
            $table->enum('status', ['Available', 'Occupied', 'Maintenance'])->default('Available');
            $table->string('floor')->nullable();
            $table->json('amenities')->nullable(); // ប្រើ JSON ងាយស្រួលជាង longtext
            $table->string('description')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
