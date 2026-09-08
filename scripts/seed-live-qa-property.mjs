import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .flatMap((line) => {
      const index = line.indexOf("=");
      if (index < 0) return [];
      return [[line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")]];
    }),
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});
const email = env.DEMO_CITIZEN_EMAIL;
const password = env.DEMO_CITIZEN_PASSWORD;
if (!email || !password) throw new Error("Citizen QA credentials are missing");

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (authError || !auth.user) throw new Error(`Citizen sign-in failed: ${authError?.message}`);

const stamp = Date.now().toString(36).toUpperCase();
const passportId = `TT-KA-QA-${stamp}`;
const boundary = [
  { lat: 12.9275, lng: 77.683 },
  { lat: 12.9284, lng: 77.6832 },
  { lat: 12.9283, lng: 77.6841 },
  { lat: 12.9274, lng: 77.6839 },
];
const location = {
  address: "QA Parcel, Bellandur, Bengaluru East",
  region: "Bengaluru Urban, Karnataka",
  country: "India",
  propertyType: "residential",
  estimatedValueInr: 8500000,
  description: "Live development QA parcel for Government and Surveyor workflow testing.",
  latitude: 12.92795,
  longitude: 77.68355,
  boundary,
  stateCode: "KA",
  cadastralIdentifiers: {
    district: "Bengaluru Urban",
    taluk: "Bengaluru East",
    village: "Bellandur",
    surveyNumber: `QA-${stamp}`,
    khataNumber: `QA-KHATA-${stamp}`,
    kaveriRegRef: `QA-KAVERI-${stamp}`,
  },
};

const { data: property, error: propertyError } = await supabase
  .from("properties")
  .insert({
    owner_id: auth.user.id,
    property_name: `TerraTrust QA Parcel ${stamp}`,
    passport_id: passportId,
    location,
    area: 742.5,
    status: "pending",
    trust_score: 0,
  })
  .select("id, passport_id, property_name, location, area, status, trust_score")
  .single();
if (propertyError || !property)
  throw new Error(`Property insert failed: ${propertyError?.message}`);

const storagePath = `${auth.user.id}/${property.id}/qa-sale-deed-${stamp}.pdf`;
const { error: storageError } = await supabase.storage
  .from("property-documents")
  .upload(storagePath, Buffer.from(`%PDF-1.4\n% TerraTrust QA evidence ${passportId}\n%%EOF\n`), {
    contentType: "application/pdf",
    upsert: false,
  });
if (storageError)
  console.warn(`Storage upload unavailable for seed evidence: ${storageError.message}`);
const { data: document, error: documentError } = await supabase
  .from("property_documents")
  .insert({
    property_id: property.id,
    name: `QA Sale Deed ${stamp}.pdf`,
    kind: "deed",
    storage_path: storageError ? null : storagePath,
    verified: false,
  })
  .select("id, name, kind, storage_path, verified, created_at")
  .single();
if (documentError || !document)
  throw new Error(`Document insert failed: ${documentError?.message}`);

const webhook = env.VITE_N8N_WEBHOOK_URL;
const payload = {
  propertyId: property.id,
  propertyUuid: property.id,
  passportId,
  userId: auth.user.id,
  actorRole: "citizen",
  recipientRole: "owner",
  stateCode: "KA",
  cadastralIdentifiers: location.cadastralIdentifiers,
  stateSources: { Bhoomi: "reference-only", Kaveri: "reference-only", BBMP: "reference-only" },
  property: {
    title: property.property_name,
    address: location.address,
    region: location.region,
    country: "India",
    type: "residential",
    area: property.area,
    owner: email,
    status: property.status,
    boundaryVertices: boundary.length,
    valuationInr: location.estimatedValueInr,
    description: location.description,
    latitude: location.latitude,
    longitude: location.longitude,
    boundary,
    stateCode: "KA",
    cadastralIdentifiers: location.cadastralIdentifiers,
  },
  documents: [{ id: document.id, name: document.name, kind: document.kind, verified: false }],
  existingScores: { trustScore: 0, aiConfidence: 0, valuation: location.estimatedValueInr },
};
const response = await fetch(webhook, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const raw = await response.text();
let result;
try {
  result = JSON.parse(raw);
} catch {
  result = { raw };
}
if (!response.ok) throw new Error(`n8n ${response.status}: ${raw}`);
const verification = Array.isArray(result) ? result[0] : result;
const status =
  verification.status ?? (verification.decision === "VERIFIED" ? "verified" : "manual_review");
const { error: verificationError } = await supabase
  .from("verification_results")
  .insert({ property_id: property.id, provider: "n8n", result: verification });
if (verificationError)
  throw new Error(`Verification persistence failed: ${verificationError.message}`);
if (status === "manual_review") {
  const { data: reviewCase, error: caseError } = await supabase
    .from("review_cases")
    .insert({
      property_id: property.id,
      status: "open",
      reason: verification.decisionReason || "n8n manual review required",
    })
    .select("id, property_id, status, reason, created_at")
    .single();
  if (caseError) throw new Error(`Review case persistence failed: ${caseError.message}`);
  console.log(
    JSON.stringify(
      {
        propertyId: property.id,
        passportId,
        documentId: document.id,
        reviewCaseId: reviewCase.id,
        n8nStatus: status,
        workflowId: verification.workflowId ?? null,
      },
      null,
      2,
    ),
  );
} else {
  console.log(
    JSON.stringify(
      {
        propertyId: property.id,
        passportId,
        documentId: document.id,
        reviewCaseId: null,
        n8nStatus: status,
        workflowId: verification.workflowId ?? null,
      },
      null,
      2,
    ),
  );
}
await supabase.auth.signOut();
