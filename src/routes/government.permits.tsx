import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill, KpiRow } from "@/components/ui-ext/Scaffold";

export const Route = createFileRoute("/government/permits")({
  head: () => ({ meta: [{ title: "Permits — TerraTrust AI" }] }),
  component: Page,
});

const rows = [
  { id: "PMT-44021", parcel: "TT-8421-KA", kind: "BBMP Building Sanction Plan", filed: "2024-09-12", status: "Approved" },
  { id: "PMT-44018", parcel: "TT-7188-KA", kind: "Layout Subdivision Approval", filed: "2024-09-10", status: "Under review" },
  { id: "PMT-44012", parcel: "TT-5512-GG", kind: "Change of Land Use (CLU)", filed: "2024-09-08", status: "On hold" },
  { id: "PMT-44002", parcel: "TT-9930-PN", kind: "Boundary Wall & Fencing Sanction", filed: "2024-09-04", status: "Approved" },
  { id: "PMT-43988", parcel: "TT-2210-MYS", kind: "Agricultural to Non-Agricultural (NA)", filed: "2024-08-29", status: "Approved" },
];

function Page() {
  return (
    <AppShell title="Municipal & Revenue Permits" subtitle="Construction approvals, subdivision layout permits, and land-use conversions." requiredRole={["government", "admin"]}>
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">MUNICIPAL PERMITS DESK:</strong> Official workflow tracking municipal building plan sanctions, NA conversions, and subdivision clearances.
      </div>

      <KpiRow items={[
        { label: "Active permits", value: "18", hint: "Sanctioned municipal clearances" },
        { label: "Approved YTD", value: "1,402" },
        { label: "Avg. processing", value: "9.2d" },
        { label: "Appeals pending", value: "12" },
      ]} />
      <div className="mt-6">
        <DataTable rows={rows} columns={[
          { key: "id", label: "Permit ID", render: r => <span className="font-mono text-xs font-semibold">{r.id}</span> },
          { key: "parcel", label: "Parcel ID", render: r => <span className="font-mono text-xs">{r.parcel}</span> },
          { key: "kind", label: "Permit Category", render: r => <span className="text-xs">{r.kind}</span> },
          { key: "filed", label: "Filing Date", render: r => <span className="text-muted-foreground text-xs">{r.filed}</span> },
          { key: "s", label: "Status", render: r => <Pill tone={r.status === "Approved" ? "success" : r.status === "On hold" ? "danger" : "warning"}>{r.status}</Pill> },
        ]} />
      </div>
    </AppShell>
  );
}
