import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { getIcd10CmDetail, addFavorite, removeFavorite, getFavorites } from '@/lib/icd-api';
import type { Icd10Cm, Favorite } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';

interface Props {
    code: string;
}

export default function Icd10CmShowPage({ code }: Props) {
    const { auth } = usePage().props;
    const isAuthenticated = !!auth.user;

    const [entry, setEntry] = useState<Icd10Cm | null>(null);
    const [favorite, setFavorite] = useState<Favorite | null>(null);
    const [loading, setLoading] = useState(true);
    const [favLoading, setFavLoading] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'ICD-10', href: '/icd' },
        { title: 'ICD-10-CM', href: '/icd/cm' },
        { title: code, href: `/icd/cm/${code}` },
    ];

    useEffect(() => {
        const requests: [Promise<Icd10Cm>, Promise<Favorite[]>] = [
            getIcd10CmDetail(code),
            isAuthenticated ? getFavorites() : Promise.resolve([]),
        ];
        Promise.all(requests)
            .then(([detail, favs]) => {
                setEntry(detail);
                const match = favs.find(
                    (f) => f.favorable_id === detail.id && f.favorable_type.includes('Icd10Cm'),
                );
                setFavorite(match ?? null);
            })
            .catch(() => { /* network or auth error */ })
            .finally(() => setLoading(false));
    }, [code]);

    const toggleFavorite = async () => {
        if (!entry || favLoading) return;
        setFavLoading(true);
        try {
            if (favorite) {
                await removeFavorite(favorite.id);
                setFavorite(null);
            } else {
                const fav = await addFavorite(entry.id, 'icd10_cm');
                setFavorite(fav);
            }
        } catch {
            // noop — button stays in its previous state
        } finally {
            setFavLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={entry ? `${entry.code} — ${entry.description}` : 'ICD-10-CM'} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {loading && (
                    <div className="space-y-3">
                        <div className="h-10 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-6 w-96 animate-pulse rounded bg-muted" />
                    </div>
                )}

                {entry && (
                    <>
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-mono text-4xl font-bold text-primary">
                                        {entry.code}
                                    </span>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            entry.valid
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {entry.valid ? 'Válido' : 'Não válido'}
                                    </span>
                                </div>
                                <h1 className="mt-2 text-xl font-semibold leading-snug">
                                    {entry.description}
                                </h1>
                            </div>
                            {isAuthenticated && (
                                <button
                                    onClick={toggleFavorite}
                                    disabled={favLoading}
                                    className={`shrink-0 rounded-lg border px-4 py-2 text-sm transition disabled:opacity-50 ${
                                        favorite
                                            ? 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20'
                                            : 'border-sidebar-border/70 hover:bg-accent dark:border-sidebar-border'
                                    }`}
                                >
                                    {favorite ? '★ Guardado' : '☆ Guardar'}
                                </button>
                            )}
                        </div>

                        {/* Metadata */}
                        <dl className="grid gap-4 rounded-xl border border-sidebar-border/70 p-5 sm:grid-cols-2 dark:border-sidebar-border">
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Tipo
                                </dt>
                                <dd className="mt-1 font-mono text-sm">ICD-10-CM (Diagnóstico)</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Código
                                </dt>
                                <dd className="mt-1 font-mono text-sm">{entry.code}</dd>
                            </div>
                            {entry.subspecialty && (
                                <>
                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Subespecialidade
                                        </dt>
                                        <dd className="mt-1 text-sm">
                                            <Link
                                                href={`/icd/cm?subspecialty_id=${entry.subspecialty_id}`}
                                                className="text-primary hover:underline"
                                            >
                                                {entry.subspecialty.name}
                                            </Link>
                                        </dd>
                                    </div>
                                    {entry.subspecialty.specialty && (
                                        <div>
                                            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Especialidade
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {entry.subspecialty.specialty.name}
                                            </dd>
                                        </div>
                                    )}
                                </>
                            )}
                            {entry.notes && (
                                <div className="sm:col-span-2">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Notas
                                    </dt>
                                    <dd className="mt-1 text-sm">{entry.notes}</dd>
                                </div>
                            )}
                        </dl>

                        <div className="flex gap-3">
                            <Link
                                href="/icd/cm"
                                className="rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm transition hover:bg-accent dark:border-sidebar-border"
                            >
                                ← Voltar à lista
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}


interface Props {
    code: string;
}
