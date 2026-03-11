import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { getFavorites, removeFavorite } from '@/lib/icd-api';
import type { Favorite } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ICD-10', href: '/icd' },
    { title: 'Favoritos', href: '/icd/favorites' },
];

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFavorites()
            .then(setFavorites)
            .catch(() => { /* session may have expired */ })
            .finally(() => setLoading(false));
    }, []);

    const handleRemove = async (id: number) => {
        try {
            await removeFavorite(id);
            setFavorites((prev) => prev.filter((f) => f.id !== id));
        } catch {
            // noop — item stays in the list if the request fails
        }
    };

    const getHref = (fav: Favorite): string => {
        const type = fav.favorable_type;
        if (type.includes('Icd10Cm') && fav.favorable) {
            return `/icd/cm/${(fav.favorable as any).code}`;
        }
        if (type.includes('Icd10Pcs') && fav.favorable) {
            return `/icd/pcs/${(fav.favorable as any).code}`;
        }
        return '#';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Favoritos" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-bold">Favoritos</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Códigos ICD-10 guardados para acesso rápido.
                    </p>
                </div>

                {/* Skeleton */}
                {loading && (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-16 animate-pulse rounded-xl border border-sidebar-border/70 bg-muted dark:border-sidebar-border"
                            />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && favorites.length === 0 && (
                    <div className="rounded-xl border border-sidebar-border/70 p-10 text-center dark:border-sidebar-border">
                        <p className="text-muted-foreground">Nenhum favorito guardado.</p>
                        <div className="mt-3 flex justify-center gap-4">
                            <Link
                                href="/icd/cm"
                                className="text-sm text-primary hover:underline"
                            >
                                Pesquisar diagnósticos →
                            </Link>
                            <Link
                                href="/icd/pcs"
                                className="text-sm text-primary hover:underline"
                            >
                                Pesquisar procedimentos →
                            </Link>
                        </div>
                    </div>
                )}

                {/* List */}
                {!loading && favorites.length > 0 && (
                    <div className="space-y-3">
                        {favorites.map((fav) => {
                            const code = (fav.favorable as any)?.code as string | undefined;
                            const description = (fav.favorable as any)?.description as
                                | string
                                | undefined;
                            const isCm = fav.favorable_type.includes('Icd10Cm');

                            return (
                                <div
                                    key={fav.id}
                                    className="flex items-center justify-between gap-4 rounded-xl border border-sidebar-border/70 px-5 py-4 dark:border-sidebar-border"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span
                                            className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                                                isCm
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                            }`}
                                        >
                                            {isCm ? 'CM' : 'PCS'}
                                        </span>
                                        <Link
                                            href={getHref(fav)}
                                            className="min-w-0 hover:text-primary"
                                        >
                                            <span className="font-mono font-medium">{code}</span>
                                            {description && (
                                                <span className="ml-2 truncate text-sm text-muted-foreground">
                                                    {description}
                                                </span>
                                            )}
                                        </Link>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(fav.id)}
                                        className="shrink-0 rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                                    >
                                        Remover
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
