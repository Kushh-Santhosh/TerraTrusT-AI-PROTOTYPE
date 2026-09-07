import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { KpiRow, DataTable, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/fraud/")({
  head: () => ({ meta: [{ title: "Fraud Detection & Anomaly Engine — TerraTrust AI" }] }),
  component: FraudPage,
});

const cases = [
  { id: "F-9821", parcel: "TT-5512-GG", region: "Gurugram (Haryana)", risk: 92, kind: "Duplicate registered deed", flagged: "2024-09-21", status: "Open" },
  { id: "F-9784", parcel: "TT-7710-BLR", region: "Bengaluru (Karnataka)", risk: 78, kind: "Cadastral boundary overlap", flagged: "2024-09-18", status: "Investigating" },
  { id: "F-9740", parcel: "TT-4421-PN", region: "Pune (Maharashtra)", risk: 64, kind: "Forged e-Stamp paper (OCR)", flagged: "2024-09-15", status: "Open" },
  { id: "F-9712", parcel: "TT-2200-HYD", region: "Hyderabad (Telangana)", risk: 55, kind: "PAN/Aadhaar identity mismatch", flagged: "2024-09-12", status: "Under review" },
  { id: "F-9698", parcel: "TT-1188-MYS", region: "Mysuru (Karnataka)", risk: 33, kind: "Stale village survey sketch", flagged: "2024-09-10", status: "Closed" },
];

function FraudPage() {
  const handleExport = () => {
    toast.success("Evidentiary fraud audit log exported.");
  };

  return (
    <AppShell
      title="Fraud Detection"
      subtitle="AI-flagged evidentiary anomalies across sub-registrar deeds, cadastral polygons, and identity records."
      actions={
        <Button variant="outline" className="rounded-full" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export Audit Log
        </Button>
      }
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">FRAUD ANOMALY ENGINE:</strong> Evidentiary discrepancy detector testing document watermarks, duplicate survey numbers, and polygon geometry intersections.
      </div>

      <KpiRow items={[
        { label: "Open cases", value: "27", hint: "↓ 9 vs last week" },
        { label: "Avg. risk score", value: "61", hint: "Across active flags" },
        { label: "Resolved YTD", value: "412", hint: "94% cleared within 14d" },
        { label: "AI precision", value: "97.2%", hint: "True-positive rate" },
      ]} />
      <div className="mt-6">
        <DataTable rows={cases} columns={[
          { key: "id", label: "Case", render: r => <span className="font-mono text-xs font-semibold">{r.id}</span> },
          { key: "parcel", label: "Parcel", render: r => <Link to="/properties/$id" params={{ id: "c63deb92-22df-4cb7-903c-25866f7d6aa0" }} className="font-medium hover:text-primary">{r.parcel}</Link> },
          { key: "region", label: "Jurisdiction", render: r => <span className="text-muted-foreground">{r.region}</span> },
          { key: "kind", label: "Anomaly Detected", render: r => <span className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-destructive" />{r.kind}</span> },
          { key: "risk", label: "Risk Score", render: r => <Pill tone={r.risk > 80 ? "danger" : r.risk > 60 ? "warning" : "info"}>{r.risk}</Pill> },
          { key: "flagged", label: "Flagged Date", render: r => <span className="text-muted-foreground text-xs">{r.flagged}</span> },
          { key: "status", label: "Status", render: r => <Pill tone={r.status === "Closed" ? "success" : r.status === "Investigating" ? "warning" : "danger"}>{r.status}</Pill> },
          { key: "action", label: "", render: r => <Link to="/fraud/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">Inspect<ExternalLink className="h-3 w-3" /></Link>, className: "text-right" },
        ]} />
      </div>
    </AppShell>
  );
}
