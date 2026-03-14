import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, ShieldCheck, ShieldOff } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem, User } from '@/types';

interface Props {
    user: Pick<User, 'id' | 'name' | 'email' | 'email_verified_at' | 'created_at'>;
}

export default function AdminUsersEdit({ user }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Utilizadores', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/users/${user.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar — ${user.name}`} />

            <div className="mx-auto max-w-2xl space-y-5 p-6">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar à lista
                </Link>

                {/* Info card */}
                <Card className="border-0 bg-muted/30">
                    <CardContent className="flex flex-wrap items-center gap-4 pt-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                ID
                            </p>
                            <p className="font-mono text-sm font-semibold">#{user.id}</p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Registado em
                            </p>
                            <p className="text-sm">
                                {new Date(user.created_at).toLocaleDateString('pt-PT')}
                            </p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Email
                            </p>
                            {user.email_verified_at ? (
                                <Badge className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                                    <ShieldCheck className="h-3 w-3" />
                                    Verificado
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 text-muted-foreground">
                                    <ShieldOff className="h-3 w-3" />
                                    Não verificado
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Edit form */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Editar utilizador</CardTitle>
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
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <Separator />

                            <p className="text-xs text-muted-foreground">
                                Deixe em branco para manter a palavra-passe atual.
                            </p>

                            {/* New password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password"
                                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    Nova palavra-passe
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

                            {/* Confirm new password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password_confirmation"
                                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    Confirmar nova palavra-passe
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
                                    {processing ? 'A guardar…' : 'Guardar alterações'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
