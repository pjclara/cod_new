<?php

namespace App\Services;

use App\Models\Icd10Pcs;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class Icd10PcsStructureService
{
    private const AXIS_NAMES = [
        1 => 'Secção',
        2 => 'Sistema Corporal',
        3 => 'Operação Raiz',
        4 => 'Parte do Corpo',
        5 => 'Abordagem',
        6 => 'Dispositivo',
        7 => 'Qualificador',
    ];

    public function getNode(string $prefix = ''): array
    {
        $prefix = strtoupper(trim($prefix));
        $prefix = preg_replace('/[^A-HJ-NP-Z0-9]/', '', $prefix) ?? '';
        $prefix = substr($prefix, 0, 7);

        $options = [];
        $matchCount = 0;
        $exactMatch = null;

        if (strlen($prefix) < 7) {
            $axis = strlen($prefix) + 1;
            $options = DB::table($this->axisTable($axis))
                ->where('parent_prefix', $prefix === '' ? null : $prefix)
                ->orderBy('value')
                ->get(['value', 'prefix', 'term', 'description', 'code_count'])
                ->map(fn ($option) => [
                    'axis' => $axis,
                    'axis_name' => self::AXIS_NAMES[$axis],
                    'value' => $option->value,
                    'prefix' => $option->prefix,
                    'term' => $option->term,
                    'description' => $option->description,
                    'label' => trim($option->value.' — '.$option->term),
                    'code_count' => (int) $option->code_count,
                ])
                ->all();

            if ($options === []) {
                throw new ModelNotFoundException('Estrutura ICD-10-PCS não encontrada para o prefixo fornecido.');
            }

            $matchCount = array_sum(array_column($options, 'code_count'));
        } else {
            $code = Icd10Pcs::query()->select(['code', 'description'])->where('code', $prefix)->first();

            if (! $code) {
                throw new ModelNotFoundException('Estrutura ICD-10-PCS não encontrada para o prefixo fornecido.');
            }

            $matchCount = 1;
            $exactMatch = [
                'code' => $code->code,
                'description' => $code->description,
            ];
        }

        return [
            'prefix' => $prefix,
            'selected_length' => strlen($prefix),
            'next_axis' => strlen($prefix) < 7 ? strlen($prefix) + 1 : null,
            'axis_names' => self::AXIS_NAMES,
            'match_count' => $matchCount,
            'options' => $options,
            'exact_match' => $exactMatch,
        ];
    }

    private function axisTable(int $axis): string
    {
        return sprintf('icd10_pcs_axis_%d_options', $axis);
    }
}
