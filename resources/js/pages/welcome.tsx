import { Head } from '@inertiajs/react';
import {
    Search,
    ChevronDown,
    Activity,
    Stethoscope,
    Layers,
    BookOpen,
    ArrowRight,
    Loader2,
} from 'lucide-react';
import { getIcd10Cm, getIcd10Pcs, searchIcd10Cm, searchIcd10Pcs } from '@/lib/icd-api';
import type { Icd10Cm, Icd10Pcs } from '@/types/icd';
import { useState } from 'react';

interface Props {
    canRegister: boolean;
    stats: {
        cm: number;
        pcs: number;
        specialties: number;
        cmUnassigned: number;
        pcsUnassigned: number;
        cmSurgery: number;
        pcsSurgery: number;
    };
    catalog: Array<{
        id: number;
        name: string;
        slug: string;
        cm_count: number;
        pcs_count: number;
        subspecialties: Array<{
            id: number;
            name: string;
            slug: string;
            cm_count: number;
            pcs_count: number;
        }>;
    }>;
}

export default function Welcome({ canRegister, stats, catalog }: Props) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<'cm' | 'pcs'>('cm');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTouched, setSearchTouched] = useState(false);
    const [searchResults, setSearchResults] = useState<Array<Icd10Cm | Icd10Pcs>>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [subCodes, setSubCodes] = useState<
        Record<
            number,
            {
                expanded: boolean;
                loading: boolean;
                loaded: boolean;
                cm: Icd10Cm[];
                pcs: Icd10Pcs[];
                error: string | null;
            }
        >
    >({});

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const q = query.trim();
        setSearchTouched(true);
        setSearchError(null);

        if (!q) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);

        try {
            if (searchType === 'cm') {
                const results = await searchIcd10Cm(q);
                setSearchResults(results);
            } else {
                const results = await searchIcd10Pcs(q);
                setSearchResults(results);
            }
        } catch {
            setSearchError('Não foi possível pesquisar agora. Tente novamente.');
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }

    async function toggleSubspecialtyCodes(
        subId: number,
        counts: { cm_count: number; pcs_count: number },
    ) {
        const existing = subCodes[subId];

        if (existing?.expanded) {
            setSubCodes((prev) => ({
                ...prev,
                [subId]: { ...existing, expanded: false },
            }));
            return;
        }

        if (existing?.loaded) {
            setSubCodes((prev) => ({
                ...prev,
                [subId]: { ...existing, expanded: true },
            }));
            return;
        }

        setSubCodes((prev) => ({
            ...prev,
            [subId]: {
                expanded: true,
                loading: true,
                loaded: false,
                cm: [],
                pcs: [],
                error: null,
            },
        }));

        try {
            const cmPromise =
                counts.cm_count > 0
                    ? getIcd10Cm({ subspecialty_id: subId, page: 1 }).then((r) => r.data)
                    : Promise.resolve([] as Icd10Cm[]);

            const pcsPromise =
                counts.pcs_count > 0
                    ? getIcd10Pcs({ subspecialty_id: subId, page: 1 }).then((r) => r.data)
                    : Promise.resolve([] as Icd10Pcs[]);

            const [cm, pcs] = await Promise.all([cmPromise, pcsPromise]);

            setSubCodes((prev) => ({
                ...prev,
                [subId]: {
                    expanded: true,
                    loading: false,
                    loaded: true,
                    cm,
                    pcs,
                    error: null,
                },
            }));
        } catch {
            setSubCodes((prev) => ({
                ...prev,
                [subId]: {
                    expanded: true,
                    loading: false,
                    loaded: false,
                    cm: [],
                    pcs: [],
                    error: 'Erro ao carregar códigos desta subespecialidade.',
                },
            }));
        }
    }

    return (
        <>
            <Head title="Explore Diagnósticos e Procedimentos" />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                {/* ── Header ─────────────────────────────────────────────────── */}
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
                    <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                        <a href="/" className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                                <Activity className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                                Medicodex
                            </span>
                        </a>
                        <nav className="flex items-center gap-2">
                            <a
                                href="/login"
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Entrar
                            </a>
                            {canRegister && (
                                <a
                                    href="/register"
                                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    Registar
                                </a>
                            )}
                        </nav>
                    </div>
                </header>

                {/* ── Hero ───────────────────────────────────────────────────── */}
                <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
                        <div className="mx-auto max-w-3xl text-center">
                            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                                <Stethoscope className="h-3.5 w-3.5" />
                                Classificação Internacional de Doenças — 10.ª Revisão
                            </span>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Diagnósticos e Procedimentos
                                <br />
                                <span className="text-blue-600">num só lugar</span>
                            </h1>
                            <p className="mt-4 text-base text-slate-500 dark:text-slate-400">
                                Pesquise e consulte códigos ICD-10-CM e ICD-10-PCS organizados por especialidade clínica.
                            </p>

                            {/* Stats strip */}
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {stats.cm.toLocaleString('pt-PT')}
                                    </span>
                                    diagnósticos
                                </div>
                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                    <Layers className="h-4 w-4 text-indigo-500" />
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {stats.pcs.toLocaleString('pt-PT')}
                                    </span>
                                    procedimentos
                                </div>
                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                    <Activity className="h-4 w-4 text-emerald-500" />
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {stats.specialties.toLocaleString('pt-PT')}
                                    </span>
                                    especialidades
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <form
                            onSubmit={handleSearch}
                            className="mx-auto mt-10 max-w-3xl"
                        >
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                                {/* Type toggle */}
                                <div className="flex border-b border-slate-100 px-3 pt-2 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setSearchType('cm')}
                                        className={`rounded-t-md px-4 py-2 text-xs font-semibold tracking-wide transition ${
                                            searchType === 'cm'
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        ICD-10-CM — Diagnósticos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSearchType('pcs')}
                                        className={`rounded-t-md px-4 py-2 text-xs font-semibold tracking-wide transition ${
                                            searchType === 'pcs'
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        ICD-10-PCS — Procedimentos
                                    </button>
                                </div>

                                {/* Input row */}
                                <div className="flex items-center gap-2 p-3">
                                    <Search className="ml-1 h-4 w-4 shrink-0 text-slate-400" />
                                    <input
                                        type="search"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Pesquisar por código ou descrição…"
                                        className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={searchLoading}
                                        className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {searchLoading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        )}
                                        Pesquisar
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Search results */}
                        <div className="mx-auto mt-3 max-w-3xl">
                            {!searchLoading && searchError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                                    {searchError}
                                </div>
                            )}

                            {!searchLoading && !searchError && searchTouched && query.trim() && (
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                                        <span className="text-xs font-medium text-slate-500">
                                            {searchResults.length.toLocaleString('pt-PT')} resultado(s) em{' '}
                                            {searchType === 'cm' ? 'Diagnósticos' : 'Procedimentos'}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {searchType.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="max-h-72 overflow-auto">
                                        {searchResults.length === 0 ? (
                                            <p className="px-4 py-6 text-center text-sm text-slate-400">
                                                Nenhum código encontrado para "{query}".
                                            </p>
                                        ) : (
                                            <ul className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {searchResults.map((item) => (
                                                    <li key={`${searchType}-${item.id}`}>
                                                        <a
                                                            href={
                                                                searchType === 'cm'
                                                                    ? `/icd/cm/${item.code}`
                                                                    : `/icd/pcs/${item.code}`
                                                            }
                                                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                        >
                                                            <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                                                {item.code}
                                                            </span>
                                                            <span className="truncate text-sm text-slate-700 dark:text-slate-300">
                                                                {item.description}
                                                            </span>
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Catalog ────────────────────────────────────────────────── */}
                <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Especialidades clínicas
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Apenas especialidades com códigos ICD-10 associados
                            </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            {catalog.length} especialidade{catalog.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {catalog.map((specialty) => (
                            <details
                                key={specialty.id}
                                className="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                            >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 select-none">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                                            <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                {specialty.name}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                                    {specialty.cm_count.toLocaleString('pt-PT')} CM
                                                </span>
                                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                    {specialty.pcs_count.toLocaleString('pt-PT')} PCS
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                                </summary>

                                <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {specialty.subspecialties.map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                                            >
                                                {/* Sub header */}
                                                <div className="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                                            {sub.name}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                {sub.cm_count.toLocaleString('pt-PT')} CM
                                                            </span>
                                                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                {sub.pcs_count.toLocaleString('pt-PT')} PCS
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleSubspecialtyCodes(sub.id, {
                                                                cm_count: sub.cm_count,
                                                                pcs_count: sub.pcs_count,
                                                            })
                                                        }
                                                        className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                                                    >
                                                        {subCodes[sub.id]?.expanded ? 'Ocultar' : 'Ver códigos'}
                                                    </button>
                                                </div>

                                                {/* Expanded codes */}
                                                {subCodes[sub.id]?.expanded && (
                                                    <div className="border-t border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                                                        {subCodes[sub.id]?.loading && (
                                                            <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                A carregar códigos…
                                                            </div>
                                                        )}

                                                        {subCodes[sub.id]?.error && (
                                                            <p className="text-xs text-red-500">
                                                                {subCodes[sub.id]?.error}
                                                            </p>
                                                        )}

                                                        {!subCodes[sub.id]?.loading &&
                                                            !subCodes[sub.id]?.error && (
                                                                <div className="grid gap-3 lg:grid-cols-2">
                                                                    {/* CM */}
                                                                    <div>
                                                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                            Diagnósticos CM
                                                                        </p>
                                                                        {subCodes[sub.id]?.cm.length ? (
                                                                            <ul className="max-h-52 space-y-1 overflow-auto">
                                                                                {subCodes[sub.id]?.cm.map(
                                                                                    (code) => (
                                                                                        <li key={`cm-${code.id}`}>
                                                                                            <a
                                                                                                href={`/icd/cm/${code.code}`}
                                                                                                className="flex items-start gap-2 rounded-md px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                                            >
                                                                                                <span className="mt-px shrink-0 rounded bg-blue-50 px-1.5 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                                                                                    {code.code}
                                                                                                </span>
                                                                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                                                                    {code.description}
                                                                                                </span>
                                                                                            </a>
                                                                                        </li>
                                                                                    ),
                                                                                )}
                                                                            </ul>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-400">
                                                                                Sem códigos CM.
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* PCS */}
                                                                    <div>
                                                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                            Procedimentos PCS
                                                                        </p>
                                                                        {subCodes[sub.id]?.pcs.length ? (
                                                                            <ul className="max-h-52 space-y-1 overflow-auto">
                                                                                {subCodes[sub.id]?.pcs.map(
                                                                                    (code) => (
                                                                                        <li key={`pcs-${code.id}`}>
                                                                                            <a
                                                                                                href={`/icd/pcs/${code.code}`}
                                                                                                className="flex items-start gap-2 rounded-md px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                                            >
                                                                                                <span className="mt-px shrink-0 rounded bg-indigo-50 px-1.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                                                                    {code.code}
                                                                                                </span>
                                                                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                                                                    {code.description}
                                                                                                </span>
                                                                                            </a>
                                                                                        </li>
                                                                                    ),
                                                                                )}
                                                                            </ul>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-400">
                                                                                Sem códigos PCS.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* ── Footer ─────────────────────────────────────────────────── */}
                <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <p className="text-center text-xs text-slate-400">
                            © {new Date().getFullYear()} Medicodex — Classificação ICD-10-CM/PCS
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

