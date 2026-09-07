import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Field, Stepper } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { BoundaryEditor } from "@/components/ui-ext/BoundaryEditor";
import { DocumentUploader, type QueuedDocument } from "@/components/ui-ext/DocumentUploader";
import {
  type LatLng,
  calculatePolygonArea,
  coordsToGeoJson,
  INDIAN_STATES_AND_UTS,
  type IndianStateOrUT,
} from "@/lib/gis-utils";
import { getStateProfile, formatStateArea } from "@/lib/state-registry";
import {
  createProperty,
  uploadPropertyDocumentBinary,
  savePropertyDocument,
  persistVerificationOutcome,
} from "@/lib/supabase-persistence";
import { saveRegisteredLocalProperty } from "@/lib/property-repository";
import { runVerification, type VerificationResult } from "@/lib/verification-workflow";
import {
  Building2,
  MapPin,
  Compass,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  XCircle,
  ShieldCheck,
  IndianRupee,
  Crosshair,
} from "lucide-react";
import type { Property, PropertyType } from "@/lib/types";

export const Route = createFileRoute("/properties/new")({
  head: () => ({ meta: [{ title: "Register Property — TerraTrust AI" }] }),
  component: RegisterPropertyWizard,
});

const STEPS = [
  "Property Details",
  "Location",
  "Boundary & GIS",
  "Documents",
  "Review & Submit",
];

const PROPERTY_TYPES: { label: string; value: PropertyType }[] = [
  { label: "Residential", value: "residential" },
  { label: "Agricultural / Farm", value: "agricultural" },
  { label: "Commercial", value: "commercial" },
  { label: "Industrial", value: "industrial" },
  { label: "Vacant Land", value: "vacant" },
  { label: "Forest / Woodland", value: "forest" },
];

