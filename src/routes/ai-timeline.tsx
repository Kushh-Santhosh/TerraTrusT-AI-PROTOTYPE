import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-timeline")({
  head: () => ({ meta: [{ title: "AI Timeline — TerraTrust AI" }] }),
  component: TimelinePage,
});
function TimelinePage() {
  return (
    <AppShell
      title="AI Evidence Timeline"
      subtitle="Timeline interpretation based only on persisted property events and documents."
    >
      <RealFeatureAnalysis feature="timeline" title="Timeline analysis" subtitle="" />
    </AppShell>
  );
}
