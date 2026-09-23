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
        Schema::create('room_images', function (Blueprint $table) {
            $table->id();
            // ភ្ជាប់ទៅកាន់ ID របស់តារាង rooms បើលុបបន្ទប់ ឱ្យលុបរូបភាពជាមួយគ្នា (Cascade)
            $table->foreignId('room_id')->constrained('rooms')->onDelete('cascade');
            $table->string('image_path');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_images');
    }
};
