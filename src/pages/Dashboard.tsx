import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  Car,
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  ClipboardCheck,
  Loader2,
  FileWarning,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MetricCard from "@/components/MetricCard";
import ActivityFeed, { type ActivityItem } from "@/components/ActivityFeed";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useAdminDashboardQuery } from "@/hooks/useAdminDashboard";
import type { DashboardActivityItem } from "@/api/adminDashboard";
import { getRollingMonthKeys, seriesForMonths } from "@/lib/dashboardSeries";

const MONTHS = 12;

const chartTooltipProps = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  },
} as const;

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined).format(Math.round(Number.isFinite(n) ? n : 0));
}

/** Percent change: current vs previous 30-day window (for signups, bookings, listings, revenue). */
function trendVsPrior30d(current: number, previous: number): { value: number; label: string } {
  const label = "vs prior 30 days";
  if (previous <= 0 && current <= 0) return { value: 0, label };
  if (previous <= 0) return { value: 100, label };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.round(pct * 10) / 10, label };
}

function mapActivityItem(row: DashboardActivityItem): ActivityItem {
  const kindMap: Record<string, ActivityItem["type"]> = {
    user_registered: "user",
    vehicle_listed: "vehicle",
    dispute_submitted: "dispute",
    inspection_request: "inspection",
    expense_claim: "claim",
  };
  let time = "";
  try {
    time = formatDistanceToNow(new Date(row.created_at), { addSuffix: true });
  } catch {
    time = row.created_at;
  }
  return {
    id: row.id,
    title: row.title,
    description: row.message,
    time,
    type: kindMap[row.kind] ?? "user",
    to: row.path || undefined,
  };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="admin-card h-36 bg-muted/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <div className="admin-card h-80 bg-muted/40" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="admin-card h-72 bg-muted/40" />
            <div className="admin-card h-72 bg-muted/40" />
          </div>
        </div>
        <div className="xl:col-span-4 admin-card min-h-[280px] bg-muted/40" />
      </div>
    </div>
  );
}

const XL_MIN_PX = 1280;

