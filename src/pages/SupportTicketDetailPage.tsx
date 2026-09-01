import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TicketChat } from "@/components/support/TicketChat";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/admin-api";
import { DISPUTE_REQUEST_STATUS } from "@/api/disputeRequests";
import { DAMAGE_TICKET_STATUS } from "@/api/damageTickets";
import { extrasIsOpen, extrasStatusLabel, extrasStatusVariant } from "@/api/bookingInvoices";
import type { SupportChatRoom, SupportTicketKind } from "@/api/supportTicketChat";
import {
  damageStatusLabel,
  damageStatusVariant,
  disputeStatusLabel,
  disputeStatusVariant,
  kindLabel,
  partyName,
} from "@/lib/supportTickets";
import { useDisputeRequestDetailQuery, useUpdateDisputeRequestMutation } from "@/hooks/useAdminDisputeRequests";
import {
  useChargeDamageTicketMutation,
  useDamageTicketDetailQuery,
  useUpdateDamageTicketMutation,
} from "@/hooks/useAdminDamageTickets";
import { useBookingInvoiceDetailQuery, useUpdateBookingInvoiceMutation } from "@/hooks/useAdminBookingInvoices";
import { useDeleteSupportTicketMutation } from "@/hooks/useSupportTicketChat";
import { buildSupportTicketEvents, initials } from "@/lib/ticketTimeline";
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

