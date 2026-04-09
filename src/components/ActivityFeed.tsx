import { Link } from "react-router-dom";
import {
  Clock,
  Activity,
  User,
  Car,
  AlertTriangle,
  ClipboardCheck,
  Route,
  FileWarning,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  /** Short label (e.g. event type). */
  title: string;
  /** Longer description. */
  description: string;
  time: string;
  type: "user" | "vehicle" | "dispute" | "inspection" | "trip" | "claim";
  /** Admin app route (e.g. /users) */
  to?: string;
}

const typeStyles: Record<
  ActivityItem["type"],
  { wrap: string; icon: string; Icon: LucideIcon }
> = {
  user: { wrap: "bg-sky-500/12 text-sky-600 dark:text-sky-400", icon: "ring-sky-500/20", Icon: User },
  vehicle: {
    wrap: "bg-secondary/15 text-secondary",
    icon: "ring-secondary/25",
    Icon: Car,
  },
  dispute: {
    wrap: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
    icon: "ring-amber-500/20",
    Icon: AlertTriangle,
  },
  inspection: {
    wrap: "bg-primary/12 text-primary",
    icon: "ring-primary/20",
    Icon: ClipboardCheck,
  },
  trip: { wrap: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400", icon: "ring-emerald-500/20", Icon: Route },
  claim: {
    wrap: "bg-destructive/12 text-destructive",
    icon: "ring-destructive/20",
    Icon: FileWarning,
  },
};

interface ActivityFeedProps {
  activities: ActivityItem[];
  emptyMessage?: string;
}

const ActivityFeed = ({ activities, emptyMessage = "No recent activity yet." }: ActivityFeedProps) => {
  return (
    <div
      className={cn(
        "admin-card flex min-h-[220px] flex-col overflow-hidden",
        /* Capped height so the list region gets a definite flex basis and overflow-y-auto works (esp. xl grid). */
        "max-h-[min(72vh,640px)] xl:max-h-[min(calc(100dvh-10rem),56rem)]",
        "w-full bg-gradient-to-b from-card via-card to-muted/25 dark:to-muted/10"
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-border/60 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Activity className="h-5 w-5" strokeWidth={2} />
        </div>
        <h3 className="font-['DM_Sans',system-ui,sans-serif] text-base font-semibold tracking-tight text-card-foreground">
          Recent activity
        </h3>
      </div>

      {activities.length === 0 ? (
        <div className="flex min-h-[160px] flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Activity className="h-6 w-6 opacity-70" />
          </div>
          <p className="max-w-[220px] text-sm leading-relaxed text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain py-2",
            /* Hide scrollbar but keep scroll (Firefox / IE legacy / Chromium) */
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0"
          )}
        >
        <ul className="flex flex-col gap-0" role="list">
          {activities.map((item, index) => {
            const styles = typeStyles[item.type] ?? typeStyles.user;
            const Icon = styles.Icon;
            const isLast = index === activities.length - 1;

            const inner = (
              <div
                className={cn(
                  "group relative flex gap-4 rounded-2xl border border-transparent px-1 py-4 transition-colors",
                  "hover:border-border/80 hover:bg-background/80 dark:hover:bg-background/40"
                )}
              >
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-2 ring-offset-2 ring-offset-card",
                      styles.wrap,
                      styles.icon
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  {!isLast ? (
                    <span
                      className="mt-2 w-px flex-1 min-h-[28px] bg-gradient-to-b from-border to-transparent"
                      aria-hidden
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 pb-2 pt-0.5">
                  <p className="font-['DM_Sans',system-ui,sans-serif] text-base font-semibold leading-snug text-card-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground/90">
                    <Clock className="h-4 w-4 shrink-0 opacity-70" />
                    <span>{item.time}</span>
                  </p>
                </div>
              </div>
            );

            return (
              <li key={item.id}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="block rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
export type { ActivityItem };
