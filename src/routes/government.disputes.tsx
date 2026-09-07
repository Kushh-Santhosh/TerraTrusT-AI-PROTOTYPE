import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill, KpiRow } from "@/components/ui-ext/Scaffold";

export const Route = createFileRoute("/government/disputes")({
  head: () => ({ meta: [{ title: "Govt. disputes — TerraTrust AI" }] }),
  component: Page,
});

const rows = [
  { id: "D-3318", parcel: "TT-5512-GG", kind: "Ownership overlap", region: "Gurugram", filed: "2024-07-30", days: 61, status: "Mediation" },
  { id: "D-3301", parcel: "TT-8814-MYS", kind: "Cadastral boundary marker", region: "Mysuru", filed: "2024-09-05", days: 24, status: "Open" },
  { id: "D-3289", parcel: "TT-1132-BLR", kind: "Duplicate deed verification", region: "Bengaluru", filed: "2024-08-12", days: 48, status: "Resolved" },
  { id: "D-3276", parcel: "TT-2401-PN", kind: "Family partition challenge", region: "Pune", filed: "2024-06-19", days: 102, status: "Awaiting hearing" },
];

function Page() {
  return (
    <AppShell title="Active Land Disputes Queue" subtitle="Inter-jurisdictional disputes and title challenges routed to revenue officers." requiredRole={["government", "admin"]}>
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">DISPUTE DOCKET:</strong> Active mediation queue integrating surveyor Naksha verifications and Sub-Registrar records.
      </div>

      <KpiRow items={[
        { label: "Open cases", value: "2", hint: "Active disputes" },
        { label: "Avg. resolution", value: "37d" },
        { label: "Resolved YTD", value: "612" },
        { label: "Lok Adalat backlog", value: "12" },
      ]} />
      <div className="mt-6">
        <DataTable rows={rows} columns={[
          { key: "id", label: "Docket ID", render: r => <Link to="/disputes/$id" params={{ id: r.id }} className="font-mono text-xs hover:text-primary font-semibold">{r.id}</Link> },
          { key: "parcel", label: "Parcel ID", render: r => <span className="font-mono text-xs">{r.parcel}</span> },
          { key: "kind", label: "Dispute Category", render: r => <span className="text-xs">{r.kind}</span> },
          { key: "region", label: "Jurisdiction", render: r => <span className="text-muted-foreground text-xs">{r.region}</span> },
          { key: "days", label: "Days Open", render: r => <span className="text-xs">{r.days}d</span> },
          { key: "s", label: "Status", render: r => <Pill tone={r.status === "Resolved" ? "success" : r.status === "Mediation" ? "warning" : "danger"}>{r.status}</Pill> },
        ]} />
      </div>
    </AppShell>
  );
}
