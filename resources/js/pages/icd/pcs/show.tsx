import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { getIcd10PcsDetail, addFavorite, removeFavorite, getFavorites } from '@/lib/icd-api';
import type { Icd10Pcs, Favorite } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';

const PCS_AXES = [
    'Secção',
    'Sistema corporal',
    'Operação',
    'Parte do corpo',
    'Abordagem',
    'Dispositivo',
    'Qualificador',
];

interface Props {
    code: string;
}

export default function Icd10PcsShowPage({ code }: Props) {
    const { auth } = usePage().props;
    const isAuthenticated = !!auth.user;

    const [entry, setEntry] = useState<Icd10Pcs | null>(null);
    const [favorite, setFavorite] = useState<Favorite | null>(null);
    const [loading, setLoading] = useState(true);
    const [favLoading, setFavLoading] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'ICD-10', href: '/icd' },
        { title: 'ICD-10-PCS', href: '/icd/pcs' },
        { title: code, href: `/icd/pcs/${code}` },
    ];

    useEffect(() => {
        const requests: [Promise<Icd10Pcs>, Promise<Favorite[]>] = [
            getIcd10PcsDetail(code),
            isAuthenticated ? getFavorites() : Promise.resolve([]),
        ];
        Promise.all(requests)
            .then(([detail, favs]) => {
                setEntry(detail);
                const match = favs.find(
                    (f) => f.favorable_id === detail.id && f.favorable_type.includes('Icd10Pcs'),
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
                const fav = await addFavorite(entry.id, 'icd10_pcs');
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
            <Head title={entry ? `${entry.code} — ${entry.description}` : 'ICD-10-PCS'} />
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
                                <span className="font-mono text-4xl font-bold text-primary">
                                    {entry.code}
                                </span>
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

                        {/* 7-axis code breakdown */}
                        <div>
                            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Estrutura do código (7 eixos)
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {code.split('').map((char, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center rounded-lg border border-sidebar-border/70 px-3 py-2 text-center dark:border-sidebar-border"
                                    >
                                        <span className="font-mono text-xl font-bold text-primary">
                                            {char}
                                        </span>
                                        <span className="mt-1 text-xs text-muted-foreground">
                                            {PCS_AXES[i] ?? `Eixo ${i + 1}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metadata */}
                        <dl className="grid gap-4 rounded-xl border border-sidebar-border/70 p-5 sm:grid-cols-2 dark:border-sidebar-border">
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Tipo
                                </dt>
                                <dd className="mt-1 font-mono text-sm">ICD-10-PCS (Procedimento)</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Código
                                </dt>
                                <dd className="mt-1 font-mono text-sm">{entry.code}</dd>
                            </div>
                            {entry.subspecialties && entry.subspecialties.length > 0 && (
                                <>
                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Subespecialidade{entry.subspecialties.length > 1 ? 's' : ''}
                                        </dt>
                                        <dd className="mt-1 flex flex-col gap-0.5 text-sm">
                                            {entry.subspecialties.map((sub) => (
                                                <Link
                                                    key={sub.id}
                                                    href={`/icd/pcs?subspecialty_id=${sub.id}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </dd>
                                    </div>
                                    {entry.subspecialties.some((s) => s.specialty) && (
                                        <div>
                                            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Especialidade{[...new Set(entry.subspecialties.filter((s) => s.specialty).map((s) => s.specialty!.name))].length > 1 ? 's' : ''}
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {[...new Set(entry.subspecialties.filter((s) => s.specialty).map((s) => s.specialty!.name))].join(', ')}
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
                                href="/icd/pcs"
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
