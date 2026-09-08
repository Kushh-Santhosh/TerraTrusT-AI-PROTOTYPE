import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-boundary")({
  head: () => ({ meta: [{ title: "AI Boundary Detection — TerraTrust AI" }] }),
  component: BoundaryPage,
});

const vertices = [
  { id: "V1", expected: "6.4414, 3.4707", detected: "6.4414, 3.4707", drift: 0.1 },
  { id: "V2", expected: "6.4415, 3.4712", detected: "6.4415, 3.4712", drift: 0.2 },
  { id: "V3", expected: "6.4411, 3.4713", detected: "6.4410, 3.4713", drift: 0.5 },
  { id: "V4", expected: "6.4410, 3.4708", detected: "6.4410, 3.4708", drift: 0.3 },
];

function BoundaryPage() {
  return (
    <AppShell
      title="AI Boundary Detection"
      subtitle="Polygon extraction from satellite imagery, cross-checked against surveyor ground truth."
    >
      <RealFeatureAnalysis feature="boundary" title="Boundary analysis" subtitle="" />
    </AppShell>
  );
}
