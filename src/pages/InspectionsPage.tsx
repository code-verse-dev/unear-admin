import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar } from "lucide-react";

interface InspectionRow {
  id: string;
  vehicle: string;
  host: string;
  location: string;
  requested: string;
  status: string;
  [key: string]: unknown;
}

const mockInspections: InspectionRow[] = [
  { id: "INS-001", vehicle: "Tesla Model 3", host: "Sarah Smith", location: "Los Angeles, CA", requested: "2026-03-01", status: "Pending" },
  { id: "INS-002", vehicle: "BMW X5", host: "John Doe", location: "San Francisco, CA", requested: "2026-02-28", status: "Scheduled" },
  { id: "INS-003", vehicle: "Toyota Camry", host: "Mike Johnson", location: "Austin, TX", requested: "2026-02-20", status: "Completed" },
  { id: "INS-004", vehicle: "Honda Civic", host: "Emily Chen", location: "Seattle, WA", requested: "2026-02-15", status: "Rejected" },
];

const statusVariant = (s: string) => {
  switch (s) {
    case "Completed": return "success";
    case "Scheduled": return "info";
    case "Rejected": return "destructive";
    default: return "warning";
  }
};

const columns: Column<InspectionRow>[] = [
  { key: "id", header: "Inspection ID" },
  { key: "vehicle", header: "Vehicle" },
  { key: "host", header: "Host" },
  { key: "location", header: "Location" },
  { key: "requested", header: "Requested Date" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={statusVariant(r.status) as any}>{r.status}</StatusBadge> },
  {
    key: "actions", header: "Actions",
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-success"><Check className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info"><Calendar className="w-4 h-4" /></Button>
      </div>
    ),
  },
];

const InspectionsPage = () => {
  const [search, setSearch] = useState("");

  const filtered = mockInspections.filter((i) => {
    if (search && !i.vehicle.toLowerCase().includes(search.toLowerCase()) && !i.host.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageContainer title="Inspection Requests" subtitle="Vehicle inspection management">
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search inspections..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />
    </PageContainer>
  );
};

export default InspectionsPage;
