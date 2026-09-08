import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai-ocr")({
  head: () => ({ meta: [{ title: "AI OCR — TerraTrust AI" }] }),
  component: OCRPage,
});
function OCRPage() {
  return (
    <AppShell
      title="AI Document Intelligence"
      subtitle="Analyze available document evidence without claiming unverified OCR fields."
    >
      <RealFeatureAnalysis feature="ocr" title="OCR analysis" subtitle="" />
    </AppShell>
  );
}
