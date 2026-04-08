import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  INSPECTIONS_PAGE_SIZE_DEFAULT,
  INSPECTION_REQUEST_STATUS,
  formatInspectionAvailability,
  inspectionReportHref,
  type AdminInspectionRequest,
  type InspectionRequestsListParams,
} from "@/api/inspectionRequests";
import {
  useInspectionRequestDetailQuery,
  useInspectionRequestsListQuery,
  useUpdateInspectionRequestMutation,
} from "@/hooks/useAdminInspectionRequests";
import { cn } from "@/lib/utils";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

const formatDateUS = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

function accountUserLabel(r: AdminInspectionRequest): string {
  const u = r.user;
  if (!u) return `User #${r.user_id}`;
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || `User #${u.id}`;
}

function inspectionStatusLabel(s: number): string {
  if (s === INSPECTION_REQUEST_STATUS.UNPAID) return "Unpaid";
  if (s === INSPECTION_REQUEST_STATUS.REQUESTED) return "Requested";
  if (s === INSPECTION_REQUEST_STATUS.COMPLETED) return "Completed";
  if (s === INSPECTION_REQUEST_STATUS.CANCELLED) return "Cancelled";
  return `Status ${s}`;
}

function inspectionStatusVariant(
  s: number
): "success" | "warning" | "destructive" | "default" | "secondary" | "info" {
  if (s === INSPECTION_REQUEST_STATUS.COMPLETED) return "success";
  if (s === INSPECTION_REQUEST_STATUS.CANCELLED) return "destructive";
  if (s === INSPECTION_REQUEST_STATUS.UNPAID) return "warning";
  if (s === INSPECTION_REQUEST_STATUS.REQUESTED) return "info";
  return "secondary";
}

function truncateId(id: string, max = 18) {
  if (!id || id.length <= max) return id || "—";
  return `${id.slice(0, max)}…`;
}

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

const InspectionsPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<AdminInspectionRequest | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("");

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const listParams = useMemo(() => {
    const p: InspectionRequestsListParams = {
      page,
      limit: INSPECTIONS_PAGE_SIZE_DEFAULT,
      orderBy: "id",
      order: "DESC",
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter !== "all") {
      const n = parseInt(statusFilter, 10);
      if (!Number.isNaN(n)) p.status = n;
    }
    return p;
  }, [page, debouncedSearch, statusFilter]);

  const { data, isLoading, isFetching, isError, error, refetch } = useInspectionRequestsListQuery(listParams);
  const updateMut = useUpdateInspectionRequestMutation();

  const detailId = sheetOpen && selected ? selected.id : 0;
  const detailQuery = useInspectionRequestDetailQuery(detailId, sheetOpen);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "Failed to load inspection requests",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (sheetOpen && detailQuery.data) {
      setStatusDraft(String(detailQuery.data.status));
    }
  }, [sheetOpen, detailQuery.data]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openSheet = (row: AdminInspectionRequest) => {
    setSelected(row);
    setStatusDraft(String(row.status));
    setSheetOpen(true);
  };

  const displayRow = detailQuery.data ?? selected;

  const saveStatus = async () => {
    if (!displayRow) return;
    const next = parseInt(statusDraft, 10);
    if (Number.isNaN(next)) return;
    if (next === displayRow.status) {
      toast({ title: "No changes", description: "Status is already set to this value." });
      return;
    }
    try {
      const updated = await updateMut.mutateAsync({ id: displayRow.id, body: { status: next } });
      setSelected(updated);
      toast({ title: "Inspection updated", description: `Request #${updated.id}` });
      await detailQuery.refetch();
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminInspectionRequest>[] = [
    { key: "id", header: "ID", render: (row) => <span className="font-mono text-xs">{row.id}</span> },
    {
      key: "car_name",
      header: "Vehicle",
      className: "min-w-[120px]",
      render: (row) => (
        <div className="text-sm">
          <div className="font-medium leading-tight">{row.car_name}</div>
          <div className="text-xs text-muted-foreground">
            {row.model} · {row.color}
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (row) => <span className="text-sm text-muted-foreground">{accountUserLabel(row)}</span>,
    },
    { key: "car_type", header: "Type", render: (row) => <span className="text-sm">{row.car_type}</span> },
    {
      key: "charges",
      header: "Charges",
      render: (row) => <span className="tabular-nums text-sm font-medium">{money(row.charges)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge variant={inspectionStatusVariant(row.status)}>{inspectionStatusLabel(row.status)}</StatusBadge>
      ),
    },
    {
      key: "createdAt",
      header: "Submitted",
      render: (row) => <span>{formatDateUS(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          className={actionIconButtonClass}
          onClick={() => openSheet(row)}
          title="View"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const reportHref = displayRow ? inspectionReportHref(displayRow.report_url) : null;

  return (
    <PageContainer fullWidth title="Inspection Requests" subtitle="Review vehicle inspection requests and status">
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by id, vehicle, model, color, type, payment id, horsepower, or user name…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All statuses", value: "all" },
                { label: "Unpaid", value: String(INSPECTION_REQUEST_STATUS.UNPAID) },
                { label: "Requested", value: String(INSPECTION_REQUEST_STATUS.REQUESTED) },
                { label: "Completed", value: String(INSPECTION_REQUEST_STATUS.COMPLETED) },
                { label: "Cancelled", value: String(INSPECTION_REQUEST_STATUS.CANCELLED) },
              ],
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
            setStatusFilter("all");
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
          pageSize={INSPECTIONS_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          emptyMessage={isError ? "Could not load inspection requests." : "No requests match your filters."}
        />
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            "flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-3xl"
          )}
        >
          <SheetDescription className="sr-only">Inspection request details</SheetDescription>
          {displayRow ? (
            <SheetTitle className="sr-only">Inspection #{displayRow.id}</SheetTitle>
          ) : (
            <SheetTitle className="sr-only">Inspection details</SheetTitle>
          )}
          {displayRow ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-4 flex items-start justify-between gap-2 pr-2">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Inspection #{displayRow.id}</h2>
                    <p className="text-sm text-muted-foreground">Vehicle inspection request</p>
                  </div>
                  {detailQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  ) : null}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Account user</span>
                      <div className="font-medium leading-tight">{accountUserLabel(displayRow)}</div>
                      <p className="text-xs text-muted-foreground">User #{displayRow.user_id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Vehicle name</span>
                      <div className="font-medium">{displayRow.car_name}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Model / color</span>
                      <div>
                        {displayRow.model} · {displayRow.color}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Car type</span>
                      <div>{displayRow.car_type}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Horsepower</span>
                      <div className="tabular-nums">{displayRow.horsepower}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Charges</span>
                      <div className="font-semibold tabular-nums">{money(displayRow.charges)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <div className="mt-0.5">
                        <StatusBadge variant={inspectionStatusVariant(displayRow.status)}>
                          {inspectionStatusLabel(displayRow.status)}
                        </StatusBadge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Submitted</span>
                      <div>{formatDateUS(displayRow.createdAt)}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Payment intent</span>
                      <div className="break-all font-mono text-xs" title={displayRow.payment_intent_id}>
                        {truncateId(displayRow.payment_intent_id, 36)}
                      </div>
                    </div>
                    {reportHref ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Report</span>
                        <div className="mt-1">
                          <a
                            href={reportHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            Open report <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        </div>
                      </div>
                    ) : null}
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Availability</span>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-xs">
                        {formatInspectionAvailability(displayRow.availability)}
                      </pre>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <Label htmlFor="inspection-status" className="text-xs text-muted-foreground">
                      Update status
                    </Label>
                    <Select value={statusDraft} onValueChange={setStatusDraft}>
                      <SelectTrigger id="inspection-status" className="mt-2 w-full sm:max-w-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(INSPECTION_REQUEST_STATUS.UNPAID)}>Unpaid</SelectItem>
                        <SelectItem value={String(INSPECTION_REQUEST_STATUS.REQUESTED)}>Requested</SelectItem>
                        <SelectItem value={String(INSPECTION_REQUEST_STATUS.COMPLETED)}>Completed</SelectItem>
                        <SelectItem value={String(INSPECTION_REQUEST_STATUS.CANCELLED)}>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 border-t border-border bg-background p-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                  Close
                </Button>
                <Button type="button" disabled={updateMut.isPending} onClick={() => void saveStatus()}>
                  {updateMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  Save status
                </Button>
              </SheetFooter>
            </>
          ) : detailQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
};

export default InspectionsPage;
