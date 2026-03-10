<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\SpecialtySeeder;
use Database\Seeders\SubspecialtySeeder;
use Database\Seeders\Icd10CmSeeder;
use Database\Seeders\Icd10PcsSeeder;
use Database\Seeders\Icd10PcsAxisSeeder;
use Database\Seeders\Icd10ClassificationSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SpecialtySeeder::class,
            SubspecialtySeeder::class,
            Icd10CmSeeder::class,
            Icd10PcsSeeder::class,
            Icd10PcsAxisSeeder::class,
            Icd10ClassificationSeeder::class,
        ]);

        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Utilizador de Teste',
            'email' => 'test@example.com',
        ]);
    }
}
