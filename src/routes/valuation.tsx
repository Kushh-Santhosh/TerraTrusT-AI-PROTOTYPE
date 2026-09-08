import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Info, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { analyzePropertyWithAI, type PropertyAIAnalysis } from "@/lib/ai-server";
import { loadInstitutionalProperties, loadOwnedProperties } from "@/lib/property-repository";
import {
  loadLatestPropertyAIAnalysis,
  persistPropertyAIAnalysis,
} from "@/lib/supabase-persistence";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/valuation")({
  head: () => ({ meta: [{ title: "AI Valuation — TerraTrust AI" }] }),
  component: ValuationPage,
});

function ValuationPage() {
  const { user, profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [analysis, setAnalysis] = useState<PropertyAIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProperties() {
      if (!user?.id || !profile?.role) return;
      const loaded =
        profile?.role === "citizen"
          ? await loadOwnedProperties(user.id)
          : await loadInstitutionalProperties();
      if (!cancelled) {
        setProperties(loaded);
        setSelectedId((current) => current || loaded[0]?.id || "");
      }
    }
    void loadProperties();
    return () => {
      cancelled = true;
    };
  }, [profile?.role, user?.id]);

  const selectedProperty = properties.find((property) => property.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadStoredAnalysis() {
      if (!selectedProperty) return;
      const stored = await loadLatestPropertyAIAnalysis(selectedProperty.id, "valuation");
      if (cancelled || !stored.data) return;
      setAnalysis(stored.data.result as unknown as PropertyAIAnalysis);
    }
    void loadStoredAnalysis();
    return () => {
      cancelled = true;
    };
  }, [selectedProperty]);

  async function runAnalysis() {
    if (!selectedProperty || isLoading) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    const result = await analyzePropertyWithAI({ data: selectedProperty });
    if (!result.ok) {
      setError(result.message);
      setIsLoading(false);
      return;
    }
    setAnalysis(result.analysis);
    const persisted = await persistPropertyAIAnalysis({
      propertyId: selectedProperty.id,
      passportId: selectedProperty.passportId,
      model: result.analysis.model,
      confidence: result.analysis.valuationConfidence,
      result: result.analysis,
    });
    if (persisted.error) setError(`Analysis completed, but persistence failed: ${persisted.error}`);
    setIsLoading(false);
  }

  return (
    <AppShell
      title="AI Property Valuation"
      subtitle="Defensible, explainable Indian land values backed by sub-registrar comparables, satellite geography, and infrastructure signals."
    >
      {/* Valuation Notice */}
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
        <span>
          <strong className="text-foreground">AI VALUATION MODEL:</strong> Explainable AI model
          outputs based on registered circle rates and recent Indian registry comparables.
          Non-binding estimate; not an official legal government stamp valuation.
        </span>
        <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary font-bold">
          ₹ INR ONLY
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="surface-card p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-semibold text-foreground">Estimate a Property</p>
          </div>
          <div className="mt-5 grid gap-4">
            <div className="grid gap-2">
              <Label>Property record</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} · {property.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProperty ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{selectedProperty.address}</p>
                <p className="mt-1">
                  {selectedProperty.area.toLocaleString()} m² · {selectedProperty.type} ·{" "}
                  {selectedProperty.status}
                </p>
                <p className="mt-1">Passport {selectedProperty.passportId}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No persisted property records are available for this account.
              </p>
            )}
            <Button
              className="mt-2"
              onClick={runAnalysis}
              disabled={!selectedProperty || isLoading}
            >
              <Sparkles className="mr-1 h-4 w-4" />{" "}
              {isLoading ? "Analyzing evidence..." : "Run AI analysis"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="surface-card relative overflow-hidden p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI-assisted indicative valuation
            </p>
            {error && (
              <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            {analysis ? (
              <>
                <p className="mt-2 font-display text-5xl font-bold text-foreground">
                  {analysis.estimatedValueINR == null
                    ? "Insufficient evidence"
                    : `₹${analysis.estimatedValueINR.toLocaleString("en-IN")}`}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Range: ₹{analysis.valueRangeINR.low?.toLocaleString("en-IN") ?? "—"} – ₹
                  {analysis.valueRangeINR.high?.toLocaleString("en-IN") ?? "—"} · Confidence:{" "}
                  {analysis.valuationConfidence ?? "—"}%
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Model: {analysis.model} · Generated{" "}
                  {new Date(analysis.generatedAt).toLocaleString()}
                </p>
              </>
            ) : (
              !error && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Select a persisted property and run analysis to calculate its evidence-grounded
                  estimate.
                </p>
              )
            )}
          </div>

          <div className="surface-card p-6">
            <p className="font-semibold text-foreground text-sm">Value Attribution Breakdown</p>
            {analysis ? (
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {analysis.valuationFactors.map((factor) => (
                  <li key={factor}>• {factor}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Factors appear after a real analysis is returned.
              </p>
            )}
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-primary" /> Every TerraTrust valuation ships with a
              complete algorithmic explainability ledger.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
