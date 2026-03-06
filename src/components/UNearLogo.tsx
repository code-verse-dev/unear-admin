const UNearLogo = ({ collapsed = false }: { collapsed?: boolean }) => {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="hsl(var(--sidebar-primary))" />
          <path d="M8 22V10C8 8.89543 8.89543 8 10 8H12C13.1046 8 14 8.89543 14 10V22" stroke="hsl(var(--sidebar-primary-foreground))" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 10L18 22V10C18 8.89543 18.8954 8 20 8H22C23.1046 8 24 8.89543 24 10V22" stroke="hsl(var(--sidebar-primary-foreground))" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      {!collapsed && (
        <span className="text-lg font-extrabold tracking-tight font-display text-sidebar-accent-foreground">
          UNEAR
        </span>
      )}
    </div>
  );
};

export default UNearLogo;
