import type { Property, PropertyDocument, PropertyBoundary, PropertyType } from "./types";
import { supabase, supabaseConfigured } from "./supabase";
import { properties as demoProperties } from "./mock-data";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function mapDocumentRow(row: {
  id: string;
  name: string;
  kind: string;
  storage_path?: string | null;
  verified: boolean;
  created_at: string;
}): PropertyDocument {
  const validKinds: PropertyDocument["kind"][] = ["deed", "survey", "tax", "id", "other"];
  const kind = validKinds.includes(row.kind as PropertyDocument["kind"])
    ? (row.kind as PropertyDocument["kind"])
    : "other";

  return {
    id: row.id,
    name: row.name,
    kind,
    uploadedAt: row.created_at.slice(0, 10),
    verified: row.verified,
  };
}

export function mapPropertyRow(row: {
  id: string;
  passport_id: string;
  property_name: string;
  location: {
    address?: string;
    region?: string;
    country?: string;
    propertyType?: PropertyType;
    estimatedValueInr?: number;
    description?: string;
    latitude?: number;
    longitude?: number;
    boundary?: PropertyBoundary[];
  } | null;
  area: number;
  status: Property["status"];
  trust_score: number;
  documents?: {
    id: string;
    name: string;
    kind: string;
    storage_path?: string | null;
    verified: boolean;
    created_at: string;
  }[];
}): Property {
  const loc = row.location ?? {};
  return {
    id: row.id,
    passportId: row.passport_id,
    title: row.property_name,
    type: (loc.propertyType as PropertyType | undefined) ?? "residential",
    status: row.status,
    trustScore: row.trust_score,
    area: Number(row.area || 0),
    address: loc.address ?? "Address pending",
    region: loc.region ?? "Region pending",
    country: loc.country ?? "India",
    description: loc.description,
    owner: "Authenticated Property Owner",
    ownerSince: new Date().toISOString().slice(0, 10),
    valuation: Number(loc.estimatedValueInr ?? 0),
    aiConfidence: row.trust_score,
    coords: {
      lat: Number(loc.latitude ?? 0),
      lng: Number(loc.longitude ?? 0),
    },
    boundary: Array.isArray(loc.boundary) ? (loc.boundary as PropertyBoundary[]) : [],
    documents: (row.documents ?? []).map(mapDocumentRow),
    timeline: [],
  };
}

/** Loads properties owned by a citizen user */
export async function loadOwnedProperties(userId: string): Promise<Property[]> {
  if (!supabaseConfigured || !userId) return demoProperties;

  try {
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id, passport_id, property_name, location, area, status, trust_score, property_documents(id, name, kind, storage_path, verified, created_at)",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data?.length) return demoProperties;
    return data.map((row) => mapPropertyRow({ ...row, documents: row.property_documents }));
  } catch {
    return demoProperties;
  }
}

/** Loads a single property by its UUID or passport ID */
export async function loadPropertyById(idOrPassport: string): Promise<Property | null> {
  if (!supabaseConfigured) {
    return demoProperties.find((p) => p.id === idOrPassport || p.passportId === idOrPassport) ?? null;
  }

  try {
    const query = supabase
      .from("properties")
      .select(
        "id, passport_id, property_name, location, area, status, trust_score, property_documents(id, name, kind, storage_path, verified, created_at)",
      );

    const { data, error } = isUuid(idOrPassport)
      ? await query.eq("id", idOrPassport).maybeSingle()
      : await query.eq("passport_id", idOrPassport).maybeSingle();

    if (error || !data) {
      return demoProperties.find((p) => p.id === idOrPassport || p.passportId === idOrPassport) ?? null;
    }

    return mapPropertyRow({ ...data, documents: data.property_documents });
  } catch {
    return demoProperties.find((p) => p.id === idOrPassport || p.passportId === idOrPassport) ?? null;
  }
}

/** Loads shared properties for institutional roles (Government, Surveyor, Bank, Admin) */
export async function loadInstitutionalProperties(statusFilter?: Property["status"]): Promise<Property[]> {
  if (!supabaseConfigured) {
    if (statusFilter) return demoProperties.filter((p) => p.status === statusFilter);
    return demoProperties;
  }

  try {
    let query = supabase
      .from("properties")
      .select(
        "id, passport_id, property_name, location, area, status, trust_score, property_documents(id, name, kind, storage_path, verified, created_at)",
      )
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error || !data?.length) {
      return statusFilter ? demoProperties.filter((p) => p.status === statusFilter) : demoProperties;
    }

    return data.map((row) => mapPropertyRow({ ...row, documents: row.property_documents }));
  } catch {
    return demoProperties;
  }
}

/** Loads the latest verification result for a property */
export async function loadPropertyVerification(propertyId: string) {
  if (!supabaseConfigured) return null;

  try {
    const query = supabase
      .from("verification_results")
      .select("id, provider, result, created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    const { data } = isUuid(propertyId)
      ? await query.eq("property_id", propertyId).maybeSingle()
      : await query.maybeSingle();

    return data ?? null;
  } catch {
    return null;
  }
}

/** Loads review cases for human review queues */
export async function loadReviewCases(propertyId?: string) {
  if (!supabaseConfigured) return [];

  try {
    let query = supabase
      .from("review_cases")
      .select("id, property_id, status, reason, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }

    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
