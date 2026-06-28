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
            // 🟢 បន្ថែម Column ថ្មីទាំង ៣ សម្រាប់ទុកទិន្នន័យ Banner
            $table->string('hero_title')->nullable()->after('system_name');
            $table->text('hero_subtitle')->nullable()->after('hero_title');
            $table->text('hero_background')->nullable()->after('hero_subtitle'); // ប្រើ text ព្រោះ URL រូបភាពខ្លះអាចវែងខ្លាំង
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            // 🔴 លុប Column ទាំងនោះចេញវិញ ប្រសិនបើមានការ Rollback Migration
            $table->dropColumn(['hero_title', 'hero_subtitle', 'hero_background']);
        });
    }
};