const KINDS: SupportTicketKind[] = ["dispute", "damage", "extras"];

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
  const kind = (kindParam || "") as SupportTicketKind;
  const id = Number(idParam);
  const valid = KINDS.includes(kind) && id > 0;

  const disputeQ = useDisputeRequestDetailQuery(id, valid && kind === "dispute");
  const damageQ = useDamageTicketDetailQuery(id, valid && kind === "damage");
  const extrasQ = useBookingInvoiceDetailQuery(id, valid && kind === "extras");

  const updateDispute = useUpdateDisputeRequestMutation();
  const updateDamage = useUpdateDamageTicketMutation();
  const chargeDamage = useChargeDamageTicketMutation();
  const updateExtras = useUpdateBookingInvoiceMutation();
  const deleteMut = useDeleteSupportTicketMutation();

  const [amountDraft, setAmountDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [confirm, setConfirm] = useState<"resolve" | "reject" | "charge" | "waive" | "delete" | null>(null);

  const dispute = disputeQ.data;
  const damage = damageQ.data;
  const extras = extrasQ.data;

  useEffect(() => {
    if (kind === "damage" && damage) {
      setAmountDraft(String(damage.final_amount ?? damage.proposed_amount ?? ""));
      setNotesDraft(damage.admin_notes || "");
    }
    if (kind === "extras" && extras) {
      setAmountDraft(String(extras.total_amount ?? ""));
      setNotesDraft(extras.dispute_note || extras.note || "");
    }
  }, [kind, damage, extras]);

  const loading =
    (kind === "dispute" && disputeQ.isLoading) ||
    (kind === "damage" && damageQ.isLoading) ||
    (kind === "extras" && extrasQ.isLoading);

  const error =
    (kind === "dispute" && disputeQ.error) ||
    (kind === "damage" && damageQ.error) ||
    (kind === "extras" && extrasQ.error);

  const statusLabel = useMemo(() => {
    if (kind === "dispute" && dispute) return disputeStatusLabel(dispute.status);
    if (kind === "damage" && damage) return damageStatusLabel(damage.status);
    if (kind === "extras" && extras) return extrasStatusLabel(extras.status);
    return "—";
  }, [kind, dispute, damage, extras]);

  const statusVariant = useMemo(() => {
    if (kind === "dispute" && dispute) return disputeStatusVariant(dispute.status);
    if (kind === "damage" && damage) return damageStatusVariant(damage.status);
    if (kind === "extras" && extras) return extrasStatusVariant(extras.status);
    return "secondary" as const;
  }, [kind, dispute, damage, extras]);

  const isOpen =
    (kind === "dispute" && dispute?.status === DISPUTE_REQUEST_STATUS.REQUESTED) ||
    (kind === "damage" &&
      damage &&
      damage.status !== DAMAGE_TICKET_STATUS.CHARGED &&
      damage.status !== DAMAGE_TICKET_STATUS.CANCELLED) ||
    (kind === "extras" && extras && extrasIsOpen(extras.status));

  const chatDisabled = kind === "damage" && damage?.status === DAMAGE_TICKET_STATUS.CANCELLED;

  const rooms: { id: SupportChatRoom; label: string }[] =
    kind === "dispute"
      ? [{ id: "user", label: "User" }]
      : [
          { id: "host", label: "Host" },
          { id: "guest", label: "Guest" },
        ];

  const headerUser = (() => {
    if (kind === "dispute" && dispute) {
      return {
        name: dispute.full_name || partyName(dispute.user, `User #${dispute.user_id}`),
        subtitle: dispute.category || kindLabel(kind),
        image: resolveMediaUrl(dispute.user?.image_url),
        email: dispute.email,
        phone: dispute.phone_number,
        meta: [dispute.car_model_year, dispute.email].filter(Boolean).join(" · "),
      };
    }
    if (kind === "damage" && damage) {
      const guest = partyName(damage.guest, `Guest #${damage.guest_id}`);
      const vehicle = damage.booking?.vehicle
        ? [damage.booking.vehicle.year, damage.booking.vehicle.make, damage.booking.vehicle.model]
            .filter(Boolean)
            .join(" ")
        : `Booking #${damage.booking_id}`;
      return {
        name: guest,
        subtitle: `Host ${partyName(damage.host, `#${damage.host_id}`)}`,
        image: resolveMediaUrl(damage.guest?.image_url),
        email: damage.guest?.email,
        phone: damage.guest?.mobile_no || undefined,
        meta: vehicle,
      };
    }
    if (kind === "extras" && extras) {
      return {
        name: `Guest #${extras.guest_id}`,
        subtitle: `Host #${extras.host_id}`,
        image: undefined as string | undefined,
        email: undefined as string | undefined,
        phone: undefined as string | undefined,
        meta: `Booking #${extras.booking_id}`,
      };
    }
    return {
      name: "—",
      subtitle: kindLabel(kind),
      image: undefined as string | undefined,
      email: undefined as string | undefined,
      phone: undefined as string | undefined,
      meta: "",
    };
  })();

  const subject =
    kind === "dispute" && dispute
      ? dispute.category
      : kind === "damage" && damage
        ? damage.damage_description?.trim() || `Booking #${damage.booking_id}`
        : extras?.items?.[0]?.title || kindLabel(kind);

  const tabTitle = `${kindLabel(kind)} — TKT — ${id}`;

  const timelineEvents = useMemo(
    () => buildSupportTicketEvents({ kind, dispute, damage, extras }),
    [kind, dispute, damage, extras]
  );

  const runResolve = async () => {
    try {
      if (kind === "dispute") {
        await updateDispute.mutateAsync({ id, body: { status: DISPUTE_REQUEST_STATUS.COMPLETED } });
        toast({ title: "Ticket resolved", description: `Ticket #${id}` });
      } else if (kind === "damage") {
        const amount = parseFloat(amountDraft) || Number(damage?.final_amount) || 0;
        await chargeDamage.mutateAsync({
          id,
          body: { final_amount: amount, admin_notes: notesDraft || null },
        });
        toast({ title: "Guest charged", description: `Ticket #${id}` });
      } else if (kind === "extras") {
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
        toast({ title: "Extras confirmed", description: `Ticket #${id}` });
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
      if (kind === "dispute") {
        await updateDispute.mutateAsync({ id, body: { status: DISPUTE_REQUEST_STATUS.CANCELLED } });
      } else if (kind === "damage") {
        await updateDamage.mutateAsync({
          id,
          body: { status: DAMAGE_TICKET_STATUS.CANCELLED, admin_notes: notesDraft || null },
        });
      } else if (kind === "extras") {
        await updateExtras.mutateAsync({
          id,
          body: { action: "waive", note: notesDraft || null },
        });
      }
      setConfirm(null);
      toast({ title: kind === "extras" ? "Extras waived" : "Ticket rejected", description: `Ticket #${id}` });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const runDelete = async () => {
    try {
      await deleteMut.mutateAsync({ kind, id });
      setConfirm(null);
      toast({ title: "Ticket deleted", description: `Ticket #${id} was removed.` });
      navigate("/support-tickets");
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const busy =
    updateDispute.isPending ||
    updateDamage.isPending ||
    chargeDamage.isPending ||
    updateExtras.isPending ||
    deleteMut.isPending;

  const openDot =
    statusVariant === "success"
      ? "bg-emerald-500"
      : statusVariant === "destructive"
        ? "bg-red-500"
        : statusVariant === "warning"
          ? "bg-amber-500"
          : "bg-emerald-500";

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
            <div className="flex min-w-0 items-center gap-3">
              {headerUser.image ? (
                <img src={headerUser.image} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold tracking-wide text-white">
                  {initials(headerUser.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{headerUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">{headerUser.subtitle}</p>
              </div>
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
              <p className="text-xs text-muted-foreground">Ticket # {id}</p>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="min-h-0 space-y-4 overflow-y-auto border-r border-border bg-background p-5">
              <Field label="Requester" value={headerUser.name} />
              <Field label="Type" value={kindLabel(kind)} />
              {kind === "damage" && damage ? (
                <Field label="Host" value={partyName(damage.host, `#${damage.host_id}`)} />
              ) : null}
              {kind === "extras" && extras ? <Field label="Host" value={`#${extras.host_id}`} /> : null}
              {kind !== "dispute" ? (
                <Field
                  label="Guest"
                  value={
                    kind === "damage" && damage
                      ? partyName(damage.guest, `#${damage.guest_id}`)
                      : extras
                        ? `#${extras.guest_id}`
                        : "—"
                  }
                />
              ) : null}
              <Field
                label="Booking"
                value={
                  kind === "damage" && damage
                    ? `#${damage.booking_id}`
                    : kind === "extras" && extras
                      ? `#${extras.booking_id}`
                      : kind === "dispute" && dispute
                        ? `Txn ${dispute.transaction_id}`
                        : "—"
                }
              />
              {(kind === "damage" || kind === "extras") && isOpen ? (
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
              ) : (
                <Field
                  label="Amount"
                  value={
                    kind === "damage" && damage
                      ? money(damage.final_amount ?? damage.proposed_amount)
                      : kind === "extras" && extras
                        ? money(extras.total_amount)
                        : "—"
                  }
                />
              )}
              {isOpen && (kind === "damage" || kind === "extras") ? (
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
                    <Button className="w-full" disabled={busy} onClick={() => setConfirm(kind === "damage" ? "charge" : "resolve")}>
                      <Check className="mr-1 h-4 w-4" />
                      {kind === "damage" ? "Charge guest" : kind === "extras" ? "Confirm & charge" : "Mark as Resolved"}
                    </Button>
                    <Button className="w-full" variant="outline" disabled={busy} onClick={() => setConfirm("reject")}>
                      {kind === "extras" ? "Waive" : "Reject"}
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
                : confirm === "reject" || confirm === "waive"
                  ? kind === "extras"
                    ? "Waive these extras?"
                    : "Reject this ticket?"
                  : confirm === "charge"
                    ? "Charge the guest?"
                    : "Mark as resolved?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? `Ticket #${id} will be removed from the inbox. This is a soft delete.`
                : confirm === "charge" || (confirm === "resolve" && kind === "extras")
                  ? `This will charge ${money(parseFloat(amountDraft) || 0)} on ticket #${id}.`
                  : `This will update ticket #${id}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={cn(
                (confirm === "reject" || confirm === "waive" || confirm === "delete") &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
              onClick={(e) => {
                e.preventDefault();
                if (confirm === "delete") void runDelete();
                else if (confirm === "reject" || confirm === "waive") void runReject();
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
