import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { AIBadge, AIInsightCard, ConfidenceMeter, VerdictBanner } from "@/components/ai/AIPrimitives";
import { SectionTitle, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Download, BookOpen } from "lucide-react";

export const Route = createFileRoute("/ai-summary")({
  head: () => ({ meta: [{ title: "AI Document Summary — TerraTrust AI" }] }),
  component: SummaryPage,
});

const summary = `This is a Registered Absolute Sale Deed executed before the Sub-Registrar, Indiranagar, Bengaluru Urban on 14 March 2024 in favour of Ananya Sharma. It conveys absolute freehold title over a 540.20 m² residential plot at Site 7B, 4th Cross, Indiranagar, registered under deed reference KA-BLR-SR-2024-00831. The deed carries verified e-Stamp challan receipts matching the Karnataka Treasury template, embedded survey centroid coordinates of 12.9567°N, 77.6200°E, and a clean ownership chain traceable to a 1994 BDA allotment. There are no mortgages, attachments, court litigations, or competing claims recorded in the accompanying Encumbrance Certificate (Form 15) as of the verification date.`;

const obligations = [
  "Annual municipal property tax (SAS) payable to BBMP by 30 April each financial year.",
  "Use restricted to residential dwellings — commercial conversion requires BDA / BBMP Change of Land Use approval.",
  "Title conveyed with perpetual absolute freehold rights.",
  "Subject to municipal building bylaws and mandatory setback margins.",
];

const risks = [
  { label: "Encumbrance Certificate (Form 15)", status: "Nil encumbrance (30 yrs)" as const, tone: "success" as const },
  { label: "Property tax status (BBMP SAS)", status: "Current (2024-25)" as const, tone: "success" as const },
  { label: "Bhoomi survey boundary", status: "Verified" as const, tone: "success" as const },
  { label: "Dispute / litigation history", status: "None on record" as const, tone: "success" as const },
];

function SummaryPage() {
  return (
    <AppShell
      title="AI Document Summary"
      subtitle="Plain-English legal briefs for uploaded deeds, khata certificates, and encumbrance reports."
      actions={<><Button variant="outline"><Copy className="h-4 w-4 mr-1" /> Copy</Button><Button><Download className="h-4 w-4 mr-1" /> Export PDF</Button></>}
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">LEGAL SUMMARY ENGINE:</strong> Plain-language AI summarizer trained on Indian conveyance deeds and registry clauses. Non-binding advisory summary.
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AIInsightCard icon={<FileText className="h-3 w-3 text-primary" />} title="Doc type" value="Sale Deed" hint="Registered absolute conveyance" tone="primary" />
        <AIInsightCard title="Reading level" value="Plain English" hint="Legal jargon decoded" tone="accent" />
        <AIInsightCard title="Key clauses found" value="11" hint="Surfaced & explained below" tone="primary" />
        <AIInsightCard title="Summary confidence" value="98%" hint="Cross-checked vs full deed text" tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="surface-card p-6">
            <SectionTitle eyebrow="Plain-English summary" title="Registered Sale Deed & Khata Extract.pdf" action={<AIBadge>Summary Indic v2.4</AIBadge>} />
            <p className="text-[15px] leading-relaxed text-foreground mt-3">{summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill tone="primary">Residential</Pill>
              <Pill tone="success">Verified</Pill>
              <Pill>540 m²</Pill>
              <Pill>Indiranagar, Bengaluru</Pill>
              <Pill>2024-03-14</Pill>
            </div>
          </div>

          <div className="surface-card p-5">
            <SectionTitle eyebrow="Statutory obligations" title="What the document requires of the owner" />
            <ul className="space-y-2 text-sm mt-3">
              {obligations.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground text-xs">
                  <span className="text-primary font-bold">✓</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <VerdictBanner verdict="trusted" headline="Clean title with zero encumbrances detected." detail="Matches sub-registrar volume/page register and e-Stamp reconciliation." />
          <div className="surface-card p-5">
            <SectionTitle eyebrow="Forensic cross-checks" title="Evidentiary validation" />
            <div className="space-y-3 mt-3">
              {risks.map((r, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/60 pb-2 text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <Pill tone={r.tone}>{r.status}</Pill>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
