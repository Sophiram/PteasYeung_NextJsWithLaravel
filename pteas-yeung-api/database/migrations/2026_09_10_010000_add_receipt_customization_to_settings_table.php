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
            $table->string('receipt_logo_url')->nullable()->after('logo_url');
            $table->string('receipt_title_kh')->default('បង្កាន់ដៃទទួលប្រាក់ / វិក្កយបត្រ')->after('footer_copyright');
            $table->string('receipt_title_en')->default('OFFICIAL RECEIPT / INVOICE');
            $table->string('receipt_subtitle_kh')->default('ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល ផ្ទះយើង');
            $table->string('receipt_subtitle_en')->default('Pteas Yeung Rental Platform');
            $table->text('receipt_header_note')->nullable();
            $table->text('receipt_footer_note_kh')->nullable();
            $table->text('receipt_footer_note_en')->nullable();
            $table->text('receipt_terms_kh')->nullable();
            $table->text('receipt_terms_en')->nullable();
            $table->string('receipt_currency_symbol')->default('$');
            $table->integer('receipt_khr_exchange_rate')->default(4100);
            $table->boolean('receipt_show_water_electricity')->default(true);
            $table->boolean('receipt_show_signatures')->default(true);
            $table->string('receipt_accent_color')->default('#0284c7');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'receipt_logo_url',
                'receipt_title_kh',
                'receipt_title_en',
                'receipt_subtitle_kh',
                'receipt_subtitle_en',
                'receipt_header_note',
                'receipt_footer_note_kh',
                'receipt_footer_note_en',
                'receipt_terms_kh',
                'receipt_terms_en',
                'receipt_currency_symbol',
                'receipt_khr_exchange_rate',
                'receipt_show_water_electricity',
                'receipt_show_signatures',
                'receipt_accent_color',
            ]);
        });
    }
};
