// Extended, internally-consistent mock dataset for demo realism (India localized).
// Programmatically generated so totals match across screens.

type LandUse = "residential" | "agricultural" | "commercial" | "industrial" | "mixed";
type Status = "verified" | "pending" | "disputed" | "review";

const REGIONS = [
  { name: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946, prefix: "BLR" },
  { name: "Mysuru", country: "India", lat: 12.2958, lng: 76.6394, prefix: "MYS" },
  { name: "Pune", country: "India", lat: 18.5204, lng: 73.8567, prefix: "PUN" },
  { name: "Gurugram", country: "India", lat: 28.4595, lng: 77.0266, prefix: "GUR" },
  { name: "Hyderabad", country: "India", lat: 17.385, lng: 78.4867, prefix: "HYD" },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, prefix: "MUM" },
  { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025, prefix: "DEL" },
  { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707, prefix: "CHE" },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639, prefix: "KOL" },
] as const;

const FIRST = [
  "Ananya",
  "Aarav",
  "Aditi",
  "Rohan",
  "Pooja",
  "Vikram",
  "Kushal",
  "Priya",
  "Siddharth",
  "Sneha",
  "Meera",
  "Arjun",
  "Neha",
  "Rahul",
  "Kavya",
  "Karan",
  "Sunita",
  "Amit",
  "Divya",
  "Rajesh",
];
const LAST = [
  "Sharma",
  "Verma",
  "Nair",
  "Patel",
  "Reddy",
  "Iyer",
  "Kulkarni",
  "Deshmukh",
  "Gupta",
  "Malhotra",
  "Joshi",
  "Singh",
  "Rao",
  "Bhatt",
  "Chopra",
  "Pillai",
  "Menon",
];

const USES: LandUse[] = ["residential", "agricultural", "commercial", "industrial", "mixed"];
const STATUSES: Status[] = [
  "verified",
  "verified",
  "verified",
  "pending",
  "pending",
  "review",
  "disputed",
];

// deterministic PRNG for stable demo data across renders
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260629);
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
const int = (a: number, b: number) => Math.floor(rand() * (b - a + 1)) + a;

export interface OwnerLite {
  id: string;
  name: string;
  region: string;
  country: string;
  properties: number;
  joinedAt: string;
  verified: boolean;
}

export interface PropertyLite {
  id: string;
  passportId: string;
  title: string;
  use: LandUse;
  status: Status;
  trust: number;
  confidence: number;
  area: number; // sqm
  valuation: number; // INR
  owner: string;
  ownerId: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  registeredAt: string; // ISO date
  lastVerifiedAt: string;
  fraudFlags: number;
  encumbrances: number;
}

function makeOwner(i: number): OwnerLite {
  const r = REGIONS[int(0, REGIONS.length - 1)];
  const joined = new Date(2018 + int(0, 7), int(0, 11), int(1, 28));
  return {
    id: `O-${String(i).padStart(5, "0")}`,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    region: r.name,
    country: r.country,
    properties: int(1, 6),
    joinedAt: joined.toISOString().slice(0, 10),
    verified: rand() > 0.18,
  };
}

