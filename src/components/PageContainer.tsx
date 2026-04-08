import { ReactNode } from "react";

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
      className={`p-6 w-full min-w-0 ${fullWidth ? "max-w-none" : "max-w-[1400px] mx-auto"}`}
    >
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

export default PageContainer;
