import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Pill, SectionTitle } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { VerificationWorkflowPanel } from "@/components/ui-ext/VerificationWorkflowPanel";
import { HowTerraTrustWorks } from "@/components/ui-ext/HowTerraTrustWorks";
import {
  STEP_NAMES,
  activeProvider,
  buildPayload,
  runVerification,
  type VerificationResult,
  type WorkflowStep,
} from "@/lib/verification-workflow";
import {
  MapPin,
  Play,
  RotateCcw,
  Ruler,
  User2,
  Workflow,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  FileText,
  Scale,
  Compass,
  Check,
} from "lucide-react";
import { loadPropertyById } from "@/lib/property-repository";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import {
  createSurveyorAssignment,
  persistVerificationOutcome,
  recordGovernmentDecision,
} from "@/lib/supabase-persistence";
import { loadGovernmentSurveyors } from "@/lib/property-repository";
import { useAuth } from "@/lib/auth";
import { getStateProfile, formatStateArea } from "@/lib/state-registry";
import { RealMap } from "@/components/ui-ext/RealMap";
import { calculatePolygonArea } from "@/lib/gis-utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/properties/$id/verify")({
  head: () => ({
    meta: [
      { title: "State-Aware Land Verification — TerraTrust AI" },
      {
        name: "description",
        content:
          "Official state land registry verification, surveyor boundary overlay, and n8n-orchestrated legal review.",
      },
    ],
  }),
  loader: async ({ params }) => {
    return { property: await loadPropertyById(params.id) };
  },
  component: Page,
});

