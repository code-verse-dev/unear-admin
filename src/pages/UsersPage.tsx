import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Ban, Edit, History } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  verification: string;
  status: string;
  registered: string;
  [key: string]: unknown;
}

const mockUsers: UserRow[] = [
  { id: "USR-001", name: "John Doe", email: "john@example.com", phone: "+1 234 567 890", verification: "Verified", status: "Active", registered: "2025-12-01" },
  { id: "USR-002", name: "Sarah Smith", email: "sarah@example.com", phone: "+1 234 567 891", verification: "Pending", status: "Active", registered: "2025-12-05" },
  { id: "USR-003", name: "Mike Johnson", email: "mike@example.com", phone: "+1 234 567 892", verification: "Verified", status: "Blocked", registered: "2025-11-20" },
  { id: "USR-004", name: "Emily Chen", email: "emily@example.com", phone: "+1 234 567 893", verification: "Verified", status: "Active", registered: "2026-01-10" },
  { id: "USR-005", name: "Alex Wilson", email: "alex@example.com", phone: "+1 234 567 894", verification: "Rejected", status: "Active", registered: "2026-01-15" },
];

const columns: Column<UserRow>[] = [
  { key: "id", header: "User ID" },
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  {
    key: "verification",
    header: "Verification",
    render: (row) => (
      <StatusBadge variant={row.verification === "Verified" ? "success" : row.verification === "Pending" ? "warning" : "destructive"}>
        {row.verification}
      </StatusBadge>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <StatusBadge variant={row.status === "Active" ? "success" : "destructive"}>
        {row.status}
      </StatusBadge>
    ),
  },
  { key: "registered", header: "Registered" },
  {
    key: "actions",
    header: "Actions",
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-warning"><Ban className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info"><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-secondary"><History className="w-4 h-4" /></Button>
      </div>
    ),
  },
];

const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const filtered = mockUsers.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && u.status.toLowerCase() !== statusFilter) return false;
    if (verificationFilter !== "all" && u.verification.toLowerCase() !== verificationFilter) return false;
    return true;
  });

  return (
    <PageContainer title="Users" subtitle="Manage platform users">
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search users by name or email..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Blocked", value: "blocked" },
              ],
            },
            {
              label: "Verification",
              value: verificationFilter,
              onChange: setVerificationFilter,
              options: [
                { label: "All", value: "all" },
                { label: "Verified", value: "verified" },
                { label: "Pending", value: "pending" },
                { label: "Rejected", value: "rejected" },
              ],
            },
          ]}
          onReset={() => { setSearch(""); setStatusFilter("all"); setVerificationFilter("all"); }}
        />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={3} onPageChange={() => {}} />
    </PageContainer>
  );
};

export default UsersPage;
