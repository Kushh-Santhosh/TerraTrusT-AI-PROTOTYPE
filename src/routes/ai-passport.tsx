import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { AIBadge, ScoreRing, ConfidenceMeter, ExplainabilityPanel, VerdictBanner, SignalTile, ReasoningTrace } from "@/components/ai/AIPrimitives";
import { SectionTitle, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Brain, FileText, MapPin, ShieldCheck, Calendar, Coins, Layers, Download, Share2 } from "lucide-react";
import { valuationFactors } from "@/lib/ai-mock";

export const Route = createFileRoute("/ai-passport")({
  head: () => ({ meta: [{ title: "AI Property Passport — TerraTrust AI" }] }),
  component: PassportPage,
});

function PassportPage() {
  return (
    <AppShell
      title="AI Property Passport"
      subtitle="A composite, cryptographically signed, machine-verifiable identity for every parcel."
      actions={<>
        <Button variant="outline" asChild><Link to="/properties/$id/share" params={{ id: "p_001" }}><Share2 className="h-4 w-4 mr-1" /> Share</Link></Button>
        <Button asChild><Link to="/properties/$id/passport-pdf" params={{ id: "p_001" }}><Download className="h-4 w-4 mr-1" /> Download Passport</Link></Button>
      </>}
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">PROTOTYPE PROPERTY PASSPORT:</strong> Machine-verifiable identity combining sub-registrar deeds, cadastral survey, and AI forensic trust checks.
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="surface-card relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-primary/15 via-accent/15 to-transparent" />
          <div className="relative">
            <AIBadge tone="primary">Cryptographically Signed</AIBadge>
            <p className="mt-3 font-display text-3xl font-bold text-foreground">TT-8421-KA</p>
            <p className="text-xs text-muted-foreground mt-0.5">Indiranagar Residence, Bengaluru · 540 m²</p>
            <div className="mt-5 grid place-items-center">
              <ScoreRing value={96} label="Composite" sublabel="Verified · Karnataka Bhoomi" />
            </div>
            <dl className="mt-6 space-y-2.5 text-xs">
              {[
                { icon: MapPin, k: "Centroid", v: "12.9567° N, 77.6200° E" },
                { icon: Calendar, k: "Owner since", v: "14 June 2019" },
                { icon: Coins, k: "AI valuation", v: "₹2,40,00,000" },
                { icon: Layers, k: "Documents", v: "3 verified on-chain" },
                { icon: ShieldCheck, k: "Last verified", v: "20 Mar 2024" },
              ].map(r => (
                <div key={r.k} className="flex items-center gap-2 text-muted-foreground">
                  <r.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{r.k}</span>
                  <span className="ml-auto font-medium text-foreground font-mono">{r.v}</span>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <VerdictBanner verdict="trusted" headline="This Property Passport is authenticated." detail="All four AI verifiers agree: registered deed, cadastral boundary, ownership chain, and treasury stamp checks pass within tolerance." />

          <div className="grid gap-4 md:grid-cols-4">
            <SignalTile icon={<FileText className="h-3 w-3 text-primary" />} label="Doc integrity" value="98" tone="success" />
            <SignalTile icon={<MapPin className="h-3 w-3 text-primary" />} label="Boundary deviation" value="0.4m" tone="success" />
            <SignalTile icon={<Brain className="h-3 w-3 text-primary" />} label="Chain confidence" value="94" tone="success" />
            <SignalTile icon={<ShieldCheck className="h-3 w-3 text-primary" />} label="Fraud signals" value="0" tone="success" />
          </div>

          <div className="surface-card p-6">
            <SectionTitle eyebrow="Audit Trail" title="Reasoning verification trace" />
            <ReasoningTrace steps={[
              { label: "Deed OCR extraction", detail: "Registered Sale Deed extracted with 99% character confidence." },
              { label: "Sub-registrar Kaveri reconciliation", detail: "Confirmed volume and page registry records with zero encumbrance flags." },
              { label: "Boundary alignment", detail: "Centroid matches Bhoomi survey map naksha within 0.4m tolerance." },
              { label: "Community validation", detail: "5 ward committee neighbor attestations received and cryptographically logged." },
            ]} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