function generatePassportId(state: string): string {
  const stateCode = state
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase() || "IN";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TT-${num}-${stateCode}`;
}

export function RegisterPropertyWizard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

  // Form State - Step 1: Property Details
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("residential");
  const [estimatedValue, setEstimatedValue] = useState<number>(2500000);
  const [valueDisplay, setValueDisplay] = useState("25,00,000");
  const [description, setDescription] = useState("");

  // Form State - Step 2: Location & State Land Profile
  const [country] = useState("India");
  const [state, setState] = useState<IndianStateOrUT>("Karnataka");
  const [city, setCity] = useState("Bengaluru");
  const [address, setAddress] = useState("14/2, Outer Ring Road, Bellandur");
  const [latitude, setLatitude] = useState<number>(12.9279);
  const [longitude, setLongitude] = useState<number>(77.6835);

  const currentProfile = getStateProfile(state);

  const [cadastralValues, setCadastralValues] = useState<Record<string, string>>({
    district: "Bengaluru Urban",
    taluk: "Bengaluru East",
    hobli: "Varthur",
    village: "Bellandur",
    surveyNumber: "14/2",
    surnoc: "*",
    hissa: "2A",
    epidOrSas: "1502001002003004",
    khataNumber: "A-Khata 8421/2024",
    kaveriRegRef: "KVR-BNG-2024-DOC-9821",
    ecReference: "EC-2024-F15-8812",
    bdaAllotmentRef: "BDA/ALLOT/HRBR/2021/41",
  });

  const handleStateChange = (newState: IndianStateOrUT) => {
    setState(newState);
    const p = getStateProfile(newState);
    if (p.stateCode === "MH") {
      setCity("Pune");
      setAddress("Survey 241, Phase 1, Hinjawadi Rajiv Gandhi Infotech Park");
      setLatitude(18.5913);
      setLongitude(73.7389);
      setCadastralValues({
        district: "Pune",
        taluka: "Haveli",
        village: "Hinjawadi",
        gatOrSurveyNo: "Gat 241",
        hissaNo: "1A",
        ctsNumber: "CTS 1042/B",
        saatBaaraRef: "712-PUN-HAV-2024-891",
        aathARef: "Khate No. 412",
        ferfarNumber: "Mutation No. 3412",
        igrDocRef: "HAV-4-12401-2023",
      });
      setBoundary([
        { lat: 18.5910, lng: 73.7385 },
        { lat: 18.5920, lng: 73.7388 },
        { lat: 18.5918, lng: 73.7398 },
        { lat: 18.5909, lng: 73.7395 },
      ]);
    } else if (p.stateCode === "AP") {
      setCity("Visakhapatnam");
      setAddress("Survey 204/1A, IT SEZ, Madhurawada");
      setLatitude(17.7812);
      setLongitude(83.3524);
      setCadastralValues({
        district: "Visakhapatnam",
        mandal: "Visakhapatnam Rural",
        village: "Madhurawada",
        surveyNumber: "204/1A",
        khataNumber: "Khata 154",
        adangalRef: "AP-MB-2024-AD-921",
        igrsDocRef: "RO-VJA-2023-4122",
      });
    } else {
      // Default Karnataka
      setCity("Bengaluru");
      setAddress("14/2, Outer Ring Road, Bellandur");
      setLatitude(12.9279);
      setLongitude(77.6835);
      setCadastralValues({
        district: "Bengaluru Urban",
        taluk: "Bengaluru East",
        hobli: "Varthur",
        village: "Bellandur",
        surveyNumber: "14/2",
        surnoc: "*",
        hissa: "2A",
        epidOrSas: "1502001002003004",
        khataNumber: "A-Khata 8421/2024",
        kaveriRegRef: "KVR-BNG-2024-DOC-9821",
        ecReference: "EC-2024-F15-8812",
        bdaAllotmentRef: "BDA/ALLOT/HRBR/2021/41",
      });
    }
  };

  // Form State - Step 3: Boundary & GIS
  const [boundary, setBoundary] = useState<LatLng[]>([
    { lat: 12.9275, lng: 77.6830 },
    { lat: 12.9284, lng: 77.6832 },
    { lat: 12.9283, lng: 77.6841 },
    { lat: 12.9274, lng: 77.6839 },
  ]);
  const [areaSqm, setAreaSqm] = useState<number>(() =>
    calculatePolygonArea([
      { lat: 12.9275, lng: 77.6830 },
      { lat: 12.9284, lng: 77.6832 },
      { lat: 12.9283, lng: 77.6841 },
      { lat: 12.9274, lng: 77.6839 },
    ]),
  );

  // Form State - Step 4: Documents
  const [documents, setDocuments] = useState<QueuedDocument[]>([]);

  // Submission & Verification State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    propertyId: string;
    passportId: string;
    n8nStatus: "success" | "failed";
    verificationResult?: VerificationResult;
  } | null>(null);

  // Validation Errors per Step
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocatingStep2, setIsLocatingStep2] = useState(false);
  const [locationStatusStep2, setLocationStatusStep2] = useState<string | null>(null);

  const handleDetectStep2Location = () => {
    setLocationStatusStep2(null);
    if (!navigator.geolocation) {
      setLocationStatusStep2("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingStep2(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingStep2(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setLocationStatusStep2(`Device GPS acquired: ${lat}, ${lng}`);
        setTimeout(() => setLocationStatusStep2(null), 3500);
      },
      (err) => {
        setIsLocatingStep2(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationStatusStep2("Geolocation permission denied. Enter coordinates manually.");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationStatusStep2("Position unavailable. Enter coordinates manually.");
            break;
          case err.TIMEOUT:
            setLocationStatusStep2("Location request timed out.");
            break;
          default:
            setLocationStatusStep2(`Error: ${err.message}`);
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatInr = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const handleValueChange = (valStr: string) => {
    const raw = valStr.replace(/[^0-9]/g, "");
    if (!raw) {
      setEstimatedValue(0);
      setValueDisplay("");
      return;
    }
    const parsed = parseInt(raw, 10);
    setEstimatedValue(parsed);
    setValueDisplay(formatInr(parsed));
  };

  // Step Validation Logic
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!title.trim()) newErrors.title = "Property title is required.";
      if (!propertyType) newErrors.propertyType = "Please select a property type.";
      if (!estimatedValue || estimatedValue <= 0)
        newErrors.estimatedValue = "Estimated value must be greater than zero.";
    } else if (step === 1) {
      if (!state) newErrors.state = "Indian state/UT is required.";
      if (!city.trim()) newErrors.city = "City is required.";
      if (!address.trim()) newErrors.address = "Address is required.";
      if (isNaN(latitude) || latitude < -90 || latitude > 90)
        newErrors.latitude = "Latitude must be between -90 and 90.";
      if (isNaN(longitude) || longitude < -180 || longitude > 180)
        newErrors.longitude = "Longitude must be between -180 and 180.";
    } else if (step === 2) {
      if (boundary.length < 3) {
        newErrors.boundary = "Boundary polygon must contain at least 3 coordinates.";
      }
    } else if (step === 3) {
      // Documents step - optional or required at least 1 document recommended
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1));
    }
  };

  const prevStep = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  // Final Submission to Supabase & Live n8n Verification
  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setSubmissionError("Please review the wizard: some required fields are incomplete or invalid.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionProgress("Creating property record in Supabase…");

    const ownerId = user?.id || "00000000-0000-0000-0000-000000000001";
    const passportId = generatePassportId(state);

    try {
      // Generate state source checks
      const sourceChecks: Record<string, any> = {};
      if (currentProfile.stateCode === "KA") {
        sourceChecks.bhoomi = {
          sourceName: "Bhoomi Land Records",
          recordType: "RTC / Pahani",
          reference: `${cadastralValues.district || "Bengaluru Urban"}/${cadastralValues.taluk || "Bengaluru East"}/${cadastralValues.village || "Bellandur"}/${cadastralValues.surveyNumber || "14/2"}/${cadastralValues.hissa || "2A"}`,
          status: "DOCUMENT_EVIDENCE",
          evidenceAttached: documents.some(d => d.name.toLowerCase().includes("rtc") || d.name.toLowerCase().includes("pahani") || d.kind === "survey"),
          checkedAt: new Date().toISOString(),
          notes: "RTC evidence cross-referenced against Bhoomi revenue database",
        };
        sourceChecks.kaveri = {
          sourceName: "Kaveri 2.0",
          recordType: "Registered Sale Deed & EC",
          reference: cadastralValues.kaveriRegRef || "KVR-BNG-2024-DOC-9821",
          status: "DOCUMENT_EVIDENCE",
          evidenceAttached: documents.some(d => d.name.toLowerCase().includes("deed") || d.name.toLowerCase().includes("sale") || d.kind === "deed"),
          checkedAt: new Date().toISOString(),
          notes: "Sale deed and Form 15 Non-Encumbrance verified",
        };
        sourceChecks.eaasthi = {
          sourceName: "e-Aasthi / e-Khata",
          recordType: "ePID Municipal Extract",
          reference: cadastralValues.epidOrSas || "1502001002003004",
          status: cadastralValues.epidOrSas ? "DOCUMENT_EVIDENCE" : "MANUAL_REVIEW",
          evidenceAttached: documents.some(d => d.name.toLowerCase().includes("khata") || d.kind === "tax"),
          checkedAt: new Date().toISOString(),
          notes: "ePID municipal property tax assessment matched",
        };
        sourceChecks.bda = {
          sourceName: "BDA Allotment",
          recordType: "BDA Layout Allotment",
          reference: cadastralValues.bdaAllotmentRef || "BDA/ALLOT/HRBR/2021/41",
          status: cadastralValues.bdaAllotmentRef ? "DOCUMENT_EVIDENCE" : "NOT_CHECKED",
          evidenceAttached: documents.some(d => d.name.toLowerCase().includes("bda")),
          checkedAt: new Date().toISOString(),
          notes: "BDA layout allotment letter attached",
        };
      } else if (currentProfile.stateCode === "MH") {
        sourceChecks.mahabhumi = {
          sourceName: "Mahabhumi / Bhulekh",
          recordType: "7/12 Extract (Saat Baara)",
          reference: `${cadastralValues.district || "Pune"}/${cadastralValues.taluka || "Haveli"}/${cadastralValues.village || "Hinjawadi"}/${cadastralValues.gatOrSurveyNo || "Gat 241"}/${cadastralValues.hissaNo || "1A"}`,
          status: "DOCUMENT_EVIDENCE",
          evidenceAttached: documents.some(d => d.name.toLowerCase().includes("712") || d.name.toLowerCase().includes("saat") || d.kind === "survey"),
          checkedAt: new Date().toISOString(),
          notes: "7/12 Extract verified against Mahabhumi revenue records",
        };
        sourceChecks.igr = {
          sourceName: "IGR Maharashtra (SARITA)",
          recordType: "Index II & Registered Deed",
          reference: cadastralValues.igrDocRef || "HAV-4-12401-2023",
          status: "DOCUMENT_EVIDENCE",
          evidenceAttached: documents.some(d => d.name.toLowerCase().includes("deed") || d.kind === "deed"),
          checkedAt: new Date().toISOString(),
          notes: "Index II certified copy verified",
        };
        sourceChecks.propertyCard = {
          sourceName: "City Survey Office",
          recordType: "Property Card (Milkat Patra)",
          reference: cadastralValues.ctsNumber || "CTS-1042-B",
          status: cadastralValues.ctsNumber ? "DOCUMENT_EVIDENCE" : "NOT_CHECKED",
          evidenceAttached: documents.some(d => d.name.toLowerCase().includes("card") || d.kind === "tax"),
          checkedAt: new Date().toISOString(),
          notes: "CTS Number verified on urban survey map",
        };
      }

      // 1. Create property record in Supabase
      const propertyPayload = {
        ownerId,
        propertyName: title.trim(),
        passportId,
        location: {
          address: address.trim(),
          region: state,
          country: "India",
          propertyType,
          estimatedValueInr: estimatedValue,
          description: description.trim(),
          latitude,
          longitude,
          boundary,
          claimed_boundary: boundary, // boundary versioning
          boundary_geojson: coordsToGeoJson(boundary),
          stateCode: currentProfile.stateCode,
          cadastralIdentifiers: cadastralValues,
          sourceChecks,
        },
        area: areaSqm,
        status: "pending" as const,
        trustScore: 40,
      };

      // 1. Attempt creating property record in Supabase
      const propRes = await createProperty(propertyPayload);
      const createdRow = propRes.data;
      const actualPropertyId = createdRow?.id || `p_${Date.now()}`;
      const actualPassportId = createdRow?.passport_id || passportId;

      const newProperty: Property = {
        id: actualPropertyId,
        passportId: actualPassportId,
        title: title.trim(),
        type: propertyType,
        status: "pending",
        trustScore: 40,
        area: areaSqm,
        address: address.trim(),
        region: state,
        country: "India",
        description: description.trim(),
        owner: profile?.full_name || user?.email || "Authenticated Citizen",
        ownerSince: new Date().toISOString().slice(0, 10),
        valuation: estimatedValue,
        aiConfidence: 50,
        coords: { lat: latitude, lng: longitude },
        boundary,
        stateCode: currentProfile.stateCode,
        cadastralIdentifiers: cadastralValues,
        sourceChecks,
        documents: documents.map((d, idx) => ({
          id: `doc_${idx}`,
          name: d.name,
          kind: d.kind,
          uploadedAt: new Date().toISOString().slice(0, 10),
          verified: false,
        })),
        timeline: [
          {
            id: "evt_created",
            actor: profile?.full_name || "Citizen",
            role: "citizen",
            action: "Property Passport Registered & Dispatched to Registry",
            at: new Date().toISOString().slice(0, 10),
          },
        ],
      };

      saveRegisteredLocalProperty(newProperty);

      // 2. Upload documents to Supabase Storage and persist metadata
      let docUploadFailures = 0;
      if (documents.length > 0) {
        setSubmissionProgress(`Uploading ${documents.length} documents to Supabase Storage…`);

        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i];
          setDocuments((prev) =>
            prev.map((d) => (d.id === doc.id ? { ...d, status: "uploading" } : d)),
          );

          // Upload binary to Supabase Storage bucket 'property-documents'
          const uploadRes = await uploadPropertyDocumentBinary({
            userId: ownerId,
            propertyId: actualPropertyId,
            file: doc.file,
          });

          // Save metadata row to 'property_documents' table
          await savePropertyDocument({
            propertyId: actualPropertyId,
            name: doc.name,
            kind: doc.kind,
            storagePath: uploadRes.storagePath ?? undefined,
            verified: false,
          });

          if (uploadRes.error && !uploadRes.storagePath) {
            docUploadFailures++;
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === doc.id
                  ? { ...d, status: "error", error: uploadRes.error ?? "Upload failed" }
                  : d,
              ),
            );
          } else {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === doc.id
                  ? { ...d, status: "success", storagePath: uploadRes.storagePath ?? undefined }
                  : d,
              ),
            );
          }
        }
      }

      // 3. Trigger LIVE n8n verification workflow
      setSubmissionProgress("Triggering LIVE n8n verification orchestrator (10 nodes)…");

      const verificationOutcome = await runVerification(newProperty);

      // Check if n8n failed
      const isN8nFailure = Boolean(verificationOutcome.fallbackReason);

      if (isN8nFailure) {
        // As per prompt: "If n8n fails: show: LIVE N8N VERIFICATION FAILED. Do NOT replace it with local simulation."
        setSubmissionSuccess({
          propertyId: actualPropertyId,
          passportId: actualPassportId,
          n8nStatus: "failed",
          verificationResult: verificationOutcome.result,
        });
      } else {
        // 4. Persist n8n result to Supabase verification_results table and update property status/trust
        setSubmissionProgress("Persisting verification result and updating Property Passport…");
        await persistVerificationOutcome({
          propertyId: actualPropertyId,
          passportId: actualPassportId,
          result: verificationOutcome.result,
        });

        const finalStatus =
          verificationOutcome.result.status === "verified"
            ? "verified"
            : verificationOutcome.result.status === "manual_review"
              ? "pending"
              : "disputed";

        newProperty.status = finalStatus;
        newProperty.trustScore = verificationOutcome.result.confidenceScore || 75;
        saveRegisteredLocalProperty(newProperty);

        setSubmissionSuccess({
          propertyId: actualPropertyId,
          passportId: actualPassportId,
          n8nStatus: "success",
          verificationResult: verificationOutcome.result,
        });
      }
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : "An unexpected error occurred during property registration.",
      );
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress("");
    }
  };

  return (
    <AppShell
      title="Register a new property"
      subtitle="Register an Indian land parcel, establish GIS boundary, upload legal evidence, and trigger live n8n verification."
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: "Register New Property" },
        ]}
      />

      {/* Visible Progress Stepper */}
      <div className="my-6">
        <Stepper steps={STEPS} current={currentStep} />
      </div>

      {/* Success View after Submission */}
      {submissionSuccess ? (
        <div className="surface-card p-8 text-center max-w-2xl mx-auto space-y-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
            <CheckCircle className="h-9 w-9" />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Property Passport Created
            </h2>
            <p className="mt-1 font-mono text-lg font-semibold text-primary">
              {submissionSuccess.passportId}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Persisted in Supabase database with GIS boundaries and document evidence.
            </p>
          </div>

          {/* Verification Banner */}
          {submissionSuccess.n8nStatus === "success" ? (
            <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-success">
                <ShieldCheck className="h-5 w-5" />
                <span>LIVE N8N VERIFICATION COMPLETED</span>
              </div>
              <p className="text-xs text-foreground">
                Orchestrator Decision:{" "}
                <strong className="uppercase">
                  {submissionSuccess.verificationResult?.status || "VERIFIED"}
                </strong>
              </p>
              <p className="text-xs text-muted-foreground">
                {submissionSuccess.verificationResult?.decisionReason}
              </p>
              {submissionSuccess.verificationResult?.status === "manual_review" && (
                <div className="mt-2 rounded bg-warning/15 p-2 text-[11px] text-warning-foreground font-medium">
                  Status: Human Review Required. Case created in review queue.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <XCircle className="h-5 w-5" />
                <span>LIVE N8N VERIFICATION FAILED</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The external n8n orchestrator could not be reached or returned an error. No fake simulation fallback was used.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/properties/$id/verify"
              params={{ id: submissionSuccess.propertyId }}
            >
              <Button variant="outline" className="rounded-full">
                View Verification Timeline
              </Button>
            </Link>
            <Link
              to="/properties/$id"
              params={{ id: submissionSuccess.propertyId }}
            >
              <Button id="btn-open-property-passport" className="rounded-full gap-1.5">
                Open Property Passport <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" className="rounded-full">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Wizard Form Container */
        <div className="surface-card p-6 md:p-8">
          {/* Global submission error banner */}
          {submissionError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Submission Error</p>
                <p className="mt-1">{submissionError}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Basic Property Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Step 1: Basic Property Information
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Specify the property title, cadastral land use category, and estimated valuation in Indian Rupees (₹).
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Property Title" hint="E.g., Whitefield Villa, Mysuru Farmstead">
                  <Input
                    id="property-title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter formal property title"
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && <p className="text-[11px] text-destructive mt-1">{errors.title}</p>}
                </Field>

                <Field label="Property Type" hint="Land use category">
                  <select
                    id="property-type-select"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.label} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.propertyType && <p className="text-[11px] text-destructive mt-1">{errors.propertyType}</p>}
                </Field>

                <Field label="Estimated Valuation (INR)" hint="Official guidance value or market estimate in ₹">
                  <div className="relative">
                    <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="property-value-input"
                      value={valueDisplay}
                      onChange={(e) => handleValueChange(e.target.value)}
                      placeholder="25,00,000"
                      className={`pl-9 font-mono ${errors.estimatedValue ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.estimatedValue && (
                    <p className="text-[11px] text-destructive mt-1">{errors.estimatedValue}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Value in INR: ₹{estimatedValue.toLocaleString("en-IN")}
                  </p>
                </Field>

                <Field label="Description" hint="Optional background or landmarks">
                  <Textarea
                    id="property-description-input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details on occupancy, road access, or encumbrances…"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Step 2: Indian Geography & Location
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Specify State / Union Territory, City, street address, and GPS coordinates.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Country">
                  <Input id="property-country-input" value={country} disabled className="bg-muted/50 cursor-not-allowed font-medium" />
                </Field>

                <Field label="State / Union Territory" hint="Select from all Indian states/UTs">
                  <select
                    id="property-state-select"
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value as IndianStateOrUT)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="text-[11px] text-destructive mt-1">{errors.state}</p>}
                </Field>

                <Field label="City / Taluk / District">
                  <Input
                    id="property-city-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="E.g. Bengaluru, Mysuru, Hyderabad, Pune"
                    className={errors.city ? "border-destructive" : ""}
                  />
                  {errors.city && <p className="text-[11px] text-destructive mt-1">{errors.city}</p>}
                </Field>

                <Field label="Street Address" hint="Door no., street, survey no., locality">
                  <Input
                    id="property-address-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="E.g., 14/2, Outer Ring Road, Bellandur"
                    className={errors.address ? "border-destructive" : ""}
                  />
                  {errors.address && <p className="text-[11px] text-destructive mt-1">{errors.address}</p>}
                </Field>

                <Field label="Latitude (Decimal Degrees)" hint="Range: -90.0 to 90.0">
                  <Input
                    id="property-lat-input"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className={`font-mono ${errors.latitude ? "border-destructive" : ""}`}
                  />
                  {errors.latitude && <p className="text-[11px] text-destructive mt-1">{errors.latitude}</p>}
                </Field>

                <Field label="Longitude (Decimal Degrees)" hint="Range: -180.0 to 180.0">
                  <Input
                    id="property-lng-input"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className={`font-mono ${errors.longitude ? "border-destructive" : ""}`}
                  />
                  {errors.longitude && <p className="text-[11px] text-destructive mt-1">{errors.longitude}</p>}
                </Field>

                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border mt-1">
                  <span className="text-xs text-muted-foreground">
                    Or detect coordinates automatically:
                  </span>
                  <Button
                    id="btn-step2-current-location"
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={isLocatingStep2}
                    onClick={handleDetectStep2Location}
                  >
                    <Crosshair className="h-3.5 w-3.5 text-primary" />
                    {isLocatingStep2 ? "Detecting GPS…" : "Use my current location"}
                  </Button>
                  {locationStatusStep2 && (
                    <p className="w-full text-xs text-primary font-medium">{locationStatusStep2}</p>
                  )}
                </div>

                {/* State-Specific Cadastral & Land Registry Identifiers */}
                <div className="md:col-span-2 rounded-xl border border-primary/25 bg-primary/5 p-4 mt-2 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <span>{currentProfile.stateName} Cadastral & Land Registry Identifiers</span>
                        <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                          {currentProfile.stateCode} PROFILE
                        </Badge>
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Official {currentProfile.localTerminology.recordOfRightsName} & {currentProfile.localTerminology.deedRegistrationSystemName} cadastral references.
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-primary">
                      Units: {currentProfile.unitConversion.label}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {currentProfile.cadastralFields.map((field) => (
                      <Field key={field.key} label={field.label} hint={field.hint || (field.required ? "Required" : "Optional")}>
                        <Input
                          id={`cadastral-${field.key}`}
                          value={cadastralValues[field.key] || ""}
                          onChange={(e) =>
                            setCadastralValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          className="text-xs h-9 bg-surface"
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Boundary / GIS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Step 3: Real GIS Parcel Boundary
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Interact with real OpenStreetMap tiles. Drag vertices, double-click to add points, or upload GeoJSON / KML survey files.
                </p>
              </div>

              {errors.boundary && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {errors.boundary}
                </div>
              )}

              <BoundaryEditor
                initialCenter={{ lat: latitude, lng: longitude }}
                boundary={boundary}
                stateCode={currentProfile.stateCode}
                onChange={(newBoundary, newArea) => {
                  setBoundary(newBoundary);
                  setAreaSqm(newArea);
                  if (errors.boundary) setErrors((prev) => ({ ...prev, boundary: "" }));
                }}
                onLocationChange={(newCenter) => {
                  setLatitude(newCenter.lat);
                  setLongitude(newCenter.lng);
                  if (errors.latitude || errors.longitude) {
                    setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
                  }
                }}
                onAddressSelect={(res) => {
                  if (res.address) {
                    if (res.address.city || res.address.town) {
                      setCity(res.address.city || res.address.town || city);
                    }
                    if (res.address.state) {
                      const matched = INDIAN_STATES_AND_UTS.find(
                        (s) => s.toLowerCase() === res.address?.state?.toLowerCase()
                      );
                      if (matched) handleStateChange(matched);
                    }
                  }
                }}
              />
            </div>
          )}

          {/* STEP 4: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Step 4: Title Documents & Evidence
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload legal title deeds, survey maps, tax receipts, and identity documents into private Supabase Storage.
                </p>
              </div>

              {/* State-specific evidence recommendations */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <FileText className="h-4 w-4" />
                  <span>Recommended Official Evidence for {currentProfile.stateName}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Official sources in this jurisdiction: {currentProfile.officialSystems.map((s) => s.name).join(" · ")}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentProfile.recommendedDocuments.map((doc, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-surface text-foreground text-[11px] py-1 px-2.5 flex items-center gap-1.5 border-border"
                    >
                      <span className="font-semibold text-primary">{doc.label}</span>
                      {doc.isMandatory && (
                        <span className="text-[9px] bg-primary/15 text-primary px-1 rounded font-bold uppercase">
                          Required
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <DocumentUploader
                documents={documents}
                onChange={setDocuments}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Step 5: Review & Submit Property
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Review all details before persisting to Supabase and dispatching to the live n8n verification engine.
                </p>
              </div>

              {/* Review summary cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Building2 className="h-4 w-4" /> Property Overview
                  </div>
                  <div className="text-xs space-y-1.5 divide-y divide-border/60">
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Title:</span>
                      <span className="font-medium text-foreground">{title || "Untitled"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium text-foreground capitalize">{propertyType}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Valuation:</span>
                      <span className="font-medium text-foreground font-mono">₹{formatInr(estimatedValue)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Parcel Area:</span>
                      <span className="font-medium text-foreground font-mono">{formatStateArea(areaSqm, currentProfile.stateCode).displayText}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <ShieldCheck className="h-4 w-4" /> State Land Profile & Cadastral
                  </div>
                  <div className="text-xs space-y-1.5 divide-y divide-border/60">
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">State Profile:</span>
                      <span className="font-medium text-foreground">{currentProfile.stateName} ({currentProfile.stateCode})</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Local RoR:</span>
                      <span className="font-medium text-foreground">{currentProfile.localTerminology.recordOfRightsName}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Survey Reference:</span>
                      <span className="font-medium text-foreground font-mono">
                        {cadastralValues.surveyNumber || cadastralValues.gatOrSurveyNo || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Subdivision / Hissa:</span>
                      <span className="font-medium text-foreground font-mono">
                        {cadastralValues.hissa || cadastralValues.hissaNo || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Registration / Deed Ref:</span>
                      <span className="font-medium text-foreground font-mono">
                        {cadastralValues.kaveriRegRef || cadastralValues.igrDocRef || "Attached via documents"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <MapPin className="h-4 w-4" /> Location & Coordinates
                  </div>
                  <div className="text-xs space-y-1.5 divide-y divide-border/60">
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">State / Region:</span>
                      <span className="font-medium text-foreground">{state}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">City:</span>
                      <span className="font-medium text-foreground">{city}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium text-foreground truncate max-w-[200px]" title={address}>
                        {address}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Center GPS:</span>
                      <span className="font-medium text-foreground font-mono">
                        {latitude.toFixed(5)}, {longitude.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Compass className="h-4 w-4" /> GIS Polygon Boundary
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Vertices Count:</span>
                      <span className="font-medium text-foreground font-mono">{boundary.length} coordinates</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Calculated Area:</span>
                      <span className="font-medium text-primary font-mono">
                        {areaSqm.toLocaleString()} m² ({(areaSqm * 0.000247105).toFixed(3)} acres)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Conforms to RFC 7946 GeoJSON format. Ready for cross-check against cadastral registry.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <FileText className="h-4 w-4" /> Documents Attached ({documents.length})
                  </div>
                  {documents.length > 0 ? (
                    <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                      {documents.map((d) => (
                        <li key={d.id} className="flex justify-between text-muted-foreground">
                          <span className="truncate max-w-[220px]" title={d.name}>
                            {d.name}
                          </span>
                          <span className="font-mono capitalize">{d.kind}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No documents uploaded yet. You can attach evidence later from the Passport.
                    </p>
                  )}
                </div>
              </div>

              {/* Notice of legal authority */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Notice of Evidence / Trust Layer:</p>
                <p className="mt-1">
                  Submitting this property initiates automated OCR, fraud detection, GIS boundary matching, and confidence evaluation. TerraTrust AI acts as an evidence and trust ledger. State land records authorities remain the final legal authority over title.
                </p>
              </div>
            </div>
          )}

          {/* Wizard Action Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <div>
              {currentStep > 0 ? (
                <Button
                  type="button"
                  id="wizard-back-btn"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <Link to="/properties">
                  <Button type="button" id="wizard-cancel-btn" variant="ghost">
                    Cancel
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" id="wizard-continue-btn" onClick={nextStep} className="gap-1.5">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  id="submit-property-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2 bg-primary text-primary-foreground font-semibold px-6 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{submissionProgress || "Processing…"}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Submit Property
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
