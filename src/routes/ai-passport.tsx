import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-passport")({
  head: () => ({ meta: [{ title: "AI Property Passport — TerraTrust AI" }] }),
  component: PassportPage,
});
function PassportPage() {
  return (
    <AppShell
      title="AI Property Passport"
      subtitle="A persisted evidence summary for the selected real property, not legal title."
    >
      <RealFeatureAnalysis feature="passport" title="Passport analysis" subtitle="" />
    </AppShell>
  );
}
