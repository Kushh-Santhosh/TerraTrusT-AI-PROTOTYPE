import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-fraud")({
  head: () => ({ meta: [{ title: "AI Fraud Analysis — TerraTrust AI" }] }),
  component: FraudPage,
});
function FraudPage() {
  return (
    <AppShell
      title="AI Fraud Analysis"
      subtitle="Evidence-backed anomaly analysis. Uncertainty is reported as insufficient evidence."
    >
      <RealFeatureAnalysis feature="fraud" title="Fraud analysis" subtitle="" />
    </AppShell>
  );
}
