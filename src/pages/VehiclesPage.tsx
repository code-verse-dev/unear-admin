import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ShieldOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface VehicleRow {
  id: string;
  owner: string;
  make: string;
  model: string;
  year: number;
  status: string;
  restricted: boolean;
  added: string;
  [key: string]: unknown;
}

const mockVehicles: VehicleRow[] = [
  { id: "VEH-001", owner: "Sarah Smith", make: "Tesla", model: "Model 3", year: 2024, status: "Active", restricted: false, added: "2025-11-15" },
  { id: "VEH-002", owner: "John Doe", make: "BMW", model: "X5", year: 2023, status: "Under Review", restricted: false, added: "2025-12-01" },
  { id: "VEH-003", owner: "Mike Johnson", make: "Toyota", model: "Camry", year: 2022, status: "Active", restricted: true, added: "2025-10-20" },
  { id: "VEH-004", owner: "Emily Chen", make: "Honda", model: "Civic", year: 2024, status: "Inactive", restricted: false, added: "2026-01-05" },
];

const columns: Column<VehicleRow>[] = [
  { key: "id", header: "Vehicle ID" },
  { key: "owner", header: "Owner" },
  { key: "make", header: "Make" },
  { key: "model", header: "Model" },
  { key: "year", header: "Year" },
  {
    key: "status", header: "Status",
    render: (row) => (
      <StatusBadge variant={row.status === "Active" ? "success" : row.status === "Under Review" ? "warning" : "default"}>
        {row.status}
      </StatusBadge>
    ),
  },
  {
    key: "restricted", header: "Restricted",
    render: (row) => <Switch checked={row.restricted} />,
  },
  { key: "added", header: "Added" },
  {
    key: "actions", header: "Actions",
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info"><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
      </div>
    ),
  },
];

const VehiclesPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockVehicles.filter((v) => {
    if (search && !v.make.toLowerCase().includes(search.toLowerCase()) && !v.model.toLowerCase().includes(search.toLowerCase()) && !v.owner.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && v.status.toLowerCase().replace(" ", "-") !== statusFilter) return false;
    return true;
  });

  return (
    <PageContainer title="Vehicles" subtitle="Manage platform vehicles">
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search vehicles..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={[{
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Under Review", value: "under-review" },
              { label: "Inactive", value: "inactive" },
            ],
          }]}
          onReset={() => { setSearch(""); setStatusFilter("all"); }}
        />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={2} onPageChange={() => {}} />
    </PageContainer>
  );
};

export default VehiclesPage;
