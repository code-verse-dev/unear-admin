import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import SearchFilter from "@/components/SearchFilter";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Trash2 } from "lucide-react";
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
  REVIEW_INSTANCE_TYPE,
  REVIEW_ROLE,
  REVIEWS_PAGE_SIZE_DEFAULT,
  reviewUserLabel,
  type AdminReview,
  type ReviewsListParams,
} from "@/api/reviews";
import {
  useDeleteReviewMutation,
  useReviewDetailQuery,
  useReviewsListQuery,
  useUpdateReviewMutation,
} from "@/hooks/useAdminReviews";
import { cn } from "@/lib/utils";

const formatDateUS = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

function roleLabel(role: string): string {
  if (role === REVIEW_ROLE.HOST) return "Host → Guest";
  return "Guest → Host/Car";
}

function instanceLabel(t: number): string {
  if (t === REVIEW_INSTANCE_TYPE.BOOKING) return "Booking";
  if (t === REVIEW_INSTANCE_TYPE.PURCHASE) return "Purchase";
  return `Type ${t}`;
}

function stars(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toFixed(1)} ★`;
}

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

const ReviewsPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [visibilityDraft, setVisibilityDraft] = useState<string>("1");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, visibilityFilter]);

  const listParams = useMemo(() => {
    const p: ReviewsListParams = {
      page,
      limit: REVIEWS_PAGE_SIZE_DEFAULT,
      orderBy: "id",
      order: "DESC",
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (roleFilter !== "all") p.reviewer_role = roleFilter;
    if (visibilityFilter !== "all") p.is_public = visibilityFilter;
    return p;
  }, [page, debouncedSearch, roleFilter, visibilityFilter]);

  const { data, isLoading, isFetching, isError, error, refetch } = useReviewsListQuery(listParams);
  const updateMut = useUpdateReviewMutation();
  const deleteMut = useDeleteReviewMutation();

  const detailId = sheetOpen && selected ? selected.id : 0;
  const detailQuery = useReviewDetailQuery(detailId, sheetOpen);

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "Failed to load reviews",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (sheetOpen && detailQuery.data) {
      setVisibilityDraft(detailQuery.data.is_public ? "1" : "0");
    }
  }, [sheetOpen, detailQuery.data]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openSheet = (row: AdminReview) => {
    setSelected(row);
    setVisibilityDraft(row.is_public ? "1" : "0");
    setSheetOpen(true);
  };

  const displayRow = detailQuery.data ?? selected;

  const saveVisibility = async () => {
    if (!displayRow) return;
    try {
      await updateMut.mutateAsync({
        id: displayRow.id,
        body: { is_public: visibilityDraft === "1" },
      });
      toast({ title: "Review updated", description: "Visibility saved." });
      setSheetOpen(false);
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Could not update review",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await deleteMut.mutateAsync(selected.id);
      toast({ title: "Review deleted" });
      setDeleteDialogOpen(false);
      setSheetOpen(false);
      setSelected(null);
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Could not delete review",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminReview>[] = [
    {
      key: "id",
      header: "ID",
      render: (row) => <span className="font-medium tabular-nums">#{row.id}</span>,
    },
    {
      key: "direction",
      header: "Direction",
      render: (row) => (
        <StatusBadge variant={row.reviewer_role === REVIEW_ROLE.HOST ? "info" : "secondary"}>
          {roleLabel(row.reviewer_role)}
        </StatusBadge>
      ),
    },
    {
      key: "from",
      header: "From",
      render: (row) => (
        <span className="text-sm">{reviewUserLabel(row.user, row.user_id)}</span>
      ),
    },
    {
      key: "about",
      header: "About",
      render: (row) => (
        <span className="text-sm">{reviewUserLabel(row.seller, row.seller_id)}</span>
      ),
    },
    {
      key: "ratings",
      header: "Ratings",
      render: (row) => {
        if (row.is_host_reviewing_guest || row.reviewer_role === REVIEW_ROLE.HOST) {
          return <span className="text-sm tabular-nums">{stars(row.effective_guest_rating ?? row.rating)}</span>;
        }
        return (
          <span className="text-sm tabular-nums">
            H {stars(row.effective_host_rating)} · V {stars(row.effective_vehicle_rating)}
          </span>
        );
      },
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (row) => (
        <StatusBadge variant={row.is_public ? "success" : "warning"}>
          {row.is_public ? "Public" : "Hidden"}
        </StatusBadge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row) => <span className="text-sm text-muted-foreground">{formatDateUS(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-[88px]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={actionIconButtonClass}
            onClick={() => openSheet(row)}
            aria-label="View review"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(actionIconButtonClass, "hover:bg-destructive")}
            onClick={() => {
              setSelected(row);
              setDeleteDialogOpen(true);
            }}
            aria-label="Delete review"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      fullWidth
      title="Reviews"
      subtitle="Guest reviews of hosts and cars, and host reviews of guests after completed trips"
    >
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by name, nickname, review text, or ID…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching}
          filters={[
            {
              label: "Direction",
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { label: "All directions", value: "all" },
                { label: "Guest → Host/Car", value: REVIEW_ROLE.GUEST },
                { label: "Host → Guest", value: REVIEW_ROLE.HOST },
              ],
            },
            {
              label: "Visibility",
              value: visibilityFilter,
              onChange: setVisibilityFilter,
              options: [
                { label: "All", value: "all" },
                { label: "Public", value: "1" },
                { label: "Hidden", value: "0" },
              ],
            },
          ]}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
            setRoleFilter("all");
            setVisibilityFilter("all");
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
          isLoading={isLoading}
          pageSize={REVIEWS_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          emptyMessage="No reviews yet."
          getRowId={(r) => r.id}
        />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetTitle>Review #{displayRow?.id ?? "—"}</SheetTitle>
          <SheetDescription>
            {displayRow ? roleLabel(displayRow.reviewer_role) : "Review details"}
          </SheetDescription>

          {detailQuery.isLoading && !displayRow ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : displayRow ? (
            <div className="mt-6 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-medium">{reviewUserLabel(displayRow.user, displayRow.user_id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">About</p>
                  <p className="font-medium">{reviewUserLabel(displayRow.seller, displayRow.seller_id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p>
                    {instanceLabel(displayRow.instance_type)} #{displayRow.instance_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p>{displayRow.vehicle_id != null ? `#${displayRow.vehicle_id}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p>{formatDateUS(displayRow.createdAt)}</p>
                </div>
              </div>

              {displayRow.reviewer_role === REVIEW_ROLE.HOST ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Guest rating</p>
                  <p className="text-lg font-semibold tabular-nums">{stars(displayRow.rating)}</p>
                  <p className="whitespace-pre-wrap text-foreground/90">{displayRow.review || "—"}</p>
                </div>
              ) : displayRow.is_split_review ? (
                <div className="space-y-3">
                  <div className="space-y-1 rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">Host</p>
                    <p className="font-semibold tabular-nums">{stars(displayRow.host_rating)}</p>
                    <p className="whitespace-pre-wrap">{displayRow.host_review || "—"}</p>
                  </div>
                  <div className="space-y-1 rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">Vehicle</p>
                    <p className="font-semibold tabular-nums">{stars(displayRow.vehicle_rating)}</p>
                    <p className="whitespace-pre-wrap">{displayRow.vehicle_review || "—"}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="font-semibold tabular-nums">{stars(displayRow.rating)}</p>
                  <p className="whitespace-pre-wrap">{displayRow.review || "—"}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="review-visibility">Visibility</Label>
                <Select value={visibilityDraft} onValueChange={setVisibilityDraft}>
                  <SelectTrigger id="review-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Public</SelectItem>
                    <SelectItem value="0">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <SheetFooter className="mt-8 flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={!displayRow || deleteMut.isPending}
            >
              Delete
            </Button>
            <Button type="button" onClick={saveVisibility} disabled={!displayRow || updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the review and recalculates average ratings. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default ReviewsPage;
