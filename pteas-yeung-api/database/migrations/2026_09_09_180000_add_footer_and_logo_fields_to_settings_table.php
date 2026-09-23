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
        Schema::table('settings', function (Blueprint $table) {
            $table->string('logo_url')->nullable()->after('system_name');
            $table->text('footer_description_kh')->nullable();
            $table->text('footer_description_en')->nullable();
            $table->string('footer_hotline')->nullable();
            $table->string('footer_email')->nullable();
            $table->string('footer_telegram')->nullable();
            $table->string('footer_address_kh')->nullable();
            $table->string('footer_address_en')->nullable();
            $table->string('footer_operating_hours_kh')->nullable();
            $table->string('footer_operating_hours_en')->nullable();
            $table->string('footer_facebook')->nullable();
            $table->string('footer_instagram')->nullable();
            $table->string('footer_twitter')->nullable();
            $table->string('footer_copyright')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'logo_url',
                'footer_description_kh',
                'footer_description_en',
                'footer_hotline',
                'footer_email',
                'footer_telegram',
                'footer_address_kh',
                'footer_address_en',
                'footer_operating_hours_kh',
                'footer_operating_hours_en',
                'footer_facebook',
                'footer_instagram',
                'footer_twitter',
                'footer_copyright',
            ]);
        });
    }
};
