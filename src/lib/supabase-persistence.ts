import { supabase, supabaseConfigured } from "./supabase";
import type { VerificationResult } from "./verification-workflow";
import type { PropertyType, PropertyBoundary } from "./types";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export type PersistenceOutcome = { error: string | null; persisted: boolean; data?: any };

/**
 * Creates a new property record in the database
 */
export async function createProperty(input: {
  ownerId: string;
  propertyName: string;
  passportId: string;
  location?: {
    address?: string;
    region?: string;
    country?: string;
    propertyType?: PropertyType;
    estimatedValueInr?: number;
    description?: string;
    latitude?: number;
    longitude?: number;
    boundary?: PropertyBoundary[];
  };
  area: number;
  status?: "verified" | "pending" | "disputed" | "draft";
  trustScore?: number;
}): Promise<PersistenceOutcome> {
  if (!supabaseConfigured) {
    return { error: null, persisted: false };
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .insert({
        owner_id: input.ownerId,
        property_name: input.propertyName,
        passport_id: input.passportId,
        location: input.location ?? {},
        area: input.area,
        status: input.status ?? "pending",
        trust_score: input.trustScore ?? 0,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message, persisted: false };
    }

    return { error: null, persisted: true, data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create property",
      persisted: false,
    };
  }
}

/**
 * Stores document metadata attached to a property
 */
export async function savePropertyDocument(input: {
  propertyId: string;
  name: string;
  kind: "deed" | "survey" | "tax" | "id" | "other";
  storagePath?: string;
  verified?: boolean;
}): Promise<PersistenceOutcome> {
  if (!supabaseConfigured) return { error: null, persisted: false };

  try {
    const { data, error } = await supabase
      .from("property_documents")
      .insert({
        property_id: input.propertyId,
        name: input.name,
        kind: input.kind,
        storage_path: input.storagePath ?? null,
        verified: input.verified ?? false,
      })
      .select()
      .single();

    if (error) return { error: error.message, persisted: false };
    return { error: null, persisted: true, data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save document metadata",
      persisted: false,
    };
  }
}

/**
 * Uploads a document binary file to Supabase Storage bucket 'property-documents'
 */
export async function uploadPropertyDocumentBinary(input: {
  userId: string;
  propertyId: string;
  file: File;
}): Promise<{ storagePath: string | null; error: string | null }> {
  if (!supabaseConfigured) {
    return { storagePath: null, error: "Supabase not configured" };
  }

  try {
    const cleanName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueStamp = Date.now().toString(36);
    // Path conforms to RLS: <userId>/<propertyId>/<uniqueStamp>_<filename>
    const storagePath = `${input.userId}/${input.propertyId}/${uniqueStamp}_${cleanName}`;

    const { error } = await supabase.storage
      .from("property-documents")
      .upload(storagePath, input.file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      return { storagePath: null, error: error.message };
    }

    return { storagePath, error: null };
  } catch (err) {
    return {
      storagePath: null,
      error: err instanceof Error ? err.message : "Storage upload exception",
    };
  }
}


/**
 * Records community verification decision via RPC
 */
export async function recordCommunityDecision(input: {
  passportId: string;
  decision: "attested" | "objected";
}): Promise<PersistenceOutcome> {
  if (!supabaseConfigured) return { error: null, persisted: false };

  try {
    const { error } = await supabase.rpc("record_community_decision", {
      p_passport_id: input.passportId,
      p_decision: input.decision,
    });
    return { error: error?.message ?? null, persisted: !error };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "RPC execution failed",
      persisted: false,
    };
  }
}

/**
 * Records surveyor evidence via RPC
 */
export async function recordSurveyEvidence(input: {
  passportId: string;
  name: string;
  kind: string;
}): Promise<PersistenceOutcome> {
  if (!supabaseConfigured) return { error: null, persisted: false };

  try {
    const { error } = await supabase.rpc("record_survey_evidence", {
      p_passport_id: input.passportId,
      p_name: input.name,
      p_kind: input.kind,
    });
    return { error: error?.message ?? null, persisted: !error };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "RPC execution failed",
      persisted: false,
    };
  }
}

/**
 * Resolves property review by government officer via RPC
 */
export async function resolvePropertyReview(input: {
  passportId: string;
  resolution: "verified" | "pending" | "disputed";
}): Promise<PersistenceOutcome> {
  if (!supabaseConfigured) return { error: null, persisted: false };

  try {
    const { error } = await supabase.rpc("resolve_property_review", {
      p_passport_id: input.passportId,
      p_resolution: input.resolution,
    });
    return { error: error?.message ?? null, persisted: !error };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "RPC execution failed",
      persisted: false,
    };
  }
}

async function resolvePropertyId(idOrPassport: string): Promise<{ id: string | null; error: string | null }> {
  const query = supabase.from("properties").select("id");
  const { data, error } = isUuid(idOrPassport)
    ? await query.eq("id", idOrPassport).maybeSingle()
    : await query.eq("passport_id", idOrPassport).maybeSingle();

  if (error) return { id: null, error: error.message };
  if (!data) return { id: null, error: "Property not found" };
  return { id: data.id, error: null };
}

/**
 * Persists an n8n or simulated verification run outcome to Supabase
 */
export async function persistVerificationOutcome(input: {
  propertyId: string;
  passportId?: string;
  userId?: string;
  result: VerificationResult;
}): Promise<PersistenceOutcome> {
  if (!supabaseConfigured) {
    return { error: null, persisted: false };
  }

  try {
    const target = await resolvePropertyId(input.passportId ?? input.propertyId);
    if (!target.id) return { error: target.error, persisted: false };

    const actualPropertyId = target.id;

    // 1. Insert verification result record
    const { error: resultErr } = await supabase.from("verification_results").insert({
      property_id: actualPropertyId,
      provider: input.result.provider ?? "n8n",
      result: input.result,
    });
    if (resultErr) return { error: resultErr.message, persisted: false };

    // 2. Handle review cases
    if (input.result.status === "manual_review") {
      const { data: existingCase } = await supabase
        .from("review_cases")
        .select("id")
        .eq("property_id", actualPropertyId)
        .in("status", ["open", "in_review"])
        .maybeSingle();

      const casePayload = {
        status: "open" as const,
        reason: input.result.decisionReason || "Manual review required by orchestrator",
        updated_at: new Date().toISOString(),
      };

      if (existingCase) {
        await supabase.from("review_cases").update(casePayload).eq("id", existingCase.id);
      } else {
        await supabase.from("review_cases").insert({
          property_id: actualPropertyId,
          ...casePayload,
        });
      }
    } else if (input.result.status === "verified") {
      // Resolve any open review cases
      await supabase
        .from("review_cases")
        .update({ status: "resolved", updated_at: new Date().toISOString() })
        .eq("property_id", actualPropertyId)
        .in("status", ["open", "in_review"]);
    }

    // 3. Update property status and trust score
    const newStatus =
      input.result.status === "verified"
        ? "verified"
        : input.result.status === "manual_review"
          ? "pending"
          : "disputed";

    const { error: propErr } = await supabase
      .from("properties")
      .update({
        status: newStatus,
        trust_score: Math.max(0, Math.min(100, Math.round(input.result.confidenceScore ?? 0))),
        updated_at: new Date().toISOString(),
      })
      .eq("id", actualPropertyId);

    if (propErr) return { error: propErr.message, persisted: false };

    return { error: null, persisted: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to persist verification outcome",
      persisted: false,
    };
  }
}
