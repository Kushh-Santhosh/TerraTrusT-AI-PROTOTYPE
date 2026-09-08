import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-land-health")({
  head: () => ({ meta: [{ title: "AI Land Health — TerraTrust AI" }] }),
  component: LandHealthPage,
});
function LandHealthPage() {
  return (
    <AppShell
      title="AI Land Health"
      subtitle="Evidence-aware land-health interpretation. Satellite metrics are not fabricated when unavailable."
    >
      <RealFeatureAnalysis feature="land-health" title="Land-health analysis" subtitle="" />
    </AppShell>
  );
}
