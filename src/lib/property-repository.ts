import type { Property, PropertyDocument, PropertyBoundary, PropertyType } from "./types";
import { supabase, supabaseConfigured } from "./supabase";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type PropertyLocation = {
  address?: string;
  region?: string;
  country?: string;
  propertyType?: PropertyType;
  estimatedValueInr?: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  boundary?: PropertyBoundary[];
  cadastralIdentifiers?: Record<string, unknown>;
  sourceChecks?: Record<string, unknown>;
  stateCode?: string;
  surveyorBoundary?: PropertyBoundary[];
  governmentBoundary?: PropertyBoundary[];
  surveyorDecision?: Property["surveyorDecision"];
  surveyorNotes?: string;
  surveyorFieldPhotos?: string[];
  governmentDecision?: Property["governmentDecision"];
  governmentOfficerNotes?: string;
  governmentDecidedAt?: string;
};

type PropertyDocumentRow = {
  id: string;
  name: string;
  kind: string;
  storage_path?: string | null;
  verified: boolean;
  created_at: string;
};

type ReviewCasePropertyRow = {
  id: string;
  passport_id: string;
  property_name: string;
  status: Property["status"];
  trust_score: number;
  location: PropertyLocation | null;
};

type AssignmentPropertyRow = {
  id: string;
  passport_id: string;
  property_name: string;
  location: PropertyLocation | null;
  area: number;
  status: Property["status"];
  trust_score: number;
  property_documents: PropertyDocumentRow[];
};

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
    storagePath: row.storage_path,
  };
}

export function mapPropertyRow(row: {
  id: string;
  owner_id?: string;
  passport_id: string;
  property_name: string;
  location: PropertyLocation | null;
  area: number;
  status: Property["status"];
  trust_score: number;
  documents?: PropertyDocumentRow[];
}): Property {
  const loc = row.location ?? {};
  return {
    id: row.id,
    ownerId: row.owner_id,
    passportId: row.passport_id,
    title: row.property_name,
    type: (loc.propertyType as PropertyType | undefined) ?? "residential",
    status: row.status,
    trustScore: row.trust_score,
    area: Number(row.area || 0),
    address: loc.address ?? "Address pending",
    region: loc.region ?? "Karnataka",
    country: loc.country ?? "India",
    description: loc.description,
    owner: row.owner_id ? "Authorized owner association" : "Owner association restricted",
    ownerSince: "",
    valuation: Number(loc.estimatedValueInr ?? 0),
    aiConfidence: row.trust_score,
    coords: {
      lat: Number(loc.latitude ?? 0),
      lng: Number(loc.longitude ?? 0),
    },
    boundary: Array.isArray(loc.boundary) ? (loc.boundary as PropertyBoundary[]) : [],
    surveyorBoundary: Array.isArray(loc.surveyorBoundary)
      ? (loc.surveyorBoundary as PropertyBoundary[])
      : undefined,
    governmentBoundary: Array.isArray(loc.governmentBoundary)
      ? (loc.governmentBoundary as PropertyBoundary[])
      : undefined,
    stateCode: loc.stateCode ?? (loc.region?.toLowerCase().includes("maharashtra") ? "MH" : "KA"),
    cadastralIdentifiers: loc.cadastralIdentifiers ?? ({} as Record<string, unknown>),
    sourceChecks: loc.sourceChecks ?? ({} as Record<string, unknown>),
    surveyorDecision: loc.surveyorDecision,
    surveyorNotes: loc.surveyorNotes,
    surveyorFieldPhotos: loc.surveyorFieldPhotos,
    governmentDecision: loc.governmentDecision,
    governmentOfficerNotes: loc.governmentOfficerNotes,
    governmentDecidedAt: loc.governmentDecidedAt,
    documents: (row.documents ?? []).map(mapDocumentRow),
    timeline: [],
  };
}

