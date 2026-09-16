import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable, { Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import SearchFilter from "@/components/SearchFilter";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  HOST_CHARGE_TYPES_PAGE_SIZE_DEFAULT,
  type AdminHostChargeType,
  type WindowUnit,
} from "@/api/adminHostChargeTypes";
import {
  useCreateHostChargeTypeMutation,
  useDeleteHostChargeTypeMutation,
  useHostChargeTypesListQuery,
  useUpdateHostChargeTypeMutation,
} from "@/hooks/useAdminHostChargeTypes";
import { cn } from "@/lib/utils";

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";
const deleteIconButtonClass =
  "h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors";

type FormState = {
  name: string;
  description: string;
  base_price: string;
  window_value: string;
  window_unit: WindowUnit;
  for_host: boolean;
  for_guest: boolean;
  is_active: boolean;
  sort_order: string;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  base_price: "0",
  window_value: "24",
  window_unit: "hours",
  for_host: true,
  for_guest: false,
  is_active: true,
  sort_order: "0",
});

function windowLabel(row: AdminHostChargeType) {
  const n = Number(row.window_value) || 0;
  const unit = row.window_unit === "months" ? (n === 1 ? "month" : "months") : n === 1 ? "hour" : "hours";
  return `${n} ${unit}`;
}

function audienceLabel(row: AdminHostChargeType) {
  if (row.for_host && row.for_guest) return "Host + Guest";
  if (row.for_guest) return "Guest";
  return "Host";
}

const HostChargeTypesPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminHostChargeType | null>(null);
  const [deleting, setDeleting] = useState<AdminHostChargeType | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const listParams = useMemo(
    () => ({
      page,
      limit: HOST_CHARGE_TYPES_PAGE_SIZE_DEFAULT,
      orderBy: "sort_order",
      order: "ASC" as const,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, debouncedSearch]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useHostChargeTypesListQuery(listParams);
  const createMut = useCreateHostChargeTypeMutation();
  const updateMut = useUpdateHostChargeTypeMutation();
  const deleteMut = useDeleteHostChargeTypeMutation();

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load charge types", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormSheetOpen(true);
  };

  const openEdit = (row: AdminHostChargeType) => {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description || "",
      base_price: String(row.base_price ?? 0),
      window_value: String(row.window_value ?? 24),
      window_unit: row.window_unit === "months" ? "months" : "hours",
      for_host: !!row.for_host,
      for_guest: !!row.for_guest,
      is_active: row.is_active !== false,
      sort_order: String(row.sort_order ?? 0),
    });
    setFormSheetOpen(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      toast({ title: "Validation", description: "Name is required.", variant: "destructive" });
      return;
    }
    if (!form.for_host && !form.for_guest) {
      toast({
        title: "Validation",
        description: "Select at least one of: show for host, show for guest.",
        variant: "destructive",
      });
      return;
    }
    const body = {
      name,
      description: form.description.trim() || null,
      base_price: Number(form.base_price) || 0,
      window_value: Math.max(1, parseInt(form.window_value, 10) || 24),
      window_unit: form.window_unit,
      for_host: form.for_host,
      for_guest: form.for_guest,
      is_active: form.is_active,
      sort_order: Math.max(0, parseInt(form.sort_order, 10) || 0),
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, body });
        toast({ title: "Charge type updated" });
      } else {
        await createMut.mutateAsync(body);
        toast({ title: "Charge type created" });
      }
      setFormSheetOpen(false);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMut.mutateAsync(deleting.id);
      toast({ title: "Charge type deleted" });
      setDeleteDialogOpen(false);
      setDeleting(null);
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminHostChargeType>[] = [
    { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs tabular-nums">{r.id}</span> },
    {
      key: "name",
      header: "Name",
      className: "min-w-[160px]",
      render: (r) => (
        <div>
          <div className="font-medium leading-snug">{r.name}</div>
          <div className="text-xs text-muted-foreground">{r.slug}</div>
        </div>
      ),
    },
    {
      key: "window",
      header: "Window",
      render: (r) => <span className="text-sm">{windowLabel(r)}</span>,
    },
    {
      key: "base_price",
      header: "Min $",
      render: (r) => <span className="tabular-nums">${Number(r.base_price || 0).toFixed(2)}</span>,
    },
    {
      key: "audience",
      header: "Shown to",
      render: (r) => <span className="text-sm">{audienceLabel(r)}</span>,
    },
    {
      key: "is_active",
      header: "Active",
      render: (r) => (
        <span className={cn("text-sm", r.is_active ? "text-foreground" : "text-muted-foreground")}>
          {r.is_active ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className={actionIconButtonClass} onClick={() => openEdit(row)} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={deleteIconButtonClass}
            onClick={() => {
              setDeleting(row);
              setDeleteDialogOpen(true);
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <PageContainer
      fullWidth
      title="Host charge types"
      subtitle="Fees a host or guest can file after a trip. Set the time window, minimum amount, and who sees each type."
      actions={
        <Button className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add type
        </Button>
      }
    >
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by name…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
            setPage(1);
          }}
        />
        {isError ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>

      <div className="relative w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <DataTable
          columns={columns}
          data={rows}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          pageSize={HOST_CHARGE_TYPES_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          emptyMessage={isError ? "Could not load charge types." : "No charge types yet."}
        />
      </div>

      <Sheet open={formSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent
          side="right"
          className={cn("flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-lg")}
        >
          <SheetDescription className="sr-only">
            {editing ? "Edit charge type" : "Create a charge type"}
          </SheetDescription>
          <SheetTitle className="sr-only">{editing ? "Edit charge type" : "Add charge type"}</SheetTitle>
          <div className="shrink-0 border-b border-border px-6 py-4 pt-14 sm:pt-6">
            <h2 className="text-lg font-semibold text-foreground">
              {editing ? "Edit charge type" : "Add charge type"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Windows are elapsed time from return (UTC). Hours stay exact; months use UTC calendar months.
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="ct-name">Name</Label>
              <Input
                id="ct-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Cleaning fee"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-desc">Description</Label>
              <Textarea
                id="ct-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct-price">Minimum amount ($)</Label>
                <Input
                  id="ct-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.base_price}
                  onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-sort">Sort order</Label>
                <Input
                  id="ct-sort"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct-window">Window</Label>
                <Input
                  id="ct-window"
                  type="number"
                  min={1}
                  value={form.window_value}
                  onChange={(e) => setForm((f) => ({ ...f, window_value: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select
                  value={form.window_unit}
                  onValueChange={(v) => setForm((f) => ({ ...f, window_unit: v as WindowUnit }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Show in app</p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.for_host}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, for_host: v === true }))}
                />
                Host
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.for_guest}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, for_guest: v === true }))}
                />
                Guest
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v === true }))}
                />
                Active
              </label>
            </div>
          </div>
          <SheetFooter className="flex-col gap-2 border-t border-border bg-background p-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setFormSheetOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {editing ? "Save changes" : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this charge type?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `${deleting.name} will be hidden. Existing claims keep their type.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default HostChargeTypesPage;