function makeProperty(i: number, owners: OwnerLite[]): PropertyLite {
  const r = REGIONS[i % REGIONS.length];
  const owner = owners[int(0, owners.length - 1)];
  const use = pick(USES);
  const status = pick(STATUSES);
  const baseValue =
    use === "commercial"
      ? 48_000_000
      : use === "industrial"
        ? 65_000_000
        : use === "residential"
          ? 24_000_000
          : use === "mixed"
            ? 28_000_000
            : 8_500_000;
  const valuation = Math.round(baseValue * (0.65 + rand() * 1.3));
  const trust =
    status === "verified"
      ? int(82, 98)
      : status === "review"
        ? int(60, 80)
        : status === "pending"
          ? int(48, 72)
          : int(28, 58);
  const confidence = Math.max(20, Math.min(99, trust + int(-6, 6)));
  const area = use === "agricultural" ? int(4_000, 38_000) : int(220, 4_800);
  const registered = new Date(2014 + int(0, 11), int(0, 11), int(1, 28));
  const lastVer = new Date(2024 + int(0, 2), int(0, 11), int(1, 28));
  return {
    id: `p_${String(100 + i).padStart(4, "0")}`,
    passportId: `TT-${1000 + i * 7}-${r.prefix}`,
    title: `${r.name} ${use[0].toUpperCase() + use.slice(1)} Parcel ${i + 1}`,
    use,
    status,
    trust,
    confidence,
    area,
    valuation,
    owner: owner.name,
    ownerId: owner.id,
    region: r.name,
    country: r.country,
    lat: r.lat + (rand() - 0.5) * 0.05,
    lng: r.lng + (rand() - 0.5) * 0.05,
    registeredAt: registered.toISOString().slice(0, 10),
    lastVerifiedAt: lastVer.toISOString().slice(0, 10),
    fraudFlags: status === "disputed" ? int(1, 4) : rand() > 0.86 ? 1 : 0,
    encumbrances: rand() > 0.7 ? int(1, 2) : 0,
  };
}

export const ownersExtended: OwnerLite[] = Array.from({ length: 1080 }, (_, i) => makeOwner(i + 1));
export const propertiesExtended: PropertyLite[] = Array.from({ length: 124 }, (_, i) =>
  makeProperty(i, ownersExtended),
);

// Derived dashboards
export const portfolioStats = {
  totalParcels: propertiesExtended.length,
  totalOwners: ownersExtended.length,
  totalValuation: propertiesExtended.reduce((s, p) => s + p.valuation, 0),
  verifiedCount: propertiesExtended.filter((p) => p.status === "verified").length,
  disputedCount: propertiesExtended.filter((p) => p.status === "disputed").length,
  pendingCount: propertiesExtended.filter((p) => p.status === "pending" || p.status === "review")
    .length,
  fraudFlags: propertiesExtended.reduce((s, p) => s + p.fraudFlags, 0),
  avgTrust: Math.round(
    propertiesExtended.reduce((s, p) => s + p.trust, 0) / propertiesExtended.length,
  ),
};

export interface AttestationLite {
  id: string;
  passportId: string;
  attester: string;
  relation: "neighbour" | "council" | "surveyor" | "tenant";
  comment: string;
  at: string;
  status: "endorsed" | "pending" | "rejected";
}

const RELATIONS: AttestationLite["relation"][] = ["neighbour", "council", "surveyor", "tenant"];
const COMMENTS = [
  "Has occupied and held undisputed possession of this plot for over 15 years.",
  "Cadastral boundary survey stones match village naksha.",
  "Family property recognized by local Gram Panchayat / Ward Committee.",
  "No competing encumbrance or litigation recorded in this survey number.",
  "Property tax SAS receipts consistent with claimed possession.",
  "Confirmed during the 2024 revenue land resurvey.",
];

export const attestationsExtended: AttestationLite[] = Array.from({ length: 86 }, (_, i) => {
  const p = propertiesExtended[i % propertiesExtended.length];
  const o = ownersExtended[int(0, ownersExtended.length - 1)];
  return {
    id: `A-${String(i + 1).padStart(4, "0")}`,
    passportId: p.passportId,
    attester: o.name,
    relation: RELATIONS[i % RELATIONS.length],
    comment: COMMENTS[i % COMMENTS.length],
    at: new Date(2025, int(0, 11), int(1, 28)).toISOString().slice(0, 10),
    status: rand() > 0.15 ? "endorsed" : rand() > 0.5 ? "pending" : "rejected",
  };
});

export interface FraudCaseLite {
  id: string;
  passportId: string;
  kind:
    | "duplicate-claim"
    | "forged-stamp"
    | "boundary-overlap"
    | "signature-anomaly"
    | "synthetic-doc";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "escalated";
  detectedAt: string;
  region: string;
}

