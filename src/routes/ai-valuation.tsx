import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-valuation")({
  head: () => ({ meta: [{ title: "AI Valuation — TerraTrust AI" }] }),
  component: ValuationPage,
});
function ValuationPage() {
  return (
    <AppShell
      title="AI Valuation Analysis"
      subtitle="Run a real Gemini analysis using the selected persisted property. For the full valuation form, use AI Property Valuation."
    >
      <RealFeatureAnalysis feature="valuation" title="Valuation context" subtitle="" />
    </AppShell>
  );
}
