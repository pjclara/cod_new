<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use XMLReader;
use ZipArchive;

class Icd10PcsAxisSeeder extends Seeder
{
    private const BATCH_SIZE = 500;

    private const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

    private const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

    private const AXIS_COLUMNS = [
        1 => ['term_en' => 'B', 'term_pt' => 'C', 'desc_en' => 'D', 'desc_pt' => 'E'],
        2 => ['term_en' => 'G', 'term_pt' => 'H', 'desc_en' => 'I', 'desc_pt' => 'J'],
        3 => ['term_en' => 'L', 'term_pt' => 'M', 'desc_en' => 'N', 'desc_pt' => 'O'],
        4 => ['term_en' => 'Q', 'term_pt' => 'R', 'desc_en' => 'S', 'desc_pt' => 'T'],
        5 => ['term_en' => 'V', 'term_pt' => 'W', 'desc_en' => 'X', 'desc_pt' => 'Y'],
        6 => ['term_en' => 'AA', 'term_pt' => 'AB', 'desc_en' => 'AC', 'desc_pt' => 'AD'],
        7 => ['term_en' => 'AF', 'term_pt' => 'AG', 'desc_en' => 'AH', 'desc_pt' => 'AI'],
    ];

    public function run(): void
    {
        ini_set('memory_limit', '1G');

        $this->command?->info('A materializar os 7 eixos do ICD-10-PCS em tabelas…');

        $path = base_path('doc/icd10pcs.xlsx');
        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            throw new \RuntimeException('Não foi possível abrir o ficheiro icd10pcs.xlsx.');
        }

        $sharedStrings = $this->loadSharedStrings($path, $zip);
        $sheetPath = $this->resolveWorksheetPath($zip, 'ICD10PCS');

        for ($axis = 1; $axis <= 7; $axis++) {
            DB::table($this->tableName($axis))->delete();
        }

        $axisData = [1 => [], 2 => [], 3 => [], 4 => [], 5 => [], 6 => []];
        $axis7Batch = [];
        $axis7Count = 0;
        $seen = [];
        $now = now()->toDateTimeString();

        $reader = new XMLReader();
        $reader->open('zip://'.$path.'#'.$sheetPath);

