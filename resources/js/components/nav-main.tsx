import { Link } from '@inertiajs/react';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2">
            <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                Admin
            </SidebarGroupLabel>

            <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className="h-9 rounded-lg text-sm"
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon className="size-4" />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
