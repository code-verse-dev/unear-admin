import { Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  message: string;
  time: string;
  type: "user" | "vehicle" | "dispute" | "inspection" | "trip";
}

const typeColors: Record<string, string> = {
  user: "bg-info/10 text-info",
  vehicle: "bg-secondary/10 text-secondary",
  dispute: "bg-warning/10 text-warning",
  inspection: "bg-primary/10 text-primary",
  trip: "bg-success/10 text-success",
};

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  return (
    <div className="admin-card">
      <h3 className="text-base font-semibold text-card-foreground mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${typeColors[item.type]?.split(" ")[0] || "bg-muted"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-card-foreground">{item.message}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
export type { ActivityItem };
