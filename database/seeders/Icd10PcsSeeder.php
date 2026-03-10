<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;

/** @implements IReadFilter */
class PcsColumnFilter implements IReadFilter
{
    // Only load the columns we need for PCS:
    // AJ(36)=code, AK(37)=valid, AM(39)=desc EN long, AO(41)=desc PT long, AP(42)=desc PT short
    private const COLS = ['AJ', 'AK', 'AM', 'AO', 'AP'];

    public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
    {
        return in_array($columnAddress, self::COLS, true);
    }
}

class Icd10PcsSeeder extends Seeder
{
    private const BATCH_SIZE = 500;

    public function run(): void
    {
        ini_set('memory_limit', '1G');

        $path = base_path('doc/icd10pcs.xlsx');

        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $reader->setLoadSheetsOnly(['ICD10PCS']);
        $reader->setReadFilter(new PcsColumnFilter());

        $this->command?->info('A carregar a folha de cálculo ICD-10-PCS…');
        $spreadsheet = $reader->load($path);
        $sheet       = $spreadsheet->getSheetByName('ICD10PCS');

        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
            DB::table('icd10_pcs')->delete();
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('icd10_pcs')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        $batch = [];
        $now   = now()->toDateTimeString();
        $count = 0;
        $seen  = [];

        // Row 1 is the header; data starts at row 2.
        foreach ($sheet->getRowIterator(2) as $row) {
            $ri = $row->getRowIndex();

            $code  = trim((string) ($sheet->getCell('AJ' . $ri)->getValue() ?? ''));
            $valid = (string) ($sheet->getCell('AK' . $ri)->getValue() ?? '0');

            // Os códigos PCS têm exatamente 7 caracteres; ignorar agregados do cabeçalho
            if (strlen($code) !== 7 || $valid !== '1' || isset($seen[$code])) {
                continue;
            }
            $seen[$code] = true;

            // Preferir descrição longa PT → curta PT → longa EN
            $descPtLong  = trim((string) ($sheet->getCell('AO' . $ri)->getValue() ?? ''));
            $descPtShort = trim((string) ($sheet->getCell('AP' . $ri)->getValue() ?? ''));
            $descEnLong  = trim((string) ($sheet->getCell('AM' . $ri)->getValue() ?? ''));
            $description = $descPtLong ?: $descPtShort ?: $descEnLong;

            $batch[] = [
                'code'            => $code,
                'description'     => $description,
                'subspecialty_id' => null,
                'notes'           => null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ];

            if (count($batch) >= self::BATCH_SIZE) {
                DB::table('icd10_pcs')->insert($batch);
                $count += count($batch);
                $batch  = [];
                $this->command?->line("  Inseridos {$count} códigos PCS…");
            }
        }

        if (!empty($batch)) {
            DB::table('icd10_pcs')->insert($batch);
            $count += count($batch);
        }

        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);

        $this->command?->info("Importação ICD-10-PCS concluída: {$count} códigos inseridos.");
    }
}
