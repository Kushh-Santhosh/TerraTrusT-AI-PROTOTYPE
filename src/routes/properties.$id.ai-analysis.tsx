import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs } from "@/components/ui-ext/Scaffold";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/properties/$id/ai-analysis")({
  head: () => ({ meta: [{ title: "AI Analysis — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return (
    <AppShell
      title="AI Analysis"
      subtitle="Algorithmic explainability for trust score, boundary validation, and market valuation."
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: id, to: "/properties/$id" },
          { label: "AI Analysis" },
        ]}
      />
      <PropertySubNav propertyId={id} activeTab="ai-analysis" />

      <RealFeatureAnalysis
        feature="summary"
        title="Property analysis"
        subtitle=""
        propertyId={id}
      />
    </AppShell>
  );
}
