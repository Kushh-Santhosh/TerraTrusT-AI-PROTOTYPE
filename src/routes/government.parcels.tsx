import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, KpiRow, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/government/parcels")({
  head: () => ({ meta: [{ title: "Parcels Registry — TerraTrust AI" }] }),
  component: Page,
});

const rows = [
  { id: "KA-BLR-0412", region: "Karnataka", taluk: "Bengaluru East", area: "540 sqm", owner: "Ananya Sharma", status: "Verified" },
  { id: "MH-PUN-0891", region: "Maharashtra", taluk: "Haveli / Pune", area: "1,240 sqm", owner: "Prashant Deshmukh", status: "Verified" },
  { id: "DL-GUR-0518", region: "Haryana", taluk: "Gurugram South", area: "1,800 sqm", owner: "Disputed Record", status: "Disputed" },
  { id: "KA-MYS-0143", region: "Karnataka", taluk: "Mysuru Urban", area: "1.24 ha", owner: "Kushal Santhosh", status: "Pending" },
  { id: "MH-MUM-0319", region: "Maharashtra", taluk: "Andheri West", area: "880 sqm", owner: "Vikram Malhotra", status: "Verified" },
  { id: "KA-BLR-0992", region: "Karnataka", taluk: "Bengaluru South", area: "620 sqm", owner: "Dr. Vandana Rao", status: "Verified" },
];

function Page() {
  return (
    <AppShell
      title="Land Records Registry"
      subtitle="Read-only access to state cadastral parcel registry. 2,418,332 entries synchronized with Bhoomi & Mahabhulekh."
      requiredRole={["government", "admin"]}
      actions={
        <Button
          variant="outline"
          onClick={() => toast.success("Exporting regional cadastre CSV (Karnataka & Maharashtra zones)...")}
        >
          <Download className="h-4 w-4" /> Export region
        </Button>
      }
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">STATE CADASTRAL REGISTRY:</strong> Read-only access to state cadastral parcel registry synchronized with state revenue datasets.
      </div>

      <KpiRow
        items={[
          { label: "Total cadastral parcels", value: "2.41M" },
          { label: "Verified / clean title", value: "91.5%" },
          { label: "Pending verification", value: "6.2%" },
          { label: "Encumbered / disputed", value: "1.2%" },
        ]}
      />
      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={[
            { key: "id", label: "Passport ID", render: r => <span className="font-mono text-xs font-medium">{r.id}</span> },
            { key: "region", label: "State", render: r => r.region },
            { key: "taluk", label: "Taluk / Tehsil", render: r => <span className="text-muted-foreground">{r.taluk}</span> },
            { key: "area", label: "Area", render: r => r.area },
            { key: "owner", label: "Owner of Record", render: r => <span className="text-muted-foreground">{r.owner}</span> },
            {
              key: "s",
              label: "Status",
              render: r => (
                <Pill tone={r.status === "Verified" ? "success" : r.status === "Disputed" ? "danger" : "warning"}>
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
