import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { DataTable, Pill } from "@/components/ui-ext/Scaffold";
import { FileText, Plus, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports/")({
  head: () => ({ meta: [{ title: "Audit & Intelligence Reports — TerraTrust AI" }] }),
  component: ReportsPage,
});

const reports = [
  {
    id: "R-2241",
    title: "Bengaluru Urban regional valuation Q3 2024",
    kind: "Valuation",
    scope: "Bengaluru",
    generated: "2024-09-22",
    size: "2.4 MB",
    status: "Ready",
  },
  {
    id: "R-2240",
    title: "Boundary integrity audit — Pune Tech Corridor",
    kind: "GIS",
    scope: "Pune",
    generated: "2024-09-20",
    size: "1.1 MB",
    status: "Ready",
  },
  {
    id: "R-2239",
    title: "Fraud watch & circle rate compliance",
    kind: "Fraud",
    scope: "National",
    generated: "2024-09-18",
    size: "3.8 MB",
    status: "Ready",
  },
  {
    id: "R-2237",
    title: "Citizen property portfolio statement",
    kind: "Portfolio",
    scope: "Personal",
    generated: "2024-09-15",
    size: "640 KB",
    status: "Ready",
  },
  {
    id: "R-2233",
    title: "Bank collateral eligibility — TT-8421-KA",
    kind: "Bank",
    scope: "Indiranagar",
    generated: "2024-09-10",
    size: "880 KB",
    status: "Ready",
  },
  {
    id: "R-2231",
    title: "Dispute resolution & mediation log",
    kind: "Disputes",
    scope: "Gurugram",
    generated: "2024-09-08",
    size: "1.6 MB",
    status: "Archived",
  },
];

function ReportsPage() {
  const handleDownload = (id: string, title: string) => {
    toast.success(`Exporting ${id}: ${title}`);
    const blob = new Blob(
      [
        `TERRATRUST AI OFFICIAL CADASTRAL REPORT\nReport ID: ${id}\nTitle: ${title}\nTimestamp: ${new Date().toISOString()}\nStatus: Verified\nJurisdiction: Karnataka / India`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}-cadastral-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Audit & Intelligence Reports"
      subtitle="Automated and on-demand evidentiary exports across your land records."
      actions={
        <Link to="/reports/new">
          <Button className="rounded-full">
            <Plus className="h-4 w-4 mr-1" /> New Report
          </Button>
        </Link>
      }
    >
      <DataTable
        rows={reports}
        columns={[
          {
            key: "id",
            label: "ID",
            render: (r) => <span className="font-mono text-xs font-semibold">{r.id}</span>,
          },
          {
            key: "title",
            label: "Report Title",
            render: (r) => (
              <Link
                to="/reports/$id"
                params={{ id: r.id }}
                className="flex items-center gap-2 font-medium hover:text-primary"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                {r.title}
              </Link>
            ),
          },
          { key: "kind", label: "Category", render: (r) => <Pill tone="info">{r.kind}</Pill> },
          {
            key: "scope",
            label: "Jurisdiction",
            render: (r) => <span className="text-muted-foreground text-xs">{r.scope}</span>,
          },
          {
            key: "generated",
            label: "Generated",
            render: (r) => <span className="text-muted-foreground text-xs">{r.generated}</span>,
          },
          {
            key: "size",
            label: "File Size",
            render: (r) => <span className="text-muted-foreground text-xs">{r.size}</span>,
          },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <Pill tone={r.status === "Ready" ? "success" : "default"}>{r.status}</Pill>
            ),
          },
          {
            key: "dl",
            label: "",
            render: (r) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownload(r.id, r.title)}
                title="Download Report"
              >
                <Download className="h-4 w-4" />
              </Button>
            ),
            className: "text-right",
          },
        ]}
      />
    </AppShell>
  );
}
