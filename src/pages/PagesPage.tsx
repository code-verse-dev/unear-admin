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
import { PAGES_PAGE_SIZE_DEFAULT, type AdminContentPage } from "@/api/adminPages";
import {
  useCreatePageMutation,
  useDeletePageMutation,
  usePagesListQuery,
  useUpdatePageMutation,
} from "@/hooks/useAdminPages";
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

const PagesPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<AdminContentPage | null>(null);
  const [viewingPage, setViewingPage] = useState<AdminContentPage | null>(null);
  const [deletingPage, setDeletingPage] = useState<AdminContentPage | null>(null);
  const [form, setForm] = useState({ title: "", content: "", url: "" });

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
      limit: PAGES_PAGE_SIZE_DEFAULT,
      orderBy: "id",
      order: "DESC" as const,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, debouncedSearch]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = usePagesListQuery(listParams);
  const createMut = useCreatePageMutation();
  const updateMut = useUpdatePageMutation();
  const deleteMut = useDeletePageMutation();

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ title: "Failed to load pages", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, data?.links?.total ?? 1);
  const currentPage = data?.links?.current ?? page;

  const openAdd = () => {
    setEditingPage(null);
    setForm({ title: "", content: "", url: "" });
    setFormSheetOpen(true);
  };

  const openEdit = (p: AdminContentPage) => {
    setEditingPage(p);
    setForm({
      title: p.title,
      content: p.content || "",
      url: p.url?.trim() ? p.url : "",
    });
    setFormSheetOpen(true);
  };

  const openView = (p: AdminContentPage) => {
    setViewingPage(p);
    setViewSheetOpen(true);
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const plain = form.content.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!title || !plain) {
      toast({ title: "Validation", description: "Title and page content are required.", variant: "destructive" });
      return;
    }
    const urlTrim = form.url.trim();
    try {
      if (editingPage) {
        await updateMut.mutateAsync({
          id: editingPage.id,
          body: { title, content: form.content, url: urlTrim || null },
        });
        toast({ title: "Page updated" });
      } else {
        await createMut.mutateAsync({
          title,
          content: form.content,
          ...(urlTrim ? { url: urlTrim } : {}),
        });
        toast({ title: "Page created" });
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
    if (!deletingPage) return;
    try {
      await deleteMut.mutateAsync(deletingPage.id);
      toast({ title: "Page deleted" });
      setDeleteDialogOpen(false);
      setDeletingPage(null);
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const columns: Column<AdminContentPage>[] = [
    { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs tabular-nums">{r.id}</span> },
    {
      key: "title",
      header: "Title",
      className: "min-w-[140px]",
      render: (r) => <span className="font-medium leading-snug line-clamp-2">{r.title}</span>,
    },
    {
      key: "slug",
      header: "Slug",
      render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.slug}</span>,
    },
    {
      key: "preview",
      header: "Preview",
      className: "max-w-[min(220px,32vw)] w-[min(220px,32vw)]",
      render: (r) => (
        <span className="block text-xs text-muted-foreground line-clamp-2 break-words">{htmlPlainPreview(r.content)}</span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (r) => <span className="text-sm">{formatDateUS(r.updatedAt ?? r.createdAt)}</span>,
    },
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
              setDeletingPage(row);
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
      title="Pages"
      subtitle="Static content pages; slug is generated from the title on save"
      actions={
        <Button className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add page
        </Button>
      }
    >
      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by title, slug, or content…"
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
          pageSize={PAGES_PAGE_SIZE_DEFAULT}
          totalRecords={data?.links?.total_records}
          emptyMessage={isError ? "Could not load pages." : "No pages match your search."}
        />
      </div>

      <Sheet open={formSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent
          side="right"
          className={cn("flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-3xl")}
        >
          <SheetDescription className="sr-only">
            {editingPage ? "Edit static page content" : "Create a new static page"}
          </SheetDescription>
          <SheetTitle className="sr-only">{editingPage ? "Edit page" : "Add page"}</SheetTitle>
          <div className="shrink-0 border-b border-border px-6 py-4 pt-14 sm:pt-6">
            <h2 className="text-lg font-semibold text-foreground">{editingPage ? "Edit page" : "Add page"}</h2>
            <p className="text-sm text-muted-foreground">
              The URL slug is derived from the title when you save. Optional external URL can be stored for linking.
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Title</Label>
              <Input
                id="page-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Privacy Policy"
              />
            </div>
            {editingPage ? (
              <div className="space-y-1.5">
                <Label>Current slug</Label>
                <p className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                  {editingPage.slug}
                  <span className="mt-1 block text-[11px] font-sans text-muted-foreground">
                    Saving a new title will regenerate the slug (backend).
                  </span>
                </p>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="page-url">External URL (optional)</Label>
              <Input
                id="page-url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Page content</Label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                placeholder="Main page body…"
              />
            </div>
          </div>
          <SheetFooter className="flex-col gap-2 border-t border-border bg-background p-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setFormSheetOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {editingPage ? "Save changes" : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        open={viewSheetOpen}
        onOpenChange={(open) => {
          setViewSheetOpen(open);
          if (!open) setViewingPage(null);
        }}
      >
        <SheetContent
          side="right"
          className={cn("flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-3xl")}
        >
          <SheetDescription className="sr-only">Page preview</SheetDescription>
          <SheetTitle className="sr-only">{viewingPage?.title ?? "Page"}</SheetTitle>
          {viewingPage ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-14 sm:pt-6">
                <div className="mb-4 pr-2">
                  <h2 className="text-lg font-semibold text-foreground">{viewingPage.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    Slug: <span className="font-mono">{viewingPage.slug}</span>
                    {viewingPage.url ? (
                      <>
                        {" "}
                        ·{" "}
                        <a href={viewingPage.url} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                          external link
                        </a>
                      </>
                    ) : null}{" "}
                    · Updated {formatDateUS(viewingPage.updatedAt ?? viewingPage.createdAt)}
                  </p>
                </div>
                <div
                  className={cn(
                    "prose prose-sm max-w-none dark:prose-invert",
                    "prose-headings:font-semibold prose-p:text-foreground prose-a:text-primary"
                  )}
                  dangerouslySetInnerHTML={{ __html: viewingPage.content || "" }}
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
            <AlertDialogTitle>Delete page</AlertDialogTitle>
            <AlertDialogDescription>
              Delete “{deletingPage?.title}”? This cannot be undone.
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

export default PagesPage;
