import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  BOOKING_INVOICE_STATUS,
  TRIP_EXTRAS_PAGE_SIZE_DEFAULT,
  extrasIsOpen,
  extrasStatusLabel,
  extrasStatusVariant,
  invoiceItemAttachmentUrls,
  isInvoiceImageUrl,
  type AdminBookingInvoice,
  type BookingInvoicesListParams,
} from "@/api/bookingInvoices";
import {
  useBookingInvoicesListQuery,
  useUpdateBookingInvoiceMutation,
} from "@/hooks/useAdminBookingInvoices";
import { cn } from "@/lib/utils";

const formatDateUS = (iso: string | undefined | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

const money = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

const TripExtrasPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("open");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<AdminBookingInvoice | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [confirmAction, setConfirmAction] = useState<"confirm" | "waive" | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const listParams: BookingInvoicesListParams = useMemo(() => {
    const p: BookingInvoicesListParams = {};
    if (statusFilter !== "open") p.status = statusFilter;
    return p;
  }, [statusFilter]);

  const { data, isLoading, isFetching, isError, error, refetch } = useBookingInvoicesListQuery(listParams);
  const updateMut = useUpdateBookingInvoiceMutation();

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load trip extras", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const filtered = useMemo(() => {
    const rows = data ?? [];
    if (!debouncedSearch) return rows;
    const q = debouncedSearch.toLowerCase();
    return rows.filter((row) => {
      const hay = [
        String(row.id),
        String(row.booking_id),
        String(row.guest_id),
        String(row.host_id),
        row.status,
        row.note || "",
        row.dispute_note || "",
        ...(row.items || []).map((i) => i.title),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, debouncedSearch]);

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / TRIP_EXTRAS_PAGE_SIZE_DEFAULT) || 1);
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * TRIP_EXTRAS_PAGE_SIZE_DEFAULT,
    currentPage * TRIP_EXTRAS_PAGE_SIZE_DEFAULT
  );

  const openSheet = (row: AdminBookingInvoice) => {
    setSelected(row);
    setAmountDraft(String(row.total_amount ?? ""));
    setNoteDraft(row.dispute_note || row.note || "");
    setSheetOpen(true);
  };

  const display = selected
    ? (data ?? []).find((r) => r.id === selected.id) ?? selected
    : null;
  const canAct = display ? extrasIsOpen(display.status) : false;

  const runUpdate = async (action: "confirm" | "waive" | "set_amount") => {
    if (!display) return;
    const amount = parseFloat(amountDraft);
    try {
      const updated = await updateMut.mutateAsync({
        id: display.id,
        body: {
          action,
          amount: action === "set_amount" ? amount : undefined,
          note: noteDraft.trim() || null,
        },
      });
      setSelected(updated);
      setConfirmAction(null);
      toast({
        title: action === "waive" ? "Extras waived" : "Trip extras updated",
        description: `Ticket #${updated.id}`,
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminBookingInvoice>[] = [
    {
      key: "id",
      header: "Ticket",
      render: (row) => <span className="font-mono text-xs tabular-nums">Ticket #{row.id}</span>,
    },
    {
      key: "booking_id",
      header: "Booking",
      render: (row) => <span className="font-mono text-xs">#{row.booking_id}</span>,
    },
    {
      key: "host_id",
      header: "Host",
      render: (row) => <span className="text-sm">User #{row.host_id}</span>,
    },
    {
      key: "guest_id",
      header: "Guest",
      render: (row) => <span className="text-sm">User #{row.guest_id}</span>,
    },
    {
      key: "total_amount",
      header: "Amount",
      render: (row) => <span className="tabular-nums">{money(row.total_amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge variant={extrasStatusVariant(row.status)}>{extrasStatusLabel(row.status)}</StatusBadge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
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

  return (
    <PageContainer
      fullWidth
      title="Trip extras"
      subtitle="Host extra charges to the guest — pay path is in the app; admin only when disputed or unpaid"
    >
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by ticket, booking, host, guest, note…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching && !isLoading}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "Open (unpaid / disputed)", value: "open" },
                { label: "Pending payment", value: BOOKING_INVOICE_STATUS.PENDING_PAYMENT },
                { label: "Disputed", value: BOOKING_INVOICE_STATUS.DISPUTED },
                { label: "Paid", value: BOOKING_INVOICE_STATUS.PAID },
                { label: "Waived", value: BOOKING_INVOICE_STATUS.WAIVED },
              ],
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
            setStatusFilter("open");
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
          pageSize={TRIP_EXTRAS_PAGE_SIZE_DEFAULT}
          totalRecords={totalRecords}
          emptyMessage={isError ? "Could not load trip extras." : "No trip extras match your filters."}
        />
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelected(null);
            setConfirmAction(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            "flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-3xl"
          )}
        >
          <SheetDescription className="sr-only">Trip extras invoice details</SheetDescription>
          {display ? (
            <SheetTitle className="sr-only">Ticket #{display.id}</SheetTitle>
          ) : (
            <SheetTitle className="sr-only">Trip extras</SheetTitle>
          )}
          {display ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-4 flex items-start justify-between gap-2 pr-2">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Ticket #{display.id}</h2>
                    <p className="text-sm text-muted-foreground">Host extra charges on booking #{display.booking_id}</p>
                  </div>
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  ) : null}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <div className="mt-0.5">
                        <StatusBadge variant={extrasStatusVariant(display.status)}>
                          {extrasStatusLabel(display.status)}
                        </StatusBadge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Amount</span>
                      <div className="font-medium tabular-nums">{money(display.total_amount)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Host</span>
                      <div>User #{display.host_id}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Guest</span>
                      <div>User #{display.guest_id}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Created</span>
                      <div>{formatDateUS(display.createdAt)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Paid</span>
                      <div>{formatDateUS(display.paid_at)}</div>
                    </div>
                    {display.note ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Host note</span>
                        <div className="mt-0.5 whitespace-pre-wrap">{display.note}</div>
                      </div>
                    ) : null}
                    {display.dispute_note ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Dispute note</span>
                        <div className="mt-0.5 whitespace-pre-wrap">{display.dispute_note}</div>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Line items</p>
                    {(display.items || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No line items</p>
                    ) : (
                      <ul className="space-y-2">
                        {(display.items || []).map((item) => {
                          const files = invoiceItemAttachmentUrls(item);
                          return (
                            <li
                              key={item.id}
                              className="rounded-lg border border-border bg-muted/30 p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  <p className="text-xs text-muted-foreground">
                                    {item.charge_type}
                                    {item.is_system ? " · system" : ""}
                                  </p>
                                  {item.description ? (
                                    <p className="mt-1 whitespace-pre-wrap text-xs">{item.description}</p>
                                  ) : null}
                                </div>
                                <span className="shrink-0 tabular-nums">{money(item.amount)}</span>
                              </div>
                              {files.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {files.map((url) =>
                                    isInvoiceImageUrl(url) ? (
                                      <a
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block h-16 w-20 overflow-hidden rounded border border-border"
                                      >
                                        <img src={url} alt="" className="h-full w-full object-cover" />
                                      </a>
                                    ) : (
                                      <a
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        File
                                      </a>
                                    )
                                  )}
                                </div>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {canAct ? (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                      <div>
                        <Label htmlFor="extras-amount" className="text-xs text-muted-foreground">
                          Amount
                        </Label>
                        <Input
                          id="extras-amount"
                          className="mt-2 max-w-xs"
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountDraft}
                          onChange={(e) => setAmountDraft(e.target.value)}
                          disabled={updateMut.isPending}
                        />
                      </div>
                      <div>
                        <Label htmlFor="extras-note" className="text-xs text-muted-foreground">
                          Admin note
                        </Label>
                        <Textarea
                          id="extras-note"
                          className="mt-2"
                          rows={3}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          disabled={updateMut.isPending}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 border-t border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                  Close
                </Button>
                {canAct ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={updateMut.isPending}
                      onClick={() => setConfirmAction("waive")}
                    >
                      Waive
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={updateMut.isPending || !(parseFloat(amountDraft) >= 0)}
                      onClick={() => void runUpdate("set_amount")}
                    >
                      {updateMut.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      ) : null}
                      Set amount
                    </Button>
                    <Button
                      type="button"
                      disabled={updateMut.isPending}
                      onClick={() => setConfirmAction("confirm")}
                    >
                      Confirm & charge
                    </Button>
                  </>
                ) : null}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmAction != null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "waive" ? "Waive these extras?" : "Charge the guest?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "waive"
                ? `Ticket #${display?.id} will be waived. The guest will not be charged.`
                : `This will confirm ticket #${display?.id} and charge ${money(
                    parseFloat(amountDraft) || display?.total_amount || 0
                  )} from the guest wallet and/or saved card.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!confirmAction) return;
                if (confirmAction === "confirm" && display) {
                  const draft = parseFloat(amountDraft);
                  const current = Number(display.total_amount) || 0;
                  if (!Number.isNaN(draft) && Math.abs(draft - current) > 0.001) {
                    void runUpdate("set_amount");
                    return;
                  }
                }
                void runUpdate(confirmAction);
              }}
            >
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default TripExtrasPage;
