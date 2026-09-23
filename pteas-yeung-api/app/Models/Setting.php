<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'system_name',
        'logo_url',
        'receipt_logo_url',
        'admin_email',
        'hero_title',
        'hero_subtitle',
        'hero_background',
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
        'admin_bank_name',
        'admin_bank_account_name',
        'admin_bank_account_number',
        'admin_bank_qr_url',
        'admin_hotline_secondary',
        'admin_payment_notes_kh',
        'admin_payment_notes_en',
    ];

    protected $casts = [
        'receipt_show_water_electricity' => 'boolean',
        'receipt_show_signatures' => 'boolean',
        'receipt_khr_exchange_rate' => 'integer',
    ];
}
