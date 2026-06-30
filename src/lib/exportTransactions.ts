import { downloadCsv } from "@/lib/exportCsv";
import {
  type ReferencePadDigits,
  transactionReferenceNumber,
} from "@/lib/transactionReference";
import {
  listTransactions,
  type AdminTransaction,
  type TransactionsListParams,
} from "@/api/transactions";

const TRANSACTION_TYPE_DEBIT = 10;
const TRANSACTION_TYPE_CREDIT = 20;

const INSTANCE_LABELS: Record<number, string> = {
  10: "Inspection",
  20: "Purchase",
  25: "Final purchase",
  30: "Rent",
  40: "Rent extension",
};

function transactionTypeLabel(t: number): string {
  if (t === TRANSACTION_TYPE_DEBIT) return "Debit";
  if (t === TRANSACTION_TYPE_CREDIT) return "Credit";
  return `Type ${t}`;
}

function instanceLabel(t: number): string {
  return INSTANCE_LABELS[t] ?? `Instance ${t}`;
}

function displayUserName(t: AdminTransaction): string {
  const u = t.user;
  if (!u) return `User #${t.user_id}`;
  const n = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
  return n || `User #${u.id}`;
}

function formatDateUS(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function txnReference(t: AdminTransaction, pad: ReferencePadDigits = "8"): string {
  return transactionReferenceNumber(t, pad);
}

async function fetchAllTransactions(
  params: Omit<TransactionsListParams, "page">
): Promise<AdminTransaction[]> {
  const limit = 500;
  let page = 1;
  let totalPages = 1;
  const all: AdminTransaction[] = [];

  while (page <= totalPages) {
    const result = await listTransactions({ ...params, page, limit });
    all.push(...result.rows);
    totalPages = Math.max(1, result.links?.total ?? 1);
    page += 1;
    if (result.rows.length === 0) break;
  }

  return all;
}

export async function exportTransactionsExcel(
  params: Omit<TransactionsListParams, "page" | "limit">
): Promise<number> {
  const pad = params.reference_pad ?? "8";
  const rows = await fetchAllTransactions({
    ...params,
    orderBy: params.orderBy ?? "id",
    order: params.order ?? "DESC",
  });

  const headers = [
    "Reference Number",
    "Date",
    "User",
    "User ID",
    "Amount (USD)",
    "Debit / Credit",
    "Instance",
    "Instance ID",
    "Status",
    "Description",
  ];

  const data = rows.map((t) => [
    txnReference(t, pad),
    formatDateUS(t.createdAt),
    displayUserName(t),
    String(t.user_id),
    String(Number(t.transaction_amount) || 0),
    transactionTypeLabel(t.transaction_type),
    instanceLabel(t.instance_type),
    String(t.instance_id),
    t.status,
    t.description ?? "",
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`unear-transactions-${stamp}.csv`, headers, data);
  return rows.length;
}

export { transactionReferenceNumber } from "@/lib/transactionReference";
