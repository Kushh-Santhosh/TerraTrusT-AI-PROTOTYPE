import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { AIBadge, ConfidenceMeter, AIInsightCard, ReasoningTrace, VerdictBanner } from "@/components/ai/AIPrimitives";
import { SectionTitle, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { ScanLine, Upload, FileText, CheckCircle2 } from "lucide-react";
import { ocrFields, recommendationsForDoc } from "@/lib/ai-mock";

export const Route = createFileRoute("/ai-ocr")({
  head: () => ({ meta: [{ title: "AI Document OCR — TerraTrust AI" }] }),
  component: OCRPage,
});

function OCRPage() {
  return (
    <AppShell
      title="Document OCR & Forensic Extraction"
      subtitle="Extract structured title attributes from registered Indian sale deeds, survey nakshas, and khata extracts."
      actions={<><Button variant="outline"><Upload className="h-4 w-4 mr-1" /> Upload Deed</Button><Button><ScanLine className="h-4 w-4 mr-1" /> Re-scan</Button></>}
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">FORENSIC OCR ENGINE:</strong> Calibrated on Indian bilingual deed templates, e-Stamp certificates, and sub-registrar seal formats.
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AIInsightCard title="Fields extracted" value="8 / 8" hint="Sale Deed · Page 2" tone="success" />
        <AIInsightCard title="Avg. confidence" value="97%" delta={{ value: 3, label: "vs prior scan" }} tone="primary" />
        <AIInsightCard title="Verification" value="Auto-pass" hint="All parameters verified" tone="success" />
        <AIInsightCard title="Inference latency" value="1.1s" hint="GPU-accelerated" tone="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_440px]">
        <div className="surface-card p-6">
          <SectionTitle eyebrow="Source · Page 2" title="Registered Sale Deed & Form 15.pdf" action={<AIBadge>OCR Indic v3.1</AIBadge>} />
          <div className="relative overflow-hidden rounded-xl border border-border bg-[oklch(0.985_0.005_95)] p-6">
            <div className="absolute right-4 top-4"><Pill tone="success"><CheckCircle2 className="h-3 w-3 inline mr-1" /> Stamped & Valid</Pill></div>
            <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">Department of Stamps & Registration · Government of Karnataka</p>
            <p className="mt-1 text-center font-display text-2xl font-bold">Registered Sale Deed</p>
            <p className="mt-1 text-center text-xs text-muted-foreground font-mono">Ref. KA-BLR-SR-2024-00831</p>
            <div className="mt-6 space-y-3 text-sm">
              {ocrFields.map((f, i) => (
                <div key={i} className="group relative rounded-md bg-surface p-2.5 ring-1 ring-primary/15">
                  <div className="absolute inset-y-0 left-0 w-1 rounded-l-md bg-primary/60" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{f.label}</p>
                  <p className="font-medium text-foreground text-xs">{f.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[10px] text-muted-foreground">— End of extracted region —</p>
          </div>
        </div>

        <div className="space-y-6">
          <VerdictBanner verdict="trusted" headline="All 8 fields extracted & cross-validated." detail="e-Challan stamp matches treasury issue window. Aadhaar, PAN and Sub-Registrar deed references align with registry." />
          <div className="surface-card p-5">
            <SectionTitle eyebrow="Field certainty" title="Extraction quality" />
            <div className="space-y-3">
              {ocrFields.map((f, i) => (
                <ConfidenceMeter key={i} value={f.confidence} label={f.label} hint={f.value} />
              ))}
            </div>
          </div>
          <div className="surface-card p-5">
            <SectionTitle eyebrow="Forensic Cross-checks" title="What the model verified" />
            <ul className="space-y-2 text-xs text-muted-foreground">
              {recommendationsForDoc.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
