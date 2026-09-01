import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Loader2, Trash2 } from "lucide-react";
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
  DISPUTES_PAGE_SIZE_DEFAULT,
  DISPUTE_REQUEST_STATUS,
  disputeAttachmentUrls,
  firstDisputeImageUrl,
  type AdminDisputeRequest,
  type DisputeRequestsListParams,
} from "@/api/disputeRequests";
import {
  useDeleteDisputeRequestMutation,
  useDisputeRequestDetailQuery,
  useDisputeRequestsListQuery,
  useUpdateDisputeRequestMutation,
} from "@/hooks/useAdminDisputeRequests";
import { cn } from "@/lib/utils";

const formatDateUS = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

function accountUserLabel(d: AdminDisputeRequest): string {
  const u = d.user;
  if (!u) return `User #${d.user_id}`;
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || `User #${u.id}`;
}

function disputeStatusLabel(s: number): string {
  if (s === DISPUTE_REQUEST_STATUS.REQUESTED) return "Awaiting Support";
  if (s === DISPUTE_REQUEST_STATUS.COMPLETED) return "Accepted";
  if (s === DISPUTE_REQUEST_STATUS.CANCELLED) return "Rejected";
  return `Status ${s}`;
}

function disputeStatusVariant(
  s: number
): "success" | "warning" | "destructive" | "default" | "secondary" | "info" {
  if (s === DISPUTE_REQUEST_STATUS.COMPLETED) return "success";
  if (s === DISPUTE_REQUEST_STATUS.CANCELLED) return "destructive";
  if (s === DISPUTE_REQUEST_STATUS.REQUESTED) return "warning";
  return "secondary";
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i;

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

const DisputesPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<AdminDisputeRequest | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const listParams = useMemo(() => {
    const p: DisputeRequestsListParams = {
      page,
      limit: DISPUTES_PAGE_SIZE_DEFAULT,
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

  const { data, isLoading, isFetching, isError, error, refetch } = useDisputeRequestsListQuery(listParams);
  const updateMut = useUpdateDisputeRequestMutation();
  const deleteMut = useDeleteDisputeRequestMutation();

  const detailId = sheetOpen && selected ? selected.id : 0;
  const detailQuery = useDisputeRequestDetailQuery(detailId, sheetOpen);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load disputes", description: error.message, variant: "destructive" });
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

  const openSheet = (row: AdminDisputeRequest) => {
    setSelected(row);
    setStatusDraft(String(row.status));
    setSheetOpen(true);
  };

  const displayDispute = detailQuery.data ?? selected;

  const confirmDeleteDispute = async () => {
    if (!displayDispute) return;
    const id = displayDispute.id;
    try {
      await deleteMut.mutateAsync(id);
      setDeleteDialogOpen(false);
      setSheetOpen(false);
      setSelected(null);
      toast({ title: "Dispute deleted", description: `Ticket #${id} was removed.` });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const saveStatus = async () => {
    if (!displayDispute) return;
    const next = parseInt(statusDraft, 10);
    if (Number.isNaN(next)) return;
    if (next === displayDispute.status) {
      toast({ title: "No changes", description: "Status is already set to this value." });
      return;
    }
    try {
      const updated = await updateMut.mutateAsync({ id: displayDispute.id, body: { status: next } });
      setSelected(updated);
      toast({ title: "Dispute updated", description: `Ticket #${updated.id}` });
      await detailQuery.refetch();
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminDisputeRequest>[] = [
    {
      key: "id",
      header: "Ticket",
      render: (row) => <span className="font-mono text-xs tabular-nums">Ticket #{row.id}</span>,
    },
    {
      key: "evidence",
      header: "Files",
      className: "w-[88px]",
      render: (row) => {
        const thumb = firstDisputeImageUrl(row);
        const count = disputeAttachmentUrls(row).length;
        if (!thumb) {
          return count > 0 ? (
            <div className="flex h-12 w-[4.5rem] items-center justify-center rounded-lg border border-border bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          );
        }
        const extra = count - 1;
        return (
          <div className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
            {extra > 0 ? (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-background/95 px-1 py-px text-[10px] font-semibold tabular-nums text-foreground shadow-sm">
                +{extra}
              </span>
            ) : null}
          </div>
        );
      },
    },
    { key: "category", header: "Category", render: (row) => <span className="text-sm">{row.category}</span> },
    {
      key: "full_name",
      header: "Name",
      className: "min-w-[120px]",
      render: (row) => <span className="text-sm font-medium leading-tight">{row.full_name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="truncate text-sm text-muted-foreground">{row.email}</span>,
    },
    {
      key: "transaction_id",
      header: "Txn ref",
      render: (row) => <span className="font-mono text-xs tabular-nums">{row.transaction_id}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge variant={disputeStatusVariant(row.status)}>{disputeStatusLabel(row.status)}</StatusBadge>
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

  const attachments = displayDispute ? disputeAttachmentUrls(displayDispute) : [];

  return (
    <PageContainer fullWidth title="Dispute Requests" subtitle="Review and update platform dispute submissions">
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by id, name, email, phone, category, description, txn ref, or account name…"
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
                { label: "Awaiting Support", value: String(DISPUTE_REQUEST_STATUS.REQUESTED) },
                { label: "Accepted", value: String(DISPUTE_REQUEST_STATUS.COMPLETED) },
                { label: "Rejected", value: String(DISPUTE_REQUEST_STATUS.CANCELLED) },
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
          pageSize={DISPUTES_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          emptyMessage={isError ? "Could not load disputes." : "No disputes match your filters."}
        />
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelected(null);
            setDeleteDialogOpen(false);
          }
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            "flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-3xl"
          )}
        >
          <SheetDescription className="sr-only">Dispute request details</SheetDescription>
          {displayDispute ? (
            <SheetTitle className="sr-only">Ticket #{displayDispute.id}</SheetTitle>
          ) : (
            <SheetTitle className="sr-only">Dispute details</SheetTitle>
          )}
          {displayDispute ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-4 flex items-start justify-between gap-2 pr-2">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Ticket #{displayDispute.id}</h2>
                    <p className="text-sm text-muted-foreground">Submitted dispute request</p>
                  </div>
                  {detailQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  ) : null}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Account user</span>
                      <div className="font-medium leading-tight">{accountUserLabel(displayDispute)}</div>
                      <p className="text-xs text-muted-foreground">User #{displayDispute.user_id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Submitted name</span>
                      <div className="font-medium">{displayDispute.full_name}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Email</span>
                      <div className="truncate">{displayDispute.email}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Phone</span>
                      <div>{displayDispute.phone_number}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Category</span>
                      <div>{displayDispute.category}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <div className="mt-0.5">
                        <StatusBadge variant={disputeStatusVariant(displayDispute.status)}>
                          {disputeStatusLabel(displayDispute.status)}
                        </StatusBadge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Vehicle / year</span>
                      <div>{displayDispute.car_model_year}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Transaction ref</span>
                      <div className="font-mono text-xs tabular-nums">{displayDispute.transaction_id}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Transaction date</span>
                      <div>{formatDateUS(displayDispute.transaction_date)}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Preferred resolution</span>
                      <div className="mt-0.5">{displayDispute.preferred_resolution}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Submitted</span>
                      <div>{formatDateUS(displayDispute.createdAt)}</div>
                    </div>
                    {displayDispute.description ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Description</span>
                        <div className="mt-0.5 whitespace-pre-wrap text-xs">{displayDispute.description}</div>
                      </div>
                    ) : null}
                  </div>

                  {attachments.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Attachments</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {attachments.map((url) =>
                          IMAGE_EXT.test(url) ? (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted outline-none ring-offset-background transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            </a>
                          ) : (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg border border-border p-3 text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="truncate text-xs">Open file</span>
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <Label htmlFor="dispute-status" className="text-xs text-muted-foreground">
                      Update status
                    </Label>
                    <Select value={statusDraft} onValueChange={setStatusDraft}>
                      <SelectTrigger id="dispute-status" className="mt-2 w-full sm:max-w-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(DISPUTE_REQUEST_STATUS.REQUESTED)}>
                          Awaiting Support
                        </SelectItem>
                        <SelectItem value={String(DISPUTE_REQUEST_STATUS.COMPLETED)}>Accepted</SelectItem>
                        <SelectItem value={String(DISPUTE_REQUEST_STATUS.CANCELLED)}>Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 border-t border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:mr-auto"
                  disabled={deleteMut.isPending}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                  Delete
                </Button>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                    Close
                  </Button>
                  <Button type="button" disabled={updateMut.isPending} onClick={() => void saveStatus()}>
                    {updateMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    ) : null}
                    Save status
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : detailQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dispute request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove ticket #{displayDispute?.id} from the list. The record is soft-deleted and will no
              longer appear here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteDispute();
              }}
            >
              {deleteMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default DisputesPage;
