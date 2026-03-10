import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { getIcd10Pcs, getIcd10PcsStructure, searchIcd10Pcs } from '@/lib/icd-api';
import type { Icd10Pcs, Icd10PcsStructureNode, Paginated } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ICD-10', href: '/icd' },
    { title: 'ICD-10-PCS', href: '/icd/pcs' },
];

interface Props {
    subspecialtyId?: number;
}

export default function Icd10PcsListPage({ subspecialtyId }: Props) {
    const [result, setResult] = useState<Paginated<Icd10Pcs> | null>(null);
    const [searchResults, setSearchResults] = useState<Icd10Pcs[] | null>(null);
    const [structureNodes, setStructureNodes] = useState<Record<string, Icd10PcsStructureNode>>({});
    const [axisSelections, setAxisSelections] = useState<string[]>(Array(7).fill(''));
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [structureLoading, setStructureLoading] = useState(true);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentPrefix = axisSelections.join('');
    const currentStructure = structureNodes[currentPrefix] ?? null;
    const hasStructureFilter = currentPrefix.length > 0;
    const rootStructure = structureNodes[''];

    const loadPage = (p: number) => {
        setLoading(true);
        setSearchResults(null);
        getIcd10Pcs({
            subspecialty_id: subspecialtyId,
            code_prefix: currentPrefix || undefined,
            page: p,
        })
            .then((r) => { setResult(r); setPage(r.meta.current_page); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadPage(1); }, [subspecialtyId, currentPrefix]);

    useEffect(() => {
        setStructureLoading(true);
        getIcd10PcsStructure('')
            .then((node) => {
                setStructureNodes((prev) => ({ ...prev, '': node }));
            })
            .finally(() => setStructureLoading(false));
    }, []);

    useEffect(() => {
        if (!currentPrefix || structureNodes[currentPrefix]) {
            return;
        }

        setStructureLoading(true);
        getIcd10PcsStructure(currentPrefix)
            .then((node) => {
                setStructureNodes((prev) => ({ ...prev, [currentPrefix]: node }));
            })
            .finally(() => setStructureLoading(false));
    }, [currentPrefix, structureNodes]);

    const handleSearch = (q: string) => {
        setQuery(q);
        if (debounce.current) clearTimeout(debounce.current);
        if (!q.trim()) { setSearchResults(null); return; }
        setLoading(true);
        debounce.current = setTimeout(() => {
            searchIcd10Pcs(q)
                .then(setSearchResults)
                .finally(() => setLoading(false));
        }, 350);
    };

    const handleAxisChange = (index: number, value: string) => {
        setAxisSelections((prev) => {
            const next = [...prev];
            next[index] = value;

            for (let i = index + 1; i < next.length; i++) {
                next[i] = '';
            }

            return next;
        });
    };

    const clearStructure = () => {
        setAxisSelections(Array(7).fill(''));
    };

    const codes = searchResults ?? result?.data ?? [];
    const isSearchMode = Boolean(query.trim());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ICD-10-PCS — Procedimentos" />
            <div className="flex flex-col gap-4 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">ICD-10-PCS — Procedimentos</h1>
                        {result && !isSearchMode && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {result.meta.total.toLocaleString('pt-PT')} códigos • Página {page} de{' '}
                                {result.meta.last_page}
                            </p>
                        )}
                        {hasStructureFilter && !isSearchMode && (
                            <p className="mt-1 text-xs text-primary">
                                Filtro ativo por estrutura PCS: <span className="font-mono">{currentPrefix}</span>
                            </p>
                        )}
                    </div>
                    <Link
                        href="/icd/cm"
                        className="rounded-lg border border-sidebar-border/70 px-3 py-1.5 text-sm transition hover:bg-accent dark:border-sidebar-border"
                    >
                        ← Diagnósticos CM
                    </Link>
                </div>

                {/* Search */}
                <input
                    type="search"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Pesquisar por código ou descrição…"
                    className="w-full rounded-lg border border-sidebar-border/70 bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-sidebar-border"
                />

                {isSearchMode && (
                    <p className="-mt-1 text-xs text-muted-foreground">
                        {loading
                            ? 'A pesquisar…'
                            : `${searchResults?.length ?? 0} resultado(s) para “${query}”`}
                    </p>
                )}

                {/* PCS 7-axis selector */}
                <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Estrutura do código (7 eixos)</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Selecione cada eixo para construir o código ICD-10-PCS passo a passo.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={clearStructure}
                            className="rounded-lg border border-sidebar-border/70 px-3 py-1.5 text-sm transition hover:bg-accent dark:border-sidebar-border"
                        >
                            Limpar seleção
                        </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 7 }).map((_, index) => {
                            const prefixBefore = axisSelections.slice(0, index).join('');
                            const node = structureNodes[prefixBefore];
                            const options = node?.options ?? [];
                            const disabled = index > 0 && !prefixBefore;
                            const axisName = rootStructure?.axis_names[index + 1] ?? `Eixo ${index + 1}`;

                            return (
                                <label key={index} className="flex flex-col gap-1.5">
                                    <span className="text-sm font-medium">{axisName}</span>
                                    <select
                                        value={axisSelections[index]}
                                        onChange={(e) => handleAxisChange(index, e.target.value)}
                                        disabled={disabled || structureLoading || options.length === 0}
                                        className="rounded-lg border border-sidebar-border/70 bg-background px-3 py-2 text-sm outline-none transition focus:border-primary disabled:opacity-50 dark:border-sidebar-border"
                                    >
                                        <option value="">
                                            {disabled ? 'Selecione o eixo anterior' : `Escolher ${axisName.toLowerCase()}`}
                                        </option>
                                        {options.map((option) => (
                                            <option key={option.prefix} value={option.value}>
                                                {option.prefix} — {option.description}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            );
                        })}
                    </div>

                    <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
                        <p>
                            <span className="font-medium">Prefixo atual:</span>{' '}
                            <span className="font-mono">{currentPrefix || '—'}</span>
                        </p>
                        <p className="mt-1 text-muted-foreground">
                            {structureLoading
                                ? 'A carregar opções dos eixos…'
                                : `${currentStructure?.match_count ?? 0} código(s) compatível(eis) com a seleção atual.`}
                        </p>

                        {hasStructureFilter && !isSearchMode && (
                            <p className="mt-1 text-muted-foreground">
                                A tabela abaixo está filtrada automaticamente pelo prefixo selecionado.
                            </p>
                        )}

                        {rootStructure && (
                            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="rounded-md border border-sidebar-border/60 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                                    >
                                        <span className="font-medium text-foreground">
                                            {index + 1}. {rootStructure.axis_names[index + 1]}
                                        </span>
                                        <p className="mt-1 text-muted-foreground">
                                            {axisSelections[index] || 'Sem seleção'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentStructure?.exact_match && (
                            <div className="mt-3 rounded-lg border border-primary/20 bg-background p-3">
                                <p className="text-sm text-muted-foreground">Código encontrado</p>
                                <p className="mt-1 font-mono text-lg font-semibold text-primary">
                                    {currentStructure.exact_match.code}
                                </p>
                                <p className="mt-1 text-sm leading-snug">
                                    {currentStructure.exact_match.description}
                                </p>
                                <Link
                                    href={`/icd/pcs/${currentStructure.exact_match.code}`}
                                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                                >
                                    Ver detalhe do código →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Código</th>
                                <th className="px-4 py-3 text-left font-medium">Descrição</th>
                                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                                    Subespecialidade
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/40 dark:divide-sidebar-border">
                            {loading &&
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={3} className="px-4 py-3">
                                            <div className="h-4 animate-pulse rounded bg-muted" />
                                        </td>
                                    </tr>
                                ))}

                            {!loading &&
                                codes.map((c) => (
                                    <tr key={c.id} className="transition hover:bg-accent/50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/icd/pcs/${c.code}`}
                                                className="font-mono font-medium text-primary hover:underline"
                                            >
                                                {c.code}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 leading-snug">{c.description}</td>
                                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                            {c.subspecialty?.name ?? '—'}
                                        </td>
                                    </tr>
                                ))}

                            {!loading && codes.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        Nenhum resultado encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isSearchMode && result && result.meta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">
                            Mostrando{' '}
                            {((page - 1) * result.meta.per_page + 1).toLocaleString('pt-PT')}–
                            {Math.min(page * result.meta.per_page, result.meta.total).toLocaleString(
                                'pt-PT',
                            )}{' '}
                            de {result.meta.total.toLocaleString('pt-PT')}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadPage(page - 1)}
                                disabled={page <= 1}
                                className="rounded-lg border border-sidebar-border/70 px-3 py-1.5 text-sm transition hover:bg-accent disabled:opacity-40 dark:border-sidebar-border"
                            >
                                ← Anterior
                            </button>
                            <button
                                onClick={() => loadPage(page + 1)}
                                disabled={page >= result.meta.last_page}
                                className="rounded-lg border border-sidebar-border/70 px-3 py-1.5 text-sm transition hover:bg-accent disabled:opacity-40 dark:border-sidebar-border"
                            >
                                Seguinte →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
