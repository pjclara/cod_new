import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { BreadcrumbItem, User } from '@/types';

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    users: PaginatedUsers;
    search: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Utilizadores', href: '/admin/users' },
];

export default function AdminUsersIndex({ users, search }: Props) {
    const { props } = usePage<{ flash: { success?: string }; errors: { user?: string } }>();
    const flash = props.flash ?? {};
    const errors = props.errors ?? {};

    const [searchValue, setSearchValue] = useState(search);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/users', { search: searchValue }, { preserveState: true, replace: true });
    }

    function confirmDelete(user: User) {
        setDeleteTarget(user);
    }

    function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/users/${deleteTarget.id}`, {
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gerir Utilizadores" />

            <div className="mx-auto max-w-6xl space-y-5 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            Utilizadores
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {users.total.toLocaleString('pt-PT')} utilizador{users.total !== 1 ? 'es' : ''} registado{users.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/users/create">
                            <Plus className="h-4 w-4" />
                            Novo utilizador
                        </Link>
                    </Button>
                </div>

                {/* Flash messages */}
                {flash.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {errors.user && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                        {errors.user}
                    </div>
                )}

                {/* Search */}
                <form onSubmit={handleSearch}>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Pesquisar por nome ou email…"
                            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </form>

                {/* Table card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            Lista de utilizadores
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile cards — hidden on sm+ */}
                        <div className="sm:hidden divide-y">
                            {users.data.length === 0 && (
                                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum utilizador encontrado.</p>
                            )}
                            {users.data.map((user) => (
                                <div key={user.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-900 dark:text-white">{user.name}</p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            {user.email_verified_at ? (
                                                <Badge className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                    <UserCheck className="h-3 w-3" />
                                                    Verificado
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="gap-1 text-muted-foreground">
                                                    <UserX className="h-3 w-3" />
                                                    Não verificado
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString('pt-PT')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-1.5">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/users/${user.id}/edit`}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                                            onClick={() => confirmDelete(user)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table — hidden below sm */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</th>
                                        <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Registado em</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                                Nenhum utilizador encontrado.
                                            </td>
                                        </tr>
                                    )}
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="transition-colors hover:bg-muted/20">
                                            <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{user.name}</td>
                                            <td className="px-5 py-3.5 text-muted-foreground">{user.email}</td>
                                            <td className="px-5 py-3.5">
                                                {user.email_verified_at ? (
                                                    <Badge className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                        <UserCheck className="h-3 w-3" />
                                                        Verificado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                                                        <UserX className="h-3 w-3" />
                                                        Não verificado
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="hidden px-5 py-3.5 text-sm text-muted-foreground md:table-cell">
                                                {new Date(user.created_at).toLocaleDateString('pt-PT')}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/admin/users/${user.id}/edit`}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            Editar
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                                        onClick={() => confirmDelete(user)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-5 py-3.5">
                                <p className="text-xs text-muted-foreground">
                                    Página {users.current_page} de {users.last_page}
                                </p>
                                <div className="flex gap-1">
                                    {users.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url ?? '#'}
                                            preserveState
                                            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : link.url
                                                      ? 'border hover:bg-muted'
                                                      : 'cursor-default border opacity-40'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar utilizador</DialogTitle>
                        <DialogDescription>
                            Tem a certeza que deseja eliminar{' '}
                            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
                            Esta ação não pode ser revertida.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'A eliminar…' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
