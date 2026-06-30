import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X, DollarSign, Eye, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CLAIMS_PAGE_SIZE_DEFAULT,
  EXPENSE_CLAIM_STATUS,
  EXPENSE_CLAIM_TYPE,
  claimAttachmentUrls,
  firstClaimImageUrl,
  type AdminExpenseClaim,
  type ExpenseClaimsListParams,
} from "@/api/expenseClaims";
import {
  useApproveExpenseClaimMutation,
  useExpenseClaimDetailQuery,
  useExpenseClaimsListQuery,
  useMarkExpenseClaimPaidMutation,
  useRejectExpenseClaimMutation,
  useUpdateExpenseClaimMutation,
} from "@/hooks/useAdminExpenseClaims";
import { cn } from "@/lib/utils";

const formatDateUS = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

function displayUserName(c: AdminExpenseClaim): string {
  const u = c.user;
  if (!u) return `User #${c.user_id}`;
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || u.email || `User #${u.id}`;
}

function expenseTypeLabel(t: number): string {
  switch (t) {
    case EXPENSE_CLAIM_TYPE.DAMAGE_COMPENSATION:
      return "Damage";
    case EXPENSE_CLAIM_TYPE.TOWING_FEES:
      return "Towing";
    case EXPENSE_CLAIM_TYPE.GAS_REIMBURSEMENT:
      return "Gas";
    case EXPENSE_CLAIM_TYPE.TOLL_REIMBURSEMENT:
      return "Toll";
    default:
      return `Type ${t}`;
  }
}

function claimStatusLabel(s: number): string {
  switch (s) {
    case EXPENSE_CLAIM_STATUS.PENDING:
      return "Pending";
    case EXPENSE_CLAIM_STATUS.UNDER_REVIEW:
      return "Under review";
    case EXPENSE_CLAIM_STATUS.APPROVED:
      return "Approved";
    case EXPENSE_CLAIM_STATUS.REJECTED:
      return "Rejected";
    case EXPENSE_CLAIM_STATUS.PAID:
      return "Paid";
    default:
      return `Status ${s}`;
  }
}

function claimStatusVariant(
  s: number
): "success" | "warning" | "destructive" | "default" | "secondary" | "info" {
  if (s === EXPENSE_CLAIM_STATUS.PAID) return "success";
  if (s === EXPENSE_CLAIM_STATUS.APPROVED) return "info";
  if (s === EXPENSE_CLAIM_STATUS.REJECTED) return "destructive";
  if (s === EXPENSE_CLAIM_STATUS.UNDER_REVIEW) return "warning";
  return "secondary";
}

