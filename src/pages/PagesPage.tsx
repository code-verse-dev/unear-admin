import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import SearchFilter from "@/components/SearchFilter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: string;
  updatedAt: string;
  [key: string]: unknown;
}

const initialPages: PageRow[] = [
  { id: "PG-001", title: "Privacy Policy", slug: "/privacy-policy", status: "Published", content: "Our privacy policy content...", updatedAt: "01/15/2026" },
  { id: "PG-002", title: "Terms & Conditions", slug: "/terms", status: "Published", content: "Terms and conditions content...", updatedAt: "01/10/2026" },
  { id: "PG-003", title: "About", slug: "/about", status: "Published", content: "About UNear platform...", updatedAt: "12/20/2025" },
  { id: "PG-004", title: "Help Center", slug: "/help", status: "Draft", content: "Help center draft content...", updatedAt: "02/01/2026" },
];

const PagesPage = () => {
  const [pages, setPages] = useState<PageRow[]>(initialPages);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageRow | null>(null);
  const [viewingPage, setViewingPage] = useState<PageRow | null>(null);
  const [deletingPage, setDeletingPage] = useState<PageRow | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", status: "Draft", content: "" });
  const { toast } = useToast();

  const openAdd = () => {
    setEditingPage(null);
    setForm({ title: "", slug: "", status: "Draft", content: "" });
    setDialogOpen(true);
  };

  const openEdit = (page: PageRow) => {
    setEditingPage(page);
    setForm({ title: page.title, slug: page.slug, status: page.status, content: page.content });
    setDialogOpen(true);
  };

  const openView = (page: PageRow) => {
    setViewingPage(page);
    setViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ title: "Validation Error", description: "Title and slug are required.", variant: "destructive" });
      return;
    }
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
    if (editingPage) {
      setPages((prev) => prev.map((p) => p.id === editingPage.id ? { ...p, ...form, updatedAt: dateStr } : p));
      toast({ title: "Page Updated", description: `"${form.title}" has been updated.` });
    } else {
      const newId = `PG-${String(pages.length + 1).padStart(3, "0")}`;
      setPages((prev) => [...prev, { id: newId, ...form, updatedAt: dateStr }]);
      toast({ title: "Page Created", description: `"${form.title}" has been created.` });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deletingPage) return;
    setPages((prev) => prev.filter((p) => p.id !== deletingPage.id));
    toast({ title: "Page Deleted", description: `"${deletingPage.title}" has been removed.` });
    setDeleteDialogOpen(false);
    setDeletingPage(null);
  };

  const columns: Column<PageRow>[] = [
    { key: "id", header: "ID" },
    { key: "title", header: "Page Title" },
    { key: "slug", header: "Slug" },
    { key: "updatedAt", header: "Last Updated" },
    { key: "status", header: "Status", render: (r) => <StatusBadge variant={r.status === "Published" ? "success" : "default"}>{r.status}</StatusBadge> },
    {
      key: "actions", header: "Actions",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info" onClick={() => openView(row)}><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-secondary" onClick={() => openEdit(row)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setDeletingPage(row); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  const filtered = pages.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageContainer
      title="Pages"
      subtitle="Manage static content pages"
      actions={<Button className="bg-primary text-primary-foreground" onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Page</Button>}
    >
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search pages..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Page" : "Add New Page"}</DialogTitle>
            <DialogDescription>{editingPage ? "Update the page details below." : "Fill in the details to create a new page."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Page title" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="/page-slug" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Page content..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave}>{editingPage ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingPage?.title}</DialogTitle>
            <DialogDescription>Slug: {viewingPage?.slug} · Status: {viewingPage?.status} · Updated: {viewingPage?.updatedAt}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-foreground whitespace-pre-wrap">{viewingPage?.content}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deletingPage?.title}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default PagesPage;
