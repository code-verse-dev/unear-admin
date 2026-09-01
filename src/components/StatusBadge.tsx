import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "destructive" | "info" | "default" | "secondary";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-info/10 text-info border-info/20",
  default: "bg-muted text-muted-foreground border-border",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
};

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const StatusBadge = ({ variant = "default", children, className }: StatusBadgeProps) => {
  return (
    <span className={cn(
      "inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium border",
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default StatusBadge;
