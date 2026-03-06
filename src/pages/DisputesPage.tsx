import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, RefreshCw } from "lucide-react";

interface DisputeRow {
  id: string;
  bookingId: string;
  guest: string;
  host: string;
  issueType: string;
  status: string;
  created: string;
  [key: string]: unknown;
}

const mockDisputes: DisputeRow[] = [
  { id: "DSP-001", bookingId: "BK-2041", guest: "John Doe", host: "Sarah Smith", issueType: "Vehicle Condition", status: "Open", created: "2026-03-01" },
  { id: "DSP-002", bookingId: "BK-2035", guest: "Alex Wilson", host: "Mike Johnson", issueType: "Late Return", status: "Under Review", created: "2026-02-28" },
  { id: "DSP-003", bookingId: "BK-2028", guest: "Emily Chen", host: "John Doe", issueType: "Billing Issue", status: "Resolved", created: "2026-02-20" },
];

const statusVariant = (s: string) => {
  switch (s) {
    case "Resolved": return "success";
    case "Under Review": return "warning";
    default: return "destructive";
  }
};

const columns: Column<DisputeRow>[] = [
  { key: "id", header: "Dispute ID" },
  { key: "bookingId", header: "Booking ID" },
  { key: "guest", header: "Guest" },
  { key: "host", header: "Host" },
  { key: "issueType", header: "Issue Type" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={statusVariant(r.status) as any}>{r.status}</StatusBadge> },
  { key: "created", header: "Created" },
  {
    key: "actions", header: "Actions",
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-success"><CheckCircle className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info"><RefreshCw className="w-4 h-4" /></Button>
      </div>
    ),
  },
];

const DisputesPage = () => {
  const [search, setSearch] = useState("");

  const filtered = mockDisputes.filter((d) => {
    if (search && !d.guest.toLowerCase().includes(search.toLowerCase()) && !d.host.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageContainer title="Dispute Requests" subtitle="Manage platform disputes">
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search disputes..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />
    </PageContainer>
  );
};

export default DisputesPage;
