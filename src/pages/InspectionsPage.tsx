import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar, Eye, Trash2, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface InspectionRow {
  id: string;
  vehicle: string;
  host: string;
  location: string;
  requested: string;
  scheduledDate: string;
  status: string;
  [key: string]: unknown;
}

const formatDateUS = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

const initialInspections: InspectionRow[] = [
  { id: "INS-001", vehicle: "Tesla Model 3", host: "Sarah Smith", location: "Los Angeles, CA", requested: "2026-03-01", scheduledDate: "", status: "Pending" },
  { id: "INS-002", vehicle: "BMW X5", host: "John Doe", location: "San Francisco, CA", requested: "2026-02-28", scheduledDate: "2026-03-10", status: "Scheduled" },
  { id: "INS-003", vehicle: "Toyota Camry", host: "Mike Johnson", location: "Austin, TX", requested: "2026-02-20", scheduledDate: "2026-02-25", status: "Completed" },
  { id: "INS-004", vehicle: "Honda Civic", host: "Emily Chen", location: "Seattle, WA", requested: "2026-02-15", scheduledDate: "", status: "Rejected" },
];

const statusVariant = (s: string) => {
  switch (s) {
    case "Completed": return "success";
    case "Scheduled": return "info";
    case "Rejected": return "destructive";
    default: return "warning";
  }
};

const InspectionsPage = () => {
  const [inspections, setInspections] = useState<InspectionRow[]>(initialInspections);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Dialog states
  const [viewOpen, setViewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<InspectionRow | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const simulateAsync = (cb: () => void, id: string) => {
    setLoading(id);
    setTimeout(() => {
      cb();
      setLoading(null);
    }, 500);
  };

  const handleApprove = (row: InspectionRow) => {
    simulateAsync(() => {
      setInspections((prev) => prev.map((i) => i.id === row.id ? { ...i, status: "Scheduled", scheduledDate: new Date().toISOString().split("T")[0] } : i));
      toast({ title: "Approved", description: `${row.id} has been approved and scheduled.` });
    }, `approve-${row.id}`);
  };

  const handleReject = (row: InspectionRow) => {
    simulateAsync(() => {
      setInspections((prev) => prev.map((i) => i.id === row.id ? { ...i, status: "Rejected" } : i));
      toast({ title: "Rejected", description: `${row.id} has been rejected.`, variant: "destructive" });
    }, `reject-${row.id}`);
  };

  const handleSchedule = () => {
    if (!selected || !scheduleDate) return;
    simulateAsync(() => {
      setInspections((prev) => prev.map((i) => i.id === selected.id ? { ...i, status: "Scheduled", scheduledDate: scheduleDate } : i));
      toast({ title: "Scheduled", description: `${selected.id} scheduled for ${formatDateUS(scheduleDate)}.` });
      setScheduleOpen(false);
      setScheduleDate("");
    }, `schedule-${selected.id}`);
  };

  const handleDelete = () => {
    if (!selected) return;
    simulateAsync(() => {
      setInspections((prev) => prev.filter((i) => i.id !== selected.id));
      toast({ title: "Deleted", description: `${selected.id} has been removed.` });
      setDeleteOpen(false);
    }, `delete-${selected.id}`);
  };

  const columns: Column<InspectionRow>[] = [
    { key: "id", header: "Inspection ID" },
    { key: "vehicle", header: "Vehicle" },
    { key: "host", header: "Host" },
    { key: "location", header: "Location" },
    { key: "requested", header: "Requested Date", render: (r) => <span>{formatDateUS(r.requested)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge variant={statusVariant(r.status) as any}>{r.status}</StatusBadge> },
    {
      key: "actions", header: "Actions",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setSelected(row); setViewOpen(true); }} title="View Details">
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === "Pending" && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-success" onClick={() => handleApprove(row)} disabled={loading === `approve-${row.id}`} title="Approve">
                {loading === `approve-${row.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleReject(row)} disabled={loading === `reject-${row.id}`} title="Reject">
                {loading === `reject-${row.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info" onClick={() => { setSelected(row); setScheduleDate(""); setScheduleOpen(true); }} title="Schedule">
                <Calendar className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setSelected(row); setDeleteOpen(true); }} title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filtered = inspections.filter((i) => {
    if (search && !i.vehicle.toLowerCase().includes(search.toLowerCase()) && !i.host.toLowerCase().includes(search.toLowerCase()) && !i.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageContainer title="Inspection Requests" subtitle="Vehicle inspection management">
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search inspections..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
            <DialogDescription>Details for {selected?.id}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-muted-foreground">ID:</span> {selected.id}</div>
              <div><span className="font-medium text-muted-foreground">Vehicle:</span> {selected.vehicle}</div>
              <div><span className="font-medium text-muted-foreground">Host:</span> {selected.host}</div>
              <div><span className="font-medium text-muted-foreground">Location:</span> {selected.location}</div>
              <div><span className="font-medium text-muted-foreground">Requested:</span> {formatDateUS(selected.requested)}</div>
              <div><span className="font-medium text-muted-foreground">Scheduled:</span> {selected.scheduledDate ? formatDateUS(selected.scheduledDate) : "—"}</div>
              <div className="col-span-2"><span className="font-medium text-muted-foreground">Status:</span> <StatusBadge variant={statusVariant(selected.status) as any}>{selected.status}</StatusBadge></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Inspection</DialogTitle>
            <DialogDescription>Set a date for {selected?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Inspection Date</Label>
            <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={!scheduleDate || loading === `schedule-${selected?.id}`}>
              {loading === `schedule-${selected?.id}` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inspection?</AlertDialogTitle>
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

export default InspectionsPage;
