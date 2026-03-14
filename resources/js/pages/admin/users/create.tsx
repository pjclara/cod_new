import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Utilizadores', href: '/admin/users' },
    { title: 'Novo utilizador', href: '/admin/users/create' },
];

export default function AdminUsersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/users');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Novo Utilizador" />

            <div className="mx-auto max-w-2xl space-y-5 p-6">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar à lista
                </Link>

                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Novo utilizador</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="name"
                                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    Nome
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                                    placeholder="Nome completo"
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="email"
                                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                                    placeholder="email@exemplo.com"
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password"
                                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    Palavra-passe
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive">{errors.password}</p>
                                )}
                            </div>

                            {/* Password confirmation */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password_confirmation"
                                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    Confirmar palavra-passe
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" type="button" asChild>
                                    <Link href="/admin/users">Cancelar</Link>
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'A guardar…' : 'Criar utilizador'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
