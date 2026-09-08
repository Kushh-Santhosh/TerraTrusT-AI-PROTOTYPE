import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-suggestions")({
  head: () => ({ meta: [{ title: "AI Suggestions — TerraTrust AI" }] }),
  component: SuggestionsPage,
});
function SuggestionsPage() {
  return (
    <AppShell
      title="AI Verification Suggestions"
      subtitle="Evidence-driven next actions for the selected persisted property."
    >
      <RealFeatureAnalysis feature="suggestions" title="Suggestions" subtitle="" />
    </AppShell>
  );
}
