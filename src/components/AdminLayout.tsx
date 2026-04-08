import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Check, AlertTriangle, Car, CreditCard, UserPlus } from "lucide-react";
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
import { useMemo, useState } from "react";
import { getAdminSession } from "@/lib/auth-session";
import { adminLogout } from "@/lib/admin-api";

const initialNotifications = [
  { id: 1, icon: UserPlus, title: "New user registered", desc: "Ahmed Khan joined the platform", time: "2 min ago", read: false },
  { id: 2, icon: AlertTriangle, title: "Dispute submitted", desc: "Booking #2847 — damage claim", time: "15 min ago", read: false },
  { id: 3, icon: Car, title: "Vehicle added", desc: "Toyota Camry 2024 by Sara Ali", time: "1 hr ago", read: false },
  { id: 4, icon: CreditCard, title: "Payment received", desc: "$245.00 for booking #2831", time: "3 hr ago", read: true },
  { id: 5, icon: Check, title: "Inspection completed", desc: "Honda Civic — passed inspection", time: "5 hr ago", read: true },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const displayName = useMemo(() => {
    const s = getAdminSession();
    if (!s) return "Admin";
    const full = [s.firstname, s.lastname].filter(Boolean).join(" ").trim();
    return full || s.name || s.email || "Admin";
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
            <SidebarTrigger className="text-foreground" />
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[360px] p-0 rounded-xl shadow-xl border-border">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[11px] font-semibold text-secondary hover:text-secondary/70 transition-colors">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${!n.read ? "bg-secondary/5" : ""}`}
                      >
                        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.read ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}>
                          <n.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-tight ${!n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                            {n.title}
                          </p>
                          <p className="text-[12px] text-muted-foreground/70 mt-0.5 truncate">{n.desc}</p>
                          <p className="text-[11px] text-muted-foreground/50 mt-1">{n.time}</p>
                        </div>
                        {!n.read && <div className="mt-2 w-2 h-2 rounded-full bg-secondary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-border">
                    <button
                      onClick={() => navigate("/notifications")}
                      className="text-[12px] font-semibold text-secondary hover:text-secondary/70 transition-colors w-full text-center"
                    >
                      View all notifications
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/85 transition-colors">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem className="text-sm font-medium cursor-pointer" disabled>
                    <User className="w-4 h-4 mr-2" /> {displayName}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-sm font-medium text-destructive cursor-pointer focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