        while ($reader->read()) {
            if ($reader->nodeType !== XMLReader::ELEMENT || $reader->localName !== 'row') {
                continue;
            }

            $rowIndex = (int) $reader->getAttribute('r');

            if ($rowIndex < 2) {
                continue;
            }

            $rowXml = $reader->readOuterXml();

            if ($rowXml === '') {
                continue;
            }

            $values = $this->parseRowValues($rowXml, $sharedStrings);

            $code = trim((string) ($values['AJ'] ?? ''));
            $valid = (string) ($values['AK'] ?? '0');

            if (strlen($code) !== 7 || $valid !== '1' || isset($seen[$code])) {
                continue;
            }

            $seen[$code] = true;

            for ($axis = 1; $axis <= 7; $axis++) {
                $prefix = substr($code, 0, $axis);
                $parentPrefix = $axis === 1 ? null : substr($code, 0, $axis - 1);
                $value = substr($code, $axis - 1, 1);
                $columns = self::AXIS_COLUMNS[$axis];

                $term = $this->normalizeLabel(
                    $values[$columns['term_pt']] ?? null
                    ?: $values[$columns['term_en']] ?? null
                    ?: $values[$columns['desc_pt']] ?? null
                    ?: $values[$columns['desc_en']] ?? null
                );

                $description = $this->normalizeLabel(
                    $values[$columns['desc_pt']] ?? null
                    ?: $values[$columns['desc_en']] ?? null
                    ?: $term
                );

                if ($axis === 7) {
                    $axis7Batch[] = [
                        'parent_prefix' => $parentPrefix,
                        'prefix' => $prefix,
                        'value' => $value,
                        'term' => $term,
                        'description' => $description,
                        'code_count' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if (count($axis7Batch) >= self::BATCH_SIZE) {
                        DB::table($this->tableName(7))->insert($axis7Batch);
                        $axis7Count += count($axis7Batch);
                        $axis7Batch = [];
                    }

                    continue;
                }

                if (! isset($axisData[$axis][$prefix])) {
                    $axisData[$axis][$prefix] = [
                        'parent_prefix' => $parentPrefix,
                        'prefix' => $prefix,
                        'value' => $value,
                        'term' => $term,
                        'description' => $description,
                        'code_count' => 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                $axisData[$axis][$prefix]['code_count']++;
            }
        }

        $reader->close();
        $zip->close();

        if ($axis7Batch !== []) {
            DB::table($this->tableName(7))->insert($axis7Batch);
            $axis7Count += count($axis7Batch);
        }

        for ($axis = 1; $axis <= 6; $axis++) {
            $table = $this->tableName($axis);

            foreach (array_chunk(array_values($axisData[$axis]), self::BATCH_SIZE) as $batch) {
                DB::table($table)->insert($batch);
            }

            $this->command?->line(sprintf('  Eixo %d: %d opções gravadas.', $axis, count($axisData[$axis])));
        }

        $this->command?->line(sprintf('  Eixo 7: %d opções gravadas.', $axis7Count));

        $this->command?->info('Materialização dos eixos ICD-10-PCS concluída.');
    }

    private function loadSharedStrings(string $path, ZipArchive $zip): array
    {
        if ($zip->locateName('xl/sharedStrings.xml') === false) {
            return [];
        }

        $reader = new XMLReader();
        $reader->open('zip://'.$path.'#xl/sharedStrings.xml');

        $strings = [];

        while ($reader->read()) {
            if ($reader->nodeType !== XMLReader::ELEMENT || $reader->localName !== 'si') {
                continue;
            }

            $xml = $reader->readOuterXml();

            if ($xml === '') {
                $strings[] = '';
                continue;
            }

            $element = simplexml_load_string($xml);
            $texts = $element?->xpath('.//*[local-name()="t"]') ?: [];
            $strings[] = trim(implode('', array_map(fn ($node) => (string) $node, $texts)));
        }

        $reader->close();

        return $strings;
    }

    private function resolveWorksheetPath(ZipArchive $zip, string $worksheetName): string
    {
        $workbookXml = $zip->getFromName('xl/workbook.xml');
        $relsXml = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($workbookXml === false || $relsXml === false) {
            throw new \RuntimeException('Não foi possível ler a estrutura interna do ficheiro ICD10PCS.');
        }

        $workbook = simplexml_load_string($workbookXml);
        $rels = simplexml_load_string($relsXml);

        $relationshipMap = [];
        foreach (($rels->xpath('//*[local-name()="Relationship"]') ?: []) as $relationship) {
            $relationshipMap[(string) $relationship['Id']] = (string) $relationship['Target'];
        }

        $workbook->registerXPathNamespace('main', self::NS_MAIN);
        $workbook->registerXPathNamespace('r', self::NS_REL);

        $sheets = $workbook->xpath('//main:sheets/main:sheet') ?: [];

        foreach ($sheets as $sheet) {
            if ((string) $sheet['name'] !== $worksheetName) {
                continue;
            }

            $relationshipId = (string) $sheet->attributes(self::NS_REL)['id'];
            $target = $relationshipMap[$relationshipId] ?? null;

            if ($target === null) {
                break;
            }

            return str_starts_with($target, 'xl/') ? $target : 'xl/'.$target;
        }

        throw new \RuntimeException('A folha ICD10PCS não foi encontrada no ficheiro de origem.');
    }

    private function parseRowValues(string $rowXml, array $sharedStrings): array
    {
        $element = simplexml_load_string($rowXml);
        $values = [];

        if (! $element) {
            return $values;
        }

        foreach (($element->xpath('.//*[local-name()="c"]') ?: []) as $cell) {
            $reference = (string) $cell['r'];
            $column = preg_replace('/\d+/', '', $reference) ?: '';

            if ($column === '') {
                continue;
            }

            $type = (string) $cell['t'];
            $rawValue = isset($cell->v) ? (string) $cell->v : '';

            if ($type === 's') {
                $values[$column] = $sharedStrings[(int) $rawValue] ?? '';
                continue;
            }

            if ($type === 'inlineStr') {
                $texts = $cell->xpath('.//*[local-name()="t"]') ?: [];
                $values[$column] = implode('', array_map(fn ($node) => (string) $node, $texts));
                continue;
            }

            $values[$column] = $rawValue;
        }

        return $values;
    }

    private function tableName(int $axis): string
    {
        return sprintf('icd10_pcs_axis_%d_options', $axis);
    }

    private function normalizeLabel(mixed $value): string
    {
        return trim((string) ($value ?? ''));
    }
}
