import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-recommendations")({
  head: () => ({ meta: [{ title: "AI Recommendations — TerraTrust AI" }] }),
  component: RecommendationsPage,
});
function RecommendationsPage() {
  return (
    <AppShell
      title="AI Recommendations"
      subtitle="Evidence-driven next actions for the selected persisted property."
    >
      <RealFeatureAnalysis feature="recommendations" title="Recommendations" subtitle="" />
    </AppShell>
  );
}
