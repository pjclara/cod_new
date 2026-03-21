<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create pivot table CM <-> Subspecialty
        Schema::create('icd10_cm_subspecialty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('icd10_cm_id')->constrained('icd10_cm')->onDelete('cascade');
            $table->foreignId('subspecialty_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->unique(['icd10_cm_id', 'subspecialty_id']);
        });

        // 2. Create pivot table PCS <-> Subspecialty
        Schema::create('icd10_pcs_subspecialty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('icd10_pcs_id')->constrained('icd10_pcs')->onDelete('cascade');
            $table->foreignId('subspecialty_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->unique(['icd10_pcs_id', 'subspecialty_id']);
        });

        // 3. Migrate existing FK data to pivot tables
        $now = now();

        DB::table('icd10_cm')
            ->whereNotNull('subspecialty_id')
            ->select(['id', 'subspecialty_id'])
            ->chunkById(500, function ($rows) use ($now) {
                $inserts = collect($rows)->map(fn ($r) => [
                    'icd10_cm_id'     => $r->id,
                    'subspecialty_id' => $r->subspecialty_id,
                    'created_at'      => $now,
                    'updated_at'      => $now,
                ])->all();
                DB::table('icd10_cm_subspecialty')->insertOrIgnore($inserts);
            });

        DB::table('icd10_pcs')
            ->whereNotNull('subspecialty_id')
            ->select(['id', 'subspecialty_id'])
            ->chunkById(500, function ($rows) use ($now) {
                $inserts = collect($rows)->map(fn ($r) => [
                    'icd10_pcs_id'    => $r->id,
                    'subspecialty_id' => $r->subspecialty_id,
                    'created_at'      => $now,
                    'updated_at'      => $now,
                ])->all();
                DB::table('icd10_pcs_subspecialty')->insertOrIgnore($inserts);
            });

        // 4. Drop old FK columns
        Schema::table('icd10_cm', function (Blueprint $table) {
            $table->dropForeign(['subspecialty_id']);
            $table->dropColumn('subspecialty_id');
        });

        Schema::table('icd10_pcs', function (Blueprint $table) {
            $table->dropForeign(['subspecialty_id']);
            $table->dropColumn('subspecialty_id');
        });
    }

    public function down(): void
    {
        // Re-add FK columns
        Schema::table('icd10_cm', function (Blueprint $table) {
            $table->foreignId('subspecialty_id')->nullable()->constrained()->onDelete('set null')->after('id');
        });

        Schema::table('icd10_pcs', function (Blueprint $table) {
            $table->foreignId('subspecialty_id')->nullable()->constrained()->onDelete('set null')->after('id');
        });

        // Migrate pivot data back (take first subspecialty per code)
        DB::table('icd10_cm_subspecialty')
            ->select(['icd10_cm_id', DB::raw('MIN(subspecialty_id) as sub_id')])
            ->groupBy('icd10_cm_id')
            ->get()
            ->each(fn ($r) => DB::table('icd10_cm')->where('id', $r->icd10_cm_id)->update(['subspecialty_id' => $r->sub_id]));

        DB::table('icd10_pcs_subspecialty')
            ->select(['icd10_pcs_id', DB::raw('MIN(subspecialty_id) as sub_id')])
            ->groupBy('icd10_pcs_id')
            ->get()
            ->each(fn ($r) => DB::table('icd10_pcs')->where('id', $r->icd10_pcs_id)->update(['subspecialty_id' => $r->sub_id]));

        Schema::dropIfExists('icd10_cm_subspecialty');
        Schema::dropIfExists('icd10_pcs_subspecialty');
    }
};
