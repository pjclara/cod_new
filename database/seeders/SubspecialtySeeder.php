<?php

namespace Database\Seeders;

use App\Models\Specialty;
use App\Models\Subspecialty;
use Illuminate\Database\Seeder;

class SubspecialtySeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'cardiology' => [
                ['slug' => 'ischemic-heart-disease', 'name' => 'Doença Cardíaca Isquémica', 'description' => 'Patologias causadas pela redução do fluxo sanguíneo para o miocárdio.'],
                ['slug' => 'heart-failure', 'name' => 'Insuficiência Cardíaca', 'description' => 'Condição em que o coração não consegue bombear sangue de forma eficaz.'],
                ['slug' => 'arrhythmias', 'name' => 'Arritmias', 'description' => 'Alterações do ritmo cardíaco, rápidas, lentas ou irregulares.'],
                ['slug' => 'valvular-heart-disease', 'name' => 'Doença Valvular Cardíaca', 'description' => 'Doenças que afetam o funcionamento das válvulas cardíacas.'],
                ['slug' => 'congenital-heart-disease', 'name' => 'Cardiopatia Congénita', 'description' => 'Anomalias cardíacas presentes desde o nascimento.'],
            ],
            'neurology' => [
                ['slug' => 'cerebrovascular-disease', 'name' => 'Doença Cerebrovascular', 'description' => 'Patologias que afetam os vasos sanguíneos do cérebro.'],
                ['slug' => 'epilepsy', 'name' => 'Epilepsia', 'description' => 'Perturbação neurológica caracterizada por crises epiléticas recorrentes.'],
                ['slug' => 'dementia', 'name' => 'Demência', 'description' => 'Declínio progressivo das funções cognitivas e da autonomia.'],
                ['slug' => 'movement-disorders', 'name' => 'Perturbações do Movimento', 'description' => 'Doenças com alterações do controlo motor, como tremor ou rigidez.'],
                ['slug' => 'peripheral-neuropathy', 'name' => 'Neuropatia Periférica', 'description' => 'Lesão ou disfunção dos nervos periféricos.'],
            ],
            'orthopedics' => [
                ['slug' => 'spine-disorders', 'name' => 'Patologias da Coluna', 'description' => 'Condições que afetam a coluna vertebral e estruturas associadas.'],
                ['slug' => 'joint-replacement', 'name' => 'Substituição Articular', 'description' => 'Tratamento cirúrgico com próteses articulares.'],
                ['slug' => 'sports-medicine', 'name' => 'Medicina Desportiva', 'description' => 'Prevenção e tratamento de lesões relacionadas com a prática desportiva.'],
                ['slug' => 'trauma-and-fractures', 'name' => 'Trauma e Fraturas', 'description' => 'Lesões traumáticas do aparelho locomotor.'],
                ['slug' => 'pediatric-orthopedics', 'name' => 'Ortopedia Pediátrica', 'description' => 'Patologias ortopédicas na criança e no adolescente.'],
            ],
            'gastroenterology' => [
                ['slug' => 'inflammatory-bowel-disease', 'name' => 'Doença Inflamatória do Intestino', 'description' => 'Doenças inflamatórias crónicas do tubo digestivo, como Crohn e colite ulcerosa.'],
                ['slug' => 'liver-disease', 'name' => 'Doença Hepática', 'description' => 'Patologias que afetam o fígado e a sua função.'],
                ['slug' => 'colorectal', 'name' => 'Colorretal', 'description' => 'Doenças do cólon, reto e canal anal.'],
                ['slug' => 'upper-gi', 'name' => 'Trato Gastrointestinal Superior', 'description' => 'Patologias do esófago, estômago e duodeno.'],
                ['slug' => 'pancreatic-disease', 'name' => 'Doença Pancreática', 'description' => 'Condições que afetam o pâncreas exócrino e endócrino.'],
            ],
            'pulmonology' => [
                ['slug' => 'obstructive-lung-disease', 'name' => 'Doença Pulmonar Obstrutiva', 'description' => 'Doenças com limitação persistente do fluxo aéreo.'],
                ['slug' => 'interstitial-lung-disease', 'name' => 'Doença Pulmonar Intersticial', 'description' => 'Patologias difusas do interstício pulmonar.'],
                ['slug' => 'pulmonary-hypertension', 'name' => 'Hipertensão Pulmonar', 'description' => 'Elevação da pressão nas artérias pulmonares.'],
                ['slug' => 'sleep-disorders', 'name' => 'Perturbações do Sono', 'description' => 'Doenças respiratórias e neurológicas associadas ao sono.'],
                ['slug' => 'pleural-disease', 'name' => 'Doença Pleural', 'description' => 'Patologias da pleura, incluindo derrames e espessamentos.'],
            ],
            'endocrinology' => [
                ['slug' => 'diabetes', 'name' => 'Diabetes', 'description' => 'Doenças relacionadas com alterações da glicose e da insulina.'],
                ['slug' => 'thyroid-disorders', 'name' => 'Perturbações da Tiroide', 'description' => 'Patologias que afetam a estrutura ou função da tiroide.'],
                ['slug' => 'adrenal-disorders', 'name' => 'Perturbações da Suprarrenal', 'description' => 'Condições associadas à produção hormonal das glândulas suprarrenais.'],
                ['slug' => 'pituitary-disorders', 'name' => 'Perturbações Hipofisárias', 'description' => 'Doenças da hipófise com impacto hormonal sistémico.'],
                ['slug' => 'metabolic-bone-disease', 'name' => 'Doença Óssea Metabólica', 'description' => 'Alterações do metabolismo ósseo, como osteoporose e osteomalácia.'],
            ],
            'nephrology' => [
                ['slug' => 'chronic-kidney-disease', 'name' => 'Doença Renal Crónica', 'description' => 'Perda progressiva e persistente da função renal.'],
                ['slug' => 'acute-kidney-injury', 'name' => 'Lesão Renal Aguda', 'description' => 'Deterioração súbita da função renal.'],
                ['slug' => 'glomerular-disease', 'name' => 'Doença Glomerular', 'description' => 'Patologias que afetam os glomérulos renais.'],
                ['slug' => 'dialysis', 'name' => 'Diálise', 'description' => 'Cuidados e acompanhamento de doentes em terapêutica dialítica.'],
                ['slug' => 'electrolyte-disorders', 'name' => 'Perturbações Eletrolíticas', 'description' => 'Desequilíbrios do sódio, potássio e outros eletrólitos.'],
            ],
            'oncology' => [
                ['slug' => 'breast-cancer', 'name' => 'Cancro da Mama', 'description' => 'Diagnóstico, estadiamento e tratamento do cancro da mama.'],
                ['slug' => 'lung-cancer', 'name' => 'Cancro do Pulmão', 'description' => 'Neoplasias malignas primárias do pulmão e vias aéreas.'],
                ['slug' => 'gastrointestinal-cancers', 'name' => 'Cancros Gastrointestinais', 'description' => 'Neoplasias do esófago, estômago, fígado, pâncreas e intestino.'],
                ['slug' => 'hematologic-malignancies', 'name' => 'Neoplasias Hematológicas', 'description' => 'Doenças malignas do sangue, medula óssea e sistema linfático.'],
                ['slug' => 'palliative-oncology', 'name' => 'Oncologia Paliativa', 'description' => 'Controlo de sintomas e cuidados centrados na qualidade de vida.'],
            ],
            'psychiatry' => [
                ['slug' => 'mood-disorders', 'name' => 'Perturbações do Humor', 'description' => 'Inclui depressão, perturbação bipolar e alterações afetivas relacionadas.'],
                ['slug' => 'anxiety-disorders', 'name' => 'Perturbações de Ansiedade', 'description' => 'Conjunto de perturbações marcadas por medo, ansiedade e evitamento.'],
                ['slug' => 'psychotic-disorders', 'name' => 'Perturbações Psicóticas', 'description' => 'Doenças com alterações da perceção, pensamento e contacto com a realidade.'],
                ['slug' => 'addiction-psychiatry', 'name' => 'Psiquiatria da Adição', 'description' => 'Avaliação e tratamento de dependências químicas e comportamentais.'],
                ['slug' => 'geriatric-psychiatry', 'name' => 'Psiquiatria Geriátrica', 'description' => 'Saúde mental da pessoa idosa e comorbilidades associadas.'],
            ],
            'general-surgery' => [
                ['slug' => 'abdominal-surgery', 'name' => 'Cirurgia Abdominal', 'description' => 'Procedimentos cirúrgicos do abdómen e vísceras associadas.'],
                ['slug' => 'hernia-surgery', 'name' => 'Cirurgia da Hérnia', 'description' => 'Tratamento cirúrgico de hérnias da parede abdominal.'],
                ['slug' => 'breast-surgery', 'name' => 'Cirurgia da Mama', 'description' => 'Procedimentos cirúrgicos benignos e oncológicos da mama.'],
                ['slug' => 'thyroid-and-parathyroid-surgery', 'name' => 'Cirurgia da Tiroide e Paratiroide', 'description' => 'Cirurgia endócrina cervical para doenças da tiroide e paratiroides.'],
                ['slug' => 'minimally-invasive-surgery', 'name' => 'Cirurgia Minimamente Invasiva', 'description' => 'Técnicas laparoscópicas e outras abordagens menos invasivas.'],
            ],
        ];

        foreach ($data as $specialtySlug => $subspecialties) {
            $specialty = Specialty::where('slug', $specialtySlug)->first();
            if (! $specialty) {
                continue;
            }

            foreach ($subspecialties as $subspecialty) {
                Subspecialty::updateOrCreate(
                    ['slug' => $subspecialty['slug']],
                    [
                        'specialty_id' => $specialty->id,
                        'name' => $subspecialty['name'],
                        'description' => $subspecialty['description'],
                    ]
                );
            }
        }
    }
}
