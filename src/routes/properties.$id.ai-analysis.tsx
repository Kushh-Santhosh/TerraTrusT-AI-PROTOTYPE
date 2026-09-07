import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, KpiRow, Pill } from "@/components/ui-ext/Scaffold";
import { Sparkles, TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { PropertySubNav } from "@/components/property/PropertySubNav";

export const Route = createFileRoute("/properties/$id/ai-analysis")({
  head: () => ({ meta: [{ title: "AI Analysis — TerraTrust AI" }] }),
  component: Page,
});

const factors = [
  { label: "Location score", value: 94, note: "Premium corridor — Indiranagar / Koramangala, Bengaluru" },
  { label: "Document completeness", value: 100, note: "Sale deed, survey plan, tax receipt, identity on file" },
  { label: "Boundary integrity", value: 97, note: "GIS match within 0.4m of revenue records" },
  { label: "Ownership clarity", value: 99, note: "Single owner registered since 2019" },
  { label: "Market liquidity", value: 88, note: "Verified transactions recorded nearby in last 90 days" },
  { label: "Risk indicators", value: 96, note: "No active disputes, clear encumbrance certificate" },
];

function Page() {
  const { id } = Route.useParams();
  return (
    <AppShell title="AI Analysis" subtitle="Algorithmic explainability for trust score, boundary validation, and market valuation.">
      <Crumbs items={[{ label: "Properties", to: "/properties" }, { label: id, to: "/properties/$id" }, { label: "AI Analysis" }]} />
      <PropertySubNav propertyId={id} activeTab="ai-analysis" />

      {/* Estimate Notice */}
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span><strong className="text-foreground">AI FORENSIC ANALYSIS:</strong> Explainable AI model outputs. AI estimates are non-binding and do not replace official government sub-registrar stamp duty or revenue valuations.</span>
        <Pill tone="primary">AI v2.4 India</Pill>
      </div>

      <KpiRow items={[
        { label: "Trust score", value: "96", hint: "+4 since last verification" },
        { label: "AI confidence", value: "92%", hint: "High certainty" },
        { label: "AI valuation", value: "₹2.4 Cr", hint: "± ₹12 Lakhs" },
        { label: "Model", value: "Geo-LLM Indic v2.4" },
      ]} />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <h3 className="flex items-center gap-2 font-display text-xl"><Sparkles className="h-5 w-5 text-primary" /> Score factors</h3>
          <div className="mt-4 space-y-3">
            {factors.map(f => (
              <div key={f.label}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-sm text-muted-foreground">{f.value}/100</p>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${f.value}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{f.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="surface-card p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-success" /> Strengths</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Continuous undisputed ownership since 2019</li>
              <li>• All documents passed OCR &amp; signature cross-match</li>
              <li>• Boundary matches revenue coordinates &amp; satellite</li>
            </ul>
          </div>
          <div className="surface-card p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4 text-warning-foreground" /> Watchouts</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Property tax receipt renewal due in Q4 2025</li>
              <li>• 1 secondary neighbor attestation pending review</li>
            </ul>
          </div>
          <div className="surface-card p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-primary" /> Outlook</p>
            <p className="mt-2 text-xs text-muted-foreground">+7.2% projected appreciation in 12 months based on Karnataka urban corridor infrastructure expansion.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
