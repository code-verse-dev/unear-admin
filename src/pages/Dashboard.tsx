import { useState } from "react";
import {
  Users,
  Car,
  MapPin,
  DollarSign,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import ActivityFeed, { ActivityItem } from "@/components/ActivityFeed";
import PageContainer from "@/components/PageContainer";
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
} from "recharts";

const tripData = [
  { day: "Mon", trips: 45 },
  { day: "Tue", trips: 62 },
  { day: "Wed", trips: 58 },
  { day: "Thu", trips: 71 },
  { day: "Fri", trips: 89 },
  { day: "Sat", trips: 95 },
  { day: "Sun", trips: 78 },
];

const revenueData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5100 },
  { month: "Mar", revenue: 4800 },
  { month: "Apr", revenue: 6300 },
  { month: "May", revenue: 7200 },
  { month: "Jun", revenue: 6800 },
];

const userRegData = [
  { week: "W1", users: 12 },
  { week: "W2", users: 18 },
  { week: "W3", users: 24 },
  { week: "W4", users: 15 },
  { week: "W5", users: 32 },
  { week: "W6", users: 28 },
];

const activities: ActivityItem[] = [
  { id: "1", message: "New user John Doe registered", time: "5 min ago", type: "user" },
  { id: "2", message: "Vehicle Tesla Model 3 added by Sarah", time: "12 min ago", type: "vehicle" },
  { id: "3", message: "Dispute #1042 submitted by Mike", time: "25 min ago", type: "dispute" },
  { id: "4", message: "Inspection requested for BMW X5", time: "1 hour ago", type: "inspection" },
  { id: "5", message: "Trip #3021 completed successfully", time: "2 hours ago", type: "trip" },
  { id: "6", message: "New user Emily Chen registered", time: "3 hours ago", type: "user" },
];

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" subtitle="Platform overview and analytics">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard title="Total Users" value="1,247" icon={Users} variant="primary" trend={{ value: 12.5, label: "vs last month" }} />
        <MetricCard title="Active Vehicles" value="342" icon={Car} variant="secondary" trend={{ value: 8.2, label: "vs last month" }} />
        <MetricCard title="Total Trips" value="5,891" icon={MapPin} variant="success" trend={{ value: 15.3, label: "vs last month" }} />
        <MetricCard title="Revenue" value="$48.2K" icon={DollarSign} variant="info" trend={{ value: 22.1, label: "vs last month" }} />
        <MetricCard title="Pending Disputes" value="18" icon={AlertTriangle} variant="warning" trend={{ value: -5.2, label: "vs last month" }} />
        <MetricCard title="Inspections" value="24" icon={ClipboardCheck} variant="primary" trend={{ value: 3.8, label: "vs last month" }} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="admin-card">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Trips Per Day</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={tripData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="trips" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-card">
          <h3 className="text-base font-semibold text-card-foreground mb-4">New User Registrations</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userRegData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="users" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ActivityFeed activities={activities} />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