const Dashboard = () => {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminDashboardQuery();
  const chartsBlockRef = useRef<HTMLDivElement>(null);
  /** On xl, match Recent activity column height to the charts block (list scrolls inside). */
  const [activityColumnPx, setActivityColumnPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = chartsBlockRef.current;
    if (!el) return;

    const sync = () => {
      if (typeof window === "undefined" || window.innerWidth < XL_MIN_PX) {
        setActivityColumnPx(null);
        return;
      }
      setActivityColumnPx(el.offsetHeight);
    };

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    sync();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [data?.dashboardStats, data?.dashboardGraphData]);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Dashboard failed to load", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const monthKeys = useMemo(() => getRollingMonthKeys(MONTHS), []);

  const chartBookings = useMemo(() => {
    if (!data?.dashboardGraphData?.bookingsByMonth) return [];
    return seriesForMonths(monthKeys, data.dashboardGraphData.bookingsByMonth, "total");
  }, [data?.dashboardGraphData?.bookingsByMonth, monthKeys]);

  const chartCompletedRentals = useMemo(() => {
    if (!data?.dashboardGraphData?.rentalGraph) return [];
    return seriesForMonths(monthKeys, data.dashboardGraphData.rentalGraph, "total_purchases");
  }, [data?.dashboardGraphData?.rentalGraph, monthKeys]);

  const chartPurchases = useMemo(() => {
    if (!data?.dashboardGraphData?.purchaseGraph) return [];
    return seriesForMonths(monthKeys, data.dashboardGraphData.purchaseGraph, "total_purchases");
  }, [data?.dashboardGraphData?.purchaseGraph, monthKeys]);

  const chartUsers = useMemo(() => {
    if (!data?.dashboardGraphData?.usersByMonth) return [];
    return seriesForMonths(monthKeys, data.dashboardGraphData.usersByMonth, "total");
  }, [data?.dashboardGraphData?.usersByMonth, monthKeys]);

  const mergedTrend = useMemo(
    () =>
      monthKeys.map((_, i) => ({
        label: chartBookings[i]?.label ?? "",
        bookings: chartBookings[i]?.value ?? 0,
        completed: chartCompletedRentals[i]?.value ?? 0,
      })),
    [chartBookings, chartCompletedRentals, monthKeys]
  );

  const activities = useMemo(
    () => (data?.recent_activity ?? []).map(mapActivityItem),
    [data?.recent_activity]
  );

  const stats = data?.dashboardStats;
  const platformRevenue = stats
    ? stats.total_rental_commission + stats.total_purchase_commission + stats.total_inspection_earning
    : 0;
  const activeListings =
    stats != null ? stats.total_rented_vehicles + stats.total_listed_vehicles : 0;

  return (
    <PageContainer fullWidth title="Dashboard">
      {isLoading && !data ? (
        <DashboardSkeleton />
      ) : isError && !data ? (
        <div className="admin-card max-w-md flex flex-col items-start gap-4 py-10">
          <p className="text-sm text-muted-foreground">Could not load dashboard data.</p>
          <Button type="button" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Try again"}
          </Button>
        </div>
      ) : stats ? (
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="App users"
                value={formatInt(stats.total_users)}
                icon={Users}
                variant="primary"
                trend={trendVsPrior30d(stats.new_users_30d ?? 0, stats.new_users_prev_30d ?? 0)}
                hint={`${formatInt(stats.new_users_30d ?? 0)} new in last 30 days`}
              />
              <MetricCard
                title="Bookings"
                value={formatInt(stats.total_bookings)}
                icon={CalendarCheck}
                variant="info"
                trend={trendVsPrior30d(stats.new_bookings_30d ?? 0, stats.new_bookings_prev_30d ?? 0)}
                hint={`${formatInt(stats.new_bookings_30d ?? 0)} created in last 30 days`}
              />
              <MetricCard
                title="Platform revenue"
                value={formatUsd(platformRevenue)}
                icon={DollarSign}
                variant="info"
                trend={trendVsPrior30d(stats.period_revenue_30d ?? 0, stats.period_revenue_prev_30d ?? 0)}
                hint={`${formatUsd(stats.period_revenue_30d ?? 0)} earned in last 30 days (bookings, purchases, inspections)`}
              />
              <MetricCard
                title="Active listings"
                value={formatInt(activeListings)}
                icon={Car}
                variant="secondary"
                trend={trendVsPrior30d(stats.new_vehicles_30d ?? 0, stats.new_vehicles_prev_30d ?? 0)}
                hint={`${formatInt(stats.new_vehicles_30d ?? 0)} new vehicles listed in last 30 days (rent + sale)`}
              />
            </div>
            <div className="grid grid-cols-1 border-t border-border/60 pt-6 sm:grid-cols-3 gap-5">
              <MetricCard
                title="Open disputes"
                value={formatInt(stats.pending_disputes)}
                icon={AlertTriangle}
                variant="warning"
              />
              <MetricCard
                title="Inspections in queue"
                value={formatInt(stats.open_inspections)}
                icon={ClipboardCheck}
                variant="primary"
                hint="Unpaid or requested"
              />
              <MetricCard
                title="Expense claims"
                value={formatInt(stats.pending_expense_claims)}
                icon={FileWarning}
                variant="destructive"
                hint="Pending or under review"
              />
            </div>
          </section>

          <div className="grid min-h-0 grid-cols-1 items-stretch gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-stretch">
            <div className="min-h-0 w-full min-w-0 self-start">
              <div ref={chartsBlockRef} className="space-y-6">
                <div className="admin-card bg-gradient-to-br from-card via-card to-muted/15 dark:to-muted/5">
                  <p className="mb-4 text-sm font-medium text-card-foreground">Bookings vs completed trips</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mergedTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip {...chartTooltipProps} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        name="Bookings created"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        name="Completed trips"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="admin-card bg-gradient-to-br from-card via-card to-muted/15 dark:to-muted/5">
                    <p className="mb-4 text-sm font-medium text-card-foreground">Purchase closings</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartPurchases} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip {...chartTooltipProps} />
                        <Bar dataKey="value" name="Purchases" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="admin-card bg-gradient-to-br from-card via-card to-muted/15 dark:to-muted/5">
                    <p className="mb-4 text-sm font-medium text-card-foreground">New signups</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartUsers} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip {...chartTooltipProps} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="Users"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden self-start xl:min-h-0"
              style={
                activityColumnPx != null
                  ? {
                      height: activityColumnPx,
                      maxHeight: activityColumnPx,
                      minHeight: 0,
                    }
                  : undefined
              }
            >
              <div className="admin-card flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-card via-card to-muted/15 dark:to-muted/5">
                <ActivityFeed activities={activities} asCard={false} stretchColumn />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
};

export default Dashboard;
