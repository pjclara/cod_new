<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('icd10_pcs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subspecialty_id')->nullable()->constrained()->onDelete('set null');
            $table->string('code', 7)->unique();
            $table->text('description');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('code');

            if (DB::connection()->getDriverName() !== 'sqlite') {
                $table->fullText(['code', 'description']);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('icd10_pcs');
    }
};
