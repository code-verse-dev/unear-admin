import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "destructive" | "info";
}

const variantStyles: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

const MetricCard = ({ title, value, icon: Icon, trend, variant = "primary" }: MetricCardProps) => {
  return (
    <div className="admin-card flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        {trend && (
          <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-success" : "text-destructive")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </p>
        )}
      </div>
      <div className={cn("metric-icon", variantStyles[variant])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default MetricCard;
