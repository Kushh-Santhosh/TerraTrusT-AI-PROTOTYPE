import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill, KpiRow } from "@/components/ui-ext/Scaffold";

export const Route = createFileRoute("/surveyor/assignments")({
  head: () => ({ meta: [{ title: "Surveyor Field Assignments — TerraTrust AI" }] }),
  component: Page,
});

const rows = [
  { id: "S-2241", parcel: "KA-BLR-0412", region: "Bengaluru, Karnataka", due: "2024-10-02", priority: "High", status: "In progress" },
  { id: "S-2240", parcel: "MH-PUN-0891", region: "Pune, Maharashtra", due: "2024-10-05", priority: "Medium", status: "Scheduled" },
  { id: "S-2238", parcel: "KA-MYS-0143", region: "Mysuru, Karnataka", due: "2024-10-09", priority: "Low", status: "Scheduled" },
  { id: "S-2236", parcel: "DL-GUR-0518", region: "Gurugram, Haryana", due: "2024-09-28", priority: "High", status: "Awaiting review" },
  { id: "S-2230", parcel: "MH-MUM-0319", region: "Mumbai, Maharashtra", due: "2024-09-22", priority: "High", status: "Completed" },
];

function Page() {
  return (
    <AppShell
      title="Field assignments"
      subtitle="Cadastral & boundary verification jobs dispatched to licensed surveyors."
      requiredRole={["surveyor", "admin"]}
    >
      <KpiRow
        items={[
          { label: "Active assignments", value: "12" },
          { label: "Due this week", value: "4" },
          { label: "Avg. turnaround", value: "2.4d" },
          { label: "Survey quality rating", value: "4.92 / 5" },
        ]}
      />
      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={[
            { key: "id", label: "Job ID", render: r => <span className="font-mono text-xs font-medium">{r.id}</span> },
            {
              key: "parcel",
              label: "Parcel Passport",
              render: r => (
                <Link to="/surveyor/assignments/$id" params={{ id: r.id }} className="font-medium text-primary hover:underline">
                  {r.parcel}
                </Link>
              ),
            },
            { key: "region", label: "Location", render: r => <span className="text-muted-foreground">{r.region}</span> },
            { key: "due", label: "Target Completion", render: r => r.due },
            {
              key: "p",
              label: "Priority",
              render: r => (
                <Pill tone={r.priority === "High" ? "danger" : r.priority === "Medium" ? "warning" : "info"}>
                  {r.priority}
                </Pill>
              ),
            },
            {
              key: "s",
              label: "Status",
              render: r => (
                <Pill tone={r.status === "Completed" ? "success" : r.status === "Awaiting review" ? "warning" : "info"}>
                  {r.status}
                </Pill>
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
