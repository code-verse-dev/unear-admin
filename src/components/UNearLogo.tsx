import unearLogo from "@/assets/unear-logo.png";

const UNearLogo = ({ collapsed = false }: { collapsed?: boolean }) => {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 flex items-center justify-center rounded-lg overflow-hidden">
        <img src={unearLogo} alt="UNear" className="w-full h-full object-cover" />
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
