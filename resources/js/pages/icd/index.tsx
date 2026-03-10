import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'ICD-10', href: '/icd' }];

interface Props {
    stats: { cm: number; pcs: number; specialties: number };
}

export default function IcdHomePage({ stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ICD-10 — Nomenclatura" />
            <div className="flex flex-col gap-6 p-6">
                {/* Hero */}
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8">
                    <h1 className="text-3xl font-bold tracking-tight">Nomenclatura ICD-10</h1>
                    <p className="mt-2 max-w-lg text-muted-foreground">
                        Consulte diagnósticos (ICD-10-CM) e procedimentos (ICD-10-PCS) com descrições em Português de
                        Portugal.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/icd/cm"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                        >
                            Diagnósticos ICD-10-CM
                        </Link>
                        <Link
                            href="/icd/pcs"
                            className="inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
                        >
                            Procedimentos ICD-10-PCS
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Diagnósticos (CM)" value={stats.cm} href="/icd/cm" />
                    <StatCard label="Procedimentos (PCS)" value={stats.pcs} href="/icd/pcs" />
                    <StatCard label="Especialidades" value={stats.specialties} href="/icd/specialties" />
                </div>

                {/* Quick nav */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <QuickCard
                        href="/icd/specialties"
                        title="Navegar por Especialidade"
                        desc="Explore códigos organizados por área clínica e subespecialidade"
                    />
                    <QuickCard
                        href="/icd/favorites"
                        title="Favoritos"
                        desc="Aceda rapidamente aos códigos ICD-10 que guardou"
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
    return (
        <Link
            href={href}
            className="rounded-xl border border-sidebar-border/70 p-5 transition hover:border-primary hover:bg-accent dark:border-sidebar-border"
        >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value.toLocaleString('pt-PT')}</p>
        </Link>
    );
}

function QuickCard({ href, title, desc }: { href: string; title: string; desc: string }) {
    return (
        <Link
            href={href}
            className="group rounded-xl border border-sidebar-border/70 p-5 transition hover:border-primary hover:bg-accent dark:border-sidebar-border"
        >
            <h3 className="font-semibold transition group-hover:text-primary">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </Link>
    );
}
