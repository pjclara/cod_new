import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { getSubspecialties, getSpecialty } from '@/lib/icd-api';
import type { Specialty, Subspecialty } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';

interface Props {
    specialtyId: number;
}

export default function SubspecialtiesPage({ specialtyId }: Props) {
    const [specialty, setSpecialty] = useState<Specialty | null>(null);
    const [subspecialties, setSubspecialties] = useState<Subspecialty[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getSpecialty(specialtyId), getSubspecialties(specialtyId)])
            .then(([spec, subs]) => {
                setSpecialty(spec);
                setSubspecialties(subs);
            })
            .finally(() => setLoading(false));
    }, [specialtyId]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'ICD-10', href: '/icd' },
        { title: 'Especialidades', href: '/icd/specialties' },
        {
            title: specialty?.name ?? '…',
            href: `/icd/specialties/${specialtyId}/subspecialties`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={
                    specialty
                        ? `${specialty.name} — Subespecialidades`
                        : 'Subespecialidades'
                }
            />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        {specialty?.name ?? '…'} — Subespecialidades
                    </h1>
                    {!loading && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {subspecialties.length} subespecialidade
                            {subspecialties.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-36 animate-pulse rounded-xl border border-sidebar-border/70 bg-muted dark:border-sidebar-border"
                            />
                        ))}
                    </div>
                )}

                {!loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {subspecialties.map((sub) => (
                            <div
                                key={sub.id}
                                className="rounded-xl border border-sidebar-border/70 p-5 dark:border-sidebar-border"
                            >
                                <h2 className="mb-1 font-semibold">{sub.name}</h2>
                                {sub.description && (
                                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                                        {sub.description}
                                    </p>
                                )}
                                <div className="mt-3 flex gap-2">
                                    <Link
                                        href={`/icd/cm?subspecialty_id=${sub.id}`}
                                        className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                    >
                                        ICD-10-CM
                                    </Link>
                                    <Link
                                        href={`/icd/pcs?subspecialty_id=${sub.id}`}
                                        className="rounded-md border border-purple-300 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                                    >
                                        ICD-10-PCS
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}


interface Props {
    specialtyId: number;
}
