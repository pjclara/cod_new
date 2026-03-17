import { Head, usePage } from '@inertiajs/react';
import {
    Search,
    Activity,
    Stethoscope,
    Layers,
    BookOpen,
    ArrowRight,
    Loader2,
    Check,
    Star,
} from 'lucide-react';
import { getIcd10Cm, getIcd10Pcs, searchIcd10Cm, searchIcd10Pcs, getFavorites } from '@/lib/icd-api';
import type { Icd10Cm, Icd10Pcs, Favorite } from '@/types/icd';
import { useState, useEffect } from 'react';

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
    const [activeSubspecialty, setActiveSubspecialty] = useState(0);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [favLoading, setFavLoading] = useState(false);
    const [favError, setFavError] = useState<string | null>(null);

    const { auth } = usePage<{ auth: { user: { id: number; name: string } | null } }>().props;
    const isLoggedIn = !!auth?.user;

    // -1 = tab de favoritos; 0+ = índice na lista catalog
    const [activeTab, setActiveTab] = useState<number>(isLoggedIn ? -1 : 0);

    useEffect(() => {
        if (isLoggedIn && activeTab === -1) {
            setFavLoading(true);
            setFavError(null);
            getFavorites()
                .then(setFavorites)
                .catch(() => setFavError('Não foi possível carregar os favoritos.'))
                .finally(() => setFavLoading(false));
        }
    }, [isLoggedIn, activeTab]);

    function copyCode(code: string) {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 1500);
        });
    }

    const activeSubs = catalog[activeTab >= 0 ? activeTab : 0]?.subspecialties ?? [];
    const activeSub = activeTab >= 0 ? activeSubs[activeSubspecialty] : undefined;
    const activeSubData = activeSub ? subCodes[activeSub.id] : undefined;

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

    async function loadSubCodes(subId: number, counts: { cm_count: number; pcs_count: number }) {
        if (subCodes[subId]?.loaded || subCodes[subId]?.loading) return;
        setSubCodes((prev) => ({
            ...prev,
            [subId]: { expanded: true, loading: true, loaded: false, cm: [], pcs: [], error: null },
        }));
        try {
            const [cm, pcs] = await Promise.all([
                counts.cm_count > 0
                    ? getIcd10Cm({ subspecialty_id: subId, page: 1 }).then((r) => r.data)
                    : Promise.resolve([] as Icd10Cm[]),
                counts.pcs_count > 0
                    ? getIcd10Pcs({ subspecialty_id: subId, page: 1 }).then((r) => r.data)
                    : Promise.resolve([] as Icd10Pcs[]),
            ]);
            setSubCodes((prev) => ({
                ...prev,
                [subId]: { expanded: true, loading: false, loaded: true, cm, pcs, error: null },
            }));
        } catch {
            setSubCodes((prev) => ({
                ...prev,
                [subId]: { expanded: true, loading: false, loaded: false, cm: [], pcs: [], error: 'Erro ao carregar códigos desta subespecialidade.' },
            }));
        }
    }

    // Auto‑load first subspecialty whenever active specialty tab changes
    useEffect(() => {
        if (activeTab < 0) return;
        const firstSub = catalog[activeTab]?.subspecialties[0];
        if (firstSub) loadSubCodes(firstSub.id, firstSub);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

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
                                Medic@dex
                            </span>
                        </a>
                        <nav className="flex items-center gap-2">
                            {isLoggedIn ? (
                                <a
                                    href="/dashboard"
                                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    Dashboard
                                </a>
                            ) : (
                                <a
                                    href="/login"
                                    className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    Entrar
                                </a>
                            )}
                        </nav>
                    </div>
                </header>

                {/* ── Hero ───────────────────────────────────────────────────── */}
                <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
                        <div className="mx-auto max-w-3xl text-center">
                            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                                <Stethoscope className="h-3 w-3" />
                                Classificação Internacional de Doenças — 10.ª Revisão
                            </span>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                Diagnósticos e Procedimentos
                                <span className="ml-2 text-blue-600">num só lugar</span>
                            </h1>
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                Pesquise e consulte códigos ICD-10-CM e ICD-10-PCS organizados por especialidade clínica.
                            </p>

                            {/* Stats strip */}
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-sm">
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
                            className="mx-auto mt-6 max-w-2xl"
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
                        <div className="mx-auto mt-3 max-w-2xl">
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
                                                        <button
                                                            type="button"
                                                            onClick={() => copyCode(item.code)}
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                        >
                                                            <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                                                {item.code}
                                                            </span>
                                                            <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                                                                {item.description}
                                                            </span>
                                                            {copiedCode === item.code
                                                                ? <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                                : <Search className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100" />}
                                                        </button>
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
                    <div className="mb-4 flex items-center justify-between">
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

                    {/* Tab bar */}
                    <div className="overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                        <div className="flex min-w-max">
                            {/* Tab Favoritos — apenas para utilizadores autenticados */}
                            {isLoggedIn && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(-1)}
                                    className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                                        activeTab === -1
                                            ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Star className={`h-3.5 w-3.5 ${
                                        activeTab === -1 ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                                    }`} />
                                    Favoritos
                                    {favorites.length > 0 && (
                                        <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                            activeTab === -1
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {favorites.length}
                                        </span>
                                    )}
                                </button>
                            )}
                            {catalog.map((specialty, idx) => (
                                <button
                                    key={specialty.id}
                                    type="button"
                                    onClick={() => { setActiveTab(idx); setActiveSubspecialty(0); }}
                                    className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                                        activeTab === idx
                                            ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {specialty.name}
                                    <span
                                        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                            activeTab === idx
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                    >
                                        {specialty.cm_count + specialty.pcs_count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Painel Favoritos */}
                    {activeTab === -1 && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            {favLoading && (
                                <div className="flex items-center gap-2 px-5 py-6 text-sm text-slate-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    A carregar favoritos…
                                </div>
                            )}
                            {favError && (
                                <p className="px-5 py-6 text-sm text-red-500">{favError}</p>
                            )}
                            {!favLoading && !favError && favorites.length === 0 && (
                                <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                                    <Star className="h-8 w-8 text-slate-200 dark:text-slate-700" />
                                    <p className="text-sm text-slate-400">Ainda não tem favoritos.</p>
                                    <p className="text-xs text-slate-400">Adicione códigos favoritos nas páginas de detalhe.</p>
                                </div>
                            )}
                            {!favLoading && !favError && favorites.length > 0 && (() => {
                                const cmFavs = favorites.filter(
                                    (f) => f.favorable_type?.includes('Icd10Cm') && f.favorable,
                                ) as (Favorite & { favorable: Icd10Cm })[];
                                const pcsFavs = favorites.filter(
                                    (f) => f.favorable_type?.includes('Icd10Pcs') && f.favorable,
                                ) as (Favorite & { favorable: Icd10Pcs })[];
                                return (
                                    <div className="grid gap-4 p-4 lg:grid-cols-2">
                                        {/* CM */}
                                        <div>
                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                Diagnósticos CM
                                            </p>
                                            {cmFavs.length > 0 ? (
                                                <ul className="space-y-0.5">
                                                    {cmFavs.map((f) => (
                                                        <li key={f.id}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyCode(f.favorable.code)}
                                                                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                                                            >
                                                                <span className="mt-px shrink-0 rounded bg-blue-50 px-1.5 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                                                    {f.favorable.code}
                                                                </span>
                                                                <span className="flex-1 text-xs text-slate-600 dark:text-slate-400">
                                                                    {f.favorable.description}
                                                                </span>
                                                                {copiedCode === f.favorable.code && <Check className="mt-px h-3 w-3 shrink-0 text-emerald-500" />}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-slate-400">Sem diagnósticos favoritos.</p>
                                            )}
                                        </div>
                                        {/* PCS */}
                                        <div>
                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                Procedimentos PCS
                                            </p>
                                            {pcsFavs.length > 0 ? (
                                                <ul className="space-y-0.5">
                                                    {pcsFavs.map((f) => (
                                                        <li key={f.id}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyCode(f.favorable.code)}
                                                                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                                                            >
                                                                <span className="mt-px shrink-0 rounded bg-indigo-50 px-1.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                                    {f.favorable.code}
                                                                </span>
                                                                <span className="flex-1 text-xs text-slate-600 dark:text-slate-400">
                                                                    {f.favorable.description}
                                                                </span>
                                                                {copiedCode === f.favorable.code && <Check className="mt-px h-3 w-3 shrink-0 text-emerald-500" />}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-slate-400">Sem procedimentos favoritos.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Subspecialty tabs + codes panel */}
                    {activeTab >= 0 && activeSubs.length > 0 && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            {/* Sub-tab bar */}
                            <div className="overflow-x-auto border-b border-slate-100 dark:border-slate-800">
                                <div className="flex min-w-max px-2">
                                    {activeSubs.map((sub, subIdx) => (
                                        <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveSubspecialty(subIdx);
                                                loadSubCodes(sub.id, sub);
                                            }}
                                            className={`-mb-px border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition ${
                                                activeSubspecialty === subIdx
                                                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {sub.name}
                                            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                                activeSubspecialty === subIdx
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                                {sub.cm_count + sub.pcs_count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Codes panel */}
                            <div className="p-4">
                                {(!activeSubData || activeSubData.loading) && (
                                    <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        A carregar códigos…
                                    </div>
                                )}
                                {activeSubData?.error && (
                                    <p className="py-3 text-xs text-red-500">{activeSubData.error}</p>
                                )}
                                {activeSubData?.loaded && !activeSubData.error && (
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        {/* CM */}
                                        <div>
                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                Diagnósticos CM
                                            </p>
                                            {activeSubData.cm.length > 0 ? (
                                                <ul className="max-h-64 space-y-0.5 overflow-auto">
                                                    {activeSubData.cm.map((code) => (
                                                        <li key={`cm-${code.id}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyCode(code.code)}
                                                                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                                                            >
                                                                <span className="mt-px shrink-0 rounded bg-blue-50 px-1.5 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                                                    {code.code}
                                                                </span>
                                                                <span className="flex-1 text-xs text-slate-600 dark:text-slate-400">
                                                                    {code.description}
                                                                </span>
                                                                {copiedCode === code.code && <Check className="mt-px h-3 w-3 shrink-0 text-emerald-500" />}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-slate-400">Sem códigos CM.</p>
                                            )}
                                        </div>
                                        {/* PCS */}
                                        <div>
                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                Procedimentos PCS
                                            </p>
                                            {activeSubData.pcs.length > 0 ? (
                                                <ul className="max-h-64 space-y-0.5 overflow-auto">
                                                    {activeSubData.pcs.map((code) => (
                                                        <li key={`pcs-${code.id}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyCode(code.code)}
                                                                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                                                            >
                                                                <span className="mt-px shrink-0 rounded bg-indigo-50 px-1.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                                    {code.code}
                                                                </span>
                                                                <span className="flex-1 text-xs text-slate-600 dark:text-slate-400">
                                                                    {code.description}
                                                                </span>
                                                                {copiedCode === code.code && <Check className="mt-px h-3 w-3 shrink-0 text-emerald-500" />}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-slate-400">Sem códigos PCS.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* ── Footer ─────────────────────────────────────────────────── */}
                <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <p className="text-center text-xs text-slate-400">
                            © {new Date().getFullYear()} Medic@dex — Classificação ICD-10-CM/PCS
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

