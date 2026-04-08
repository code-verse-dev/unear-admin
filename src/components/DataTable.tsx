import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

/** Page numbers with ellipses (delta = pages around current). */
function getPaginationItems(current: number, total: number, delta = 2): (number | "ellipsis")[] {
  if (total <= 1) return [1];
  const range: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }
  const out: (number | "ellipsis")[] = [];
  let prev: number | undefined;
  for (const i of range) {
    if (prev !== undefined) {
      if (i - prev === 2) {
        out.push(prev + 1);
      } else if (i - prev !== 1) {
        out.push("ellipsis");
      }
    }
    out.push(i);
    prev = i;
  }
  return out;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  getRowId?: (row: T) => string | number;
  /** Initial load: table-shaped skeletons instead of empty state. */
  isLoading?: boolean;
  skeletonRowCount?: number;
  /** Rows per page (for skeleton count default and range label). */
  pageSize?: number;
  /** Total rows in the full result set (for "Showing X–Y of Z"). */
  totalRecords?: number;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = "No data found.",
  getRowId,
  isLoading = false,
  skeletonRowCount,
  pageSize = 20,
  totalRecords,
}: DataTableProps<T>) {
  const rowsSkeleton = skeletonRowCount ?? pageSize;
  const safeTotalPages = Math.max(1, totalPages);
  const showPagination =
    Boolean(onPageChange) &&
    (safeTotalPages > 1 || (typeof totalRecords === "number" && totalRecords > 0));

  const rangeLabel = (() => {
    if (totalRecords == null) {
      return `Page ${page} of ${safeTotalPages}`;
    }
    if (totalRecords === 0) return "No results";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalRecords);
    return `Showing ${start}–${end} of ${totalRecords}`;
  })();

  const pageItems = getPaginationItems(page, safeTotalPages);

  return (
    <div className="table-container w-full min-w-0">
      <div className="relative w-full min-w-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: rowsSkeleton }).map((_, rowIdx) => (
                <TableRow key={`sk-${rowIdx}`} className="hover:bg-transparent">
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      <Skeleton
                        className={cn(
                          "h-4 w-full max-w-[120px]",
                          col.key === "actions" && "max-w-[200px] h-8",
                          col.key === "email" && "max-w-[180px]"
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow
                  key={getRowId != null ? String(getRowId(row)) : idx}
                  className="hover:bg-muted/30"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && onPageChange && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-sm text-muted-foreground tabular-nums order-2 sm:order-1">{rangeLabel}</p>

          <div className="flex flex-wrap items-center justify-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border"
              onClick={() => onPageChange(1)}
              disabled={page <= 1 || isLoading}
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-0.5 px-1">
              {pageItems.map((item, i) =>
                item === "ellipsis" ? (
                  <span
                    key={`e-${i}`}
                    className="px-2 text-muted-foreground text-sm select-none"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 min-w-8 px-2.5 border-border",
                      item === page && "pointer-events-none"
                    )}
                    onClick={() => onPageChange(item)}
                    disabled={isLoading}
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? "page" : undefined}
                  >
                    {item}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= safeTotalPages || isLoading}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border"
              onClick={() => onPageChange(safeTotalPages)}
              disabled={page >= safeTotalPages || isLoading}
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
