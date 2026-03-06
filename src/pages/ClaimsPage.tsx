import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X, DollarSign, Paperclip } from "lucide-react";

interface ClaimRow {
  id: string;
  bookingId: string;
  host: string;
  expenseType: string;
  amount: string;
  status: string;
  submitted: string;
  [key: string]: unknown;
}

const mockClaims: ClaimRow[] = [
  { id: "CLM-001", bookingId: "BK-2041", host: "Sarah Smith", expenseType: "Damage", amount: "$450.00", status: "Pending", submitted: "2026-02-15" },
  { id: "CLM-002", bookingId: "BK-2035", host: "John Doe", expenseType: "Cleaning", amount: "$75.00", status: "Approved", submitted: "2026-02-10" },
  { id: "CLM-003", bookingId: "BK-2028", host: "Mike Johnson", expenseType: "Fuel", amount: "$120.00", status: "Paid", submitted: "2026-02-05" },
  { id: "CLM-004", bookingId: "BK-2022", host: "Emily Chen", expenseType: "Toll Reimbursement", amount: "$35.50", status: "Rejected", submitted: "2026-01-28" },
];

const statusVariant = (s: string) => {
  switch (s) {
    case "Approved": return "info";
    case "Paid": return "success";
    case "Rejected": return "destructive";
    default: return "warning";
  }
};

const columns: Column<ClaimRow>[] = [
  { key: "id", header: "Claim ID" },
  { key: "bookingId", header: "Booking ID" },
  { key: "host", header: "Host" },
  { key: "expenseType", header: "Expense Type" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={statusVariant(r.status) as any}>{r.status}</StatusBadge> },
  { key: "submitted", header: "Submitted" },
  {
    key: "actions", header: "Actions",
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-success"><Check className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info"><DollarSign className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Paperclip className="w-4 h-4" /></Button>
      </div>
    ),
  },
];

const ClaimsPage = () => {
  const [search, setSearch] = useState("");

  const filtered = mockClaims.filter((c) => {
    if (search && !c.host.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageContainer title="Claims" subtitle="Manage expense claims submitted by hosts">
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search claims..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />
    </PageContainer>
  );
};

export default ClaimsPage;
