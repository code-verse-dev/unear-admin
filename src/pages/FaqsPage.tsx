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

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: string;
  updatedAt: string;
  [key: string]: unknown;
}

const initialFaqs: FaqRow[] = [
  { id: "FAQ-001", question: "How do I list my vehicle?", answer: "Go to the Vehicles section and click 'Add Vehicle'. Fill in the required details.", category: "Getting Started", status: "Published", updatedAt: "01/12/2026" },
  { id: "FAQ-002", question: "What is the cancellation policy?", answer: "Cancellations made 24 hours before the booking are fully refundable.", category: "Bookings", status: "Published", updatedAt: "01/05/2026" },
  { id: "FAQ-003", question: "How do payouts work?", answer: "Payouts are processed within 3-5 business days after trip completion.", category: "Payments", status: "Draft", updatedAt: "12/28/2025" },
  { id: "FAQ-004", question: "What insurance is provided?", answer: "All bookings include comprehensive insurance coverage up to $50,000.", category: "Insurance", status: "Published", updatedAt: "01/18/2026" },
];

const categories = ["Getting Started", "Bookings", "Payments", "Insurance", "General"];

const FaqsPage = () => {
  const [faqs, setFaqs] = useState<FaqRow[]>(initialFaqs);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqRow | null>(null);
  const [viewingFaq, setViewingFaq] = useState<FaqRow | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<FaqRow | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "General", status: "Draft" });
  const { toast } = useToast();

  const openAdd = () => {
    setEditingFaq(null);
    setForm({ question: "", answer: "", category: "General", status: "Draft" });
    setDialogOpen(true);
  };

  const openEdit = (faq: FaqRow) => {
    setEditingFaq(faq);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, status: faq.status });
    setDialogOpen(true);
  };

  const openView = (faq: FaqRow) => {
    setViewingFaq(faq);
    setViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: "Validation Error", description: "Question and answer are required.", variant: "destructive" });
      return;
    }
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
    if (editingFaq) {
      setFaqs((prev) => prev.map((f) => f.id === editingFaq.id ? { ...f, ...form, updatedAt: dateStr } : f));
      toast({ title: "FAQ Updated", description: "The FAQ has been updated successfully." });
    } else {
      const newId = `FAQ-${String(faqs.length + 1).padStart(3, "0")}`;
      setFaqs((prev) => [...prev, { id: newId, ...form, updatedAt: dateStr }]);
      toast({ title: "FAQ Created", description: "A new FAQ has been added." });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deletingFaq) return;
    setFaqs((prev) => prev.filter((f) => f.id !== deletingFaq.id));
    toast({ title: "FAQ Deleted", description: `FAQ "${deletingFaq.question}" has been removed.` });
    setDeleteDialogOpen(false);
    setDeletingFaq(null);
  };

  const columns: Column<FaqRow>[] = [
    { key: "id", header: "ID" },
    { key: "question", header: "Question" },
    { key: "category", header: "Category" },
    { key: "updatedAt", header: "Last Updated" },
    { key: "status", header: "Status", render: (r) => <StatusBadge variant={r.status === "Published" ? "success" : "default"}>{r.status}</StatusBadge> },
    {
      key: "actions", header: "Actions",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info" onClick={() => openView(row)}><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-secondary" onClick={() => openEdit(row)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setDeletingFaq(row); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  const filtered = faqs.filter((f) => !search || f.question.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageContainer
      title="FAQs"
      subtitle="Manage frequently asked questions"
      actions={<Button className="bg-primary text-primary-foreground" onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add FAQ</Button>}
    >
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search FAQs..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
            <DialogDescription>{editingFaq ? "Update the FAQ details below." : "Fill in the details to create a new FAQ."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Question</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter the question" />
            </div>
            <div className="space-y-1.5">
              <Label>Answer</Label>
              <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Enter the answer..." rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave}>{editingFaq ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingFaq?.question}</DialogTitle>
            <DialogDescription>Category: {viewingFaq?.category} · Status: {viewingFaq?.status} · Updated: {viewingFaq?.updatedAt}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-foreground whitespace-pre-wrap">{viewingFaq?.answer}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this FAQ? This action cannot be undone.</AlertDialogDescription>
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

export default FaqsPage;
