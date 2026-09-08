import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-risk")({
  head: () => ({ meta: [{ title: "AI Risk Analysis — TerraTrust AI" }] }),
  component: RiskPage,
});
function RiskPage() {
  return (
    <AppShell
      title="AI Risk Analysis"
      subtitle="Risk interpretation grounded in documents, boundary, verification, and institutional evidence."
    >
      <RealFeatureAnalysis feature="risk" title="Risk analysis" subtitle="" />
    </AppShell>
  );
}
