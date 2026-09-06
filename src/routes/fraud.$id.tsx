import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle2, X, Flag } from "lucide-react";

export const Route = createFileRoute("/fraud/$id")({
  head: () => ({ meta: [{ title: "Fraud Case — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return (
    <AppShell title={`Case ${id}`} subtitle="Duplicate registered sale deed detected on TT-5512-GG"
      actions={<><Button variant="outline"><X className="h-4 w-4 mr-1" /> Dismiss</Button><Button><CheckCircle2 className="h-4 w-4 mr-1" /> Escalate to Revenue Officer</Button></>}>
      <Crumbs items={[{ label: "Fraud", to: "/fraud" }, { label: id }]} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk score</p>
              <p className="font-display text-5xl text-destructive font-bold">92</p>
            </div>
            <Pill tone="danger"><ShieldAlert className="h-3 w-3 inline mr-1" /> Open Anomaly</Pill>
          </div>
          <h3 className="mt-6 font-display text-xl font-semibold text-foreground">Forensic Evidence Summary</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Two distinct Sale Deed documents were registered within 14 days of each other claiming overlapping ownership on the same survey plot at Sector 29, Gurugram. OCR-extracted signatures show a 0.83 similarity score (false-positive likelihood &lt; 2%).
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Deed A — registered 2023-02-11 by Vikram Malhotra",
              "Deed B — presented 2023-02-25 by S. Sharma",
              "Cadastral boundary overlap: 38% of parcel area",
              "Survey nakshas cite different empanelled surveyors"
            ].map((x, i) => (
              <div key={i} className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-foreground font-medium">{x}</div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Affected Parcel</p>
            <Link to="/properties/$id" params={{ id: "p_003" }} className="mt-1 block font-semibold hover:text-primary text-sm text-foreground">Gurugram Commercial Plot</Link>
            <p className="text-xs text-muted-foreground font-mono">Plot 88, Sector 29 — TT-5512-GG</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Investigation Timeline</p>
            <ul className="mt-2 space-y-2 text-xs">
              <li><span className="font-semibold text-foreground">2024-09-21</span> · AI detected duplicate deed registration</li>
              <li><span className="font-semibold text-foreground">2024-09-22</span> · Escalated to District Revenue &amp; Sub-Registrar</li>
              <li><span className="font-semibold text-foreground">2024-09-25</span> · Awaiting field survey &amp; community attestation</li>
            </ul>
          </div>
          <Button variant="outline" className="w-full"><Flag className="h-4 w-4 mr-1" /> Report to District Collector</Button>
        </div>
      </div>
    </AppShell>
  );
}
