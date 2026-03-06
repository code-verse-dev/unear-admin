import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

interface TransactionRow {
  id: string;
  bookingId: string;
  user: string;
  amount: string;
  fee: string;
  method: string;
  status: string;
  date: string;
  [key: string]: unknown;
}

const mockTransactions: TransactionRow[] = [
  { id: "TXN-001", bookingId: "BK-2041", user: "John Doe", amount: "$250.00", fee: "$25.00", method: "Credit Card", status: "Completed", date: "2026-03-01" },
  { id: "TXN-002", bookingId: "BK-2038", user: "Sarah Smith", amount: "$180.00", fee: "$18.00", method: "PayPal", status: "Pending", date: "2026-03-02" },
  { id: "TXN-003", bookingId: "BK-2035", user: "Mike Johnson", amount: "$320.00", fee: "$32.00", method: "Credit Card", status: "Refunded", date: "2026-02-28" },
  { id: "TXN-004", bookingId: "BK-2030", user: "Emily Chen", amount: "$95.00", fee: "$9.50", method: "Debit Card", status: "Completed", date: "2026-02-25" },
];

const statusVariant = (s: string) => {
  switch (s) {
    case "Completed": return "success";
    case "Refunded": return "info";
    default: return "warning";
  }
};

const columns: Column<TransactionRow>[] = [
  { key: "id", header: "Transaction ID" },
  { key: "bookingId", header: "Booking ID" },
  { key: "user", header: "User" },
  { key: "amount", header: "Amount" },
  { key: "fee", header: "Fee" },
  { key: "method", header: "Payment Method" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={statusVariant(r.status) as any}>{r.status}</StatusBadge> },
  { key: "date", header: "Date" },
];

const TransactionsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockTransactions.filter((t) => {
    if (search && !t.user.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status.toLowerCase() !== statusFilter) return false;
    return true;
  });

  return (
    <PageContainer title="Transactions" subtitle="Financial transaction history">
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search transactions..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={[{
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All", value: "all" },
              { label: "Completed", value: "completed" },
              { label: "Pending", value: "pending" },
              { label: "Refunded", value: "refunded" },
            ],
          }]}
          onReset={() => { setSearch(""); setStatusFilter("all"); }}
        />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={2} onPageChange={() => {}} />
    </PageContainer>
  );
};

export default TransactionsPage;
