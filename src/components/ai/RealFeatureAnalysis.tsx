import {
  AIBadge,
  AIInsightCard,
  ConfidenceMeter,
  VerdictBanner,
} from "@/components/ai/AIPrimitives";
import { Button } from "@/components/ui/button";
import { useActivePropertyAI } from "@/hooks/use-active-property-ai";
import type { PropertyFeature } from "@/lib/ai-server";
import { AlertTriangle, Brain, CheckCircle2, Loader2 } from "lucide-react";

export function RealFeatureAnalysis({
  feature,
  title,
  subtitle,
  propertyId,
}: {
  feature: PropertyFeature;
  title: string;
  subtitle: string;
  propertyId?: string;
}) {
  const { property, result, isLoading, error, run } = useActivePropertyAI(feature, propertyId);
  const analysis = result?.ok ? result.analysis : null;
  return (
    <div className="space-y-6">
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
        <strong className="text-foreground">REAL EVIDENCE ANALYSIS:</strong> Gemini interprets the
        selected persisted property. Missing evidence is reported explicitly; this is not legal
        title or official government verification.
      </div>
      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold text-foreground">
            {property?.title ?? "No persisted property selected"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {property
              ? `${property.passportId} · ${property.region} · ${property.area.toLocaleString()} m²`
              : "Sign in with an account that can access a property."}
          </p>
        </div>
        <Button onClick={run} disabled={!property || isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Brain className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Analyzing evidence..." : `Run ${title}`}
        </Button>
      </div>
      {error && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </p>
      )}
      {analysis ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <AIInsightCard
              title="Analysis"
              value={analysis.band}
              hint={analysis.title}
              tone="primary"
            />
            <AIInsightCard
              title="Score"
              value={analysis.score == null ? "—" : `${Math.round(analysis.score)}/100`}
              hint="AI interpretation only"
              tone={analysis.score != null && analysis.score >= 70 ? "success" : "warning"}
            />
            <AIInsightCard
              title="Confidence"
              value={analysis.confidence == null ? "—" : `${Math.round(analysis.confidence)}%`}
              hint={analysis.model}
              tone="accent"
            />
            <AIInsightCard
              title="Evidence gaps"
              value={`${analysis.missingEvidence.length}`}
              hint="Requires action"
              tone="warning"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-6">
              <p className="font-semibold text-foreground">{analysis.title}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{analysis.summary}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                Model {analysis.model} · {new Date(analysis.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="surface-card p-6">
              <p className="font-semibold text-foreground">Evidence and findings</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[...analysis.findings, ...analysis.evidence].map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-6">
              <p className="font-semibold text-foreground">Recommended next actions</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {analysis.recommendations.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="surface-card p-6">
              <p className="font-semibold text-foreground">Missing evidence and limitations</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  ...analysis.missingEvidence,
                  "AI interpretation does not replace government authority or legal title.",
                ].map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        !error && (
          <p className="rounded-lg border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
            Run the analysis to generate a real Gemini result from persisted property evidence.
          </p>
        )
      )}
    </div>
  );
}
