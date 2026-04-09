import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable, { Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import SearchFilter from "@/components/SearchFilter";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/RichTextEditor";
import { FAQS_PAGE_SIZE_DEFAULT, type AdminFaq } from "@/api/adminFaqs";
import {
  useCreateFaqMutation,
  useDeleteFaqMutation,
  useFaqsListQuery,
  useUpdateFaqMutation,
} from "@/hooks/useAdminFaqs";
import { cn } from "@/lib/utils";
import { htmlPlainPreview } from "@/lib/htmlPreview";

function formatDateUS(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

const actionIconButtonClass =
  "h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors";

const deleteIconButtonClass =
  "h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors";

const FaqsPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<AdminFaq | null>(null);
  const [viewingFaq, setViewingFaq] = useState<AdminFaq | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<AdminFaq | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const listParams = useMemo(
    () => ({
      page,
      limit: FAQS_PAGE_SIZE_DEFAULT,
      orderBy: "id",
      order: "DESC" as const,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, debouncedSearch]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useFaqsListQuery(listParams);
  const createMut = useCreateFaqMutation();
  const updateMut = useUpdateFaqMutation();
  const deleteMut = useDeleteFaqMutation();

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load FAQs", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openAdd = () => {
    setEditingFaq(null);
    setForm({ title: "", content: "" });
    setFormSheetOpen(true);
  };

  const openEdit = (faq: AdminFaq) => {
    setEditingFaq(faq);
    setForm({ title: faq.title, content: faq.content || "" });
    setFormSheetOpen(true);
  };

  const openView = (faq: AdminFaq) => {
    setViewingFaq(faq);
    setViewSheetOpen(true);
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const plain = form.content.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!title || !plain) {
      toast({ title: "Validation", description: "Title and answer content are required.", variant: "destructive" });
      return;
    }
    try {
      if (editingFaq) {
        await updateMut.mutateAsync({ id: editingFaq.id, body: { title, content: form.content } });
        toast({ title: "FAQ updated" });
      } else {
        await createMut.mutateAsync({ title, content: form.content });
        toast({ title: "FAQ created" });
      }
      setFormSheetOpen(false);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingFaq) return;
    try {
      await deleteMut.mutateAsync(deletingFaq.id);
      toast({ title: "FAQ deleted" });
      setDeleteDialogOpen(false);
      setDeletingFaq(null);
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminFaq>[] = [
    { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs tabular-nums">{r.id}</span> },
    {
      key: "title",
      header: "Title",
      className: "min-w-[160px]",
      render: (r) => <span className="font-medium leading-snug line-clamp-2">{r.title}</span>,
    },
    {
      key: "preview",
      header: "Preview",
      className: "max-w-[min(220px,32vw)] w-[min(220px,32vw)]",
      render: (r) => (
        <span className="block text-xs text-muted-foreground line-clamp-2 break-words">{htmlPlainPreview(r.content)}</span>
      ),
    },
    { key: "updatedAt", header: "Updated", render: (r) => <span className="text-sm">{formatDateUS(r.updatedAt)}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className={actionIconButtonClass} onClick={() => openView(row)} title="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className={actionIconButtonClass} onClick={() => openEdit(row)} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={deleteIconButtonClass}
            onClick={() => {
              setDeletingFaq(row);
              setDeleteDialogOpen(true);
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <PageContainer
      fullWidth
      title="FAQs"
      subtitle="Manage frequently asked questions (API: title + HTML content)"
      actions={
        <Button className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add FAQ
        </Button>
      }
    >
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by title or content…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isFetching}
          onReset={() => {
            setSearchInput("");
            setDebouncedSearch("");
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
          pageSize={FAQS_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          emptyMessage={isError ? "Could not load FAQs." : "No FAQs match your search."}
        />
      </div>

      <Sheet open={formSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent
          side="right"
          className={cn("flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-3xl")}
        >
          <SheetDescription className="sr-only">
            {editingFaq ? "Edit FAQ question and answer" : "Create a new FAQ"}
          </SheetDescription>
          <SheetTitle className="sr-only">{editingFaq ? "Edit FAQ" : "Add FAQ"}</SheetTitle>
          <div className="shrink-0 border-b border-border px-6 py-4 pt-14 sm:pt-6">
            <h2 className="text-lg font-semibold text-foreground">{editingFaq ? "Edit FAQ" : "Add FAQ"}</h2>
            <p className="text-sm text-muted-foreground">
              Title appears as the question heading; use the editor for the answer (supports formatting and links).
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="faq-title">Title</Label>
              <Input
                id="faq-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. How do I list my vehicle?"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Answer</Label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                placeholder="Write the answer…"
              />
            </div>
          </div>
          <SheetFooter className="flex-col gap-2 border-t border-border bg-background p-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setFormSheetOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {editingFaq ? "Save changes" : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        open={viewSheetOpen}
        onOpenChange={(open) => {
          setViewSheetOpen(open);
          if (!open) setViewingFaq(null);
        }}
      >
        <SheetContent
          side="right"
          className={cn("flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-3xl")}
        >
          <SheetDescription className="sr-only">FAQ preview</SheetDescription>
          <SheetTitle className="sr-only">{viewingFaq?.title ?? "FAQ"}</SheetTitle>
          {viewingFaq ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-4 pr-2">
                  <h2 className="text-lg font-semibold text-foreground">{viewingFaq.title}</h2>
                  <p className="text-sm text-muted-foreground">Updated {formatDateUS(viewingFaq.updatedAt)}</p>
                </div>
                <div
                  className={cn(
                    "prose prose-sm max-w-none dark:prose-invert",
                    "prose-headings:font-semibold prose-p:text-foreground prose-a:text-primary"
                  )}
                  dangerouslySetInnerHTML={{ __html: viewingFaq.content || "" }}
                />
              </div>
              <SheetFooter className="border-t border-border bg-background p-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setViewSheetOpen(false)}>
                  Close
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Delete “{deletingFaq?.title}”? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default FaqsPage;
