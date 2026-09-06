// Mock data for AI-powered feature screens (India localized).

export const valuationFactors = [
  { label: "Location desirability (Indiranagar, Bengaluru)", weight: 32, direction: "up" as const, note: "Top 5% premium corridor in Bengaluru Urban district." },
  { label: "Recent comparable sales (12 nearby)", weight: 24, direction: "up" as const, note: "Median registered sale ₹2.40 Cr · 90-day window." },
  { label: "Verified title chain", weight: 14, direction: "up" as const, note: "Unbroken transfer history since 1998." },
  { label: "Guideline value adjustment", weight: -9, direction: "down" as const, note: "State stamp duty revision alignment." },
  { label: "Distance to flood risk zone", weight: -4, direction: "down" as const, note: "2.4km from natural drainage buffer." },
  { label: "Infrastructure (road + utilities)", weight: 11, direction: "up" as const, note: "60ft asphalt road, BWSSB water, BESCOM grid." },
];

export const fraudSignals = [
  { label: "Duplicate boundary overlap", weight: 38, direction: "down" as const, note: "Polygon checked against Bhoomi registry survey numbers." },
  { label: "Document watermark verification", weight: 21, direction: "down" as const, note: "Stamp paper e-Challan verified with Treasury portal." },
  { label: "Signature anomaly score", weight: 14, direction: "down" as const, note: "98% biometric & signature match." },
  { label: "Revenue department cross-validation", weight: 10, direction: "up" as const, note: "State Land Revenue records acknowledge parcel survey number." },
  { label: "Owner verified identity", weight: 8, direction: "up" as const, note: "Aadhaar + PAN verification matched via DigiLocker." },
];

export const valuationHistory = [
  { m: "Jan", value: 218 }, { m: "Feb", value: 222 }, { m: "Mar", value: 226 },
  { m: "Apr", value: 225 }, { m: "May", value: 231 }, { m: "Jun", value: 234 },
  { m: "Jul", value: 238 }, { m: "Aug", value: 240 }, { m: "Sep", value: 242 },
  { m: "Oct", value: 245 }, { m: "Nov", value: 248 }, { m: "Dec", value: 252 },
];

export const ndviSeries = [
  { m: "Jan", ndvi: 0.42, moisture: 0.31 },
  { m: "Feb", ndvi: 0.39, moisture: 0.28 },
  { m: "Mar", ndvi: 0.45, moisture: 0.34 },
  { m: "Apr", ndvi: 0.58, moisture: 0.46 },
  { m: "May", ndvi: 0.66, moisture: 0.52 },
  { m: "Jun", ndvi: 0.72, moisture: 0.58 },
  { m: "Jul", ndvi: 0.76, moisture: 0.61 },
  { m: "Aug", ndvi: 0.74, moisture: 0.59 },
  { m: "Sep", ndvi: 0.68, moisture: 0.54 },
  { m: "Oct", ndvi: 0.61, moisture: 0.48 },
  { m: "Nov", ndvi: 0.55, moisture: 0.41 },
  { m: "Dec", ndvi: 0.48, moisture: 0.36 },
];

export const ownershipChain = [
  { year: 1982, owner: "Government of Karnataka", event: "Revenue grant allotment", confidence: 92 },
  { year: 1994, owner: "M. Murthy", event: "BDA allotment sale", confidence: 91 },
  { year: 2009, owner: "S. Murthy", event: "Family partition deed", confidence: 94 },
  { year: 2019, owner: "Ananya Sharma", event: "Registered sale deed", confidence: 98 },
];

export const aiRecommendations = [
  { id: "r1", priority: "high" as const, title: "Upload BBMP property tax receipt 2024-25", impact: "+12 trust pts", reason: "Closes the documentation gap and unlocks institutional bank loan approvals.", cta: "Upload now" },
  { id: "r2", priority: "high" as const, title: "Surveyor field verification for Mysuru Farm", impact: "Eliminates boundary dispute risk", reason: "GIS polygon alignment recommended with Bhoomi survey coordinates.", cta: "Open survey request" },
  { id: "r3", priority: "medium" as const, title: "Refresh Cartosat / Sentinel-2 satellite scan", impact: "+4 confidence pts", reason: "Recent optical pass improves boundary detection precision to ±0.2m.", cta: "Refresh imagery" },
  { id: "r4", priority: "medium" as const, title: "Request neighborhood attestation in Indiranagar", impact: "Reaches community gold tier", reason: "Properties with ≥3 verified local attestations clear revenue queue 2.4× faster.", cta: "Invite attestor" },
  { id: "r5", priority: "low" as const, title: "Enable monthly AI passport refresh", impact: "Automated trust drift alerts", reason: "Get notified if any guideline valuation or encumbrance status changes.", cta: "Enable" },
];

export const ocrFields = [
  { label: "Owner name", value: "Ananya Sharma", confidence: 99 },
  { label: "Survey / Plot number", value: "Sy. No. 42 / Site 7B", confidence: 97 },
  { label: "Sub-Registrar ref.", value: "KA-BLR-SR-2024-8421", confidence: 99 },
  { label: "Area (sqm)", value: "540.20", confidence: 96 },
  { label: "Registration date", value: "14 March 2024", confidence: 98 },
  { label: "Issuing authority", value: "Karnataka Department of Stamps & Registration", confidence: 98 },
  { label: "e-Challan stamp ID", value: "KA-GRAS-2024-00831", confidence: 95 },
  { label: "Centroid coordinates", value: "12.9567° N, 77.6200° E", confidence: 96 },
];

export const verificationSuggestions = [
  { id: "v1", action: "Cross-check coordinates with Bhoomi spatial dataset", confidence: 98, status: "Auto-passed" as const },
  { id: "v2", action: "Request neighborhood attestation (≥2 resident verifiers)", confidence: 85, status: "Suggested" as const },
  { id: "v3", action: "Empanelled surveyor field inspection", confidence: 78, status: "Suggested" as const },
  { id: "v4", action: "Sub-registrar Kaveri 2.0 deed verification", confidence: 92, status: "Auto-passed" as const },
  { id: "v5", action: "Encumbrance certificate (Form 15) reconciliation", confidence: 94, status: "Auto-passed" as const },
];

export const riskBreakdown = [
  { label: "Title / legal risk", value: 8, tone: "success" as const },
  { label: "Boundary integrity", value: 14, tone: "success" as const },
  { label: "Environmental (flood buffer, lake bed)", value: 12, tone: "success" as const },
  { label: "Guideline / market drift", value: 18, tone: "warning" as const },
  { label: "Fraud signal exposure", value: 4, tone: "success" as const },
];

export const landHealth = {
  ndvi: 0.71, moisture: 0.58, erosion: 0.12, slope: 4.2, soilCarbon: 1.8,
  treeCover: 0.34, builtupRatio: 0.62,
};

export const recommendationsForDoc = [
  "Owner name matches Aadhaar & PAN verification records — 99% confidence.",
  "Survey reference cross-validates with Karnataka Revenue / Bhoomi database.",
  "Site coordinates within stated survey parcel polygon (0.4m drift).",
  "e-Stamp ID verified against State Treasury reconciliation logs.",
];
