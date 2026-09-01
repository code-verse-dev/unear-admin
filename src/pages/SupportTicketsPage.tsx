import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Car,
  Copy,
  Download,
  Eye,
  FileText,
  Headset,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Scale,
  Trash2,
} from "lucide-react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import MetricCard from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { useDisputeRequestsListQuery } from "@/hooks/useAdminDisputeRequests";
import { useDamageTicketsListQuery } from "@/hooks/useAdminDamageTickets";
import { useBookingInvoicesListQuery } from "@/hooks/useAdminBookingInvoices";
import { useDeleteSupportTicketMutation } from "@/hooks/useSupportTicketChat";
import {
  SUPPORT_PAGE_SIZE,
  exportTicketsCsv,
  kindChipClass,
  kindLabel,
  rowFromDamage,
  rowFromDispute,
  rowFromExtras,
  ticketMatchesSearch,
  type SupportTicketRow,
} from "@/lib/supportTickets";
import { cn } from "@/lib/utils";

const money = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

const formatDateUS = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

function relative(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return formatDateUS(iso);
  }
}

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

type SortKey = "newest" | "oldest" | "updated" | "amount";

const SupportTicketsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const typeFromUrl = searchParams.get("type");
  const [typeFilter, setTypeFilter] = useState<string>(
    typeFromUrl === "dispute" || typeFromUrl === "damage" || typeFromUrl === "extras" ? typeFromUrl : "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [pendingDelete, setPendingDelete] = useState<SupportTicketRow[] | null>(null);

  const deleteMut = useDeleteSupportTicketMutation();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setSelected({});
  }, [debouncedSearch, typeFilter, statusFilter, sortKey]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (typeFilter === "all") next.delete("type");
    else next.set("type", typeFilter);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const disputesQ = useDisputeRequestsListQuery({
    page: 1,
    limit: 100,
    orderBy: "id",
    order: "DESC",
  });
  const damageQ = useDamageTicketsListQuery({
    page: 1,
    limit: 100,
    orderBy: "id",
    order: "DESC",
  });
  const extrasQ = useBookingInvoicesListQuery({ status: "all" });

  const isLoading = disputesQ.isLoading || damageQ.isLoading || extrasQ.isLoading;
  const isFetching = disputesQ.isFetching || damageQ.isFetching || extrasQ.isFetching;

  const allRows = useMemo(() => {
    return [
      ...(disputesQ.data?.rows ?? []).map(rowFromDispute),
      ...(damageQ.data?.rows ?? []).map(rowFromDamage),
      ...(extrasQ.data ?? []).map(rowFromExtras),
    ];
  }, [disputesQ.data, damageQ.data, extrasQ.data]);

  const rows = useMemo(() => {
    let list = allRows;
    if (typeFilter !== "all") list = list.filter((r) => r.kind === typeFilter);
    if (statusFilter === "open") list = list.filter((r) => r.isOpen);
    if (statusFilter === "closed") list = list.filter((r) => !r.isOpen);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((r) => ticketMatchesSearch(r, q));
    }
    list = [...list].sort((a, b) => {
      if (sortKey === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortKey === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortKey === "amount") return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [allRows, typeFilter, statusFilter, debouncedSearch, sortKey]);

  const stats = useMemo(() => {
    const open = allRows.filter((r) => r.isOpen).length;
    return {
      open,
      closed: allRows.length - open,
      dispute: allRows.filter((r) => r.kind === "dispute").length,
      damage: allRows.filter((r) => r.kind === "damage").length,
      extras: allRows.filter((r) => r.kind === "extras").length,
    };
  }, [allRows]);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / SUPPORT_PAGE_SIZE) || 1);
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * SUPPORT_PAGE_SIZE, currentPage * SUPPORT_PAGE_SIZE);
  const selectedKeys = Object.keys(selected).filter((k) => selected[k]);
  const selectedOnPage = pageRows.filter((r) => selected[r.key]);
  const allPageSelected = pageRows.length > 0 && selectedOnPage.length === pageRows.length;

  const openTicket = (r: SupportTicketRow) => navigate(`/support-tickets/${r.kind}/${r.id}`);

  const copyId = async (r: SupportTicketRow) => {
    try {
      await navigator.clipboard.writeText(`Ticket #${r.id}`);
      toast({ title: "Copied", description: `Ticket #${r.id}` });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const runDelete = async () => {
    if (!pendingDelete?.length) return;
    let ok = 0;
    let failed = 0;
    for (const r of pendingDelete) {
      try {
        await deleteMut.mutateAsync({ kind: r.kind, id: r.id });
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    setPendingDelete(null);
    setSelected({});
    if (ok) toast({ title: ok === 1 ? "Ticket deleted" : `${ok} tickets deleted` });
    if (failed) {
      toast({
        title: "Some deletes failed",
        description: `${failed} could not be removed.`,
        variant: "destructive",
      });
    }
  };

  const columns: Column<SupportTicketRow>[] = [
    {
      key: "select",
      header: "",
      className: "w-10",
      render: (r) => (
        <Checkbox
          checked={!!selected[r.key]}
          onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [r.key]: v === true }))}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ticket ${r.id}`}
        />
      ),
    },
    {
      key: "id",
      header: "Ticket",
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.previewUrl ? (
            <img src={r.previewUrl} alt="" className="h-10 w-10 rounded-md object-cover border border-border" />
          ) : r.attachmentCount > 0 ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : r.requesterImage ? (
            <img src={r.requesterImage} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {r.requesterName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="font-mono text-xs tabular-nums">#{r.id}</span>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Type",
      render: (r) => (
        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", kindChipClass(r.kind))}>
          {kindLabel(r.kind)}
        </span>
      ),
    },
    {
      key: "title",
      header: "Subject",
      className: "min-w-[180px]",
      render: (r) => (
        <div>
          <div className="line-clamp-1 text-sm font-medium">{r.title}</div>
          <div className="line-clamp-1 text-xs text-muted-foreground">{r.requesterName}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge variant={r.statusVariant}>{r.statusLabel}</StatusBadge>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (r) => <span className="tabular-nums text-sm">{money(r.amount)}</span>,
    },
    {
      key: "updatedAt",
      header: "Activity",
      render: (r) => (
        <div>
          <div className="text-sm">{relative(r.updatedAt)}</div>
          <div className="text-[11px] text-muted-foreground">Opened {formatDateUS(r.createdAt)}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className={actionIconButtonClass}
            onClick={() => openTicket(r)}
            title="Open"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={actionIconButtonClass} title="More">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openTicket(r)}>
                <Eye className="mr-2 h-4 w-4" /> Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void copyId(r)}>
                <Copy className="mr-2 h-4 w-4" /> Copy ticket ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPendingDelete([r])}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      fullWidth
      title="Support Tickets"
      subtitle="One inbox for disputes, damage, and trip extras"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void disputesQ.refetch();
              void damageQ.refetch();
              void extrasQ.refetch();
            }}
            disabled={isFetching}
          >
            <RefreshCw className={cn("mr-1 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportTicketsCsv(rows)} disabled={!rows.length}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Open" value={stats.open} icon={Headset} variant="warning" />
        <MetricCard title="Closed" value={stats.closed} icon={Scale} variant="success" />
        <button type="button" className="text-left" onClick={() => setTypeFilter("dispute")}>
          <MetricCard title="Disputes" value={stats.dispute} icon={Scale} variant="info" />
        </button>
        <button type="button" className="text-left" onClick={() => setTypeFilter("damage")}>
          <MetricCard title="Damage" value={stats.damage} icon={AlertTriangle} variant="destructive" />
        </button>
        <button type="button" className="text-left" onClick={() => setTypeFilter("extras")}>
          <MetricCard title="Trip extras" value={stats.extras} icon={Car} variant="secondary" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["dispute", "Dispute"],
            ["damage", "Damage"],
            ["extras", "Trip extras"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={typeFilter === value ? "default" : "outline"}
            onClick={() => setTypeFilter(value)}
          >
            {label}
            <span className="ml-1.5 tabular-nums opacity-70">
              {value === "all" ? allRows.length : value === "dispute" ? stats.dispute : value === "damage" ? stats.damage : stats.extras}
            </span>
          </Button>
        ))}
      </div>

      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by ticket #, name, email, booking…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching && !isLoading}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "Open", value: "open" },
                { label: "Closed", value: "closed" },
                { label: "All statuses", value: "all" },
              ],
            },
            {
              label: "Sort",
              value: sortKey,
              onChange: (v) => setSortKey(v as SortKey),
              options: [
                { label: "Newest", value: "newest" },
                { label: "Oldest", value: "oldest" },
                { label: "Last activity", value: "updated" },
                { label: "Amount", value: "amount" },
              ],
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
            setTypeFilter("all");
            setStatusFilter("open");
            setSortKey("newest");
            setPage(1);
          }}
        />
      </div>

      {selectedKeys.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <p className="text-sm font-medium">{selectedKeys.length} selected</p>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setPendingDelete(rows.filter((r) => selected[r.key]))}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected({})}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allPageSelected}
            onCheckedChange={(v) => {
              const on = v === true;
              setSelected((prev) => {
                const next = { ...prev };
                pageRows.forEach((r) => {
                  next[r.key] = on;
                });
                return next;
              });
            }}
            aria-label="Select page"
          />
          Select page
        </div>
        <DataTable
          columns={columns}
          data={pageRows}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={openTicket}
          getRowId={(r) => r.key}
          isLoading={isLoading}
          pageSize={SUPPORT_PAGE_SIZE}
          totalRecords={totalRecords}
          emptyMessage="No support tickets match your filters."
        />
      </div>

      <AlertDialog open={pendingDelete != null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete?.length === 1 ? `ticket #${pendingDelete[0].id}` : `${pendingDelete?.length ?? 0} tickets`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from the inbox. Records are soft-deleted and will no longer appear for users as open
              tickets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void runDelete();
              }}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default SupportTicketsPage;
