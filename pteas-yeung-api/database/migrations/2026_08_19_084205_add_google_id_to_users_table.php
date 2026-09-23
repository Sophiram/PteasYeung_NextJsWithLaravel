<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // បន្ថែម Column google_id បន្ទាប់ពី email
            $table->string('google_id')->nullable()->after('email');

            // កែប្រែ password ឱ្យអាច nullable បាន (ករណីចុះឈ្មោះតាម Google គ្មាន Password)
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('google_id');
            $table->string('password')->nullable(false)->change();
        });
    }
};
