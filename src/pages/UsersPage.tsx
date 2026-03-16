import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Ban, Edit, Trash2, KeyRound, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

const formatDateUS = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

const initialUsers: UserRow[] = [
  { id: "USR-001", name: "John Doe", email: "john@example.com", phone: "+1 234 567 890", verification: "Verified", status: "Active", registered: "2025-12-01" },
  { id: "USR-002", name: "Sarah Smith", email: "sarah@example.com", phone: "+1 234 567 891", verification: "Pending", status: "Active", registered: "2025-12-05" },
  { id: "USR-003", name: "Mike Johnson", email: "mike@example.com", phone: "+1 234 567 892", verification: "Verified", status: "Blocked", registered: "2025-11-20" },
  { id: "USR-004", name: "Emily Chen", email: "emily@example.com", phone: "+1 234 567 893", verification: "Verified", status: "Active", registered: "2026-01-10" },
  { id: "USR-005", name: "Alex Wilson", email: "alex@example.com", phone: "+1 234 567 894", verification: "Rejected", status: "Active", registered: "2026-01-15" },
];

const UsersPage = () => {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", verification: "Pending", status: "Active" });
  const { toast } = useToast();

  const openView = (u: UserRow) => { setSelectedUser(u); setViewDialogOpen(true); };
  const openEdit = (u: UserRow) => {
    setSelectedUser(u);
    setEditForm({ name: u.name, email: u.email, phone: u.phone, verification: u.verification, status: u.status });
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!selectedUser || !editForm.name.trim() || !editForm.email.trim()) {
      toast({ title: "Validation Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, ...editForm } : u));
    toast({ title: "User Updated", description: `${editForm.name} has been updated.` });
    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    toast({ title: "User Deleted", description: `${selectedUser.name} has been removed.` });
    setDeleteDialogOpen(false);
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    toast({ title: "Password Reset", description: `A password reset link has been sent to ${selectedUser.email}.` });
    setResetDialogOpen(false);
  };

  const toggleStatus = (u: UserRow) => {
    const newStatus = u.status === "Active" ? "Blocked" : "Active";
    setUsers((prev) => prev.map((user) => user.id === u.id ? { ...user, status: newStatus } : user));
    toast({ title: newStatus === "Active" ? "User Activated" : "User Blocked", description: `${u.name} has been ${newStatus.toLowerCase()}.` });
  };

  const columns: Column<UserRow>[] = [
    { key: "id", header: "User ID" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    {
      key: "verification", header: "Verification",
      render: (row) => (
        <StatusBadge variant={row.verification === "Verified" ? "success" : row.verification === "Pending" ? "warning" : "destructive"}>
          {row.verification}
        </StatusBadge>
      ),
    },
    {
      key: "status", header: "Status",
      render: (row) => (
        <StatusBadge variant={row.status === "Active" ? "success" : "destructive"}>
          {row.status}
        </StatusBadge>
      ),
    },
    {
      key: "registered", header: "Registered",
      render: (row) => <span>{formatDateUS(row.registered)}</span>,
    },
    {
      key: "actions", header: "Actions",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info" title="View" onClick={() => openView(row)}><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-secondary" title="Edit" onClick={() => openEdit(row)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-warning" title="Reset Password" onClick={() => { setSelectedUser(row); setResetDialogOpen(true); }}><KeyRound className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" title={row.status === "Active" ? "Block" : "Activate"} onClick={() => toggleStatus(row)}>
            {row.status === "Active" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Delete" onClick={() => { setSelectedUser(row); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  const filtered = users.filter((u) => {
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
              label: "Status", value: statusFilter, onChange: setStatusFilter,
              options: [{ label: "All Status", value: "all" }, { label: "Active", value: "active" }, { label: "Blocked", value: "blocked" }],
            },
            {
              label: "Verification", value: verificationFilter, onChange: setVerificationFilter,
              options: [{ label: "All", value: "all" }, { label: "Verified", value: "verified" }, { label: "Pending", value: "pending" }, { label: "Rejected", value: "rejected" }],
            },
          ]}
          onReset={() => { setSearch(""); setStatusFilter("all"); setVerificationFilter("all"); }}
        />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Viewing details for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-medium text-foreground">{selectedUser.id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{selectedUser.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-foreground">{selectedUser.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium text-foreground">{selectedUser.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Verification</span><StatusBadge variant={selectedUser.verification === "Verified" ? "success" : selectedUser.verification === "Pending" ? "warning" : "destructive"}>{selectedUser.verification}</StatusBadge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge variant={selectedUser.status === "Active" ? "success" : "destructive"}>{selectedUser.status}</StatusBadge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span className="font-medium text-foreground">{formatDateUS(selectedUser.registered)}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Verification</Label>
              <Select value={editForm.verification} onValueChange={(v) => setEditForm({ ...editForm, verification: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirm */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>Send a password reset link to {selectedUser?.email}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} className="bg-primary text-primary-foreground">Send Reset Link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default UsersPage;
