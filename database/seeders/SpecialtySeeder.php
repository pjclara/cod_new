<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Seeder;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            ['slug' => 'cardiology', 'name' => 'Cardiologia', 'description' => 'Coração e sistema cardiovascular'],
            ['slug' => 'neurology', 'name' => 'Neurologia', 'description' => 'Cérebro, medula espinal e sistema nervoso'],
            ['slug' => 'orthopedics', 'name' => 'Ortopedia', 'description' => 'Sistema músculo-esquelético'],
            ['slug' => 'gastroenterology', 'name' => 'Gastroenterologia', 'description' => 'Sistema digestivo'],
            ['slug' => 'pulmonology', 'name' => 'Pneumologia', 'description' => 'Sistema respiratório'],
            ['slug' => 'endocrinology', 'name' => 'Endocrinologia', 'description' => 'Hormonas e metabolismo'],
            ['slug' => 'nephrology', 'name' => 'Nefrologia', 'description' => 'Rins e sistema urinário'],
            ['slug' => 'oncology', 'name' => 'Oncologia', 'description' => 'Cancro e tumores'],
            ['slug' => 'psychiatry', 'name' => 'Psiquiatria', 'description' => 'Perturbações da saúde mental'],
            ['slug' => 'general-surgery', 'name' => 'Cirurgia Geral', 'description' => 'Procedimentos cirúrgicos'],
        ];

        foreach ($specialties as $data) {
            Specialty::updateOrCreate(
                ['slug' => $data['slug']],
                ['name' => $data['name'], 'description' => $data['description']]
            );
        }
    }
}