function vehicleSummary(v: AdminExpenseClaim["vehicle"]): string {
  if (!v) return "—";
  const bits = [v.year, v.make, v.model].filter(Boolean);
  return bits.length ? bits.join(" ") : `Vehicle #${v.id}`;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i;

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

const ClaimsPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [claimSheetOpen, setClaimSheetOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState<AdminExpenseClaim | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [notesDraft, setNotesDraft] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  const listParams: ExpenseClaimsListParams = useMemo(() => {
    const p: ExpenseClaimsListParams = {
      page,
      limit: CLAIMS_PAGE_SIZE_DEFAULT,
      orderBy: "id",
      order: "DESC",
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter === "pending") p.status = EXPENSE_CLAIM_STATUS.PENDING;
    else if (statusFilter === "under_review") p.status = EXPENSE_CLAIM_STATUS.UNDER_REVIEW;
    else if (statusFilter === "approved") p.status = EXPENSE_CLAIM_STATUS.APPROVED;
    else if (statusFilter === "rejected") p.status = EXPENSE_CLAIM_STATUS.REJECTED;
    else if (statusFilter === "paid") p.status = EXPENSE_CLAIM_STATUS.PAID;
    if (typeFilter === "damage") p.expense_type = EXPENSE_CLAIM_TYPE.DAMAGE_COMPENSATION;
    else if (typeFilter === "towing") p.expense_type = EXPENSE_CLAIM_TYPE.TOWING_FEES;
    else if (typeFilter === "gas") p.expense_type = EXPENSE_CLAIM_TYPE.GAS_REIMBURSEMENT;
    else if (typeFilter === "toll") p.expense_type = EXPENSE_CLAIM_TYPE.TOLL_REIMBURSEMENT;
    return p;
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  const { data, isLoading, isFetching, isError, error, refetch } = useExpenseClaimsListQuery(listParams);
  const detailId = claimSheetOpen && selected ? selected.id : 0;
  const detailQuery = useExpenseClaimDetailQuery(detailId, claimSheetOpen);

  const approveMut = useApproveExpenseClaimMutation();
  const rejectMut = useRejectExpenseClaimMutation();
  const paidMut = useMarkExpenseClaimPaidMutation();
  const updateMut = useUpdateExpenseClaimMutation();

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load claims", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (claimSheetOpen && detailQuery.data) {
      setNotesDraft(detailQuery.data.admin_notes || "");
    }
  }, [claimSheetOpen, detailQuery.data]);

  const rows = data?.rows ?? [];

  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openClaimSheet = (row: AdminExpenseClaim) => {
    setSelected(row);
    setNotesDraft(row.admin_notes || "");
    setClaimSheetOpen(true);
  };

  const displayClaim = detailQuery.data ?? selected;

  const savedAdminNotes = (selected?.admin_notes ?? detailQuery.data?.admin_notes ?? "").trim();

  const saveNotes = async () => {
    if (!selected) return;
    try {
      const updated = await updateMut.mutateAsync({
        id: selected.id,
        body: { admin_notes: notesDraft.trim() || null },
      });
      setSelected((prev) => (prev?.id === updated.id ? { ...prev, admin_notes: updated.admin_notes } : prev));
      setNotesDraft(updated.admin_notes || "");
      toast({ title: "Notes saved" });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const onApprove = async (row: AdminExpenseClaim) => {
    try {
      const updated = await approveMut.mutateAsync({ id: row.id });
      if (selected?.id === row.id) setSelected(updated);
      toast({ title: "Claim approved", description: `Claim #${row.id}` });
    } catch (e) {
      toast({
        title: "Approve failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const onMarkPaid = async (row: AdminExpenseClaim) => {
    try {
      const updated = await paidMut.mutateAsync({ id: row.id });
      if (selected?.id === row.id) setSelected(updated);
      toast({ title: "Marked as paid", description: `Claim #${row.id}` });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const confirmReject = async () => {
    if (!selected) return;
    try {
      await rejectMut.mutateAsync({ id: selected.id, admin_notes: rejectNotes.trim() || null });
      toast({ title: "Claim rejected", description: `Claim #${selected.id}`, variant: "destructive" });
      setRejectOpen(false);
      setRejectNotes("");
      setClaimSheetOpen(false);
      setSelected(null);
    } catch (e) {
      toast({
        title: "Reject failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const busy =
    approveMut.isPending || rejectMut.isPending || paidMut.isPending || updateMut.isPending;

  const columns: Column<AdminExpenseClaim>[] = [
    { key: "id", header: "ID", render: (row) => <span className="font-mono text-xs">{row.id}</span> },
    {
      key: "evidence",
      header: "Evidence",
      className: "w-[88px]",
      render: (row) => {
        const thumb = firstClaimImageUrl(row);
        const count = claimAttachmentUrls(row).length;
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
    {
      key: "amount",
      header: "Amount",
      render: (row) => <span className="tabular-nums">{money(row.amount)}</span>,
    },
    {
      key: "expense_type",
      header: "Type",
      render: (row) => <span>{expenseTypeLabel(row.expense_type)}</span>,
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (row) => <span className="text-sm text-muted-foreground">{vehicleSummary(row.vehicle)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge variant={claimStatusVariant(row.status)}>{claimStatusLabel(row.status)}</StatusBadge>
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
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={actionIconButtonClass}
            onClick={() => openClaimSheet(row)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === EXPENSE_CLAIM_STATUS.PENDING ||
          row.status === EXPENSE_CLAIM_STATUS.UNDER_REVIEW ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={actionIconButtonClass}
                onClick={() => onApprove(row)}
                disabled={busy}
                title="Approve"
              >
                {approveMut.isPending && approveMut.variables?.id === row.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={actionIconButtonClass}
                onClick={() => {
                  setSelected(row);
                  setRejectNotes("");
                  setRejectOpen(true);
                }}
                disabled={busy}
                title="Reject"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : null}
          {row.status === EXPENSE_CLAIM_STATUS.APPROVED ? (
            <Button
              variant="ghost"
              size="icon"
              className={actionIconButtonClass}
              onClick={() => onMarkPaid(row)}
              disabled={busy}
              title="Mark as paid"
            >
              {paidMut.isPending && paidMut.variables?.id === row.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const attachments = displayClaim ? claimAttachmentUrls(displayClaim) : [];

  return (
    <PageContainer title="Claims" subtitle="Review accident expense claims from hosts" fullWidth>
      <div className="mb-4 flex flex-col gap-2">
        <SearchFilter
          searchPlaceholder="Search by id, user, email, vehicle, description…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching && !isLoading}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All statuses", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Under review", value: "under_review" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "Paid", value: "paid" },
              ],
            },
            {
              label: "Type",
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { label: "All types", value: "all" },
                { label: "Damage", value: "damage" },
                { label: "Towing", value: "towing" },
                { label: "Gas", value: "gas" },
                { label: "Toll", value: "toll" },
              ],
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
            setStatusFilter("all");
            setTypeFilter("all");
            setPage(1);
          }}
        />
        {isError ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
      <div className="relative w-full min-w-0 rounded-xl border border-border bg-card overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          pageSize={CLAIMS_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          emptyMessage={isError ? "Could not load claims." : "No claims match your filters."}
        />
      </div>

      <Sheet
        open={claimSheetOpen}
        onOpenChange={(open) => {
          setClaimSheetOpen(open);
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            "flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-3xl"
          )}
        >
          <SheetDescription className="sr-only">Expense claim details and attachments</SheetDescription>
          {displayClaim ? (
            <SheetTitle className="sr-only">Claim #{displayClaim.id}</SheetTitle>
          ) : (
            <SheetTitle className="sr-only">Claim details</SheetTitle>
          )}
          {displayClaim ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-4 flex items-start justify-between gap-2 pr-2">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Claim #{displayClaim.id}</h2>
                    <p className="text-sm text-muted-foreground">Expense claim details and attachments</p>
                  </div>
                  {detailQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  ) : null}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Submitted by</span>
                      <div className="font-medium leading-tight">{displayUserName(displayClaim)}</div>
                      {displayClaim.user?.email ? (
                        <p className="truncate text-xs text-muted-foreground">{displayClaim.user.email}</p>
                      ) : null}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Amount</span>
                      <div className="font-medium tabular-nums">{money(displayClaim.amount)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <div className="mt-0.5">
                        <StatusBadge variant={claimStatusVariant(displayClaim.status)}>
                          {claimStatusLabel(displayClaim.status)}
                        </StatusBadge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Type</span>
                      <div>{expenseTypeLabel(displayClaim.expense_type)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Accident date</span>
                      <div>{formatDateUS(displayClaim.accident_date)}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Vehicle</span>
                      <div>{vehicleSummary(displayClaim.vehicle)}</div>
                    </div>
                    {displayClaim.booking?.id ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Booking</span>
                        <div className="font-mono text-xs">#{displayClaim.booking.id}</div>
                      </div>
                    ) : null}
                    {displayClaim.accident_location ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Location</span>
                        <div>{displayClaim.accident_location}</div>
                      </div>
                    ) : null}
                    {displayClaim.description ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Description</span>
                        <div className="whitespace-pre-wrap">{displayClaim.description}</div>
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

                  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Saved admin notes</p>
                      {savedAdminNotes ? (
                        <div className="mt-2 min-h-[4.5rem] rounded-md border border-border/80 bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {savedAdminNotes}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm italic text-muted-foreground">No admin notes saved yet.</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="admin-notes">Add or update notes</Label>
                      <Textarea
                        id="admin-notes"
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={4}
                        className="mt-1.5 bg-background"
                        placeholder="Internal notes visible to admins only…"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 border-t border-border bg-background p-4 sm:flex-col sm:space-x-0">
                <div className="flex w-full flex-wrap gap-2">
                  {displayClaim.status === EXPENSE_CLAIM_STATUS.PENDING ||
                  displayClaim.status === EXPENSE_CLAIM_STATUS.UNDER_REVIEW ? (
                    <>
                      <Button
                        type="button"
                        className="flex-1 bg-primary text-primary-foreground sm:flex-none"
                        disabled={busy}
                        onClick={() => void onApprove(displayClaim)}
                      >
                        {approveMut.isPending && approveMut.variables?.id === displayClaim.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1 sm:flex-none"
                        disabled={busy}
                        onClick={() => {
                          setSelected(displayClaim);
                          setRejectNotes("");
                          setRejectOpen(true);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {displayClaim.status === EXPENSE_CLAIM_STATUS.APPROVED ? (
                    <Button
                      type="button"
                      className="flex-1 bg-primary text-primary-foreground sm:flex-none"
                      disabled={busy}
                      onClick={() => void onMarkPaid(displayClaim)}
                    >
                      {paidMut.isPending && paidMut.variables?.id === displayClaim.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <DollarSign className="mr-2 h-4 w-4" />
                      )}
                      Mark as paid
                    </Button>
                  ) : null}
                </div>
                <div className="flex w-full flex-wrap gap-2 border-t border-border pt-2">
                  <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => setClaimSheetOpen(false)}>
                    Close
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 sm:flex-none"
                    onClick={() => void saveNotes()}
                    disabled={busy || !selected}
                  >
                    {updateMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save notes
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject claim #{selected?.id}?</DialogTitle>
            <DialogDescription>Optional message shown to the user.</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reject-notes">Reason / notes</Label>
            <Textarea
              id="reject-notes"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              className="mt-1"
              placeholder="Explain why this claim was rejected…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmReject()} disabled={busy}>
              {rejectMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default ClaimsPage;
