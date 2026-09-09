// State Land Verification Profile & Registry Types for TerraTrust AI
// Models official Indian state systems: Land Records, Cadastral, Registration, Mutation, and Municipal records.

export type SourceAdapterStatus =
  | "LIVE_API"
  | "AUTHORIZED_CONNECTOR"
  | "DOCUMENT_EVIDENCE"
  | "MANUAL_REVIEW"
  | "UNAVAILABLE"
  | "NOT_CHECKED";

export type VerificationCheckResult =
  | "MATCH"
  | "PARTIAL_MATCH"
  | "MISMATCH"
  | "MANUAL_REVIEW_REQUIRED"
  | "EVIDENCE_RECEIVED"
  | "UNAVAILABLE";

export interface StateLandSystem {
  id: string;
  name: string;
  category:
    | "land_records"
    | "cadastral"
    | "registration"
    | "mutation"
    | "urban_municipal"
    | "planning_authority";
  officialPortalUrl: string;
  department: string;
  adapterStatus: SourceAdapterStatus;
  description: string;
  sampleReferenceFormat?: string;
  requiredFields: string[];
}

export interface StateCadastralFieldDefinition {
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
  required: boolean;
  applicableTo?: (
    | "residential"
    | "agricultural"
    | "commercial"
    | "industrial"
    | "vacant"
    | "forest"
  )[];
  isUrbanOnly?: boolean;
  isRuralOnly?: boolean;
}

export interface StateUnitConversion {
  primaryLocalUnit: string; // e.g., "Gunta", "Cent", "Bigha", "Kanal"
  localUnitToSqm: number;
  localUnitsPerAcre: number;
  label: string;
}

export interface StateLandProfile {
  stateCode: string; // e.g., "KA", "MH", "AP", "TS", "KL", "UP", "RJ", "DL"
  stateName: string;
  localTerminology: {
    recordOfRightsName: string; // e.g., "RTC / Pahani", "7/12 (Saat Baara)", "Adangal / 1B", "Khatauni"
    surveyNumberLabel: string; // e.g., "Survey Number", "Gat Number / Survey Number", "Khasra Number"
    subdivisionLabel: string; // e.g., "Hissa", "Surnoc / Hissa", "Poth"
    khataOrAccountLabel: string; // e.g., "Khata / e-Khata", "8A Khate Pustika", "Thandapper", "UPIC"
    urbanPropertyCardLabel?: string; // e.g., "Property Card (CTS)", "ePID / e-Aasthi", "PTIN"
    mutationExtractName: string; // e.g., "Mutation Register (MR Extract)", "Ferfar (Form 6)", "Pokkuvaravu"
    deedRegistrationSystemName: string; // e.g., "Kaveri 2.0", "IGR SARITA", "CARD", "PEARL", "DORIS"
    encumbranceCertificateName: string; // e.g., "EC (Form 15/16)", "Non-Encumbrance / e-Search", "Nil Encumbrance", "Barah Sala"
  };
  unitConversion: StateUnitConversion;
  cadastralFields: StateCadastralFieldDefinition[];
  officialSystems: StateLandSystem[];
  recommendedDocuments: {
    kind: string;
    label: string;
    description: string;
    isMandatory: boolean;
  }[];
}

export interface NormalizedGovernmentEvidence {
  sourceSystem: string;
  recordType: string;
  referenceNumber: string;
  sourceUrl: string;
  retrievedAt: string;
  adapterStatus: SourceAdapterStatus;
  verificationStatus: VerificationCheckResult;
  confidence: number;
  ownerMatch: boolean | null;
  identifierMatch: boolean | null;
  areaMatch: boolean | null;
  boundaryMatch: boolean | null;
  notes: string;
  evidenceDocumentUrl?: string;
  evidenceDocumentName?: string;
}
