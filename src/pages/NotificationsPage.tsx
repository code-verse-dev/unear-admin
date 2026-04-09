import { formatDistanceToNow } from "date-fns";
import { Loader2, RefreshCw, UserPlus, Scale, ListChecks, FileStack, Car, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { useAdminActivityNotificationsQuery } from "@/hooks/useAdminActivityNotifications";
import { useAdminActivityReadState } from "@/hooks/useAdminActivityReadState";
import type { AdminActivityKind } from "@/api/adminActivityNotifications";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<AdminActivityKind, LucideIcon> = {
  user_registered: UserPlus,
  dispute_submitted: Scale,
  inspection_request: ListChecks,
  expense_claim: FileStack,
  vehicle_listed: Car,
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data = [], isLoading, isError, error, refetch, isFetching } = useAdminActivityNotificationsQuery(100);
  const { readSet, markRead, markAllRead } = useAdminActivityReadState();

  const unreadIds = data.filter((n) => !readSet.has(n.id)).map((n) => n.id);

  return (
    <PageContainer
      fullWidth
      title="Notifications"
      subtitle="Platform activity: new users, disputes, inspections, claims, and vehicle listings"
      actions={
        <div className="flex items-center gap-2">
          {unreadIds.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => markAllRead(unreadIds)}>
              Mark all read
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
            Refresh
          </Button>
        </div>
      }
    >
      {isError ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Could not load notifications."}</p>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        </div>
      ) : !isError && data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="relative w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
          {data.map((n) => {
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
                  "flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/50",
                  !read && "bg-secondary/5"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    read ? "bg-muted text-muted-foreground" : "bg-secondary/15 text-secondary"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", read ? "font-medium text-muted-foreground" : "font-semibold text-foreground")}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!read ? <div className="mt-3 h-2 w-2 shrink-0 rounded-full bg-secondary" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default NotificationsPage;
