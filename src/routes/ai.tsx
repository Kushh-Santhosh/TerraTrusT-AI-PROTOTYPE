import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RealFeatureAnalysis } from "@/components/ai/RealFeatureAnalysis";

export const Route = createFileRoute("/ai")({ head: () => ({ meta: [{ title: "AI Intelligence Hub — TerraTrust AI" }] }), component: AIHubPage });
function AIHubPage() { return <AppShell title="AI Intelligence Hub" subtitle="Run evidence-grounded Gemini analysis for the selected persisted property."><RealFeatureAnalysis feature="summary" title="Property analysis" subtitle="" /></AppShell>; }
