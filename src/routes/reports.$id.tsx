import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, KpiRow, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Download, Share2, Printer } from "lucide-react";

export const Route = createFileRoute("/reports/$id")({
  head: () => ({ meta: [{ title: "Report — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return (
    <AppShell title="Bengaluru Regional Valuation Q3 2024" subtitle={`${id} · Generated 2024-09-22 by TerraTrust AI`}
      actions={<><Button variant="outline"><Share2 className="h-4 w-4 mr-1" /> Share</Button><Button variant="outline"><Printer className="h-4 w-4 mr-1" /> Print</Button><Button><Download className="h-4 w-4 mr-1" /> Download PDF</Button></>}>
      <Crumbs items={[{ label: "Reports", to: "/reports" }, { label: id }]} />
      
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">PROTOTYPE VALUATION REPORT:</strong> Aggregated spatial telemetry and registered sub-registrar transaction indices.
      </div>

      <KpiRow items={[
        { label: "Parcels analysed", value: "412,388" },
        { label: "Median valuation", value: "₹1.85 Cr", hint: "+7.2% YoY" },
        { label: "Verified tenure rate", value: "91.5%" },
        { label: "AI confidence index", value: "94%" },
      ]} />
      <div className="mt-6 surface-card p-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Executive Summary</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Registered property values across Bengaluru Urban rose 7.2% year-over-year, driven primarily by Indiranagar, Whitefield, and the Outer Ring Road tech corridor. Verification throughput improved by 18% as more empanelled surveyors onboarded, and disputed parcels fell to 1.1% of the active inventory — the lowest recorded in 8 quarters.
        </p>
        <h3 className="mt-6 font-display text-lg font-semibold text-foreground">Key Empirical Findings</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-6 text-xs text-muted-foreground">
          <li>Indiranagar corridor median valuation: ₹2.45 Cr (up from ₹2.28 Cr in Q3 2023)</li>
          <li>Boundary adjustments concentrated in Bengaluru Rural periphery (58% of regional inquiries)</li>
          <li>AI confidence on agricultural plots improved from 71% → 86% following high-resolution Cartosat optical pass</li>
          <li>Deed anomaly flag rate fell to 0.06% — a multi-year low following DigiLocker e-KYC integration</li>
        </ul>
        <div className="mt-6 flex gap-2">
          <Pill tone="info">Source: 2024 Q3 Sub-Registrar Sync</Pill>
          <Pill tone="success">Auditor Approved</Pill>
        </div>
      </div>
    </AppShell>
  );
}
