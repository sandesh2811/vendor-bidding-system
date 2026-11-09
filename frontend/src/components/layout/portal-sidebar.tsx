"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronsUpDownIcon,
  FileTextIcon,
  HandCoinsIcon,
  InboxIcon,
  LogOutIcon,
  type LucideIcon,
  StoreIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/layout/brand-mark";
import { useLogout } from "@/features/auth/use-logout";
import { meQuery } from "@/lib/api";
import { initials } from "@/lib/format";

type NavItem = { title: string; href: string; icon: LucideIcon; matches?: (path: string) => boolean };

export const ADMIN_NAV: NavItem[] = [
  { title: "Quotations", href: "/admin/quotations", icon: FileTextIcon },
  { title: "Bookings", href: "/admin/bookings", icon: HandCoinsIcon },
  { title: "Vendors", href: "/admin/vendors", icon: StoreIcon },
];

export const VENDOR_NAV: NavItem[] = [
  {
    title: "Requests",
    href: "/vendor",
    icon: InboxIcon,
    matches: (path) => path === "/vendor" || path.startsWith("/vendor/quotations"),
  },
  { title: "Bookings", href: "/vendor/bookings", icon: HandCoinsIcon },
  { title: "Profile", href: "/vendor/profile", icon: UserIcon },
];

export const isNavActive = (item: NavItem, path: string) => item.matches?.(path) ?? path.startsWith(item.href);

/* collapsible portal sidebar: brand, nav and the signed-in user's menu; shared by the admin and vendor portals */
export function PortalSidebar({
  nav,
  homeHref,
  subtitle,
  roleLabel,
}: {
  nav: NavItem[];
  homeHref: string;
  subtitle: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={homeHref} />}>
              <BrandMark className="size-7 text-xs" />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold text-sidebar-accent-foreground">Mero Event</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{subtitle}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isNavActive(item, pathname)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                    className="text-sidebar-foreground data-active:font-medium data-active:text-sidebar-accent-foreground"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu roleLabel={roleLabel} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function UserMenu({ roleLabel }: { roleLabel: string }) {
  const { data: user } = useQuery(meQuery);
  const logoutMutation = useLogout();

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent" />}
          >
            <Avatar className="size-7 after:border-sidebar-border">
              <AvatarFallback className="bg-sidebar-accent text-[11px] font-medium text-sidebar-accent-foreground">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-sidebar-accent-foreground">{user.name}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 text-sidebar-foreground/50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--anchor-width) min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm font-medium text-foreground">{user.name}</div>
                <div className="text-xs text-muted-foreground">{roleLabel}</div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
