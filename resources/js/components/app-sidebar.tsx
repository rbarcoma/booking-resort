import { Link } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    CalendarDays,
    FileText,
    Image,
    LayoutGrid,
    Users,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
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

const mainNavItems = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Resort Options',
        href: '/admin/resort-options',
        icon: Building2,
    },
    {
        title: 'Bookings',
        href: '/admin/bookings',
        icon: CalendarDays,
    },
    {
        title: 'Calendar',
        href: '/admin/calendar',
        icon: Calendar,
    },
    {
        title: 'Landing Page',
        href: '/admin/landing-page',
        icon: Image,
    },
    {
        title: 'Reports',
        href: '/admin/reports',
        icon: FileText,
    },
    {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-12">
                            <Link href="/admin/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="pt-2">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
