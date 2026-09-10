import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TicketChat } from "@/components/support/TicketChat";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { extrasIsOpen, extrasStatusLabel, extrasStatusVariant } from "@/api/bookingInvoices";
import type { SupportChatRoom, SupportTicketKind } from "@/api/supportTicketChat";
import { kindLabel, partyName, ticketRef } from "@/lib/supportTickets";
import { useBookingInvoiceDetailQuery, useUpdateBookingInvoiceMutation } from "@/hooks/useAdminBookingInvoices";
import { useDeleteSupportTicketMutation } from "@/hooks/useSupportTicketChat";
import { useUnifiedTicketDetailQuery, useUpdateUnifiedTicketMutation } from "@/hooks/useAdminUnifiedTickets";
import { UNIFIED_TICKET_STATUS } from "@/api/unifiedTickets";
import { buildSupportTicketEvents } from "@/lib/ticketTimeline";
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

const money = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

const KINDS: SupportTicketKind[] = ["extras", "claim", "general"];

function Field({ label, value, extra }: { label: string; value: string; extra?: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {extra}
      </div>
      <div className="rounded-md border border-input bg-background px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}

const SupportTicketDetailPage = () => {
  const { kind: kindParam, id: idParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const id = Number(idParam);
  const isLegacyKind = kindParam === "damage" || kindParam === "dispute";
  const kind = (isLegacyKind ? "claim" : kindParam || "") as SupportTicketKind;
  const valid = !isLegacyKind && KINDS.includes(kind) && id > 0;

  const extrasQ = useBookingInvoiceDetailQuery(id, valid && kind === "extras");
  const unifiedQ = useUnifiedTicketDetailQuery(id, valid && (kind === "claim" || kind === "general"));

  const updateExtras = useUpdateBookingInvoiceMutation();
  const updateUnified = useUpdateUnifiedTicketMutation();
  const deleteMut = useDeleteSupportTicketMutation();

  const [amountDraft, setAmountDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [confirm, setConfirm] = useState<
    "approve" | "deny" | "counter" | "waive" | "delete" | "approve_offer" | "reject_offer" | null
  >(null);
  const [counterPromptKey, setCounterPromptKey] = useState(0);
  const [offerEventId, setOfferEventId] = useState<number | null>(null);

  const extras = extrasQ.data;
  const unified = unifiedQ.data;

  useEffect(() => {
    if (kind === "extras" && extras) {
      setAmountDraft(String(extras.total_amount ?? ""));
      setNotesDraft(extras.dispute_note || extras.note || "");
    }
    if ((kind === "claim" || kind === "general") && unified) {
      setAmountDraft(String(unified.amount ?? unified.claim?.amount ?? ""));
      setNotesDraft(unified.admin_notes || "");
    }
  }, [kind, extras, unified]);

  const loading =
    (kind === "extras" && extrasQ.isLoading) ||
    ((kind === "claim" || kind === "general") && unifiedQ.isLoading);

  const error =
    (kind === "extras" && extrasQ.error) ||
    ((kind === "claim" || kind === "general") && unifiedQ.error);

  const statusLabel = useMemo(() => {
    if (kind === "extras" && extras) return extrasStatusLabel(extras.status);
    if ((kind === "claim" || kind === "general") && unified) return unified.status_label || "—";
    return "—";
  }, [kind, extras, unified]);

  const statusVariant = useMemo(() => {
    if (kind === "extras" && extras) return extrasStatusVariant(extras.status);
    if ((kind === "claim" || kind === "general") && unified) {
      return unified.is_open ? "warning" : unified.status === UNIFIED_TICKET_STATUS.CANCELLED ? "destructive" : "success";
    }
    return "secondary" as const;
  }, [kind, extras, unified]);

  const isOpen =
    (kind === "extras" && extras && extrasIsOpen(extras.status)) ||
    ((kind === "claim" || kind === "general") && !!unified?.is_open);

  const chatDisabled =
    (kind === "claim" || kind === "general") &&
    unified &&
    (unified.status === UNIFIED_TICKET_STATUS.CANCELLED || unified.status === UNIFIED_TICKET_STATUS.RESOLVED);

  const rooms: { id: SupportChatRoom; label: string }[] =
    kind === "general"
      ? [{ id: "user", label: "User" }]
      : kind === "claim"
        ? [
            { id: "host", label: "Host" },
            { id: "guest", label: "Guest" },
            { id: "user", label: "User" },
          ]
        : [
            { id: "host", label: "Host" },
            { id: "guest", label: "Guest" },
          ];

  const headerUser = (() => {
    if (kind === "extras" && extras) {
      return {
        name: `Guest #${extras.guest_id}`,
        subtitle: `Host #${extras.host_id}`,
        email: undefined as string | undefined,
        phone: undefined as string | undefined,
        meta: `Booking #${extras.booking_id}`,
      };
    }
    if ((kind === "claim" || kind === "general") && unified) {
      const name = partyName(unified.requester, `User #${unified.requester_id}`);
      const vehicle = unified.vehicle
        ? [unified.vehicle.year, unified.vehicle.make, unified.vehicle.model].filter(Boolean).join(" ")
        : unified.booking_id
          ? `Booking #${unified.booking_id}`
          : "";
      return {
        name,
        subtitle: unified.title || kindLabel(kind),
        email: unified.requester?.email,
        phone: unified.requester?.mobile_no || undefined,
        meta: vehicle,
      };
    }
    return {
      name: "—",
      subtitle: kindLabel(kind),
      email: undefined as string | undefined,
      phone: undefined as string | undefined,
      meta: "",
    };
  })();

  const subject =
    kind === "claim" || kind === "general"
      ? unified?.title || kindLabel(kind)
      : extras?.items?.[0]?.title || kindLabel(kind);

  const tabTitle = `${ticketRef(id)} · ${kindLabel(kind)}`;

  const timelineEvents = useMemo(
    () => buildSupportTicketEvents({ kind, extras, unified }),
    [kind, extras, unified]
  );

  const runResolve = async () => {
    try {
      if (kind === "extras") {
        const amount = parseFloat(amountDraft);
        const current = Number(extras?.total_amount) || 0;
        if (!Number.isNaN(amount) && Math.abs(amount - current) > 0.001) {
          await updateExtras.mutateAsync({
            id,
            body: { action: "set_amount", amount, note: notesDraft || null },
          });
        } else {
          await updateExtras.mutateAsync({
            id,
            body: { action: "confirm", note: notesDraft || null },
          });
        }
        toast({ title: "Ticket approved", description: ticketRef(id) });
      } else if (kind === "claim") {
        await updateUnified.mutateAsync({
          id,
          body: { action: "approve", admin_notes: notesDraft || null },
        });
        toast({
          title: "Amount approved",
          description: `${money(unified?.amount ?? unified?.claim?.amount)} is now payable. The ticket stays open until it is paid.`,
        });
      } else if (kind === "general") {
        await updateUnified.mutateAsync({
          id,
          body: { action: "resolve", admin_notes: notesDraft || null },
        });
        toast({ title: "Ticket closed", description: ticketRef(id) });
      }
      setConfirm(null);
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const runReject = async () => {
    try {
      if (kind === "extras") {
        await updateExtras.mutateAsync({
          id,
          body: { action: "deny", note: notesDraft || null },
        });
      } else if (kind === "claim" || kind === "general") {
        await updateUnified.mutateAsync({
          id,
          body: { action: "cancel", admin_notes: notesDraft || null },
        });
      }
      setConfirm(null);
      toast({ title: "Ticket denied", description: ticketRef(id) });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const runCounter = async () => {
    if (kind === "general") {
      setConfirm(null);
      setCounterPromptKey((value) => value + 1);
      toast({ title: "Write the counteroffer", description: "The reply box is ready for your counteroffer." });
      return;
    }

    const amount = parseFloat(amountDraft);
    if (!(amount >= 0)) {
      toast({ title: "Enter a valid counter amount", variant: "destructive" });
      return;
    }

    try {
      if (kind === "claim") {
        await updateUnified.mutateAsync({
          id,
          body: { action: "counter", amount, admin_notes: notesDraft || null },
        });
      } else {
        await updateExtras.mutateAsync({
          id,
          body: { action: "counter", amount, note: notesDraft || null },
        });
      }
      setConfirm(null);
      toast({ title: "Counteroffer sent", description: `${money(amount)} on ${ticketRef(id)}` });
    } catch (e) {
      toast({
        title: "Counteroffer failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const runWaive = async () => {
    try {
      if (kind === "claim" || kind === "general") {
        await updateUnified.mutateAsync({
          id,
          body: { action: "cancel", admin_notes: notesDraft || null },
        });
      } else {
        await updateExtras.mutateAsync({
          id,
          body: { action: "waive", note: notesDraft || null },
        });
      }
      setConfirm(null);
      toast({ title: "Ticket waived", description: ticketRef(id) });
    } catch (e) {
      toast({
        title: "Waive failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const runReviewOffer = async () => {
    if (offerEventId == null) return;
    const action = confirm === "reject_offer" ? "reject_counter" : "approve_counter";
    try {
      await updateUnified.mutateAsync({
        id,
        body: {
          action,
          event_id: offerEventId,
          admin_notes: notesDraft || null,
        },
      });
      setConfirm(null);
      setOfferEventId(null);
      toast({
        title: action === "approve_counter" ? "Counter offer approved" : "Counter offer rejected",
        description:
          action === "approve_counter"
            ? "The current amount was updated. Approve the ticket when you are ready to make it payable."
            : "The current amount was left unchanged.",
      });
    } catch (e) {
      toast({
        title: "Could not review the offer",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const runDelete = async () => {
    try {
      await deleteMut.mutateAsync({ kind, id });
      setConfirm(null);
      toast({ title: "Ticket deleted", description: `${ticketRef(id)} was removed.` });
      navigate("/support-tickets");
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const busy = updateExtras.isPending || updateUnified.isPending || deleteMut.isPending;
  const pendingOffer = kind === "claim" ? unified?.pending_counter : null;
  const currentAmount = kind === "claim" ? Number(unified?.amount ?? unified?.claim?.amount ?? 0) : null;

  const openDot =
    statusVariant === "success"
      ? "bg-emerald-500"
      : statusVariant === "destructive"
        ? "bg-red-500"
        : statusVariant === "warning"
          ? "bg-amber-500"
          : "bg-emerald-500";

  if (isLegacyKind) {
    return <Navigate to="/support-tickets?type=claim" replace />;
  }

  if (!valid) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Unknown ticket.</p>
        <Button className="mt-3" variant="outline" onClick={() => navigate("/support-tickets")}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full min-w-0 flex-col overflow-hidden bg-muted/40">
      <div className="flex shrink-0 items-end gap-1 border-b border-border bg-muted/60 px-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 h-8 text-muted-foreground"
          onClick={() => navigate("/support-tickets")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Inbox
        </Button>
        <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-border bg-background px-3 py-2 text-sm font-medium">
          <span className="max-w-[280px] truncate">{tabTitle}</span>
          <button
            type="button"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted"
            onClick={() => navigate("/support-tickets")}
            aria-label="Close ticket"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 h-8 text-muted-foreground"
          onClick={() => navigate("/support-tickets")}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add ticket
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <p className="p-6 text-sm text-destructive">{error instanceof Error ? error.message : "Failed to load ticket"}</p>
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
            <div className="min-w-0">
              <p className="font-mono text-lg font-semibold tracking-tight">{ticketRef(id)}</p>
              <p className="truncate text-sm text-muted-foreground">
                {headerUser.name}
                {headerUser.subtitle ? ` · ${headerUser.subtitle}` : ""}
              </p>
            </div>
            <div className="min-w-0 flex-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">Details: </span>
              {headerUser.meta || headerUser.email || "—"}
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className={cn("h-2 w-2 rounded-full", isOpen ? "bg-emerald-500" : openDot)} />
                {isOpen ? "Open" : statusLabel}
              </div>
              <p className="text-xs text-muted-foreground">{kindLabel(kind)}</p>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="min-h-0 space-y-4 overflow-y-auto border-r border-border bg-background p-5">
              <Field label="Ticket" value={ticketRef(id)} />
              <Field label="Requester" value={headerUser.name} />
              <Field label="Type" value={kindLabel(kind)} />
              {kind === "claim" && unified ? (
                <Field label="Host" value={partyName(unified.host, unified.host_id ? `#${unified.host_id}` : "—")} />
              ) : null}
              {kind === "extras" && extras ? <Field label="Host" value={`#${extras.host_id}`} /> : null}
              {kind !== "general" ? (
                <Field
                  label="Guest"
                  value={
                    kind === "claim" && unified
                      ? partyName(unified.guest, unified.guest_id ? `#${unified.guest_id}` : "—")
                      : extras
                        ? `#${extras.guest_id}`
                        : "—"
                  }
                />
              ) : null}
              <Field
                label="Booking"
                value={
                  kind === "extras" && extras
                    ? `#${extras.booking_id}`
                    : unified?.booking_id
                      ? `#${unified.booking_id}`
                      : "—"
                }
              />
              {kind === "extras" && isOpen ? (
                <div>
                  <Label className="mb-1.5 text-xs text-muted-foreground">Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountDraft}
                    onChange={(e) => setAmountDraft(e.target.value)}
                    disabled={busy}
                  />
                </div>
              ) : kind === "claim" && isOpen ? (
                <>
                  <Field label="Current amount" value={money(currentAmount)} />
                  {pendingOffer ? (
                    <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900">
                      {(pendingOffer.actor_role === "host" ? "Host" : pendingOffer.actor_role === "guest" ? "Guest" : "A party")}{" "}
                      offered {money(pendingOffer.amount)}. Approve or reject it on the timeline before finalizing.
                    </div>
                  ) : null}
                  <div>
                    <Label className="mb-1.5 text-xs text-muted-foreground">Your counter (sets amount immediately)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountDraft}
                      onChange={(e) => setAmountDraft(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                </>
              ) : (
                <Field
                  label="Amount"
                  value={
                    kind === "extras" && extras
                        ? money(extras.total_amount)
                        : kind === "claim" && unified
                          ? money(unified.amount ?? unified.claim?.amount)
                          : "—"
                  }
                />
              )}
              {isOpen && (kind === "extras" || kind === "claim" || kind === "general") ? (
                <div>
                  <Label className="mb-1.5 text-xs text-muted-foreground">Admin notes</Label>
                  <Textarea
                    rows={3}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    disabled={busy}
                  />
                </div>
              ) : null}

              <div className="space-y-2 pt-2">
                {isOpen ? (
                  <>
                    <Button
                      className="w-full"
                      disabled={busy || (kind === "claim" && !!pendingOffer)}
                      onClick={() => setConfirm("approve")}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button className="w-full" variant="outline" disabled={busy} onClick={() => setConfirm("deny")}>
                      Deny
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={busy || (kind !== "general" && !(parseFloat(amountDraft) >= 0))}
                      onClick={() => setConfirm("counter")}
                    >
                      Counter
                    </Button>
                    <Button className="w-full" variant="outline" disabled={busy} onClick={() => setConfirm("waive")}>
                      Waive
                    </Button>
                  </>
                ) : null}
                <Button className="w-full" variant="ghost" disabled={busy} onClick={() => setConfirm("delete")}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete ticket
                </Button>
              </div>
            </aside>

            <TicketChat
              kind={kind}
              id={id}
              rooms={rooms}
              disabled={!!chatDisabled}
              events={timelineEvents}
              title={subject || tabTitle}
              tag={kindLabel(kind)}
              source="Via app"
              counterPromptKey={counterPromptKey}
              offerBusy={busy}
              onReviewOffer={(eventId, action) => {
                setOfferEventId(eventId);
                setConfirm(action === "approve" ? "approve_offer" : "reject_offer");
              }}
            />
          </div>
        </>
      )}

      <AlertDialog open={confirm != null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? "Delete this ticket?"
                : confirm === "deny"
                  ? "Deny this ticket?"
                  : confirm === "approve_offer"
                    ? "Approve this counter offer?"
                    : confirm === "reject_offer"
                      ? "Reject this counter offer?"
                      : confirm === "counter"
                        ? kind === "general"
                          ? "Write a counteroffer?"
                          : "Set a new amount?"
                        : confirm === "waive"
                          ? "Waive this ticket?"
                          : kind === "extras"
                            ? "Approve and charge the guest?"
                            : kind === "claim"
                              ? "Approve the current amount?"
                              : "Approve this ticket?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? `${ticketRef(id)} will be removed from the inbox. This is a soft delete.`
                : confirm === "approve_offer"
                  ? `This sets the current amount to ${money(pendingOffer?.amount)}. It does not make it payable yet.`
                  : confirm === "reject_offer"
                    ? `The current amount stays ${money(currentAmount)}.`
                    : confirm === "approve" && kind === "extras"
                      ? `This will charge ${money(parseFloat(amountDraft) || 0)} on ${ticketRef(id)}.`
                      : confirm === "approve" && kind === "claim"
                        ? `Guest or host must pay ${money(currentAmount)}. The ticket stays open until paid.`
                        : confirm === "counter" && kind === "claim"
                          ? "This sets the current amount immediately. You do not need to approve this counter separately."
                          : confirm === "counter" && kind === "general"
                            ? "This will move focus to the conversation so you can send the counteroffer."
                            : `This will update ${ticketRef(id)}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirm === "counter" && kind !== "general" ? (
            <div className="space-y-1.5">
              <Label htmlFor="counter-amount" className="text-xs text-muted-foreground">
                Counter amount
              </Label>
              <Input
                id="counter-amount"
                type="number"
                min="0"
                step="0.01"
                value={amountDraft}
                onChange={(e) => setAmountDraft(e.target.value)}
                disabled={busy}
                autoFocus
              />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={cn(
                (confirm === "deny" ||
                  confirm === "waive" ||
                  confirm === "delete" ||
                  confirm === "reject_offer") &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
              onClick={(e) => {
                e.preventDefault();
                if (confirm === "delete") void runDelete();
                else if (confirm === "deny") void runReject();
                else if (confirm === "counter") void runCounter();
                else if (confirm === "waive") void runWaive();
                else if (confirm === "approve_offer" || confirm === "reject_offer") void runReviewOffer();
                else void runResolve();
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirm === "delete" ? "Delete" : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupportTicketDetailPage;
