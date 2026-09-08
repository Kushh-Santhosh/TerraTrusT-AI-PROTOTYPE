import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-confidence")({
  head: () => ({ meta: [{ title: "AI Confidence Score — TerraTrust AI" }] }),
  component: ConfidencePage,
});

function ConfidencePage() {
  return (
    <AppShell
      title="AI Confidence Score"
      subtitle="Confidence is derived from the selected property's persisted evidence and reported with its limitations."
    >
      <RealFeatureAnalysis feature="confidence" title="Confidence analysis" subtitle="" />
    </AppShell>
  );
}
