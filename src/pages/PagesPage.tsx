import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable, { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import SearchFilter from "@/components/SearchFilter";

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  [key: string]: unknown;
}

const mockPages: PageRow[] = [
  { id: "PG-001", title: "Privacy Policy", slug: "/privacy-policy", status: "Published" },
  { id: "PG-002", title: "Terms & Conditions", slug: "/terms", status: "Published" },
  { id: "PG-003", title: "About", slug: "/about", status: "Published" },
  { id: "PG-004", title: "Help Center", slug: "/help", status: "Draft" },
];

const columns: Column<PageRow>[] = [
  { key: "id", header: "ID" },
  { key: "title", header: "Page Title" },
  { key: "slug", header: "Slug" },
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

const PagesPage = () => {
  const [search, setSearch] = useState("");

  const filtered = mockPages.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageContainer
      title="Pages"
      subtitle="Manage static content pages"
      actions={<Button className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Page</Button>}
    >
      <div className="mb-4">
        <SearchFilter searchPlaceholder="Search pages..." searchValue={search} onSearchChange={setSearch} />
      </div>
      <DataTable columns={columns} data={filtered} page={1} totalPages={1} />
    </PageContainer>
  );
};

export default PagesPage;
