import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  UsersRound,
  CarFront,
  FileStack,
  Headset,
  Wallet,
  ListChecks,
  Star,
  BookOpen,
  LayoutTemplate,
  BellRing,
  Settings2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import UNearLogo from "@/components/UNearLogo";

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

type NavItem = { title: string; url: string; icon: LucideIcon };

const primaryNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { title: "Users", url: "/users", icon: UsersRound },
  { title: "Vehicles", url: "/vehicles", icon: CarFront },
  { title: "Vehicle Claims", url: "/claims", icon: FileStack },
  { title: "Support Tickets", url: "/support-tickets", icon: Headset },
];

const restNavItems: NavItem[] = [
  { title: "Transactions", url: "/transactions", icon: Wallet },
  { title: "Inspection Requests", url: "/inspections", icon: ListChecks },
  { title: "Reviews", url: "/reviews", icon: Star },
  { title: "FAQs", url: "/faqs", icon: BookOpen },
  { title: "Pages", url: "/pages", icon: LayoutTemplate },
  { title: "Push Notifications", url: "/push-notifications", icon: BellRing },
  { title: "Settings", url: "/settings", icon: Settings2 },
];

const menuButtonClass =
  "h-auto min-h-11  data-[active=true]:bg-[#DD9332] group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:min-h-11 group-data-[collapsible=icon]:w-full";

const navLinkClass =
  "flex w-full items-center gap-3.5 rounded-lg pl-2 pr-4 py-2 text-base  font-semibold tracking-tight text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:text-sidebar-muted-foreground hover:[&_svg]:text-sidebar-accent-foreground aria-[current=page]:[&_svg]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-2.5";

function isItemActive(pathname: string, url: string) {
  return url === "/" ? pathname === "/" : pathname.startsWith(url);
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
            tooltip={item.title}
            className={menuButtonClass}
          >
            <NavLink
              to={item.url}
              end={item.url === "/"}
              className={navLinkClass}
              activeClassName=" text-sidebar-accent-foreground"
            >
              <item.icon
                className="h-10 w-10 shrink-0 transition-colors duration-150 "
                strokeWidth={1.75}
                aria-hidden
              />
              {!collapsed && <span>{item.title}</span>}
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

  return (
    <Sidebar collapsible="icon" className="border-r-0 font-poppins">
      <SidebarHeader className="px-6 py-3 pr-4 border-b border-sidebar-border group-data-[collapsible=icon]:px-3">
        <UNearLogo collapsed={collapsed} />
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarGroup className="py-2 pl-4 pr-2 group-data-[collapsible=icon]:px-1.5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarNavItems items={primaryNavItems} collapsed={collapsed} pathname={pathname} />
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
