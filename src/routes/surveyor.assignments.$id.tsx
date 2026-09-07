import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RealMap } from "@/components/ui-ext/RealMap";
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Camera,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Compass,
} from "lucide-react";
import { loadSurveyorAssignments } from "@/lib/property-repository";
import {
  recordSurveyorDecision,
  savePropertyDocument,
  uploadPropertyDocumentBinary,
} from "@/lib/supabase-persistence";
import { formatStateArea } from "@/lib/state-registry";
import type { Property, PropertyBoundary } from "@/lib/types";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/surveyor/assignments/$id")({
  head: () => ({ meta: [{ title: "Surveyor Field Inspection — TerraTrust AI" }] }),
  component: SurveyorAssignmentDetail,
});

function SurveyorAssignmentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveyorBoundary, setSurveyorBoundary] = useState<PropertyBoundary[]>([]);
  const [fieldNotes, setFieldNotes] = useState("");
  const [decision, setDecision] = useState<"verified" | "correction_required">("verified");
  const [submitting, setSubmitting] = useState(false);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadSurveyorAssignments(user.id).then((assigned) => {
      const p =
        assigned.find((item) => item.id === id || (item as any).assignmentId === id) ?? null;
      if (p) {
        setProperty(p);
        setSurveyorBoundary(p.surveyorBoundary || p.boundary || []);
        if (p.surveyorNotes) setFieldNotes(p.surveyorNotes);
        if (p.surveyorDecision)
          setDecision(
            p.surveyorDecision === "correction_required" ? "correction_required" : "verified",
          );
      }
      setLoading(false);
    });
  }, [id, user?.id]);

  const handleSubmitDecision = async () => {
    if (!property) return;
    setSubmitting(true);
    setOutcomeMessage(null);

    let evidencePath: string | undefined;
    if (evidenceFile && user?.id) {
      const upload = await uploadPropertyDocumentBinary({
        userId: user.id,
        propertyId: property.id,
        file: evidenceFile,
      });
      if (upload.error || !upload.storagePath) {
        setSubmitting(false);
        setOutcomeMessage(
          `Evidence upload failed: ${upload.error || "Storage path was not returned"}`,
        );
        return;
      }
      const metadata = await savePropertyDocument({
        propertyId: property.id,
        name: evidenceFile.name,
        kind: "survey",
        storagePath: upload.storagePath,
      });
      if (metadata.error) {
        setSubmitting(false);
        setOutcomeMessage(`Evidence metadata failed: ${metadata.error}`);
        return;
      }
      evidencePath = upload.storagePath;
    }

    const res = await recordSurveyorDecision({
      propertyId: property.id,
      surveyorBoundary,
      decision,
      notes:
        fieldNotes.trim() ||
        (decision === "verified"
          ? "Field verification completed. Boundary corners conform to cadastral physical beacons."
          : "Discrepancy detected between claimed polygon and physical boundary."),
      fieldPhotos: evidencePath ? [evidencePath] : [],
    });

    setSubmitting(false);
    if (res.persisted) {
      setOutcomeMessage(
        `Survey decision recorded successfully: ${decision === "verified" ? "SURVEYOR VERIFIED" : "CORRECTION REQUIRED"}. Forwarded to Government review.`,
      );
      setTimeout(() => {
        navigate({ to: "/surveyor" });
      }, 2000);
    } else {
      setOutcomeMessage(`Failed to record decision: ${res.error || "Database error"}`);
    }
  };

  if (loading) {
    return (
      <AppShell
        title="Loading Field Assignment…"
        requiredRole={["surveyor", "government", "admin"]}
      >
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!property) {
    return (
      <AppShell title="Assignment Not Found" requiredRole={["surveyor", "government", "admin"]}>
        <div className="surface-card p-8 text-center max-w-md mx-auto my-12">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-semibold">Parcel Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Could not find an assigned property matching ID: {id}.
          </p>
          <Link to="/surveyor" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Back to Surveyor Workspace
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const stateArea = formatStateArea(property.area, property.stateCode || property.region);

  return (
    <AppShell
      title={`Field Survey: ${property.title}`}
      subtitle={`Passport ID: ${property.passportId} · ${property.address}, ${property.region}`}
      requiredRole={["surveyor", "government", "admin"]}
      actions={
        <div className="flex items-center gap-2">
          <Link to="/surveyor">
            <Button variant="outline" size="sm" className="rounded-full gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
            </Button>
          </Link>
        </div>
      }
    >
      <Crumbs
        items={[
          { label: "Surveyor", to: "/surveyor" },
          { label: "Assignments", to: "/surveyor/assignments" },
          { label: property.passportId },
        ]}
      />

      {outcomeMessage && (
        <div
          className={`mt-4 p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${outcomeMessage.includes("success") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 border-destructive/30 text-destructive"}`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{outcomeMessage}</span>
        </div>
      )}

      {/* Property Cadastral Summary Banner */}
      <div className="mt-4 rounded-xl border border-border bg-surface-elevated/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 font-mono text-[11px]"
            >
              {property.passportId}
            </Badge>
            <span className="text-sm font-semibold text-foreground">{property.title}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> {property.address}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-foreground">Area: {stateArea.displayText}</span>
            <Badge variant="outline" className="bg-surface text-[10px] uppercase font-mono">
              STATE: {property.stateCode || "KA"}
            </Badge>
          </div>
        </div>

        <div className="border-t border-border/50 pt-2 text-xs text-muted-foreground">
          <span>
            Assignment ID:{" "}
            <strong className="font-mono text-foreground">
              {String((property as any).assignmentId || "Unavailable")}
            </strong>
          </span>
          <span className="ml-4">
            Status:{" "}
            <strong className="text-foreground">
              {String((property as any).assignmentStatus || "assigned")}
            </strong>
          </span>
          <span className="ml-4">
            Assigned: {String((property as any).assignmentCreatedAt || "Unavailable")}
          </span>
        </div>

        {property.cadastralIdentifiers && Object.keys(property.cadastralIdentifiers).length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50 text-xs">
            {Object.entries(property.cadastralIdentifiers).map(([k, v]) => (
              <span
                key={k}
                className="bg-muted/50 px-2 py-0.5 rounded border border-border text-[11px]"
              >
                <strong className="text-muted-foreground capitalize">
                  {k.replace(/([A-Z])/g, " $1")}:
                </strong>{" "}
                <span className="font-mono font-medium text-foreground">{String(v)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Field Inspection & Boundary Editor Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Real Interactive MapLibre Boundary Canvas */}
        <div className="surface-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <span>Field Boundary Inspection</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect the Citizen Claimed Boundary. Adjust vertices to match physical ground
                survey markers if discrepancies exist.
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] uppercase font-bold"
            >
              Citizen Claimed: {property.boundary?.length || 0} pts
            </Badge>
          </div>

          <RealMap
            initialCenter={property.coords}
            boundary={surveyorBoundary}
            stateCode={property.stateCode || "KA"}
            boundaryLabel="SURVEYOR VERIFIED BOUNDARY"
            onChange={(newPts) => setSurveyorBoundary(newPts)}
            height={420}
          />
        </div>

        {/* Surveyor Attestation Form & Decision Submission */}
        <div className="surface-card p-5 space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Surveyor Attestation
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Field evidence attestation by authorized surveyor. Your submission will be recorded in
              the property provenance chain.
            </p>
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Survey Decision Outcome:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecision("verified")}
                className={`p-3 rounded-lg border text-left transition text-xs flex flex-col gap-1 ${decision === "verified" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500" : "border-border bg-surface text-muted-foreground hover:bg-muted"}`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>VERIFIED</span>
                </div>
                <span className="text-[10px] font-normal opacity-90">
                  Ground beacons match claimed polygon
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("correction_required")}
                className={`p-3 rounded-lg border text-left transition text-xs flex flex-col gap-1 ${decision === "correction_required" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold ring-1 ring-amber-500" : "border-border bg-surface text-muted-foreground hover:bg-muted"}`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>CORRECTION</span>
                </div>
                <span className="text-[10px] font-normal opacity-90">
                  Discrepancy found, ground adjusted
                </span>
              </button>
            </div>
          </div>

          {/* Field Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Field Observations & Beacons:
            </label>
            <Textarea
              id="surveyor-notes-input"
              rows={4}
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              placeholder="Record corner stone markers, physical boundary encroachments, or GPS accuracy readings…"
              className="text-xs"
            />
          </div>

          {/* Attached Field Deliverables */}
          <div className="space-y-2 border-t border-border pt-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-primary" />
              <span>Field Evidence Attached:</span>
            </span>
            <div className="space-y-1.5">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                className="block w-full text-xs text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground">
                Optional field evidence is uploaded to the assigned property’s Supabase Storage
                folder.
              </p>
            </div>
          </div>

          {/* Submit Decision Button */}
          <div className="pt-2">
            <Button
              id="btn-submit-survey-decision"
              onClick={handleSubmitDecision}
              disabled={submitting}
              className="w-full rounded-full gap-2 text-xs font-semibold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              <span>Submit Survey Decision to Government</span>
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Surveyor attestation does not replace official government title approval.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
