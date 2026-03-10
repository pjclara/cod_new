<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'icd10_pcs_axis_1_options',
        'icd10_pcs_axis_2_options',
        'icd10_pcs_axis_3_options',
        'icd10_pcs_axis_4_options',
        'icd10_pcs_axis_5_options',
        'icd10_pcs_axis_6_options',
        'icd10_pcs_axis_7_options',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $tableName) {
            Schema::create($tableName, function (Blueprint $table) {
                $table->id();
                $table->string('parent_prefix', 6)->nullable();
                $table->string('prefix', 7)->unique();
                $table->char('value', 1);
                $table->string('term');
                $table->text('description')->nullable();
                $table->unsignedInteger('code_count')->default(0);
                $table->timestamps();

                $table->index('parent_prefix');
                $table->index('value');
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse(self::TABLES) as $tableName) {
            Schema::dropIfExists($tableName);
        }
    }
};