function Page() {
  const { property: loaderProperty } = Route.useLoaderData();
  const { id } = Route.useParams();
  const [property, setProperty] = useState<Property | null>(loaderProperty);
  const { user, profile } = useAuth();
  const isGovOrAdmin = profile?.role === "government" || profile?.role === "admin";

  const provider = activeProvider();
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState<WorkflowStep[]>([]);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // State profile
  const stateProfile = getStateProfile(property?.stateCode || property?.region || "Karnataka");

  // Government Decision state
  const [govDecision, setGovDecision] = useState<
    "approved" | "rejected" | "clarification_requested" | null
  >(
    property?.governmentDecision && property.governmentDecision !== "pending"
      ? property.governmentDecision
      : null,
  );
  const [officerNotes, setOfficerNotes] = useState(property?.governmentOfficerNotes || "");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [propertyStatus, setPropertyStatus] = useState(property?.status || "pending");
  const [surveyors, setSurveyors] = useState<Awaited<ReturnType<typeof loadGovernmentSurveyors>>>(
    [],
  );
  const [selectedSurveyor, setSelectedSurveyor] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (isGovOrAdmin) loadGovernmentSurveyors().then(setSurveyors);
  }, [isGovOrAdmin]);

  useEffect(() => {
    if (!property) loadPropertyById(id).then(setProperty);
  }, [id, property]);

  const assignSurveyor = async () => {
    if (!user?.id || !selectedSurveyor || !property) return;
    setAssigning(true);
    const outcome = await createSurveyorAssignment({
      propertyId: property.id,
      surveyorId: selectedSurveyor,
      assignedBy: user.id,
      notes: "Government requested field boundary and evidence review.",
    });
    setAssigning(false);
    setAssignmentMessage(
      outcome.persisted
        ? "Surveyor assignment persisted and sent to the field queue."
        : outcome.error || "Assignment could not be persisted.",
    );
  };

  const run = useCallback(async () => {
    if (!property) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(true);
    setResult(null);
    setVisible([]);
    setFallbackReason(undefined);

    const outcome = await runVerification(property);
    setFallbackReason(outcome.fallbackReason);

    // Persist live result to Supabase
    if (!outcome.fallbackReason && outcome.result) {
      persistVerificationOutcome({
        propertyId: property.id,
        passportId: property.passportId,
        result: outcome.result,
      }).catch(console.error);
    }

    outcome.result.steps.forEach((step, i) => {
      timers.current.push(
        setTimeout(
          () => {
            setVisible((prev) => [...prev, step]);
            if (i === outcome.result.steps.length - 1) {
              setResult(outcome.result);
              setRunning(false);
            }
          },
          420 * (i + 1),
        ),
      );
    });
  }, [property]);

  if (!property) {
    return (
      <AppShell title="Loading property...">
        <p className="text-muted-foreground">Loading the persisted property record.</p>
      </AppShell>
    );
  }

  const handleGovernmentDecisionSubmit = async (
    decision: "approved" | "rejected" | "clarification_requested",
  ) => {
    setIsSubmittingDecision(true);
    try {
      const res = await recordGovernmentDecision({
        propertyId: property.id,
        resolution: decision,
        officerNotes:
          officerNotes ||
          `Official government determination: ${decision.toUpperCase()} by ${user?.email || "Authorized Revenue Officer"}.`,
      });

      if (res.error) {
        toast.error(`Decision error: ${res.error}`);
      } else {
        setGovDecision(decision);
        setPropertyStatus(
          decision === "approved" ? "verified" : decision === "rejected" ? "disputed" : "pending",
        );
        toast.success(
          decision === "approved"
            ? `Government order recorded. Property Passport for ${property.passportId} officially APPROVED.`
            : decision === "rejected"
              ? `Property ${property.passportId} REJECTED due to identified defects.`
              : `Clarification requested from surveyor and property owner.`,
        );
      }
    } catch (err) {
      toast.error("Failed to persist government determination.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const shown = result ? result.steps : visible;

  // Boundary comparison metrics
  const citizenAreaSqm =
    property.boundary && property.boundary.length >= 3
      ? calculatePolygonArea(property.boundary)
      : property.area;
  const surveyorAreaSqm =
    property.surveyorBoundary && property.surveyorBoundary.length >= 3
      ? calculatePolygonArea(property.surveyorBoundary)
      : null;
  const areaDiscrepancyDelta = surveyorAreaSqm ? Math.abs(surveyorAreaSqm - citizenAreaSqm) : 0;
  const areaDiscrepancyPct =
    surveyorAreaSqm && citizenAreaSqm > 0
      ? ((areaDiscrepancyDelta / citizenAreaSqm) * 100).toFixed(1)
      : null;

  return (
    <AppShell
      title="Land Verification & Registry Workbench"
      subtitle={`${property.title} · ${property.passportId} — State Land Profile: ${stateProfile.stateName}`}
      actions={
        <>
          <Button variant="outline" className="rounded-full" onClick={run} disabled={running}>
            <RotateCcw className="h-4 w-4 mr-1" /> Re-run n8n
          </Button>
          <Button className="rounded-full" onClick={run} disabled={running}>
            <Play className="h-4 w-4 mr-1" /> {running ? "Orchestrating…" : "Run Live Verification"}
          </Button>
        </>
      }
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: property.passportId, to: "/properties/$id" },
          { label: "Land Verification" },
        ]}
      />
      <PropertySubNav propertyId={property.id} activeTab="verify" />

      {/* State Verification Profile Header Banner */}
      <div className="mt-4 surface-card p-5 border-l-4 border-l-primary">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {stateProfile.stateName} State Land Profile ({stateProfile.stateCode})
              </span>
              <span className="text-xs text-muted-foreground">
                Primary Unit: <strong>{stateProfile.unitConversion.primaryLocalUnit}</strong> (
                {stateProfile.unitConversion.label})
              </span>
            </div>
            <p className="mt-1.5 text-sm text-foreground">
              Official checks configured for{" "}
              <strong>{stateProfile.localTerminology.recordOfRightsName}</strong>,{" "}
              <strong>{stateProfile.localTerminology.deedRegistrationSystemName}</strong>, and{" "}
              <strong>{stateProfile.localTerminology.urbanPropertyCardLabel}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Pill
              tone={
                propertyStatus === "verified"
                  ? "success"
                  : propertyStatus === "disputed"
                    ? "danger"
                    : "warning"
              }
            >
              {propertyStatus.toUpperCase()}
            </Pill>
          </div>
        </div>
      </div>

      {/* Cadastral Identifiers Grid */}
      <div className="mt-4 surface-card p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <p className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Building2 className="h-4 w-4 text-primary" /> State Cadastral Record Identifiers
          </p>
          <span className="text-xs font-mono text-muted-foreground">
            Passport ID: {property.passportId}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              District / Taluk
            </p>
            <p className="mt-1 font-medium text-foreground">
              {String(property.cadastralIdentifiers?.district || property.region)} ·{" "}
              {String(property.cadastralIdentifiers?.taluk || "Jurisdiction Taluk")}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {stateProfile.localTerminology.surveyNumberLabel}
            </p>
            <p className="mt-1 font-mono font-medium text-foreground">
              {String(
                property.cadastralIdentifiers?.surveyNumber ||
                  property.cadastralIdentifiers?.gatNumber ||
                  "Survey Ref Attached",
              )}
              {property.cadastralIdentifiers?.hissa
                ? ` / Hissa ${property.cadastralIdentifiers.hissa}`
                : ""}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {stateProfile.localTerminology.khataOrAccountLabel}
            </p>
            <p className="mt-1 font-mono text-foreground">
              {String(
                property.cadastralIdentifiers?.khataNumber ||
                  property.cadastralIdentifiers?.epidOrSas ||
                  property.cadastralIdentifiers?.propertyCardNumber ||
                  "Municipal / RoR Record",
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Registration Ref ({stateProfile.localTerminology.deedRegistrationSystemName})
            </p>
            <p className="mt-1 font-mono text-foreground">
              {String(
                property.cadastralIdentifiers?.kaveriRegRef ||
                  property.cadastralIdentifiers?.ecReference ||
                  property.cadastralIdentifiers?.igrDocNumber ||
                  "Title Deed Attached",
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Official State Registry Checks Panel */}
      <div className="mt-6 surface-card p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Researched Official Systems &
              Evidence
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified integration status for {stateProfile.stateName} revenue, registration, and
              municipal systems.
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Zero fake automated APIs · Real evidentiary fallbacks
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {stateProfile.officialSystems.map((sys) => {
            const hasCadastralRef =
              property.cadastralIdentifiers &&
              sys.requiredFields.some((f) => property.cadastralIdentifiers?.[f]);

            return (
              <div
                key={sys.id}
                className="rounded-xl border border-border/80 bg-background/60 p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground">{sys.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono shrink-0 ${
                        sys.adapterStatus === "DOCUMENT_EVIDENCE"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : sys.adapterStatus === "AUTHORIZED_CONNECTOR"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                            : sys.adapterStatus === "MANUAL_REVIEW"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {sys.adapterStatus.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{sys.department}</p>
                  <p className="text-[11px] text-foreground/80 mt-2 line-clamp-2 leading-relaxed">
                    {sys.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    {hasCadastralRef ? "Reference attached" : "Check applicable"}
                  </span>
                  <a
                    href={sys.officialPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    Official Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Layer Boundary Inspection */}
      <div className="mt-6 surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Layers className="h-4 w-4 text-primary" /> Multi-Layer Boundary Inspection
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Citizen Claimed Boundary (Teal) vs Licensed Surveyor Field Boundary (Amber).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {surveyorAreaSqm ? (
              <Badge
                variant="outline"
                className={
                  areaDiscrepancyDelta < 10
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                }
              >
                {areaDiscrepancyDelta < 10
                  ? "✓ 0% Boundary Discrepancy — Exact Ground Match"
                  : `⚠️ ${areaDiscrepancyPct}% Discrepancy (Δ ${areaDiscrepancyDelta.toFixed(1)} m²)`}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                Citizen Claimed Boundary Active (Surveyor Pending)
              </Badge>
            )}
          </div>
        </div>

        <RealMap
          initialCenter={property.coords}
          boundary={property.boundary}
          secondaryBoundary={property.surveyorBoundary}
          secondaryBoundaryLabel="SURVEYOR FIELD VERIFIED"
          readOnly={true}
          stateCode={property.stateCode || stateProfile.stateCode}
          boundaryLabel="CITIZEN CLAIMED BOUNDARY"
          height={380}
        />

        {property.surveyorDecision && (
          <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3 text-xs">
            <Compass className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">
                  Surveyor Field Verification Determination:{" "}
                  <span className="capitalize text-primary">
                    {property.surveyorDecision.replace("_", " ")}
                  </span>
                </p>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Field Notes Attached
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {property.surveyorNotes ||
                  "Licensed cadastral surveyor completed boundary vertex inspection and field marker verification."}
              </p>
            </div>
          </div>
        )}
        {property.surveyorFieldPhotos && property.surveyorFieldPhotos.length > 0 && (
          <div className="mt-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs">
            <p className="font-semibold text-foreground">Surveyor evidence submitted</p>
            <p className="mt-1 text-muted-foreground">
              Inspection evidence is stored in the private property-document bucket and is visible
              to authorized reviewers.
            </p>
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-foreground">
              {property.surveyorFieldPhotos.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Government Legal Authority Decision Panel */}
      {isGovOrAdmin && (
        <div className="mt-6 surface-card p-5 border border-amber-500/30">
          <h3 className="text-sm font-semibold text-foreground">Field survey assignment</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign this persisted property to a licensed surveyor before making a final decision.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={selectedSurveyor}
              onChange={(event) => setSelectedSurveyor(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
            >
              <option value="">Select a surveyor</option>
              {surveyors.map((surveyor) => (
                <option key={surveyor.id} value={surveyor.id}>
                  {surveyor.full_name || surveyor.email}
                </option>
              ))}
            </select>
            <Button
              onClick={assignSurveyor}
              disabled={assigning || !selectedSurveyor}
              variant="outline"
              className="text-xs"
            >
              {assigning ? "Assigning…" : "Assign surveyor"}
            </Button>
          </div>
          {surveyors.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              No persisted surveyor profiles are available in this jurisdiction.
            </p>
          )}
          {assignmentMessage && (
            <p className="mt-2 text-xs text-muted-foreground">{assignmentMessage}</p>
          )}
        </div>
      )}

      {/* Government Legal Authority Decision Panel */}
      <div className="mt-6 surface-card p-5 border-2 border-primary/20">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Scale className="h-4 w-4 text-primary" /> Government Legal Authority Determination
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Under Section 102 of the Land Revenue Code, only authorized revenue officers make
              final title determinations.
            </p>
          </div>
          {govDecision && (
            <Badge
              variant="outline"
              className={`font-mono text-xs ${
                govDecision === "approved"
                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                  : govDecision === "rejected"
                    ? "bg-red-500/15 text-red-600 border-red-500/30"
                    : "bg-amber-500/15 text-amber-600 border-amber-500/30"
              }`}
            >
              ORDER: {govDecision.toUpperCase()}
            </Badge>
          )}
        </div>

        {isGovOrAdmin ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Government Officer Review Remarks & Gazette / Order Reference:
              </label>
              <textarea
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="e.g., Verified against Bhoomi RTC, Kaveri 2.0 registered deed, and Surveyor field inspection report. No encumbrance or boundary overlap found. Legal Property Passport authorized."
                className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[72px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                id="btn-gov-approve"
                disabled={isSubmittingDecision}
                onClick={() => handleGovernmentDecisionSubmit("approved")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmittingDecision && govDecision === "approved"
                  ? "Recording…"
                  : "APPROVE (Issue Property Passport)"}
              </Button>

              <Button
                id="btn-gov-clarify"
                variant="outline"
                disabled={isSubmittingDecision}
                onClick={() => handleGovernmentDecisionSubmit("clarification_requested")}
                className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 rounded-full text-xs gap-1.5"
              >
                <AlertTriangle className="h-4 w-4" />
                {isSubmittingDecision && govDecision === "clarification_requested"
                  ? "Recording…"
                  : "REQUEST CLARIFICATION"}
              </Button>

              <Button
                id="btn-gov-reject"
                variant="outline"
                disabled={isSubmittingDecision}
                onClick={() => handleGovernmentDecisionSubmit("rejected")}
                className="border-red-500/40 text-red-600 hover:bg-red-500/10 rounded-full text-xs gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                {isSubmittingDecision && govDecision === "rejected"
                  ? "Recording…"
                  : "REJECT (Record Defect Notice)"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              {govDecision
                ? `Authoritative revenue officer determination recorded: ${govDecision.toUpperCase()}.`
                : "Awaiting final decision from jurisdiction revenue officer."}
            </span>
            <span className="font-mono text-[11px]">Role: {profile?.role || "citizen"}</span>
          </div>
        )}
      </div>

      {/* n8n Live Verification Runner */}
      <div className="mt-6">
        <VerificationWorkflowPanel
          result={result}
          running={running}
          provider={result?.provider ?? provider}
          fallbackReason={fallbackReason}
          propertyId={property.id}
          liveSteps={shown}
        />
      </div>

      {!result && !running && shown.length === 0 && (
        <div className="mt-6 surface-card p-5">
          <SectionTitle
            eyebrow="Ready"
            title="Start the orchestrated run"
            description="The workflow calls the existing TerraTrust engines in sequence and returns a signed, auditable decision."
          />
          <p className="text-sm text-muted-foreground">
            Orchestrates OCR, fraud score, boundary verification, and state registry matching via
            live n8n webhook.
          </p>
        </div>
      )}

      <div className="mt-6">
        <HowTerraTrustWorks />
      </div>

      <div className="mt-6 surface-card overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-4 py-2 font-mono text-xs">
          POST $VITE_N8N_WEBHOOK_URL · state-aware request payload
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed">
          <code>{JSON.stringify(buildPayload(property), null, 2)}</code>
        </pre>
      </div>
    </AppShell>
  );
}