/** Loads properties owned by a citizen user */
export async function loadOwnedProperties(userId: string): Promise<Property[]> {
  if (!supabaseConfigured || !userId || !isUuid(userId)) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id, owner_id, passport_id, property_name, location, area, status, trust_score, property_documents(id, name, kind, storage_path, verified, created_at)",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => mapPropertyRow({ ...row, documents: row.property_documents }));
  } catch {
    return [];
  }
}

/** Loads a single property by its UUID or passport ID */
export async function loadPropertyById(idOrPassport: string): Promise<Property | null> {
  // Query authoritative Supabase first
  if (supabaseConfigured) {
    try {
      const query = supabase
        .from("properties")
        .select(
          "id, owner_id, passport_id, property_name, location, area, status, trust_score, property_documents(id, name, kind, storage_path, verified, created_at)",
        );

      const { data, error } = isUuid(idOrPassport)
        ? await query.eq("id", idOrPassport).maybeSingle()
        : await query.eq("passport_id", idOrPassport).maybeSingle();

      if (data && !error) {
        return mapPropertyRow({ ...data, documents: data.property_documents });
      }
    } catch {
      return null;
    }
  }
  return null;
}

export const getPropertyById = loadPropertyById;

/** Loads shared properties for institutional roles (Government, Surveyor, Bank, Admin) */
export async function loadInstitutionalProperties(
  statusFilter?: Property["status"],
): Promise<Property[]> {
  if (!supabaseConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from("properties")
      .select(
        "id, owner_id, passport_id, property_name, location, area, status, trust_score, property_documents(id, name, kind, storage_path, verified, created_at)",
      )
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }

    return data.map((row) => mapPropertyRow({ ...row, documents: row.property_documents }));
  } catch {
    return [];
  }
}

/** Loads real government dashboard metrics from Supabase */
export async function loadGovernmentMetrics() {
  if (!supabaseConfigured) {
    return {
      totalParcels: 0,
      verifiedCount: 0,
      pendingCount: 0,
      disputedCount: 0,
      openReviewCount: 0,
    };
  }

  try {
    const { count: totalParcels } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true });
    const { count: verifiedCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "verified");
    const { count: pendingCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    const { count: disputedCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "disputed");
    const { count: openReviewCount } = await supabase
      .from("review_cases")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    return {
      totalParcels: totalParcels ?? 0,
      verifiedCount: verifiedCount ?? 0,
      pendingCount: pendingCount ?? 0,
      disputedCount: disputedCount ?? 0,
      openReviewCount: openReviewCount ?? 0,
    };
  } catch {
    return {
      totalParcels: 0,
      verifiedCount: 0,
      pendingCount: 0,
      disputedCount: 0,
      openReviewCount: 0,
    };
  }
}

/** Loads active review queue for government officers from Supabase */
export async function loadGovernmentReviewQueue() {
  if (!supabaseConfigured) return [];
  try {
    const { data: reviewCases } = await supabase
      .from("review_cases")
      .select(
        "id, status, reason, created_at, properties(id, passport_id, property_name, status, trust_score, location)",
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });

    const queue: Array<{
      caseId: string;
      propertyId: string;
      passportId: string;
      title: string;
      status: string;
      trustScore: number;
      region: string;
      reason: string;
      createdAt: string;
    }> = [];

    const seenIds = new Set<string>();

    if (reviewCases) {
      for (const r of reviewCases as unknown as Array<{
        id: string;
        status: string;
        reason: string | null;
        created_at: string;
        properties?: ReviewCasePropertyRow[] | null;
      }>) {
        const property = r.properties?.[0];
        if (!property?.id) continue;
        const propId = property.id;
        seenIds.add(propId);
        queue.push({
          caseId: r.id,
          propertyId: propId,
          passportId: property.passport_id,
          title: property.property_name,
          status: property.status,
          trustScore: property.trust_score,
          region: property.location?.region || "Region unavailable",
          reason: r.reason || "Manual review required",
          createdAt: r.created_at,
        });
      }
    }

    // Also include properties with status = 'pending' that don't already have an open review case
    const { data: pendingProps } = await supabase
      .from("properties")
      .select("id, passport_id, property_name, status, trust_score, location, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);

    if (pendingProps) {
      for (const p of pendingProps) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          queue.push({
            caseId: `case_${p.id.slice(0, 8)}`,
            propertyId: p.id,
            passportId: p.passport_id,
            title: p.property_name,
            status: p.status,
            trustScore: p.trust_score ?? 70,
            region: p.location?.region || "Region unavailable",
            reason:
              p.location?.surveyorDecision === "verified"
                ? "Surveyor field verification complete. Awaiting government final decision."
                : "Awaiting field survey & official registry review.",
            createdAt: p.created_at || "",
          });
        }
      }
    }

    return queue;
  } catch {
    return [];
  }
}

