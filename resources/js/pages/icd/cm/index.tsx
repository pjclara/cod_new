import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { getIcd10Cm, searchIcd10Cm } from '@/lib/icd-api';
import type { Icd10Cm, Paginated } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ICD-10', href: '/icd' },
    { title: 'ICD-10-CM', href: '/icd/cm' },
];

interface Props {
    subspecialtyId?: number;
}

export default function Icd10CmListPage({ subspecialtyId }: Props) {
    const [result, setResult] = useState<Paginated<Icd10Cm> | null>(null);
    const [searchResults, setSearchResults] = useState<Icd10Cm[] | null>(null);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                                        <td colSpan={4} className="px-4 py-3">
                                            <div className="h-4 animate-pulse rounded bg-muted" />
                                        </td>
                                    </tr>
                                ))}

                            {!loading &&
                                codes.map((c) => (
                                    <tr key={c.id} className="transition hover:bg-accent/50">
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
                                            {c.subspecialty?.name ?? '—'}
                                        </td>
                                        
                                    </tr>
                                ))}

                            {!loading && codes.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
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


interface Props {
    subspecialtyId?: number;
}
