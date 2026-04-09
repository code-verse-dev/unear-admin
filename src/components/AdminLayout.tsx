import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Loader2, UserPlus, Scale, ListChecks, FileStack, Car, CircleUser, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { getAdminSession } from "@/lib/auth-session";
import { adminLogout } from "@/lib/admin-api";
import { useAdminActivityNotificationsQuery } from "@/hooks/useAdminActivityNotifications";
import { useAdminActivityReadState } from "@/hooks/useAdminActivityReadState";
import type { AdminActivityKind } from "@/api/adminActivityNotifications";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const KIND_ICONS: Record<AdminActivityKind, LucideIcon> = {
  user_registered: UserPlus,
  dispute_submitted: Scale,
  inspection_request: ListChecks,
  expense_claim: FileStack,
  vehicle_listed: Car,
};

const BELL_PREVIEW_LIMIT = 15;

const AdminLayout = () => {
  const navigate = useNavigate();
  const { data: activityItems = [], isLoading, isError, error } = useAdminActivityNotificationsQuery(BELL_PREVIEW_LIMIT);
  const { readSet, markRead, markAllRead } = useAdminActivityReadState();

  const displayName = useMemo(() => {
    const s = getAdminSession();
    if (!s) return "Admin";
    const full = [s.firstname, s.lastname].filter(Boolean).join(" ").trim();
    return full || s.name || s.email || "Admin";
  }, []);

  const unreadIds = useMemo(
    () => activityItems.filter((n) => !readSet.has(n.id)).map((n) => n.id),
    [activityItems, readSet]
  );
  const unreadCount = unreadIds.length;

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      /* session cleared in adminLogout finally */
    }
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full min-w-0">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-14 min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-4">
            <SidebarTrigger className="h-10 w-10 shrink-0 text-foreground" />
            <div className="flex shrink-0 items-center gap-4">
              <ThemeToggle />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 ? (
                      <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={8}
                  className="w-[min(100vw-1.5rem,360px)] max-w-[calc(100vw-1.5rem)] p-0 rounded-xl border-border shadow-xl"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => markAllRead(unreadIds)}
                        className="text-[11px] font-semibold text-secondary hover:text-secondary/70 transition-colors"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  <div className="max-h-[min(320px,50dvh)] overflow-y-auto overscroll-contain divide-y divide-border sm:max-h-[320px]">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                        Loading…
                      </div>
                    ) : isError ? (
                      <p className="px-4 py-6 text-center text-xs text-destructive">
                        {error instanceof Error ? error.message : "Could not load notifications."}
                      </p>
                    ) : activityItems.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
                    ) : (
                      activityItems.map((n) => {
                        const Icon = KIND_ICONS[n.kind] ?? Car;
                        const read = readSet.has(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              markRead(n.id);
                              navigate(n.path);
                            }}
                            className={cn(
                              "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                              !read && "bg-secondary/5"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                !read ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"
                              )}
                            >
                              <Icon className="w-4 h-4" aria-hidden />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-[13px] leading-tight",
                                  !read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                                )}
                              >
                                {n.title}
                              </p>
                              <p className="text-[12px] text-muted-foreground/70 mt-0.5 truncate">{n.message}</p>
                              <p className="text-[11px] text-muted-foreground/50 mt-1">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {!read ? <div className="mt-2 w-2 h-2 rounded-full bg-secondary flex-shrink-0" /> : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="px-4 py-2.5 border-t border-border">
                    <button
                      type="button"
                      onClick={() => navigate("/notifications")}
                      className="text-[12px] font-semibold text-secondary hover:text-secondary/70 transition-colors w-full text-center"
                    >
                      View all notifications
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/85 hover:text-secondary-foreground"
                    aria-label="Account menu"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-[min(100vw-2rem,12rem)] rounded-xl sm:w-48">
                  <DropdownMenuItem className="text-sm font-medium cursor-pointer" disabled>
                    <User className="w-4 h-4 mr-2" /> {displayName}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm font-medium cursor-pointer"
                    onClick={() => navigate("/profile")}
                  >
                    <CircleUser className="w-4 h-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-sm font-medium text-destructive cursor-pointer focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-x-auto overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
