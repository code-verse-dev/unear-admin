import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  /** Short plain line (e.g. “12 in last 30 days”) — no % formatting. */
  hint?: string;
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "destructive" | "info";
}

const variantStyles: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

const MetricCard = ({ title, value, icon: Icon, trend, hint, variant = "primary" }: MetricCardProps) => {
  return (
    <div
      className={cn(
        "admin-card relative flex items-start justify-between overflow-hidden",
        "bg-gradient-to-br from-card via-card to-muted/20 dark:to-muted/5"
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] blur-2xl"
        aria-hidden
      />
      <div className="relative space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="font-['DM_Sans',system-ui,sans-serif] text-3xl font-bold tracking-tight text-card-foreground">
          {value}
        </p>
        {trend ? (
          <p
            className={cn(
              "text-sm font-semibold",
              trend.value > 0.05 && "text-emerald-600 dark:text-emerald-400",
              trend.value < -0.05 && "text-red-600 dark:text-red-400",
              trend.value >= -0.05 &&
                trend.value <= 0.05 &&
                "text-muted-foreground font-medium"
            )}
          >
            {trend.value > 0.05 ? "+" : ""}
            {Math.abs(trend.value) < 0.05 ? "0" : trend.value}% {trend.label}
          </p>
        ) : null}
        {hint ? <p className="text-sm leading-snug text-muted-foreground pt-0.5">{hint}</p> : null}
      </div>
      <div
        className={cn(
          "metric-icon relative h-12 w-12 shrink-0 rounded-xl shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
          variantStyles[variant]
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div>
    </div>
  );
};

export default MetricCard;
