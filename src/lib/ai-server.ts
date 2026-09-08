import { createServerFn } from "@tanstack/react-start";
import type { Property } from "./types";

const DEFAULT_MODEL = "gemini-3.8-flash";

export interface PropertyAIAnalysis {
  estimatedValueINR: number | null;
  valueRangeINR: { low: number | null; high: number | null };
  pricePerSqFtINR: number | null;
  valuationConfidence: number | null;
  valuationFactors: string[];
  locationFactors: string[];
  propertyFactors: string[];
  riskAdjustments: string[];
  documentObservations: string[];
  riskObservations: string[];
  boundaryObservations: string[];
  missingEvidence: string[];
  recommendedNextAction: string;
  assumptions: string[];
  limitations: string[];
  generatedAt: string;
  model: string;
}

export type PropertyAIResult =
  | { ok: true; analysis: PropertyAIAnalysis }
  | { ok: false; error: "AI_UNAVAILABLE" | "AI_INVALID_RESPONSE"; message: string };

const responseSchema = {
  type: "object",
  properties: {
    estimatedValueINR: { type: "number" },
    lowEstimateINR: { type: "number" },
    highEstimateINR: { type: "number" },
    pricePerSqFtINR: { type: "number" },
    confidence: { type: "number" },
    factors: { type: "array", items: { type: "string" } },
    locationFactors: { type: "array", items: { type: "string" } },
    propertyFactors: { type: "array", items: { type: "string" } },
    riskAdjustments: { type: "array", items: { type: "string" } },
    documentObservations: { type: "array", items: { type: "string" } },
    riskObservations: { type: "array", items: { type: "string" } },
    boundaryObservations: { type: "array", items: { type: "string" } },
    missingEvidence: { type: "array", items: { type: "string" } },
    recommendedNextAction: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: [
    "estimatedValueINR",
    "lowEstimateINR",
    "highEstimateINR",
    "pricePerSqFtINR",
    "confidence",
    "factors",
    "locationFactors",
    "propertyFactors",
    "riskAdjustments",
    "documentObservations",
    "riskObservations",
    "boundaryObservations",
    "missingEvidence",
    "recommendedNextAction",
    "assumptions",
    "limitations",
  ],
} as const;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeAnalysis(value: unknown, model: string): PropertyAIAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.lowEstimateINR !== "number" ||
    typeof raw.highEstimateINR !== "number" ||
    typeof raw.recommendedNextAction !== "string"
  )
    return null;
  const confidence = numberOrNull(raw.confidence);
  return {
    estimatedValueINR: numberOrNull(raw.estimatedValueINR),
    valueRangeINR: {
      low: numberOrNull(raw.lowEstimateINR),
      high: numberOrNull(raw.highEstimateINR),
    },
    pricePerSqFtINR: numberOrNull(raw.pricePerSqFtINR),
    valuationConfidence: confidence !== null && confidence <= 1 ? confidence * 100 : confidence,
    valuationFactors: strings(raw.factors),
    locationFactors: strings(raw.locationFactors),
    propertyFactors: strings(raw.propertyFactors),
    riskAdjustments: strings(raw.riskAdjustments),
    documentObservations: strings(raw.documentObservations),
    riskObservations: strings(raw.riskObservations),
    boundaryObservations: strings(raw.boundaryObservations),
    missingEvidence: strings(raw.missingEvidence),
    recommendedNextAction: raw.recommendedNextAction,
    assumptions: strings(raw.assumptions),
    limitations: strings(raw.limitations),
    generatedAt: new Date().toISOString(),
    model,
  };
}

function propertyEvidence(property: Property): Record<string, unknown> {
  return {
    propertyId: property.id,
    passportId: property.passportId,
    type: property.type,
    state: property.stateCode || property.region,
    city: property.region,
    address: property.address,
    latitude: property.coords.lat,
    longitude: property.coords.lng,
    areaSqM: property.area,
    boundary: property.boundary,
    description: property.description || null,
    status: property.status,
    documents: property.documents.map((document) => ({
      id: document.id,
      name: document.name,
      kind: document.kind,
      verified: document.verified,
    })),
    verification: {
      trustScore: property.trustScore,
      aiConfidence: property.aiConfidence,
      governmentDecision: property.governmentDecision || null,
      surveyorDecision: property.surveyorDecision || null,
    },
  };
}

export const analyzePropertyWithAI = createServerFn({ method: "POST" })
  .validator((property: Property) => property)
  .handler(async ({ data: property }): Promise<PropertyAIResult> => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return {
        ok: false,
        error: "AI_UNAVAILABLE",
        message:
          "AI analysis is temporarily unavailable. GEMINI_API_KEY is not configured on the server.",
      };
    }

    const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
    const prompt = [
      "You are TerraTrust AI, an Indian property intelligence assistant.",
      "Analyze only the supplied evidence. Never invent government records, comparables, legal ownership, or fraud findings.",
      "Return JSON matching the supplied schema. This is an AI-assisted indicative valuation, not an official government valuation or legal title decision.",
      "For insufficient evidence, use null values and explain the missing evidence instead of guessing.",
      `Property evidence:\n${JSON.stringify(propertyEvidence(property))}`,
    ].join("\n\n");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema,
              temperature: 0.1,
              maxOutputTokens: 1800,
            },
          }),
        },
      );

      if (!response.ok) {
        return {
          ok: false,
          error: "AI_UNAVAILABLE",
          message: `AI provider returned HTTP ${response.status}.`,
        };
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== "string") {
        return {
          ok: false,
          error: "AI_INVALID_RESPONSE",
          message: "AI provider returned no structured analysis.",
        };
      }

      const analysis = normalizeAnalysis(JSON.parse(text), model);
      if (!analysis) {
        return {
          ok: false,
          error: "AI_INVALID_RESPONSE",
          message: "AI provider returned an invalid analysis shape.",
        };
      }
      return { ok: true, analysis };
    } catch (error) {
      console.error(
        "Gemini property analysis failed",
        error instanceof Error ? error.message : "unknown error",
      );
      return {
        ok: false,
        error: "AI_UNAVAILABLE",
        message: "AI analysis is temporarily unavailable. Please retry.",
      };
    }
  });
