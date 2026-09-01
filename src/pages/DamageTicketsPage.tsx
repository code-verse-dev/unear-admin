import { useEffect, useMemo, useRef, useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { DollarSign, Eye, Loader2, Send } from "lucide-react";
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
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DAMAGE_TICKETS_PAGE_SIZE_DEFAULT,
  DAMAGE_TICKET_STATUS,
  damageTicketAttachmentUrls,
  firstDamageTicketImageUrl,
  isDamageTicketImageUrl,
  type AdminDamageTicket,
  type DamageTicketsListParams,
} from "@/api/damageTickets";
import {
  useChargeDamageTicketMutation,
  useDamageTicketDetailQuery,
  useDamageTicketMessagesQuery,
  useDamageTicketsListQuery,
  useSendDamageTicketMessageMutation,
  useUpdateDamageTicketMutation,
} from "@/hooks/useAdminDamageTickets";
import { cn } from "@/lib/utils";

const formatDateUS = (iso: string | undefined | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

const money = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

function displayUserName(u: AdminDamageTicket["host"] | AdminDamageTicket["guest"]): string {
  if (!u) return "—";
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || u.email || `User #${u.id}`;
}

function ticketStatusLabel(s: number): string {
  switch (s) {
    case DAMAGE_TICKET_STATUS.OPEN:
      return "Awaiting Support";
    case DAMAGE_TICKET_STATUS.IN_DISCUSSION:
      return "In discussion";
    case DAMAGE_TICKET_STATUS.AMOUNT_SET:
      return "Amount set";
    case DAMAGE_TICKET_STATUS.CHARGED:
      return "Accepted";
    case DAMAGE_TICKET_STATUS.CANCELLED:
      return "Rejected";
    default:
      return `Status ${s}`;
  }
}

function ticketStatusVariant(
  s: number
): "success" | "warning" | "destructive" | "default" | "secondary" | "info" {
  if (s === DAMAGE_TICKET_STATUS.CHARGED) return "success";
  if (s === DAMAGE_TICKET_STATUS.CANCELLED) return "destructive";
  if (s === DAMAGE_TICKET_STATUS.AMOUNT_SET) return "info";
  if (s === DAMAGE_TICKET_STATUS.IN_DISCUSSION) return "warning";
  return "secondary";
}

function vehicleSummary(booking: AdminDamageTicket["booking"]): string {
  const veh = booking?.vehicle;
  if (!veh) return booking ? `Booking #${booking.id}` : "—";
  const bits = [veh.year, veh.make, veh.model].filter(Boolean);
  return bits.length ? bits.join(" ") : `Vehicle #${veh.id}`;
}

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

function ChatPanel({
  ticketId,
  room,
  disabled,
}: {
  ticketId: number;
  room: "host" | "guest";
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const messagesQuery = useDamageTicketMessagesQuery(ticketId, room, ticketId > 0);
  const sendMutation = useSendDamageTicketMessageMutation();

  const messages = messagesQuery.data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text || disabled) return;
    try {
      await sendMutation.mutateAsync({ id: ticketId, room, message: text });
      setDraft("");
    } catch (e) {
      toast({
        title: "Could not send message",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col border rounded-md h-[320px] bg-background">
      <div className="px-3 py-2 border-b text-sm font-medium capitalize">{room} chat</div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messagesQuery.isLoading ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No messages yet</p>
        ) : (
          messages.map((m) => {
            const isAdmin = String(m.user_type || "").toUpperCase() === "ADMIN";
            return (
              <div
                key={m.message_id}
                className={cn("flex flex-col max-w-[90%]", isAdmin ? "ml-auto items-end" : "items-start")}
              >
                <span className="text-[11px] text-muted-foreground mb-0.5">
                  {m.user_name || `User #${m.user_id}`}
                </span>
                <div
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm whitespace-pre-wrap break-words",
                    isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {m.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${room}…`}
          disabled={disabled || sendMutation.isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
        />
        <Button
          size="icon"
          disabled={disabled || sendMutation.isPending || !draft.trim()}
          onClick={() => void onSend()}
        >
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

const DamageTicketsPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [finalAmountDraft, setFinalAmountDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const listParams: DamageTicketsListParams = useMemo(() => {
    const p: DamageTicketsListParams = {
      page,
      limit: DAMAGE_TICKETS_PAGE_SIZE_DEFAULT,
      orderBy: "id",
      order: "DESC",
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter !== "all") p.status = Number(statusFilter);
    return p;
  }, [page, debouncedSearch, statusFilter]);

  const listQuery = useDamageTicketsListQuery(listParams);
  const detailQuery = useDamageTicketDetailQuery(selectedId ?? 0, sheetOpen && !!selectedId);
  const updateMutation = useUpdateDamageTicketMutation();
  const chargeMutation = useChargeDamageTicketMutation();

  const rows = listQuery.data?.rows ?? [];
  const ticket = detailQuery.data;
  const totalPages = Math.max(1, listQuery.data?.links?.total ?? 1);
  const currentPage = listQuery.data?.links?.current ?? page;

  useEffect(() => {
    if (listQuery.isError && listQuery.error instanceof Error) {
      toast({
        title: "Failed to load damage tickets",
        description: listQuery.error.message,
        variant: "destructive",
      });
    }
  }, [listQuery.isError, listQuery.error, toast]);

  useEffect(() => {
    if (!ticket) return;
    setFinalAmountDraft(
      ticket.final_amount != null
        ? String(ticket.final_amount)
        : ticket.proposed_amount != null
          ? String(ticket.proposed_amount)
          : ""
    );
    setNotesDraft(ticket.admin_notes || "");
  }, [ticket?.id, ticket?.final_amount, ticket?.proposed_amount, ticket?.admin_notes]);

  const openSheet = (row: AdminDamageTicket) => {
    setSelectedId(row.id);
    setSheetOpen(true);
  };

  const saveAmount = async () => {
    if (!selectedId) return;
    const amount = parseFloat(finalAmountDraft);
    if (!(amount > 0)) {
      toast({ title: "Enter a valid final amount", variant: "destructive" });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        body: { final_amount: amount, admin_notes: notesDraft || null },
      });
      toast({ title: "Final amount saved" });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const confirmCharge = async () => {
    if (!selectedId || !ticket) return;
    const amount = parseFloat(finalAmountDraft) || Number(ticket.final_amount) || 0;
    if (!(amount > 0)) {
      toast({ title: "Set a final amount before charging", variant: "destructive" });
      return;
    }
    try {
      await chargeMutation.mutateAsync({
        id: selectedId,
        body: { final_amount: amount, admin_notes: notesDraft || null },
      });
      setChargeDialogOpen(false);
      toast({ title: "Guest charged successfully" });
    } catch (e) {
      toast({
        title: "Charge failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminDamageTicket>[] = [
    {
      key: "id",
      header: "Ticket",
      render: (r) => <span className="font-mono text-xs tabular-nums">Ticket #{r.id}</span>,
    },
    {
      key: "booking",
      header: "Booking",
      render: (r) => <span>#{r.booking_id}</span>,
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (r) => <span className="text-sm text-muted-foreground">{vehicleSummary(r.booking)}</span>,
    },
    {
      key: "host",
      header: "Host",
      render: (r) => <span>{displayUserName(r.host)}</span>,
    },
    {
      key: "guest",
      header: "Guest",
      render: (r) => <span>{displayUserName(r.guest)}</span>,
    },
    {
      key: "proposed",
      header: "Proposed",
      render: (r) => <span className="tabular-nums">{money(r.proposed_amount)}</span>,
    },
    {
      key: "final",
      header: "Final",
      render: (r) => (
        <span className="tabular-nums">{r.final_amount != null ? money(r.final_amount) : "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge variant={ticketStatusVariant(r.status)}>{ticketStatusLabel(r.status)}</StatusBadge>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (r) => <span>{formatDateUS(r.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-[100px]",
      render: (r) => {
        const thumb = firstDamageTicketImageUrl(r);
        return (
          <div className="flex items-center gap-1 justify-end">
            {thumb ? (
              <img src={thumb} alt="" className="h-8 w-8 rounded object-cover border" />
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={actionIconButtonClass}
              onClick={() => openSheet(r)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const attachmentUrls = ticket ? damageTicketAttachmentUrls(ticket) : [];
  const canCharge =
    !!ticket &&
    ticket.status !== DAMAGE_TICKET_STATUS.CHARGED &&
    ticket.status !== DAMAGE_TICKET_STATUS.CANCELLED;
  const chatDisabled = !ticket || ticket.status === DAMAGE_TICKET_STATUS.CANCELLED;

  return (
    <PageContainer
      title="Damage Tickets"
      subtitle="Host-reported damages at drop-off — negotiate amount, chat, and charge the guest."
    >
      <div className="mb-4">
        <SearchFilter
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search id, booking, host, guest…"
          isSearching={listQuery.isFetching && !listQuery.isLoading}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All statuses", value: "all" },
                { label: "Awaiting Support", value: String(DAMAGE_TICKET_STATUS.OPEN) },
                { label: "In discussion", value: String(DAMAGE_TICKET_STATUS.IN_DISCUSSION) },
                { label: "Amount set", value: String(DAMAGE_TICKET_STATUS.AMOUNT_SET) },
                { label: "Accepted", value: String(DAMAGE_TICKET_STATUS.CHARGED) },
                { label: "Rejected", value: String(DAMAGE_TICKET_STATUS.CANCELLED) },
              ],
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setStatusFilter("all");
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={listQuery.isLoading}
        page={currentPage}
        totalPages={totalPages}
        pageSize={DAMAGE_TICKETS_PAGE_SIZE_DEFAULT}
        onPageChange={setPage}
        emptyMessage="No damage tickets yet"
        getRowId={(r) => r.id}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
          <SheetTitle>{selectedId ? `Ticket #${selectedId}` : "Damage ticket"}</SheetTitle>
          <SheetDescription>
            Review photos, chat with host and guest, set the final amount, then charge the guest.
          </SheetDescription>

          {detailQuery.isLoading || !ticket ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge variant={ticketStatusVariant(ticket.status)}>
                  {ticketStatusLabel(ticket.status)}
                </StatusBadge>
                <span className="text-sm text-muted-foreground">
                  Booking #{ticket.booking_id} · {vehicleSummary(ticket.booking)}
                </span>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Host</p>
                  <p className="font-medium">{displayUserName(ticket.host)}</p>
                  <p className="text-muted-foreground">{ticket.host?.email || "—"}</p>
                  <p className="text-muted-foreground">{ticket.host?.mobile_no || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Guest</p>
                  <p className="font-medium">{displayUserName(ticket.guest)}</p>
                  <p className="text-muted-foreground">{ticket.guest?.email || "—"}</p>
                  <p className="text-muted-foreground">{ticket.guest?.mobile_no || "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Damage description</p>
                <p className="text-sm whitespace-pre-wrap">{ticket.damage_description || "—"}</p>
                <p className="text-sm mt-2">
                  Proposed: <span className="font-medium">{money(ticket.proposed_amount)}</span>
                  {ticket.final_amount != null ? (
                    <>
                      {" "}
                      · Final: <span className="font-medium">{money(ticket.final_amount)}</span>
                    </>
                  ) : null}
                </p>
              </div>

              {attachmentUrls.length > 0 ? (
                <div>
                  <p className="text-sm font-medium mb-2">Damage photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {attachmentUrls.map((url) =>
                      isDamageTicketImageUrl(url) ? (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt="Damage"
                            className="h-28 w-full object-cover rounded-md border"
                          />
                        </a>
                      ) : (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary underline break-all"
                        >
                          Attachment
                        </a>
                      )
                    )}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <ChatPanel ticketId={ticket.id} room="host" disabled={chatDisabled} />
                <ChatPanel ticketId={ticket.id} room="guest" disabled={chatDisabled} />
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="final-amount">Final amount (USD)</Label>
                  <Input
                    id="final-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={finalAmountDraft}
                    disabled={!canCharge || updateMutation.isPending}
                    onChange={(e) => setFinalAmountDraft(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin-notes">Admin notes</Label>
                  <Textarea
                    id="admin-notes"
                    value={notesDraft}
                    disabled={!canCharge || updateMutation.isPending}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="mt-6 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canCharge || updateMutation.isPending || !ticket}
              onClick={() => void saveAmount()}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save amount
            </Button>
            <Button
              type="button"
              disabled={!canCharge || chargeMutation.isPending || !ticket}
              onClick={() => setChargeDialogOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Charge guest
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Charge guest for damages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will charge{" "}
              <strong>
                {money(parseFloat(finalAmountDraft) || Number(ticket?.final_amount) || 0)}
              </strong>{" "}
              from the guest wallet and/or saved card. This cannot be undone from this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={chargeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={chargeMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void confirmCharge();
              }}
            >
              {chargeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Charge guest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default DamageTicketsPage;