/** Loads verified properties for bank underwriting */
export async function loadBankEligibleProperties(): Promise<Property[]> {
  const verifiedProperties = await loadInstitutionalProperties("verified");
  return verifiedProperties.filter(
    (property) =>
      property.valuation > 0 &&
      property.governmentDecision === "approved" &&
      property.surveyorDecision === "verified" &&
      property.documents.length > 0 &&
      property.documents.every((document) => document.verified),
  );
}

/** Loads the canonical non-draft property intelligence records visible to Bank. */
export async function loadBankAuthorizedProperties(): Promise<Property[]> {
  return loadInstitutionalProperties();
}

/** Loads properties assigned to surveyors for field work */
export interface SurveyorAssignmentProperty extends Property {
  assignmentId: string;
  assignmentStatus: string;
  assignmentNotes: string | null;
  assignmentCreatedAt: string;
  assignedBy: string;
}

export async function loadSurveyorAssignments(
  userId?: string,
): Promise<SurveyorAssignmentProperty[]> {
  if (!supabaseConfigured || !userId) return [];
  try {
    const { data, error } = await supabase
      .from("surveyor_assignments")
      .select(
        "id, status, notes, created_at, updated_at, assigned_by, properties(id, passport_id, property_name, location, area, status, trust_score, property_documents(id, name, kind, storage_path, verified, created_at))",
      )
      .eq("surveyor_id", userId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (
      data as unknown as Array<{
        id: string;
        status: string;
        notes: string | null;
        created_at: string;
        updated_at: string;
        assigned_by: string;
        properties: AssignmentPropertyRow[] | null;
      }>
    )
      .filter((row) => row.properties?.[0])
      .map((row) => {
        const property = row.properties![0];
        return {
          ...mapPropertyRow({
            ...property,
            owner_id: undefined,
            documents: property.property_documents,
          }),
          assignmentId: row.id,
          assignmentStatus: row.status,
          assignmentNotes: row.notes,
          assignmentCreatedAt: row.created_at,
          assignedBy: row.assigned_by,
        } as SurveyorAssignmentProperty;
      });
  } catch {
    return [];
  }
}

/** Loads the latest active surveyor assignment for a property. */
export async function loadPropertySurveyorAssignment(propertyId: string) {
  if (!supabaseConfigured || !isUuid(propertyId)) return null;

  try {
    const { data, error } = await supabase
      .from("surveyor_assignments")
      .select("id, status, created_at, updated_at")
      .eq("property_id", propertyId)
      .in("status", ["assigned", "in_progress", "submitted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data ?? null;
  } catch {
    return null;
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

/** Loads Government-visible audit events from the authoritative audit log. */
export async function loadGovernmentAuditLogs() {
  if (!supabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, actor_role, action, event, property_id, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function loadGovernmentSurveyors() {
  if (!supabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, region")
      .eq("role", "surveyor")
      .order("full_name");
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

/** General purpose property fetcher alias */
export async function getProperties(): Promise<Property[]> {
  return loadInstitutionalProperties();
}
