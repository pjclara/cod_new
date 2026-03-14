import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardList,
    FileText,
    FolderGit2,
    House,
    LayoutGrid,
    Star,
    Stethoscope,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Início',
        href: '/',
        icon: House,
    },
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },

    // wellcome page link
];

const icdNavItemsBase: NavItem[] = [
    { title: 'Início ICD', href: '/icd', icon: House },
    { title: 'Especialidades', href: '/icd/specialties', icon: Stethoscope },
    { title: 'Diagnósticos (CM)', href: '/icd/cm', icon: FileText },
    { title: 'Procedimentos (PCS)', href: '/icd/pcs', icon: ClipboardList },
];

const favoritesNavItem: NavItem = {
    title: 'Favoritos',
    href: '/icd/favorites',
    icon: Star,
};

const adminNavItems: NavItem[] = [
    { title: 'Utilizadores', href: '/admin/users', icon: Users },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage().props as { auth: { user: unknown } };
    const isAuthenticated = !!auth.user;

    const icdNavItems = isAuthenticated
        ? [...icdNavItemsBase, favoritesNavItem]
        : icdNavItemsBase;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavMain label="ICD-10" items={icdNavItems} />
                {isAuthenticated && (
                    <NavMain label="Administração" items={adminNavItems} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
