import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Use full width of the main content area (no max-width cap). */
  fullWidth?: boolean;
}

const PageContainer = ({ title, subtitle, actions, children, fullWidth = false }: PageContainerProps) => {
  return (
    <div
      className={cn(
        "w-full min-w-0 px-4 py-5 sm:p-6",
        fullWidth ? "max-w-none" : "mx-auto max-w-[1400px]"
      )}
    >
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="page-title break-words">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

export default PageContainer;
