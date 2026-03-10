import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { getSpecialties } from '@/lib/icd-api';
import type { Specialty } from '@/types/icd';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ICD-10', href: '/icd' },
    { title: 'Especialidades', href: '/icd/specialties' },
];

const slugBorder: Record<string, string> = {
    cardiology:        'border-red-200    hover:border-red-400    dark:border-red-900/40',
    neurology:         'border-purple-200 hover:border-purple-400 dark:border-purple-900/40',
    orthopedics:       'border-orange-200 hover:border-orange-400 dark:border-orange-900/40',
    pulmonology:       'border-blue-200   hover:border-blue-400   dark:border-blue-900/40',
    gastroenterology:  'border-yellow-200 hover:border-yellow-500 dark:border-yellow-900/40',
    nephrology:        'border-cyan-200   hover:border-cyan-400   dark:border-cyan-900/40',
    oncology:          'border-pink-200   hover:border-pink-400   dark:border-pink-900/40',
    endocrinology:     'border-green-200  hover:border-green-400  dark:border-green-900/40',
    rheumatology:      'border-indigo-200 hover:border-indigo-400 dark:border-indigo-900/40',
    'general-surgery': 'border-gray-200   hover:border-gray-400   dark:border-gray-700',
};

const slugDot: Record<string, string> = {
    cardiology:        'bg-red-400',
    neurology:         'bg-purple-400',
    orthopedics:       'bg-orange-400',
    pulmonology:       'bg-blue-400',
    gastroenterology:  'bg-yellow-500',
    nephrology:        'bg-cyan-400',
    oncology:          'bg-pink-400',
    endocrinology:     'bg-green-400',
    rheumatology:      'bg-indigo-400',
    'general-surgery': 'bg-gray-400',
};

export default function SpecialtiesPage() {
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSpecialties()
            .then(setSpecialties)
            .catch(() => setError('Erro ao carregar especialidades.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Especialidades" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">Especialidades Clínicas</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Selecione uma especialidade para ver as subespecialidades e códigos ICD-10.
                    </p>
                </div>

                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-24 animate-pulse rounded-xl border border-sidebar-border/70 bg-muted dark:border-sidebar-border"
                            />
                        ))}
                    </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                {!loading && !error && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {specialties.map((s) => (
                            <Link
                                key={s.id}
                                href={`/icd/specialties/${s.id}/subspecialties`}
                                className={`flex items-start gap-4 rounded-xl border p-5 transition ${
                                    slugBorder[s.slug] ??
                                    'border-sidebar-border/70 hover:border-primary dark:border-sidebar-border'
                                }`}
                            >
                                <span
                                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                                        slugDot[s.slug] ?? 'bg-primary'
                                    }`}
                                />
                                <div className="min-w-0">
                                    <h2 className="font-semibold leading-tight">{s.name}</h2>
                                    {s.description && (
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                            {s.description}
                                        </p>
                                    )}
                                    <span className="mt-2 inline-block text-xs text-muted-foreground">
                                        Ver subespecialidades →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
