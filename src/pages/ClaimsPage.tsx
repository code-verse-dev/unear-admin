import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X, DollarSign, Paperclip, Eye, Trash2, Edit, Loader2 } from "lucide-react";
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

interface ClaimRow {
  id: string;
  bookingId: string;
  host: string;
  expenseType: string;
  amount: string;
  status: string;
  submitted: string;
  notes: string;
  [key: string]: unknown;
}

const formatDateUS = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

const initialClaims: ClaimRow[] = [
  { id: "CLM-001", bookingId: "BK-2041", host: "Sarah Smith", expenseType: "Damage", amount: "$450.00", status: "Pending", submitted: "2026-02-15", notes: "" },
  { id: "CLM-002", bookingId: "BK-2035", host: "John Doe", expenseType: "Cleaning", amount: "$75.00", status: "Approved", submitted: "2026-02-10", notes: "" },
  { id: "CLM-003", bookingId: "BK-2028", host: "Mike Johnson", expenseType: "Fuel", amount: "$120.00", status: "Paid", submitted: "2026-02-05", notes: "" },
  { id: "CLM-004", bookingId: "BK-2022", host: "Emily Chen", expenseType: "Toll Reimbursement", amount: "$35.50", status: "Rejected", submitted: "2026-01-28", notes: "Insufficient documentation" },
];

const statusVariant = (s: string) => {
  switch (s) {
    case "Approved": return "info";
    case "Paid": return "success";
    case "Rejected": return "destructive";
    default: return "warning";
  }
};

const ClaimsPage = () => {
  const [claims, setClaims] = useState<ClaimRow[]>(initialClaims);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ClaimRow | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", expenseType: "", notes: "" });
  const [loading, setLoading] = useState<string | null>(null);

  const simulateAsync = (cb: () => void, id: string) => {
    setLoading(id);
    setTimeout(() => {
      cb();
      setLoading(null);
    }, 500);
  };

  const handleApprove = (row: ClaimRow) => {
    simulateAsync(() => {
      setClaims((prev) => prev.map((c) => c.id === row.id ? { ...c, status: "Approved" } : c));
      toast({ title: "Approved", description: `${row.id} has been approved.` });
    }, `approve-${row.id}`);
  };

  const handleReject = (row: ClaimRow) => {
    simulateAsync(() => {
      setClaims((prev) => prev.map((c) => c.id === row.id ? { ...c, status: "Rejected" } : c));
      toast({ title: "Rejected", description: `${row.id} has been rejected.`, variant: "destructive" });
    }, `reject-${row.id}`);
  };

  const handleMarkPaid = (row: ClaimRow) => {
    simulateAsync(() => {
      setClaims((prev) => prev.map((c) => c.id === row.id ? { ...c, status: "Paid" } : c));
      toast({ title: "Marked as Paid", description: `${row.id} payment processed.` });
    }, `pay-${row.id}`);
  };

  const handleEdit = () => {
    if (!selected) return;
    simulateAsync(() => {
      setClaims((prev) => prev.map((c) => c.id === selected.id ? { ...c, amount: editForm.amount || c.amount, expenseType: editForm.expenseType || c.expenseType, notes: editForm.notes } : c));
      toast({ title: "Updated", description: `${selected.id} has been updated.` });
      setEditOpen(false);
    }, `edit-${selected.id}`);
  };

  const handleDelete = () => {
    if (!selected) return;
    simulateAsync(() => {
      setClaims((prev) => prev.filter((c) => c.id !== selected.id));
      toast({ title: "Deleted", description: `${selected.id} has been removed.` });
      setDeleteOpen(false);
    }, `delete-${selected.id}`);
  };

  const columns: Column<ClaimRow>[] = [
    { key: "id", header: "Claim ID" },
    { key: "bookingId", header: "Booking ID" },
    { key: "host", header: "Host" },
    { key: "expenseType", header: "Expense Type" },
    { key: "amount", header: "Amount" },
    { key: "status", header: "Status", render: (r) => <StatusBadge variant={statusVariant(r.status) as any}>{r.status}</StatusBadge> },
    { key: "submitted", header: "Submitted", render: (r) => <span>{formatDateUS(r.submitted)}</span> },
    {
      key: "actions", header: "Actions",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setSelected(row); setViewOpen(true); }} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info" onClick={() => { setSelected(row); setEditForm({ amount: row.amount, expenseType: row.expenseType, notes: row.notes }); setEditOpen(true); }} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          {row.status === "Pending" && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-success" onClick={() => handleApprove(row)} disabled={loading === `approve-${row.id}`} title="Approve">
                {loading === `approve-${row.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleReject(row)} disabled={loading === `reject-${row.id}`} title="Reject">
                {loading === `reject-${row.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </Button>
            </>
          )}
          {row.status === "Approved" && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-success" onClick={() => handleMarkPaid(row)} disabled={loading === `pay-${row.id}`} title="Mark as Paid">
              {loading === `pay-${row.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setSelected(row); setDeleteOpen(true); }} title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filtered = claims.filter((c) => {
    if (search && !c.host.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.bookingId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageContainer title="Claims" subtitle="Manage expense claims submitted by hosts">
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search claims..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>Details for {selected?.id}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-muted-foreground">Claim ID:</span> {selected.id}</div>
              <div><span className="font-medium text-muted-foreground">Booking:</span> {selected.bookingId}</div>
              <div><span className="font-medium text-muted-foreground">Host:</span> {selected.host}</div>
              <div><span className="font-medium text-muted-foreground">Expense:</span> {selected.expenseType}</div>
              <div><span className="font-medium text-muted-foreground">Amount:</span> {selected.amount}</div>
              <div><span className="font-medium text-muted-foreground">Submitted:</span> {formatDateUS(selected.submitted)}</div>
              <div className="col-span-2"><span className="font-medium text-muted-foreground">Status:</span> <StatusBadge variant={statusVariant(selected.status) as any}>{selected.status}</StatusBadge></div>
              {selected.notes && <div className="col-span-2"><span className="font-medium text-muted-foreground">Notes:</span> {selected.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Claim</DialogTitle>
            <DialogDescription>Update {selected?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount</Label>
              <Input value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
            </div>
            <div>
              <Label>Expense Type</Label>
              <Select value={editForm.expenseType} onValueChange={(v) => setEditForm({ ...editForm, expenseType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Damage">Damage</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Fuel">Fuel</SelectItem>
                  <SelectItem value="Toll Reimbursement">Toll Reimbursement</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Add notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={loading === `edit-${selected?.id}`}>
              {loading === `edit-${selected?.id}` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Claim?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove {selected?.id}. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading === `delete-${selected?.id}` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default ClaimsPage;
