import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-summary")({
  head: () => ({ meta: [{ title: "AI Document Summary — TerraTrust AI" }] }),
  component: SummaryPage,
});

function SummaryPage() {
  return (
    <AppShell
      title="AI Document Summary"
      subtitle="Evidence-grounded interpretation of the selected property."
    >
      <RealFeatureAnalysis feature="summary" title="Summary" subtitle="" />
    </AppShell>
  );
}
