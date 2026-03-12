import { Head } from '@inertiajs/react';
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

            <div className="min-h-screen bg-muted/20">
                <header className="border-b bg-background/95 backdrop-blur">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                        <a href="/" className="text-base font-semibold text-primary">Medicodex</a>
                        <div className="flex items-center gap-3">
                            <a href="/login" className="text-sm text-muted-foreground transition hover:text-foreground">
                                Entrar
                            </a>
                            {canRegister && (
                                <a
                                    href="/register"
                                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                                >
                                    Registar
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
                    <section className="mx-auto max-w-4xl text-center">
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore Diagnósticos e Procedimentos</h1>
                        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                            Use a pesquisa para encontrar códigos rapidamente e visualize listas públicas já organizadas.
                        </p>

                        <form onSubmit={handleSearch} className="mx-auto mt-7 max-w-3xl">
                            <div className="rounded-xl border bg-background p-2 shadow-sm">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <div className="inline-flex rounded-lg border p-1">
                                        <button
                                            type="button"
                                            onClick={() => setSearchType('cm')}
                                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                                searchType === 'cm'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Diagnósticos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSearchType('pcs')}
                                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                                searchType === 'pcs'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Procedimentos
                                        </button>
                                    </div>

                                    <input
                                        type="search"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Pesquisar por código ou descrição..."
                                        className="h-10 flex-1 rounded-lg border border-sidebar-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary dark:border-sidebar-border"
                                        autoFocus
                                    />

                                    <button
                                        type="submit"
                                        className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                                    >
                                        Pesquisar
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="mx-auto mt-4 max-w-3xl text-left">
                            {searchLoading && (
                                <div className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
                                    A pesquisar códigos...
                                </div>
                            )}

                            {!searchLoading && searchError && (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                    {searchError}
                                </div>
                            )}

                            {!searchLoading && !searchError && searchTouched && query.trim() && (
                                <div className="rounded-xl border bg-background">
                                    <div className="border-b px-3 py-2 text-xs text-muted-foreground">
                                        {searchResults.length.toLocaleString('pt-PT')} resultado(s) em{' '}
                                        {searchType === 'cm' ? 'Diagnósticos' : 'Procedimentos'}
                                    </div>
                                    <div className="max-h-80 overflow-auto">
                                        {searchResults.length === 0 ? (
                                            <p className="px-3 py-4 text-sm text-muted-foreground">
                                                Nenhum código encontrado.
                                            </p>
                                        ) : (
                                            <ul className="divide-y">
                                                {searchResults.map((item) => (
                                                    <li key={`${searchType}-${item.id}`} className="px-3 py-2 text-sm">
                                                        <a
                                                            href={
                                                                searchType === 'cm'
                                                                    ? `/icd/cm/${item.code}`
                                                                    : `/icd/pcs/${item.code}`
                                                            }
                                                            className="font-mono font-medium text-primary hover:underline"
                                                        >
                                                            {item.code}
                                                        </a>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {item.description}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="mt-8">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Especialidades e Subespecialidades
                            </h2>
                            <span className="text-xs text-muted-foreground">
                                Só aparecem itens com códigos associados
                            </span>
                        </div>

                        <div className="space-y-3">
                            {catalog.map((specialty) => (
                                <details
                                    key={specialty.id}
                                    className="group overflow-hidden rounded-xl border bg-background"
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                                        <div>
                                            <p className="font-medium">{specialty.name}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {specialty.cm_count.toLocaleString('pt-PT')} CM • {specialty.pcs_count.toLocaleString('pt-PT')} PCS
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground transition group-open:rotate-180">⌄</span>
                                    </summary>

                                    <div className="border-t bg-muted/10 p-3 sm:p-4">
                                        <div className="grid gap-2">
                                            {specialty.subspecialties.map((sub) => (
                                                <div
                                                    key={sub.id}
                                                    className="rounded-lg border bg-background p-3"
                                                >
                                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                                        <div>
                                                            <p className="text-sm font-medium">{sub.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {sub.cm_count.toLocaleString('pt-PT')} CM • {sub.pcs_count.toLocaleString('pt-PT')} PCS
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleSubspecialtyCodes(sub.id, {
                                                                        cm_count: sub.cm_count,
                                                                        pcs_count: sub.pcs_count,
                                                                    })
                                                                }
                                                                className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                                                            >
                                                                {subCodes[sub.id]?.expanded
                                                                    ? 'Ocultar códigos'
                                                                    : 'Ver códigos aqui'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {subCodes[sub.id]?.expanded && (
                                                        <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                                                            {subCodes[sub.id]?.loading && (
                                                                <p className="text-xs text-muted-foreground">A carregar códigos...</p>
                                                            )}

                                                            {subCodes[sub.id]?.error && (
                                                                <p className="text-xs text-destructive">{subCodes[sub.id]?.error}</p>
                                                            )}

                                                            {!subCodes[sub.id]?.loading && !subCodes[sub.id]?.error && (
                                                                <div className="grid gap-3 lg:grid-cols-2">
                                                                    <div>
                                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                            Diagnósticos CM
                                                                        </p>
                                                                        {subCodes[sub.id]?.cm.length ? (
                                                                            <ul className="max-h-64 space-y-1 overflow-auto pr-1">
                                                                                {subCodes[sub.id]?.cm.map((code) => (
                                                                                    <li key={`cm-${code.id}`} className="rounded border bg-background px-2 py-1.5 text-xs">
                                                                                        <a
                                                                                            href={`/icd/cm/${code.code}`}
                                                                                            className="font-mono font-medium text-primary hover:underline"
                                                                                        >
                                                                                            {code.code}
                                                                                        </a>
                                                                                        <p className="mt-0.5 text-muted-foreground">{code.description}</p>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <p className="text-xs text-muted-foreground">Sem códigos CM nesta subespecialidade.</p>
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                            Procedimentos PCS
                                                                        </p>
                                                                        {subCodes[sub.id]?.pcs.length ? (
                                                                            <ul className="max-h-64 space-y-1 overflow-auto pr-1">
                                                                                {subCodes[sub.id]?.pcs.map((code) => (
                                                                                    <li key={`pcs-${code.id}`} className="rounded border bg-background px-2 py-1.5 text-xs">
                                                                                        <a
                                                                                            href={`/icd/pcs/${code.code}`}
                                                                                            className="font-mono font-medium text-primary hover:underline"
                                                                                        >
                                                                                            {code.code}
                                                                                        </a>
                                                                                        <p className="mt-0.5 text-muted-foreground">{code.description}</p>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <p className="text-xs text-muted-foreground">Sem códigos PCS nesta subespecialidade.</p>
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
                </main>
            </div>
        </>
    );
}
