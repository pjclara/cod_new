<?php

namespace Database\Seeders;

use App\Models\Subspecialty;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class Icd10ClassificationSeeder extends Seeder
{
    public function run(): void
    {
        $subspecialtyIds = Subspecialty::query()->pluck('id', 'slug');

        if ($subspecialtyIds->isEmpty()) {
            $this->command?->warn('Nenhuma subespecialidade encontrada. A classificação dos ICD foi ignorada.');

            return;
        }

        $now = now();

        // subspecialty_id foi migrado para tabelas pivot (icd10_cm_subspecialty, icd10_pcs_subspecialty)
        // As regras de classificação automática estão desactivadas — atribuição feita manualmente via UI

        #$cmAssigned = $this->applyRules('icd10_cm', $subspecialtyIds, $this->cmRules(), $now);
        #$pcsAssigned = $this->applyRules('icd10_pcs', $subspecialtyIds, $this->pcsRules(), $now);

        #$cmUnassigned = DB::table('icd10_cm')->whereNull('subspecialty_id')->count();
        #$pcsUnassigned = DB::table('icd10_pcs')->whereNull('subspecialty_id')->count();

        #$this->command?->info("ICD-10-CM classificados: {$cmAssigned} | por classificar: {$cmUnassigned}");
        #$this->command?->info("ICD-10-PCS classificados: {$pcsAssigned} | por classificar: {$pcsUnassigned}");
    }

    private function applyRules(string $table, Collection $subspecialtyIds, array $rules, $now): int
    {
        $assigned = 0;

        foreach ($rules as $slug => $rule) {
            $subspecialtyId = $subspecialtyIds->get($slug);

            if (! $subspecialtyId) {
                continue;
            }



            $query = DB::table($table)
                ->whereNull('subspecialty_id')
                ->where(function (Builder $builder) use ($rule): void {
                    $this->applyConditions($builder, $rule);
                });

            $assigned += $query->update([
                'subspecialty_id' => $subspecialtyId,
                'updated_at' => $now,
            ]);
        }

        return $assigned;
    }

    private function applyConditions(Builder $builder, array $rule): void
    {
        $hasCondition = false;

        foreach ($rule['code_prefixes'] ?? [] as $prefix) {
            $hasCondition = true;
            $builder->orWhere('code', 'like', $prefix . '%');
        }

        foreach ($rule['code_values'] ?? [] as $value) {
            $hasCondition = true;
            $builder->orWhere('code', $value);
        }

        foreach ($rule['description_keywords'] ?? [] as $keyword) {
            $hasCondition = true;
            $builder->orWhere('description', 'like', '%' . $keyword . '%');
        }

        if (! $hasCondition) {
            $builder->whereRaw('1 = 0');
        }
    }

    private function cmRules(): array
    {
        return [
            'congenital-heart-disease' => [
                'code_prefixes' => ['Q20', 'Q21', 'Q22', 'Q23', 'Q24', 'Q25', 'Q26'],
                'description_keywords' => ['congenit', 'congénit', 'septal', 'tetralogy'],
            ],
            'valvular-heart-disease' => [
                'code_prefixes' => ['I05', 'I06', 'I07', 'I08', 'I09', 'I34', 'I35', 'I36', 'I37', 'Z95.2', 'Z95.4'],
                'description_keywords' => ['valvul', 'mitral', 'aortic valve', 'aórtic', 'tricuspid', 'pulmonic valve'],
            ],
            'arrhythmias' => [
                'code_prefixes' => ['I44', 'I45', 'I47', 'I48', 'I49', 'R00.0', 'R00.1'],
                'description_keywords' => ['arritm', 'arrhythm', 'fibrillation', 'fibrilha', 'flutter', 'taquic', 'tachy', 'bradic', 'brady', 'pacemaker'],
            ],
            'heart-failure' => [
                'code_prefixes' => ['I50', 'I11.0', 'I13.0', 'I13.2'],
                'description_keywords' => ['insuficiência cardíaca', 'heart failure', 'cardiomyopath', 'miocardiop'],
            ],
            'ischemic-heart-disease' => [
                'code_prefixes' => ['I20', 'I21', 'I22', 'I23', 'I24', 'I25'],
                'description_keywords' => ['isqu', 'ischem', 'angina', 'coronar', 'coronár', 'enfarte', 'infarct', 'myocardial'],
            ],
            'cerebrovascular-disease' => [
                'code_prefixes' => ['I60', 'I61', 'I62', 'I63', 'I64', 'I65', 'I66', 'I67', 'I68', 'I69', 'G45'],
                'description_keywords' => ['cerebrovasc', 'stroke', 'avc', 'carotid', 'carótid'],
            ],
            'epilepsy' => [
                'code_prefixes' => ['G40', 'G41'],
                'description_keywords' => ['epilep', 'convuls'],
            ],
            'dementia' => [
                'code_prefixes' => ['F01', 'F02', 'F03', 'G30', 'G31.0', 'G31.1', 'G31.8'],
                'description_keywords' => ['demenc', 'demên', 'alzheimer', 'cognit'],
            ],
            'movement-disorders' => [
                'code_prefixes' => ['G20', 'G21', 'G22', 'G23', 'G24', 'G25', 'G26'],
                'description_keywords' => ['parkinson', 'tremor', 'distonia', 'movement disorder', 'coreia'],
            ],
            'peripheral-neuropathy' => [
                'code_prefixes' => ['G56', 'G57', 'G58', 'G59', 'G60', 'G61', 'G62', 'G63', 'G64'],
                'description_keywords' => ['neuropat', 'polyneurop', 'carpal tunnel', 'túnel cárpico', 'mononeurop'],
            ],
            'pediatric-orthopedics' => [
                'code_prefixes' => ['Q65', 'Q66', 'Q67', 'Q68', 'Q69', 'Q70', 'Q71', 'Q72', 'Q73', 'Q74', 'Q75', 'Q76', 'Q77', 'Q78', 'Q79'],
                'description_keywords' => ['clubfoot', 'pé boto', 'developmental dysplasia', 'congenital dislocation', 'juvenile osteochond'],
            ],
            'trauma-and-fractures' => [
                'code_prefixes' => ['S12', 'S22', 'S32', 'S42', 'S52', 'S62', 'S72', 'S82', 'S92', 'T02', 'T08', 'T10', 'T12', 'T14.2'],
                'description_keywords' => ['fractur', 'luxa', 'disloc', 'trauma', 'sprain', 'strain'],
            ],
            'sports-medicine' => [
                'code_prefixes' => ['M75', 'M76', 'M77', 'S83', 'S86', 'S93'],
                'description_keywords' => ['sports', 'desport', 'ligament', 'meniscus', 'rotator cuff', 'acl', 'tendon'],
            ],
            'spine-disorders' => [
                'code_prefixes' => ['M40', 'M41', 'M42', 'M43', 'M44', 'M45', 'M46', 'M47', 'M48', 'M49', 'M50', 'M51', 'M52', 'M53', 'M54'],
                'description_keywords' => ['coluna', 'spine', 'vertebr', 'cervicalgia', 'lombalgia', 'radicul'],
            ],
            'joint-replacement' => [
                'code_prefixes' => ['M15', 'M16', 'M17', 'M18', 'M19', 'T84', 'Z96.6'],
                'description_keywords' => ['artroplast', 'joint replacement', 'prosthesis', 'prótese articular', 'gonarthrosis', 'coxarthrosis'],
            ],
            'inflammatory-bowel-disease' => [
                'code_prefixes' => ['K50', 'K51'],
                'description_keywords' => ['crohn', 'ulcerative colitis', 'colite ulcerosa'],
            ],
            'pancreatic-disease' => [
                'code_prefixes' => ['K85', 'K86'],
                'description_keywords' => ['pancreat'],
            ],
            'liver-disease' => [
                'code_prefixes' => ['K70', 'K71', 'K72', 'K73', 'K74', 'K75', 'K76', 'K77', 'B18'],
                'description_keywords' => ['hepát', 'hepat', 'cirrh', 'cirros'],
            ],
            'upper-gi' => [
                'code_prefixes' => ['K20', 'K21', 'K22', 'K23', 'K25', 'K26', 'K27', 'K28', 'K29', 'K30', 'K31'],
                'description_keywords' => ['esofag', 'oesoph', 'gástr', 'gastr', 'duoden', 'reflux', 'peptic ulcer'],
            ],
            'colorectal' => [
                'code_prefixes' => ['K52', 'K55', 'K56', 'K57', 'K58', 'K59', 'K60', 'K61', 'K62', 'K63', 'K64'],
                'description_keywords' => ['colon', 'cólon', 'rect', 'reto', 'sigmoid', 'anal', 'hemorrhoid', 'hemorroid'],
            ],
            'obstructive-lung-disease' => [
                'code_prefixes' => ['J40', 'J41', 'J42', 'J43', 'J44', 'J45', 'J46', 'J47'],
                'description_keywords' => ['copd', 'dpo', 'asthma', 'asma', 'bronch', 'emphysema'],
            ],
            'interstitial-lung-disease' => [
                'code_prefixes' => ['J80', 'J81', 'J82', 'J84'],
                'description_keywords' => ['interstitial', 'intersticial', 'fibrose pulmonar', 'pulmonary fibrosis', 'sarcoid'],
            ],
            'pleural-disease' => [
                'code_prefixes' => ['J90', 'J91', 'J92', 'J93', 'J94'],
                'description_keywords' => ['pleur', 'pleural', 'pneumothorax', 'effusion'],
            ],
            'sleep-disorders' => [
                'code_prefixes' => ['F51', 'G47'],
                'description_keywords' => ['sleep apnea', 'apneia do sono', 'insom', 'narcolep'],
            ],
            'pulmonary-hypertension' => [
                'code_prefixes' => ['I27'],
                'description_keywords' => ['hipertensão pulmonar', 'pulmonary hypertension'],
            ],
            'diabetes' => [
                'code_prefixes' => ['E08', 'E09', 'E10', 'E11', 'E13'],
                'description_keywords' => ['diabet', 'hyperglyc', 'hypoglyc', 'insulin'],
            ],
            'thyroid-disorders' => [
                'code_prefixes' => ['E00', 'E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07'],
                'description_keywords' => ['thyroid', 'tiroid', 'hashimoto', 'graves'],
            ],
            'pituitary-disorders' => [
                'code_prefixes' => ['E22', 'E23'],
                'description_keywords' => ['pituitar', 'hipófis', 'pituitary', 'acromeg'],
            ],
            'adrenal-disorders' => [
                'code_prefixes' => ['E24', 'E25', 'E26', 'E27'],
                'description_keywords' => ['adrenal', 'suprarren', 'cushing', 'addison', 'hyperaldosteron'],
            ],
            'metabolic-bone-disease' => [
                'code_prefixes' => ['E55', 'E83.3', 'M80', 'M81', 'M82', 'M83', 'M84.4', 'M85'],
                'description_keywords' => ['osteopor', 'osteomal', 'paget', 'metabolic bone', 'vitamin d deficiency'],
            ],
            'acute-kidney-injury' => [
                'code_prefixes' => ['N17'],
                'description_keywords' => ['acute kidney injury', 'acute renal failure', 'lesão renal aguda'],
            ],
            'dialysis' => [
                'code_prefixes' => ['Z49', 'Z91.15', 'Z99.2', 'N18.6'],
                'description_keywords' => ['dialys', 'diális', 'hemodial', 'peritoneal dialysis'],
            ],
            'chronic-kidney-disease' => [
                'code_prefixes' => ['N18', 'N19', 'I12', 'I13.1', 'I13.2'],
                'description_keywords' => ['chronic kidney disease', 'doença renal crónica', 'end stage renal', 'renal insufficiency'],
            ],
            'glomerular-disease' => [
                'code_prefixes' => ['N00', 'N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08'],
                'description_keywords' => ['glomerul', 'nefrót', 'nephritic', 'nephrotic'],
            ],
            'electrolyte-disorders' => [
                'code_prefixes' => ['E86', 'E87'],
                'description_keywords' => ['dehydrat', 'desidrata', 'hyponatr', 'hyperkal', 'hipocal', 'electrolyte'],
            ],
            'breast-cancer' => [
                'code_prefixes' => ['C50', 'D05'],
                'description_keywords' => ['breast cancer', 'cancro da mama', 'carcinoma of breast'],
            ],
            'lung-cancer' => [
                'code_prefixes' => ['C33', 'C34', 'D02.2'],
                'description_keywords' => ['lung cancer', 'cancro do pulmão', 'bronchogenic'],
            ],
            'hematologic-malignancies' => [
                'code_prefixes' => ['C81', 'C82', 'C83', 'C84', 'C85', 'C86', 'C88', 'C90', 'C91', 'C92', 'C93', 'C94', 'C95', 'C96', 'D46', 'D47'],
                'description_keywords' => ['leukem', 'leucem', 'lymphom', 'linfom', 'myelom', 'mielom'],
            ],
            'gastrointestinal-cancers' => [
                'code_prefixes' => ['C15', 'C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C22', 'C23', 'C24', 'C25', 'C26'],
                'description_keywords' => ['gastric cancer', 'colorectal cancer', 'hepatocellular', 'pancreatic cancer', 'cancro gástrico', 'cancro colorretal'],
            ],
            'palliative-oncology' => [
                'code_values' => ['Z51.5'],
                'description_keywords' => ['palliative', 'paliativ'],
            ],
            'mood-disorders' => [
                'code_prefixes' => ['F30', 'F31', 'F32', 'F33', 'F34', 'F38', 'F39'],
                'description_keywords' => ['depress', 'bipolar', 'mania', 'mood disorder'],
            ],
            'anxiety-disorders' => [
                'code_prefixes' => ['F40', 'F41', 'F42', 'F43', 'F44', 'F45', 'F48'],
                'description_keywords' => ['anx', 'panic', 'phobia', 'obsessive', 'ptsd'],
            ],
            'psychotic-disorders' => [
                'code_prefixes' => ['F20', 'F21', 'F22', 'F23', 'F24', 'F25', 'F28', 'F29'],
                'description_keywords' => ['psychot', 'schizo', 'esquizo'],
            ],
            'addiction-psychiatry' => [
                'code_prefixes' => ['F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19'],
                'description_keywords' => ['alcohol', 'alcool', 'opioid', 'cannabis', 'substance use', 'dependên'],
            ],
            'geriatric-psychiatry' => [
                'code_prefixes' => ['R54'],
                'description_keywords' => ['senile', 'senil', 'old age', 'fragilidade do idoso'],
            ],
            'hernia-surgery' => [
                'code_prefixes' => ['K40', 'K41', 'K42', 'K43', 'K44', 'K45', 'K46'],
                'description_keywords' => ['hernia', 'hérnia'],
            ],
            'thyroid-and-parathyroid-surgery' => [
                'code_prefixes' => ['D34', 'E21'],
                'description_keywords' => ['thyroid', 'tiroid', 'parathyroid', 'paratiroid', 'goiter', 'bócio'],
            ],
            'breast-surgery' => [
                'code_prefixes' => ['D24', 'N60', 'N61', 'N62', 'N63', 'N64'],
                'description_keywords' => ['breast', 'mama', 'mastit'],
            ],
            'colo-retal-surgery' => [
                'code_prefixes' => ['K62', 'K63', 'K64'],
                'description_keywords' => ['colon', 'cólon', 'rect', 'reto', 'sigmoid', 'anal', 'hemorrhoid', 'hemorroid'],
            ],
            'hepato-biliary-pancreatic-surgery' => [
                'code_prefixes' => ['K22.2', 'K22.3', 'K22.4', 'K22.5', 'K22.6', 'K22.7', 'K22.8', 'K22.9', 'K23', 'K24', 'K25', 'K26'],
                'description_keywords' => ['hepato', 'biliary', 'pancreatic', 'fígado', 'vesícula biliar', 'pâncreas'],
            ],
            'esofago-gastric-surgery' => [
                'code_prefixes' => ['K20', 'K21', 'K22', 'K23', 'K24', 'K25', 'K26'],
                'description_keywords' => ['esofag', 'oesoph', 'gástr', 'gastr'],
            ],
        ];
    }

    private function pcsRules(): array
    {
        // Descrições PCS estão em português com formato:
        // "Secção -> Sistema corporal -> Operação raiz -> Parte do corpo -> Acesso -> Dispositivo -> Qualificador"
        // Regras ordenadas do mais específico para o geral; códigos já atribuídos ficam excluídos (whereNull).
        return [
            // ── CARDIOLOGIA ──────────────────────────────────────────────────
            'ischemic-heart-disease' => [
                'code_prefixes' => ['021', '027'],       // Bypass e Dilatação artéria coronária
                'description_keywords' => ['coronária'],
            ],
            'arrhythmias' => [
                'code_prefixes' => ['02H', '02K', '0JH', '5A2'], // Inserção leads/gerador, mapeamento, cardioversão
                'description_keywords' => ['marcapasso', 'desfibrilhador'],
            ],
            'valvular-heart-disease' => [
                'code_prefixes' => ['02R', '02Q', '02U'], // Substituição/reparação/suplemento de válvulas
                'description_keywords' => ['válvula aórtica', 'válvula mitral', 'válvula tricúspide', 'válvula pulmonar'],
            ],
            'heart-failure' => [
                'code_prefixes' => ['02Y', '5A0'],        // Transplante cardíaco, assistência extracorporal
                'description_keywords' => ['ventrículo assistido', 'coração artificial', 'balão intra-aórtico'],
            ],
            'congenital-heart-disease' => [
                'code_prefixes' => ['02'],               // Restantes procedimentos cardíacos/grandes vasos
                'description_keywords' => ['septal', 'tetralogia', 'congénit', 'grandes vasos'],
            ],

            // ── NEUROLOGIA / NEUROCIRURGIA ────────────────────────────────
            'cerebrovascular-disease' => [
                'code_prefixes' => ['031', '037', '03C', '03L'],  // Artérias superiores (carótida, cerebral, basilar)
                'description_keywords' => ['artéria carótida', 'artéria cerebral', 'artéria basilar', 'artéria vertebral', 'aneurisma'],
            ],
            'epilepsy' => [
                'description_keywords' => ['nervo vago'],
            ],
            'movement-disorders' => [
                'description_keywords' => ['estimulação cerebral profunda', 'tálamo', 'globo pálido', 'subtálamo'],
            ],
            'peripheral-neuropathy' => [
                'code_prefixes' => ['01B', '01N', '018'], // Excisão/libertação/divisão nervoso periférico
                'description_keywords' => ['nervo mediano', 'nervo ulnar', 'nervo radial', 'canal cárpico', 'nervo ciático', 'plexo braquial'],
            ],
            'spine-disorders' => [
                'code_prefixes' => ['0RG', '0SG'],        // Fusão articulações superiores/inferiores (coluna)
                'description_keywords' => ['coluna vertebral', 'vértebra', 'disco intervertebral', 'canal medular', 'laminecto', 'discecto'],
            ],

            // ── ORTOPEDIA ────────────────────────────────────────────────
            'joint-replacement' => [
                'code_prefixes' => ['0RR', '0SR'],        // Substituição articulações superiores e inferiores
            ],
            'trauma-and-fractures' => [
                'code_prefixes' => ['0NS', '0PS', '0QS', '0RS', '0SS'], // Reposicionamento de ossos e articulações
                'description_keywords' => ['fixação externa', 'fixação interna', 'reposicionamento'],
            ],
            'sports-medicine' => [
                'description_keywords' => ['ligamento cruzado', 'menisco', 'manguito rotador', 'labrum', 'ligamento colateral'],
            ],
            'pediatric-orthopedics' => [
                'description_keywords' => ['displasia da anca', 'displasia coxofemoral', 'pé equinovaro', 'escoliose congénita'],
            ],

            // ── ONCOLOGIA (antes das especialidades GI/pulmonares para não ser absorvida pelos prefixos gerais) ──
            'breast-cancer' => [
                'code_prefixes' => ['DM'],               // Radioterapia da mama
                'description_keywords' => ['mastectomia', 'tumorectomia', 'biópsia da mama', 'linfonodo sentinela'],
            ],
            'lung-cancer' => [
                'description_keywords' => ['lobectomia', 'pneumonectomia', 'segmentectomia', 'ressecção pulmonar', 'ressecção do brônquio'],
            ],
            'hematologic-malignancies' => [
                'code_prefixes' => ['30'],               // Administração de células estaminais/medula
                'description_keywords' => ['transplante de medula óssea', 'transplante da medula', 'células estaminais', 'leucaferese'],
            ],
            'gastrointestinal-cancers' => [
                'description_keywords' => ['ressecção abdomino-perineal', 'esofagogastrectomia', 'duodenopancreatectomia', 'gastrectomia total'],
            ],
            'palliative-oncology' => [
                'description_keywords' => ['paliativo'],
            ],

            // ── GASTROENTEROLOGIA / CIRURGIA DIGESTIVA ───────────────────
            'inflammatory-bowel-disease' => [
                'description_keywords' => ['ileostomia', 'proctocolectomia', 'reservatório ileal', 'anastomose ileoanal', 'bolsa ileal'],
            ],
            'upper-gi' => [
                'description_keywords' => ['esofagectomia', 'gastrectomia', 'gastrostomia', 'esófago', 'estômago', 'duodeno', 'piloroplastia', 'fundoplicatura'],
            ],
            'pancreatic-disease' => [
                'description_keywords' => ['pâncreas', 'pancreatectomia', 'pancreatoduo', 'ducto pancreático'],
            ],
            'liver-disease' => [
                'description_keywords' => ['fígado', 'hepático', 'hepatectomia', 'transplante hepático', 'transplante de fígado'],
            ],
            'colorectal' => [
                'description_keywords' => ['colectomia', 'colostomia', 'proctectomia', 'sigmoidectomia', 'anastomose colorrectal', 'cólon', 'reto'],
            ],

            // ── PNEUMOLOGIA ─────────────────────────────────────────────
            'pleural-disease' => [
                'description_keywords' => ['pleural', 'toracocentese', 'pleurodese', 'empiema'],
            ],
            'interstitial-lung-disease' => [
                'description_keywords' => ['biópsia pulmonar', 'biópsia do pulmão', 'fibrose pulmonar'],
            ],
            'pulmonary-hypertension' => [
                'description_keywords' => ['artéria pulmonar', 'tromboendarterectomia pulmonar'],
            ],
            'sleep-disorders' => [
                'description_keywords' => ['traqueostomia', 'nervo hipoglosso', 'traqueotomia'],
            ],
            'obstructive-lung-disease' => [
                'description_keywords' => ['brônquio', 'broncoscopia', 'redução do volume pulmonar', 'traqueobrônquico'],
            ],

            // ── ENDOCRINOLOGIA ───────────────────────────────────────────
            'thyroid-disorders' => [
                'description_keywords' => ['tiróide', 'tiroidectomia', 'tireoide'],
            ],
            'adrenal-disorders' => [
                'description_keywords' => ['suprarrenal', 'adrenalectomia', 'glândula adrenal'],
            ],
            'pituitary-disorders' => [
                'description_keywords' => ['hipófise', 'pituitária', 'hipofisectomia'],
            ],
            'metabolic-bone-disease' => [
                'description_keywords' => ['paratiróide', 'paratiroidectomia', 'glândula paratiróide'],
            ],
            'diabetes' => [
                'description_keywords' => ['ilhéus pancreáticos', 'bomba de insulina'],
            ],

            // ── NEFROLOGIA ──────────────────────────────────────────────
            'dialysis' => [
                'code_prefixes' => ['5A1D', '5A1C'],     // Hemodiálise e substituição renal extracorporal
                'description_keywords' => ['hemodiálise', 'diálise peritoneal', 'fístula arteriovenosa', 'cateter de diálise'],
            ],
            'chronic-kidney-disease' => [
                'description_keywords' => ['transplante de rim', 'transplante renal', 'nefrostomia', 'nefrectomia'],
            ],
            'acute-kidney-injury' => [
                'description_keywords' => ['hemofiltração', 'substituição renal contínua'],
            ],
            'glomerular-disease' => [
                'description_keywords' => ['biópsia renal', 'biópsia do rim'],
            ],

            // ── PSIQUIATRIA ─────────────────────────────────────────────
            'mood-disorders' => [
                'code_prefixes' => ['GZ'],               // Saúde mental (inclui eletroconvulsivoterapia)
            ],
            'psychotic-disorders' => [
                'description_keywords' => ['eletroconvulsivoterapia', 'terapia electroconvulsiva'],
            ],
            'addiction-psychiatry' => [
                'code_prefixes' => ['HZ'],               // Tratamento de abuso de substâncias
                'description_keywords' => ['desintoxicação'],
            ],

            // ── CIRURGIA GERAL ──────────────────────────────────────────
            'hernia-surgery' => [
                'description_keywords' => ['hernia', 'hérnia', 'eventração'],
            ],
            'breast-surgery' => [
                'description_keywords' => ['mastopexia', 'mamoplastia', 'reconstrução mamária'],
            ],
            'thyroid-and-parathyroid-surgery' => [
                'description_keywords' => ['bócio', 'goiter', 'paratiróide', 'paratiroidectomia'],
            ],
            'colo-retal-surgery' => [
                'description_keywords' => ['hemorrhoidectomia', 'fissurectomia', 'fistulectomia anal'],
            ],
            'hepato-biliary-pancreatic-surgery' => [
                'description_keywords' => ['Sistema Hepatobiliar e Pâncreas', 'colecistostomia', 'Vesicula biliar', 'pancreatectomia'],
            ],
            'esofago-gastric-surgery' => [
                'description_keywords' => ['fundoplicatura', 'gastrectomia', 'gastrostomia', 'esofagectomia'],
            ],

        ];
    }
}
