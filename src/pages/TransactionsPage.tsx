import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  TRANSACTIONS_PAGE_SIZE_DEFAULT,
  type AdminTransaction,
  type TransactionsListParams,
} from "@/api/transactions";
import { useTransactionDetailQuery, useTransactionsListQuery } from "@/hooks/useAdminTransactions";
import { cn } from "@/lib/utils";

const formatDateUS = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

const TRANSACTION_TYPE_DEBIT = 10;
const TRANSACTION_TYPE_CREDIT = 20;

function transactionTypeLabel(t: number): string {
  if (t === TRANSACTION_TYPE_DEBIT) return "Debit";
  if (t === TRANSACTION_TYPE_CREDIT) return "Credit";
  return `Type ${t}`;
}

const INSTANCE_LABELS: Record<number, string> = {
  10: "Inspection",
  20: "Purchase",
  25: "Final purchase",
  30: "Rent",
  40: "Rent extension",
};

function instanceLabel(t: number): string {
  return INSTANCE_LABELS[t] ?? `Instance ${t}`;
}

function displayUserName(t: AdminTransaction): string {
  const u = t.user;
  if (!u) return `User #${t.user_id}`;
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || `User #${u.id}`;
}

function txnStatusVariant(
  s: string
): "success" | "warning" | "destructive" | "default" | "secondary" | "info" {
  const x = s.toLowerCase();
  if (x.includes("succeeded") || x.includes("success") || x === "completed" || x === "paid")
    return "success";
  if (x.includes("refund")) return "info";
  if (x.includes("fail") || x.includes("cancel") || x.includes("void")) return "destructive";
  if (x.includes("pending") || x.includes("processing") || x.includes("require")) return "warning";
  return "secondary";
}

function truncateId(id: string, max = 14) {
  if (!id || id.length <= max) return id || "—";
  return `${id.slice(0, max)}…`;
}

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

const TransactionsPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<AdminTransaction | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const listParams: TransactionsListParams = useMemo(() => {
    const p: TransactionsListParams = {
      page,
      limit: TRANSACTIONS_PAGE_SIZE_DEFAULT,
      orderBy: "id",
      order: "DESC",
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter !== "all") p.status = statusFilter;
    return p;
  }, [page, debouncedSearch, statusFilter]);

  const { data, isLoading, isFetching, isError, error, refetch } = useTransactionsListQuery(listParams);

  const detailId = sheetOpen && selected ? selected.id : 0;
  const detailQuery = useTransactionDetailQuery(detailId, sheetOpen);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "Failed to load transactions",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openSheet = (row: AdminTransaction) => {
    setSelected(row);
    setSheetOpen(true);
  };

  const displayTxn = detailQuery.data ?? selected;

  const columns: Column<AdminTransaction>[] = [
    {
      key: "id",
      header: "ID",
      render: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      key: "gateway_transaction_id",
      header: "Gateway ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground" title={row.gateway_transaction_id}>
          {truncateId(row.gateway_transaction_id, 16)}
        </span>
      ),
    },
    {
      key: "transaction_amount",
      header: "Amount",
      render: (row) => <span className="tabular-nums font-medium">{money(row.transaction_amount)}</span>,
    },
    {
      key: "transaction_type",
      header: "Dr / Cr",
      render: (row) => <span className="text-sm">{transactionTypeLabel(row.transaction_type)}</span>,
    },
    {
      key: "instance_type",
      header: "Instance",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{instanceLabel(row.instance_type)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge variant={txnStatusVariant(row.status)}>{row.status}</StatusBadge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
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
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const totalAmountLabel =
    typeof data?.totalAmount === "number" ? money(data.totalAmount) : null;

  return (
    <PageContainer
      fullWidth
      title="Transactions"
      subtitle={
        totalAmountLabel
          ? `Financial history · Filtered total ${totalAmountLabel}`
          : "Financial transaction history"
      }
    >
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by id, gateway id, description, or user name…"
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
                { label: "Succeeded", value: "succeeded" },
                { label: "Pending", value: "pending" },
                { label: "Processing", value: "processing" },
                { label: "Failed", value: "failed" },
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
          pageSize={TRANSACTIONS_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          emptyMessage={isError ? "Could not load transactions." : "No transactions match your filters."}
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
          <SheetDescription className="sr-only">Transaction payment record</SheetDescription>
          {displayTxn ? (
            <SheetTitle className="sr-only">Transaction #{displayTxn.id}</SheetTitle>
          ) : (
            <SheetTitle className="sr-only">Transaction details</SheetTitle>
          )}
          {displayTxn ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-4 flex items-start justify-between gap-2 pr-2">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Transaction #{displayTxn.id}</h2>
                    <p className="text-sm text-muted-foreground">Payment record details</p>
                  </div>
                  {detailQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  ) : null}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">User</span>
                      <div className="font-medium leading-tight">{displayUserName(displayTxn)}</div>
                      <p className="text-xs text-muted-foreground">User #{displayTxn.user_id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Amount</span>
                      <div className="font-semibold tabular-nums">{money(displayTxn.transaction_amount)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <div className="mt-0.5">
                        <StatusBadge variant={txnStatusVariant(displayTxn.status)}>{displayTxn.status}</StatusBadge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Type</span>
                      <div>{transactionTypeLabel(displayTxn.transaction_type)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Instance</span>
                      <div>
                        {instanceLabel(displayTxn.instance_type)} (#{displayTxn.instance_id})
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Gateway ID</span>
                      <div className="break-all font-mono text-xs">{displayTxn.gateway_transaction_id}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">User type</span>
                      <div>{displayTxn.user_type}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Created</span>
                      <div>{formatDateUS(displayTxn.createdAt)}</div>
                    </div>
                    {displayTxn.description ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Description</span>
                        <div className="mt-0.5 whitespace-pre-wrap text-xs">{displayTxn.description}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <SheetFooter className="border-t border-border bg-background p-4">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSheetOpen(false)}>
                  Close
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

export default TransactionsPage;
