import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import SearchFilter from "@/components/SearchFilter";

interface FaqRow {
  id: string;
  question: string;
  category: string;
  status: string;
  [key: string]: unknown;
}

const mockFaqs: FaqRow[] = [
  { id: "FAQ-001", question: "How do I list my vehicle?", category: "Getting Started", status: "Published" },
  { id: "FAQ-002", question: "What is the cancellation policy?", category: "Bookings", status: "Published" },
  { id: "FAQ-003", question: "How do payouts work?", category: "Payments", status: "Draft" },
  { id: "FAQ-004", question: "What insurance is provided?", category: "Insurance", status: "Published" },
];

const columns: Column<FaqRow>[] = [
  { key: "id", header: "ID" },
  { key: "question", header: "Question" },
  { key: "category", header: "Category" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={r.status === "Published" ? "success" : "default"}>{r.status}</StatusBadge> },
  {
    key: "actions", header: "Actions",
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info"><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
      </div>
    ),
  },
];

const FaqsPage = () => {
  const [search, setSearch] = useState("");

  const filtered = mockFaqs.filter((f) => {
    if (search && !f.question.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageContainer
      title="FAQs"
      subtitle="Manage frequently asked questions"
      actions={<Button className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add FAQ</Button>}
    >
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search FAQs..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />
    </PageContainer>
  );
};

export default FaqsPage;
