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
        Schema::create('property_images', function (Blueprint $table) {
            $table->id();
            // បង្កើត Foreign Key ភ្ជាប់ទៅកាន់តារាង properties
            // onDelete('cascade') មានន័យថាបើលុប Property នោះរូបភាពទាំងអស់របស់វាគ្គក៏ត្រូវលុបចោលស្វ័យប្រវត្តដែរ
            $table->foreignId('property_id')->constrained('properties')->onDelete('cascade');
            $table->text('image_path'); // សម្រាប់រក្សាទុកទីតាំង ឬ Link រូបភាព
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_images');
    }
};
