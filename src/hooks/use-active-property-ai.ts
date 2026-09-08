import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  loadInstitutionalProperties,
  loadOwnedProperties,
  loadPropertyById,
} from "@/lib/property-repository";
import type { Property } from "@/lib/types";
import {
  analyzePropertyFeatureWithAI,
  type FeatureAIAnalysis,
  type PropertyFeature,
  type FeatureAIResult,
} from "@/lib/ai-server";
import {
  loadLatestPropertyAIAnalysis,
  persistPropertyAIAnalysis,
} from "@/lib/supabase-persistence";

export function useActivePropertyAI(feature: PropertyFeature, propertyId?: string) {
  const { user, profile } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [result, setResult] = useState<FeatureAIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      const selected = propertyId
        ? await loadPropertyById(propertyId)
        : ((profile?.role === "citizen"
            ? await loadOwnedProperties(user.id)
            : await loadInstitutionalProperties())[0] ?? null);
      if (cancelled || !selected) return;
      setProperty(selected);
      const stored = await loadLatestPropertyAIAnalysis(selected.id, feature);
      const storedResult = stored.data?.result as Record<string, unknown> | undefined;
      if (!cancelled && storedResult?.feature === feature) {
        setResult({ ok: true, analysis: storedResult as unknown as FeatureAIAnalysis });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [feature, profile?.role, propertyId, user?.id]);

  async function run() {
    if (!property || isLoading) return;
    setIsLoading(true);
    setError(null);
    const response = await analyzePropertyFeatureWithAI({ data: { property, feature } });
    if (!response.ok) {
      setError(response.message);
      setIsLoading(false);
      return;
    }
    setResult(response);
    const saved = await persistPropertyAIAnalysis({
      propertyId: property.id,
      passportId: property.passportId,
      model: response.analysis.model,
      confidence: response.analysis.confidence,
      result: response.analysis,
    });
    if (saved.error) setError(`Analysis completed but could not be saved: ${saved.error}`);
    setIsLoading(false);
  }

  return { property, result, isLoading, error, run };
}
