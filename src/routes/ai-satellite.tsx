import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-satellite")({
  head: () => ({ meta: [{ title: "AI Satellite Comparison — TerraTrust AI" }] }),
  component: SatellitePage,
});

function SatellitePage() {
  return (
    <AppShell
      title="AI Satellite Comparison"
      subtitle="Satellite interpretation is shown only when imagery evidence is persisted for the selected property."
    >
      <RealFeatureAnalysis feature="satellite" title="Satellite analysis" subtitle="" />
    </AppShell>
  );
}
