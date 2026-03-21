<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;

/** @implements IReadFilter */
class CmColumnFilter implements IReadFilter
{
    // Only load the columns we actually need: G, H, J, K, L
    private const COLS = ['G', 'H', 'J', 'K', 'L'];

    public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
    {
        return in_array($columnAddress, self::COLS, true);
    }
}

class Icd10CmSeeder extends Seeder
{
    private const BATCH_SIZE = 500;

    public function run(): void
    {
        ini_set('memory_limit', '512M');

        $path = base_path('doc/icd10cm.xlsx');

        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $reader->setLoadSheetsOnly(['ICD10CM']);
        $reader->setReadFilter(new CmColumnFilter());

        $this->command?->info('A carregar a folha de cálculo ICD-10-CM…');
        $spreadsheet = $reader->load($path);
        $sheet       = $spreadsheet->getSheetByName('ICD10CM');

        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
            DB::table('icd10_cm')->delete();
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('icd10_cm')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        $batch = [];
        $now   = now()->toDateTimeString();
        $count = 0;
        $seen  = [];

        // Row 1 is the header; data starts at row 2.
        foreach ($sheet->getRowIterator(2) as $row) {
            $ri = $row->getRowIndex();

            $code  = trim((string) ($sheet->getCell('G' . $ri)->getValue() ?? ''));
            $valid = (string) ($sheet->getCell('H' . $ri)->getValue() ?? '0');

            if ($code === '' || mb_strlen($code) > 10 || isset($seen[$code])) {
                continue;
            }
            $seen[$code] = true;

            // Preferir descrição longa PT → curta PT → longa EN
            $descPtLong  = trim((string) ($sheet->getCell('K' . $ri)->getValue() ?? ''));
            $descPtShort = trim((string) ($sheet->getCell('L' . $ri)->getValue() ?? ''));
            $descEnLong  = trim((string) ($sheet->getCell('J' . $ri)->getValue() ?? ''));
            $description = $descPtLong ?: $descPtShort ?: $descEnLong;

            $batch[] = [
                'code'            => $code,
                'description'     => $description,
                'valid'           => $valid === '1',
                'notes'           => null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ];

            if (count($batch) >= self::BATCH_SIZE) {
                DB::table('icd10_cm')->insert($batch);
                $count += count($batch);
                $batch  = [];
                $this->command?->line("  Inseridos {$count} códigos CM…");
            }
        }

        if (!empty($batch)) {
            DB::table('icd10_cm')->insert($batch);
            $count += count($batch);
        }

        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);

        $this->command?->info("Importação ICD-10-CM concluída: {$count} códigos inseridos.");
    }
}
