import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assignCmSubspecialty, bulkAssignCmSubspecialty, getIcd10Cm, getSpecialties, getSubspecialties, searchIcd10Cm } from '@/lib/icd-api';
import type { Icd10Cm, Paginated, Specialty, Subspecialty } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFavorites } from '@/hooks/use-favorites';
import { Star } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ICD-10', href: '/icd' },
    { title: 'ICD-10-CM', href: '/icd/cm' },
];

interface Props {
    subspecialtyId?: number;
}

export default function Icd10CmListPage({ subspecialtyId }: Props) {
    const { auth } = usePage().props as { auth: { user: unknown } };
    const isAuthenticated = !!auth.user;
    const { isFavorite, toggle: toggleFavorite, isPending: isFavPending } = useFavorites(isAuthenticated);

    const [result, setResult] = useState<Paginated<Icd10Cm> | null>(null);
    const [searchResults, setSearchResults] = useState<Icd10Cm[] | null>(null);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Modal de associação a subespecialidade ──
    const [assignTarget, setAssignTarget] = useState<Icd10Cm | null>(null);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | ''>('');
    const [subspecialties, setSubspecialties] = useState<Subspecialty[]>([]);
    const [selectedSubspecialtyId, setSelectedSubspecialtyId] = useState<number | ''>('');
    const [subspecialtiesLoading, setSubspecialtiesLoading] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [assignSelectedSubs, setAssignSelectedSubs] = useState<Subspecialty[]>([]);

    // ── Seleção múltipla ──
    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
    const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
    const [bulkAssignError, setBulkAssignError] = useState<string | null>(null);
    const [bulkSelectedSubs, setBulkSelectedSubs] = useState<Subspecialty[]>([]);

    const openAssignModal = (code: Icd10Cm) => {
        setAssignTarget(code);
        setAssignError(null);
        setAssignSelectedSubs(code.subspecialties ?? []);
        setSelectedSpecialtyId('');
        setSelectedSubspecialtyId('');
        setSubspecialties([]);
        if (specialties.length === 0) {
            getSpecialties().then(setSpecialties);
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
        assignCmSubspecialty(assignTarget.code, assignSelectedSubs.map((s) => s.id))
            .then((updated) => {
                setResult((prev) => {
                    if (!prev) return prev;
                    return { ...prev, data: prev.data.map((c) => (c.id === updated.id ? updated : c)) };
                });
                setSearchResults((prev) =>
                    prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
                );
                setAssignTarget(null);
            })
            .catch(() => setAssignError('Erro ao guardar. Verifique se tem sessão iniciada.'))
            .finally(() => setAssignLoading(false));
    };

    const toggleCode = (code: string) => {
        setSelectedCodes((prev) => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedCodes.size === codes.length && codes.length > 0) {
            setSelectedCodes(new Set());
        } else {
            setSelectedCodes(new Set(codes.map((c) => c.code)));
        }
    };

    const openBulkAssign = () => {
        setBulkAssignError(null);
        setBulkSelectedSubs([]);
        setSelectedSpecialtyId('');
        setSelectedSubspecialtyId('');
        setSubspecialties([]);
        if (specialties.length === 0) getSpecialties().then(setSpecialties);
        setBulkAssignOpen(true);
    };

    const handleBulkAssignSubmit = () => {
        setBulkAssignLoading(true);
        setBulkAssignError(null);
        const selCodes = Array.from(selectedCodes);
        const ids = bulkSelectedSubs.map((s) => s.id);
        bulkAssignCmSubspecialty(selCodes, ids)
            .then(() => {
                const patch = (c: Icd10Cm): Icd10Cm => {
                    if (!selCodes.includes(c.code)) return c;
                    const newSubs = bulkSelectedSubs.filter((s) => !c.subspecialties.some((cs) => cs.id === s.id));
                    return { ...c, subspecialties: [...c.subspecialties, ...newSubs] };
                };
                setResult((prev) => (prev ? { ...prev, data: prev.data.map(patch) } : prev));
                setSearchResults((prev) => (prev ? prev.map(patch) : prev));
                setSelectedCodes(new Set());
                setBulkAssignOpen(false);
            })
            .catch(() => setBulkAssignError('Erro ao guardar. Verifique se tem sessão iniciada.'))
            .finally(() => setBulkAssignLoading(false));
    };

    const loadPage = (p: number) => {
        setLoading(true);
        setSearchResults(null);
        getIcd10Cm({ subspecialty_id: subspecialtyId, page: p })
            .then((r) => { setResult(r); setPage(r.meta.current_page); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadPage(1); }, [subspecialtyId]);

    const handleSearch = (q: string) => {
        setQuery(q);
        if (debounce.current) clearTimeout(debounce.current);
        if (!q.trim()) { setSearchResults(null); return; }
        setLoading(true);
        debounce.current = setTimeout(() => {
            searchIcd10Cm(q)
                .then(setSearchResults)
                .finally(() => setLoading(false));
        }, 350);
    };

    useEffect(() => {
        const q = new URLSearchParams(window.location.search).get('q');
        if (q) handleSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const codes = searchResults ?? result?.data ?? [];
    const isSearchMode = Boolean(query.trim());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ICD-10-CM — Diagnósticos" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">ICD-10-CM — Diagnósticos</h1>
                        {result && !isSearchMode && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {result.meta.total.toLocaleString('pt-PT')} códigos • Página {page} de{' '}
                                {result.meta.last_page}
                            </p>
                        )}
                    </div>
                    <Link
                        href="/icd/pcs"
                        className="rounded-lg border border-sidebar-border/70 px-3 py-1.5 text-sm transition hover:bg-accent dark:border-sidebar-border"
                    >
                        Procedimentos PCS →
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

                {/* Barra de seleção múltipla */}
                {isAuthenticated && selectedCodes.size > 0 && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5">
                        <span className="text-sm font-medium">{selectedCodes.size} código(s) selecionado(s)</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedCodes(new Set())}
                                className="rounded-md px-2.5 py-1 text-xs transition hover:bg-accent"
                            >
                                Limpar
                            </button>
                            <button
                                type="button"
                                onClick={openBulkAssign}
                                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                            >
                                Associar selecionados
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    {/* Mobile cards — visible below sm */}
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
                            <div key={c.id} className="flex items-start gap-3 px-4 py-3">
                                {isAuthenticated && (
                                    <input
                                        type="checkbox"
                                        checked={selectedCodes.has(c.code)}
                                        onChange={() => toggleCode(c.code)}
                                        className="mt-1 h-4 w-4 shrink-0 accent-primary"
                                    />
                                )}
                                <div className="min-w-0 flex-1">
                                    <Link href={`/icd/cm/${c.code}`} className="font-mono font-medium text-primary hover:underline">
                                        {c.code}
                                    </Link>
                                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{c.description}</p>
                                    {c.subspecialties && c.subspecialties.length > 0 && (
                                        <span className="mt-1 inline-block text-xs text-muted-foreground">
                                            {c.subspecialties.map((s) => s.name).join(', ')}
                                        </span>
                                    )}
                                </div>
                                {isAuthenticated && (
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={isFavPending(c.id)}
                                            onClick={() => toggleFavorite(c.id, 'icd10_cm')}
                                            className="rounded-md p-1.5 transition hover:bg-accent disabled:opacity-50"
                                            title={isFavorite(c.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                        >
                                            <Star className={`h-4 w-4 ${ isFavorite(c.id) ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground' }`} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openAssignModal(c)}
                                            className="shrink-0 rounded-md border border-sidebar-border/70 px-2.5 py-1 text-xs transition hover:bg-accent dark:border-sidebar-border"
                                        >
                                            Associar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop table — hidden below sm */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    {isAuthenticated && (
                                        <th className="w-10 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={codes.length > 0 && selectedCodes.size === codes.length}
                                                onChange={toggleAll}
                                                className="h-4 w-4 accent-primary"
                                                title="Selecionar todos"
                                            />
                                        </th>
                                    )}
                                    <th className="px-4 py-3 text-left font-medium">Código</th>
                                    <th className="px-4 py-3 text-left font-medium">Descrição</th>
                                    <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                                        Subespecialidade
                                    </th>
                                    {isAuthenticated && (
                                        <th className="px-4 py-3 text-left font-medium">Ações</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/40 dark:divide-sidebar-border">
                                {loading &&
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={isAuthenticated ? 5 : 3} className="px-4 py-3">
                                                <div className="h-4 animate-pulse rounded bg-muted" />
                                            </td>
                                        </tr>
                                    ))}

                                {!loading &&
                                    codes.map((c) => (
                                        <tr key={c.id} className={`transition hover:bg-accent/50${selectedCodes.has(c.code) ? ' bg-primary/5' : ''}`}>
                                            {isAuthenticated && (
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCodes.has(c.code)}
                                                        onChange={() => toggleCode(c.code)}
                                                        className="h-4 w-4 accent-primary"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/icd/cm/${c.code}`}
                                                    className="font-mono font-medium text-primary hover:underline"
                                                >
                                                    {c.code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 leading-snug">{c.description}</td>
                                            <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                                {c.subspecialties && c.subspecialties.length > 0
                                                    ? c.subspecialties.map((s) => s.name).join(', ')
                                                    : '—'}
                                            </td>
                                            {isAuthenticated && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={isFavPending(c.id)}
                                                            onClick={() => toggleFavorite(c.id, 'icd10_cm')}
                                                            className="rounded-md p-1.5 transition hover:bg-accent disabled:opacity-50"
                                                            title={isFavorite(c.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                                        >
                                                            <Star className={`h-4 w-4 ${ isFavorite(c.id) ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground' }`} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openAssignModal(c)}
                                                            className="rounded-md border border-sidebar-border/70 px-2.5 py-1 text-xs transition hover:bg-accent dark:border-sidebar-border"
                                                        >
                                                            Associar
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}

                                {!loading && codes.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={isAuthenticated ? 5 : 3}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            Nenhum resultado encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
            {/* Modal — Associar CM a subespecialidade */}
            <Dialog open={assignTarget !== null} onOpenChange={(open) => { if (!open) setAssignTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Associar <span className="font-mono">{assignTarget?.code}</span> a subespecialidades
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 pt-2">
                        {/* Subespecialidades actuais */}
                        <div>
                            <span className="text-sm font-medium">Subespecialidades associadas</span>
                            <div className="mt-2 flex min-h-[32px] flex-wrap gap-1.5">
                                {assignSelectedSubs.length === 0 && (
                                    <span className="text-sm text-muted-foreground">Nenhuma</span>
                                )}
                                {assignSelectedSubs.map((sub) => (
                                    <span
                                        key={sub.id}
                                        className="flex items-center gap-1 rounded-full border border-sidebar-border/70 bg-accent px-2.5 py-0.5 text-xs dark:border-sidebar-border"
                                    >
                                        {sub.name}
                                        <button
                                            type="button"
                                            onClick={() => setAssignSelectedSubs((prev) => prev.filter((s) => s.id !== sub.id))}
                                            className="ml-0.5 opacity-60 hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <hr className="border-sidebar-border/40 dark:border-sidebar-border" />

                        {/* Adicionar nova subespecialidade */}
                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-medium">Adicionar subespecialidade</span>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs text-muted-foreground">Especialidade</span>
                                <select
                                    value={selectedSpecialtyId}
                                    onChange={(e) => handleSpecialtyChange(e.target.value)}
                                    className="rounded-lg border border-sidebar-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary dark:border-sidebar-border"
                                >
                                    <option value="">— Selecionar especialidade —</option>
                                    {specialties.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs text-muted-foreground">Subespecialidade</span>
                                <select
                                    value={selectedSubspecialtyId}
                                    onChange={(e) => setSelectedSubspecialtyId(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={selectedSpecialtyId === '' || subspecialtiesLoading}
                                    className="rounded-lg border border-sidebar-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50 dark:border-sidebar-border"
                                >
                                    <option value="">— Selecionar subespecialidade —</option>
                                    {subspecialties.map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                                {subspecialtiesLoading && (
                                    <span className="text-xs text-muted-foreground">A carregar…</span>
                                )}
                            </label>
                            <button
                                type="button"
                                disabled={selectedSubspecialtyId === ''}
                                onClick={() => {
                                    const sub = subspecialties.find((s) => s.id === Number(selectedSubspecialtyId));
                                    if (sub && !assignSelectedSubs.some((s) => s.id === sub.id)) {
                                        setAssignSelectedSubs((prev) => [...prev, sub]);
                                    }
                                    setSelectedSubspecialtyId('');
                                }}
                                className="self-start rounded-lg border border-primary px-3 py-1.5 text-sm text-primary transition hover:bg-primary/10 disabled:opacity-40"
                            >
                                + Adicionar
                            </button>
                        </div>

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

            {/* Modal — Associar vários CM em massa */}
            <Dialog open={bulkAssignOpen} onOpenChange={(open) => { if (!open) setBulkAssignOpen(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Associar {selectedCodes.size} diagnóstico(s) a subespecialidades
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 pt-2">
                        {/* Subespecialidades a associar */}
                        <div>
                            <span className="text-sm font-medium">Subespecialidades a associar</span>
                            <div className="mt-2 flex min-h-[32px] flex-wrap gap-1.5">
                                {bulkSelectedSubs.length === 0 && (
                                    <span className="text-sm text-muted-foreground">Nenhuma selecionada</span>
                                )}
                                {bulkSelectedSubs.map((sub) => (
                                    <span
                                        key={sub.id}
                                        className="flex items-center gap-1 rounded-full border border-sidebar-border/70 bg-accent px-2.5 py-0.5 text-xs dark:border-sidebar-border"
                                    >
                                        {sub.name}
                                        <button
                                            type="button"
                                            onClick={() => setBulkSelectedSubs((prev) => prev.filter((s) => s.id !== sub.id))}
                                            className="ml-0.5 opacity-60 hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <hr className="border-sidebar-border/40 dark:border-sidebar-border" />

                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-medium">Adicionar subespecialidade</span>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs text-muted-foreground">Especialidade</span>
                                <select
                                    value={selectedSpecialtyId}
                                    onChange={(e) => handleSpecialtyChange(e.target.value)}
                                    className="rounded-lg border border-sidebar-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary dark:border-sidebar-border"
                                >
                                    <option value="">— Selecionar especialidade —</option>
                                    {specialties.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs text-muted-foreground">Subespecialidade</span>
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
                                    <option value="">— Selecionar subespecialidade —</option>
                                    {subspecialties.map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                                {subspecialtiesLoading && (
                                    <span className="text-xs text-muted-foreground">A carregar…</span>
                                )}
                            </label>
                            <button
                                type="button"
                                disabled={selectedSubspecialtyId === ''}
                                onClick={() => {
                                    const sub = subspecialties.find((s) => s.id === Number(selectedSubspecialtyId));
                                    if (sub && !bulkSelectedSubs.some((s) => s.id === sub.id)) {
                                        setBulkSelectedSubs((prev) => [...prev, sub]);
                                    }
                                    setSelectedSubspecialtyId('');
                                }}
                                className="self-start rounded-lg border border-primary px-3 py-1.5 text-sm text-primary transition hover:bg-primary/10 disabled:opacity-40"
                            >
                                + Adicionar
                            </button>
                        </div>

                        {bulkAssignError && (
                            <p className="text-sm text-destructive">{bulkAssignError}</p>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setBulkAssignOpen(false)}
                                disabled={bulkAssignLoading}
                                className="rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm transition hover:bg-accent disabled:opacity-50 dark:border-sidebar-border"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkAssignSubmit}
                                disabled={bulkAssignLoading || bulkSelectedSubs.length === 0}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                            >
                                {bulkAssignLoading ? 'A guardar…' : `Guardar (${selectedCodes.size})`}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
