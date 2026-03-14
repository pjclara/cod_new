import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    assignPcsSubspecialty,
    getIcd10Pcs,
    getIcd10PcsStructure,
    getSpecialties,
    getSubspecialties,
    searchIcd10Pcs,
} from '@/lib/icd-api';
import type { Icd10Pcs, Icd10PcsStructureNode, Paginated, Specialty, Subspecialty } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ICD-10', href: '/icd' },
    { title: 'ICD-10-PCS', href: '/icd/pcs' },
];

interface Props {
    subspecialtyId?: number;
}

export default function Icd10PcsListPage({ subspecialtyId }: Props) {
    const { auth } = usePage().props as { auth: { user: unknown } };
    const isAuthenticated = !!auth.user;
    const [result, setResult] = useState<Paginated<Icd10Pcs> | null>(null);
    const [searchResults, setSearchResults] = useState<Icd10Pcs[] | null>(null);
    const [structureNodes, setStructureNodes] = useState<
        Record<string, Icd10PcsStructureNode>
    >({});
    const [axisSelections, setAxisSelections] = useState<string[]>(
        Array(7).fill(''),
    );
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [structureLoading, setStructureLoading] = useState(true);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Modal de associação a subespecialidade ──
    const [assignTarget, setAssignTarget] = useState<Icd10Pcs | null>(null);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | ''>('');
    const [subspecialties, setSubspecialties] = useState<Subspecialty[]>([]);
    const [selectedSubspecialtyId, setSelectedSubspecialtyId] = useState<number | ''>('');
    const [subspecialtiesLoading, setSubspecialtiesLoading] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);

    const openAssignModal = (code: Icd10Pcs) => {
        setAssignTarget(code);
        setAssignError(null);
        setSelectedSpecialtyId(code.subspecialty?.specialty?.id ?? '');
        setSelectedSubspecialtyId(code.subspecialty_id ?? '');
        setSubspecialties([]);
        if (specialties.length === 0) {
            getSpecialties().then(setSpecialties);
        }
        if (code.subspecialty?.specialty?.id) {
            setSubspecialtiesLoading(true);
            getSubspecialties(code.subspecialty.specialty.id)
                .then(setSubspecialties)
                .finally(() => setSubspecialtiesLoading(false));
        }
    };

    const handleSpecialtyChange = (value: string) => {
        const id = value === '' ? '' : Number(value);
        setSelectedSpecialtyId(id);
        setSelectedSubspecialtyId('');
        setSubspecialties([]);
        if (id !== '') {
            setSubspecialtiesLoading(true);
            getSubspecialties(id as number)
                .then(setSubspecialties)
                .finally(() => setSubspecialtiesLoading(false));
        }
    };

    const handleAssignSubmit = () => {
        if (!assignTarget) return;
        setAssignLoading(true);
        setAssignError(null);
        const subId = selectedSubspecialtyId === '' ? null : Number(selectedSubspecialtyId);
        assignPcsSubspecialty(assignTarget.code, subId)
            .then((updated) => {
                // Update code in the current list
                setResult((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        data: prev.data.map((c) => (c.id === updated.id ? updated : c)),
                    };
                });
                setSearchResults((prev) =>
                    prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
                );
                setAssignTarget(null);
            })
            .catch(() => setAssignError('Erro ao guardar. Verifique se tem sessão iniciada.'))
            .finally(() => setAssignLoading(false));
    };

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
            .then((r) => {
                setResult(r);
                setPage(r.meta.current_page);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPage(1);
    }, [subspecialtyId, currentPrefix]);

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
                setStructureNodes((prev) => ({
                    ...prev,
                    [currentPrefix]: node,
                }));
            })
            .finally(() => setStructureLoading(false));
    }, [currentPrefix, structureNodes]);

    const handleSearch = (q: string) => {
        setQuery(q);
        if (debounce.current) clearTimeout(debounce.current);
        if (!q.trim()) {
            setSearchResults(null);
            return;
        }
        setLoading(true);
        debounce.current = setTimeout(() => {
            searchIcd10Pcs(q)
                .then(setSearchResults)
                .finally(() => setLoading(false));
        }, 350);
    };

    useEffect(() => {
        const q = new URLSearchParams(window.location.search).get('q');
        if (q) handleSearch(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">
                            ICD-10-PCS — Procedimentos
                        </h1>

                        {result && !isSearchMode && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {result.meta.total.toLocaleString('pt-PT')}{' '}
                                códigos • Página {page} de{' '}
                                {result.meta.last_page}
                            </p>
                        )}

                        {hasStructureFilter && !isSearchMode && (
                            <p className="mt-1 text-xs text-primary">
                                Filtro ativo por estrutura PCS:
                                <span className="ml-1 font-mono">
                                    {currentPrefix}
                                </span>
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
                    className="w-full rounded-lg border border-sidebar-border/70 bg-background px-4 py-2.5 text-sm transition outline-none focus:border-primary dark:border-sidebar-border"
                />

                {isSearchMode && (
                    <p className="-mt-1 text-xs text-muted-foreground">
                        {loading
                            ? 'A pesquisar…'
                            : `${searchResults?.length ?? 0} resultado(s) para “${query}”`}
                    </p>
                )}

                {/* Layout principal */}
                <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                    {/* COLUNA ESQUERDA — ESTRUTURA PCS */}
                    <details className="group rounded-xl border border-sidebar-border/70 dark:border-sidebar-border lg:block [&[open]]:block" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 lg:hidden">
                        <span className="text-sm font-semibold">Estrutura do código (7 eixos)</span>
                        <span className="text-xs text-muted-foreground transition group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Estrutura do código (7 eixos)
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Selecione cada eixo para construir o código
                                    ICD-10-PCS.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={clearStructure}
                                className="rounded-lg border border-sidebar-border/70 px-3 py-1.5 text-sm transition hover:bg-accent dark:border-sidebar-border"
                            >
                                Limpar
                            </button>
                        </div>

                        {/* Código em construção */}
                        <div className="mt-4 rounded-lg bg-muted px-3 py-2 text-center font-mono text-lg">
                            {axisSelections.map((a) => a || '_').join('')}
                        </div>

                        {/* Selectores dos eixos */}
                        <div className="mt-4 flex flex-col gap-3">
                            {Array.from({ length: 7 }).map((_, index) => {
                                const prefixBefore = axisSelections
                                    .slice(0, index)
                                    .join('');
                                const node = structureNodes[prefixBefore];

                                const options = node?.options ?? [];

                                const disabled = index > 0 && !prefixBefore;

                                const axisName =
                                    rootStructure?.axis_names[index + 1] ??
                                    `Eixo ${index + 1}`;

                                return (
                                    <label
                                        key={index}
                                        className="flex flex-col gap-1.5"
                                    >
                                        <span className="text-sm font-medium">
                                            {axisName}
                                        </span>

                                        <select
                                            value={axisSelections[index]}
                                            onChange={(e) =>
                                                handleAxisChange(
                                                    index,
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                disabled ||
                                                structureLoading ||
                                                options.length === 0
                                            }
                                            className="rounded-lg border border-sidebar-border/70 bg-background px-3 py-2 text-sm transition outline-none focus:border-primary disabled:opacity-50 dark:border-sidebar-border"
                                        >
                                            <option value="">
                                                {disabled
                                                    ? 'Selecione o eixo anterior'
                                                    : `Escolher ${axisName.toLowerCase()}`}
                                            </option>

                                            {options.map((option) => (
                                                <option
                                                    key={option.prefix}
                                                    value={option.value}
                                                >
                                                    {option.prefix} —{' '}
                                                    {option.description}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                    </details>

                    {/* COLUNA DIREITA — RESULTADOS */}
                    <div className="flex flex-col gap-4">
                        {/* Tabela */}
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            {/* Mobile cards */}
                            <div className="sm:hidden divide-y divide-sidebar-border/40 dark:divide-sidebar-border">
                                {loading && Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="p-4 space-y-2">
                                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                                        <div className="h-3 w-full animate-pulse rounded bg-muted" />
                                    </div>
                                ))}
                                {!loading && codes.length === 0 && (
                                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
                                )}
                                {!loading && codes.map((c) => (
                                    <div key={c.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                        <div className="min-w-0">
                                            <Link href={`/icd/pcs/${c.code}`} className="font-mono font-medium text-primary hover:underline">
                                                {c.code}
                                            </Link>
                                            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{c.description}</p>
                                            {c.subspecialty && (
                                                <span className="mt-1 inline-block text-xs text-muted-foreground">{c.subspecialty.name}</span>
                                            )}
                                        </div>
                                        {isAuthenticated && (
                                            <button
                                                type="button"
                                                onClick={() => openAssignModal(c)}
                                                className="shrink-0 rounded-md border border-sidebar-border/70 px-2.5 py-1 text-xs transition hover:bg-accent dark:border-sidebar-border"
                                            >
                                                Associar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Código</th>
                                            <th className="px-4 py-3 text-left font-medium">Descrição</th>
                                            <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Subespecialidade</th>
                                            {isAuthenticated && (
                                                <th className="px-4 py-3 text-left font-medium">Ações</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/40 dark:divide-sidebar-border">
                                        {loading && Array.from({ length: 10 }).map((_, i) => (
                                            <tr key={i}>
                                                <td colSpan={isAuthenticated ? 4 : 3} className="px-4 py-3">
                                                    <div className="h-4 animate-pulse rounded bg-muted" />
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && codes.map((c) => (
                                            <tr key={c.id} className="transition hover:bg-accent/50">
                                                <td className="px-4 py-3">
                                                    <Link href={`/icd/pcs/${c.code}`} className="font-mono font-medium text-primary hover:underline">
                                                        {c.code}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 leading-snug">{c.description}</td>
                                                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                                    {c.subspecialty?.name ?? '—'}
                                                </td>
                                                {isAuthenticated && (
                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => openAssignModal(c)}
                                                            className="rounded-md border border-sidebar-border/70 px-2.5 py-1 text-xs transition hover:bg-accent dark:border-sidebar-border"
                                                        >
                                                            Associar
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {!loading && codes.length === 0 && (
                                            <tr>
                                                <td colSpan={isAuthenticated ? 4 : 3} className="px-4 py-8 text-center text-muted-foreground">
                                                    Nenhum resultado encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Paginação */}
                        {!isSearchMode &&
                            result &&
                            result.meta.last_page > 1 && (
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-sm text-muted-foreground">
                                        Mostrando{' '}
                                        {(
                                            (page - 1) * result.meta.per_page +
                                            1
                                        ).toLocaleString('pt-PT')}
                                        –
                                        {Math.min(
                                            page * result.meta.per_page,
                                            result.meta.total,
                                        ).toLocaleString('pt-PT')}{' '}
                                        de{' '}
                                        {result.meta.total.toLocaleString(
                                            'pt-PT',
                                        )}
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
                                            disabled={
                                                page >= result.meta.last_page
                                            }
                                            className="rounded-lg border border-sidebar-border/70 px-3 py-1.5 text-sm transition hover:bg-accent disabled:opacity-40 dark:border-sidebar-border"
                                        >
                                            Seguinte →
                                        </button>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Modal — Associar PCS a subespecialidade */}
            <Dialog open={assignTarget !== null} onOpenChange={(open) => { if (!open) setAssignTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Associar{' '}
                            <span className="font-mono">{assignTarget?.code}</span>{' '}
                            a subespecialidade
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 pt-2">
                        {/* Especialidade */}
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium">Especialidade</span>
                            <select
                                value={selectedSpecialtyId}
                                onChange={(e) => handleSpecialtyChange(e.target.value)}
                                className="rounded-lg border border-sidebar-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary dark:border-sidebar-border"
                            >
                                <option value="">— Sem especialidade —</option>
                                {specialties.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* Subespecialidade */}
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium">Subespecialidade</span>
                            <select
                                value={selectedSubspecialtyId}
                                onChange={(e) =>
                                    setSelectedSubspecialtyId(
                                        e.target.value === '' ? '' : Number(e.target.value),
                                    )
                                }
                                disabled={selectedSpecialtyId === '' || subspecialtiesLoading}
                                className="rounded-lg border border-sidebar-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50 dark:border-sidebar-border"
                            >
                                <option value="">— Sem subespecialidade —</option>
                                {subspecialties.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                            {subspecialtiesLoading && (
                                <span className="text-xs text-muted-foreground">A carregar…</span>
                            )}
                        </label>

                        {assignError && (
                            <p className="text-sm text-destructive">{assignError}</p>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setAssignTarget(null)}
                                disabled={assignLoading}
                                className="rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm transition hover:bg-accent disabled:opacity-50 dark:border-sidebar-border"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleAssignSubmit}
                                disabled={assignLoading}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                            >
                                {assignLoading ? 'A guardar…' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