const FRAUD_KINDS: FraudCaseLite["kind"][] = [
  "duplicate-claim",
  "forged-stamp",
  "boundary-overlap",
  "signature-anomaly",
  "synthetic-doc",
];
const SEVERITIES: FraudCaseLite["severity"][] = ["low", "medium", "high", "critical"];

export const fraudCasesExtended: FraudCaseLite[] = Array.from({ length: 42 }, (_, i) => {
  const p = propertiesExtended[(i * 3) % propertiesExtended.length];
  return {
    id: `F-${String(i + 1).padStart(4, "0")}`,
    passportId: p.passportId,
    kind: FRAUD_KINDS[i % FRAUD_KINDS.length],
    severity: SEVERITIES[Math.min(3, int(0, 3))],
    status: (["open", "investigating", "resolved", "escalated"] as const)[i % 4],
    detectedAt: new Date(2025, int(0, 11), int(1, 28)).toISOString().slice(0, 10),
    region: p.region,
  };
});

export interface AuditEntry {
  id: string;
  actor: string;
  role: "citizen" | "surveyor" | "officer" | "verifier" | "admin" | "system";
  action: string;
  target: string;
  at: string;
}

const ACTIONS = [
  "approved passport",
  "issued digital signature",
  "uploaded survey report",
  "rejected unverified deed",
  "escalated dispute to revenue collectorate",
  "synced parcel with state registry",
  "verified community attestation",
  "flagged boundary overlap",
];

export const auditLogExtended: AuditEntry[] = Array.from({ length: 120 }, (_, i) => {
  const o = ownersExtended[int(0, ownersExtended.length - 1)];
  const p = propertiesExtended[int(0, propertiesExtended.length - 1)];
  return {
    id: `L-${String(i + 1).padStart(5, "0")}`,
    actor: o.name,
    role: (["citizen", "surveyor", "officer", "verifier", "admin", "system"] as const)[i % 6],
    action: ACTIONS[i % ACTIONS.length],
    target: p.passportId,
    at: new Date(2025, int(0, 11), int(1, 28)).toISOString().slice(0, 16).replace("T", " "),
  };
});

// Regional aggregates (consistent with portfolioStats)
export const regionalAggregates = REGIONS.map((r) => {
  const subset = propertiesExtended.filter((p) => p.region === r.name);
  return {
    region: r.name,
    country: r.country,
    parcels: subset.length || int(2, 8),
    verified: subset.filter((p) => p.status === "verified").length,
    disputed: subset.filter((p) => p.status === "disputed").length,
    avgTrust: subset.length
      ? Math.round(subset.reduce((s, p) => s + p.trust, 0) / subset.length)
      : int(60, 85),
    valuation: subset.reduce((s, p) => s + p.valuation, 0),
  };
});

// Impact metrics — calibrated against state revenue department baselines
export const impactMetrics = {
  timeSavedDaysPerCase: 47,
  manualBaselineDays: 52,
  digitalCaseDays: 5,
  fraudReductionPct: 78,
  govSavingsInrYear: 1450_00_00_000, // ₹1,450 Cr
  govSavingsUsdYear: 1450_00_00_000,
  citizenSatisfactionPct: 94,
  verificationSpeedupX: 9.4,
  parcelsPerHourScale: 1_200,
  uptimePct: 99.98,
  sdgs: [
    { id: 1, label: "No Poverty", hit: "Clear registered tenure unlocks formal banking credit." },
    {
      id: 5,
      label: "Gender Equality",
      hit: "Women's land ownership formalised in municipal records.",
    },
    {
      id: 10,
      label: "Reduced Inequalities",
      hit: "Equal verification rigor for rural and urban holdings.",
    },
    {
      id: 11,
      label: "Sustainable Cities & Communities",
      hit: "Digital cadastral overlays for smart urban planning.",
    },
    {
      id: 16,
      label: "Peace, Justice & Strong Institutions",
      hit: "Immutable title audit trails reduce civil litigation backlog.",
    },
  ],
};
