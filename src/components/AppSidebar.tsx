import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  UsersRound,
  CarFront,
  Headset,
  Wallet,
  Star,
  BookOpen,
  LayoutTemplate,
  BellRing,
  Settings2,
  Receipt,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import UNearLogo from "@/components/UNearLogo";
import { useAdminActivityNotificationsQuery } from "@/hooks/useAdminActivityNotifications";
import { ACTIVITY_BELL_LIMIT } from "@/api/adminActivityNotifications";
import { usePendingUsersCountQuery } from "@/hooks/useAdminUsers";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { title: string; url: string; icon: LucideIcon; badge?: number };

const primaryNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { title: "Users", url: "/users", icon: UsersRound },
  { title: "Vehicles", url: "/vehicles", icon: CarFront },
  { title: "Support Tickets", url: "/support-tickets", icon: Headset },
];

const restNavItems: NavItem[] = [
  { title: "Transactions", url: "/transactions", icon: Wallet },
  { title: "Reviews", url: "/reviews", icon: Star },
  { title: "FAQs", url: "/faqs", icon: BookOpen },
  { title: "Pages", url: "/pages", icon: LayoutTemplate },
  { title: "Push Notifications", url: "/push-notifications", icon: BellRing },
  { title: "Charge types", url: "/host-charge-types", icon: Receipt },
  { title: "Settings", url: "/settings", icon: Settings2 },
];

const menuButtonClass =
  "h-auto min-h-11 overflow-visible data-[active=true]:bg-[#DD9332] group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:min-h-11 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:overflow-visible";

const navLinkClass =
  "relative flex w-full items-center gap-3.5 overflow-visible rounded-lg pl-2 pr-4 py-2 text-base font-semibold tracking-tight text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:text-sidebar-muted-foreground hover:[&_svg]:text-sidebar-accent-foreground aria-[current=page]:[&_svg]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-2.5";

function navPath(url: string) {
  return url.split("?")[0];
}

function isItemActive(pathname: string, url: string) {
  const path = navPath(url);
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}

function PendingBadge({ count, collapsed }: { count: number; collapsed: boolean }) {
  if (!Number.isFinite(count) || count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <div
      aria-label={`${count} pending`}
      className={cn(
        "pointer-events-none z-20 flex shrink-0 items-center justify-center rounded-full bg-destructive font-bold text-destructive-foreground tabular-nums",
        collapsed
          ? "absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px] leading-none"
          : "ml-auto h-5 min-w-5 px-1.5 text-xs leading-none"
      )}
    >
      {label}
    </div>
  );
}

function SidebarNavItems({
  items,
  collapsed,
  pathname,
}: {
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isItemActive(pathname, item.url)}
            tooltip={item.badge ? `${item.title} (${item.badge} pending)` : item.title}
            className={menuButtonClass}
          >
            <NavLink
              to={item.url}
              end={navPath(item.url) === "/"}
              className={navLinkClass}
              activeClassName=" text-sidebar-accent-foreground"
            >
              <item.icon
                className="h-10 w-10 shrink-0 transition-colors duration-150 "
                strokeWidth={1.75}
                aria-hidden
              />
              {!collapsed && <span className="min-w-0 flex-1 truncate">{item.title}</span>}
              <PendingBadge count={item.badge ?? 0} collapsed={collapsed} />
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const pathname = location.pathname;
  const { data } = useAdminActivityNotificationsQuery(ACTIVITY_BELL_LIMIT);
  const pendingFromActivity = Number(data?.pending_users) || 0;
  const { data: pendingFromUsers } = usePendingUsersCountQuery();
  const pendingUsers = Math.max(pendingFromUsers ?? 0, pendingFromActivity);

  const primaryItems: NavItem[] = primaryNavItems.map((item) =>
    item.url === "/users" ? { ...item, badge: pendingUsers } : item
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0 font-poppins">
      <SidebarHeader className="px-6 py-3 pr-4 border-b border-sidebar-border group-data-[collapsible=icon]:px-3">
        <UNearLogo collapsed={collapsed} />
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarGroup className="py-2 pl-4 pr-2 group-data-[collapsible=icon]:px-1.5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarNavItems items={primaryItems} collapsed={collapsed} pathname={pathname} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="py-2 pl-4 pr-2 group-data-[collapsible=icon]:px-1.5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarNavItems items={restNavItems} collapsed={collapsed} pathname={pathname} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-6 py-3 pr-4 border-t border-sidebar-border group-data-[collapsible=icon]:px-3">
        {!collapsed && (
          <p className="text-xs text-sidebar-muted">© 2026 UNear Platform</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
