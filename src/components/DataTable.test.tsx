import { render, screen } from "@testing-library/react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

const LONG =
  "Rear bumper scuff on the passenger side, dented alloy on the front-left wheel, and a cracked plastic diffuser. Photos and a body-shop estimate are attached.";

describe("support tickets table layout", () => {
  it("keeps type and status badges on one line", () => {
    render(
      <>
        <StatusBadge variant="warning">Awaiting Support</StatusBadge>
        <span className="inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium">
          Trip extras
        </span>
      </>
    );
    expect(screen.getByText("Awaiting Support").className).toContain("whitespace-nowrap");
    expect(screen.getByText("Trip extras").className).toContain("whitespace-nowrap");
  });

  it("truncates a long subject inside a fixed table", () => {
    render(
      <DataTable
        tableClassName="table-fixed"
        columns={[
          {
            key: "title",
            header: "Subject",
            className: "max-w-0 w-[38%] overflow-hidden",
            render: (row) => (
              <div className="truncate text-sm font-medium" title={String(row.title)}>
                {String(row.title)}
              </div>
            ),
          },
        ]}
        data={[{ title: LONG }]}
      />
    );
    const cell = screen.getByText(LONG);
    expect(cell).toHaveClass("truncate");
    expect(cell).toHaveAttribute("title", LONG);
    expect(document.querySelector("table")).toHaveClass("table-fixed");
    expect(cell.closest("td")).toHaveClass("overflow-hidden");
  });
});
