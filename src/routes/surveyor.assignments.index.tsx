import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill, KpiRow } from "@/components/ui-ext/Scaffold";
import {
  loadSurveyorAssignments,
  type SurveyorAssignmentProperty,
} from "@/lib/property-repository";
import { useState, useEffect } from "react";
import { Briefcase, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/surveyor/assignments/")({
  head: () => ({ meta: [{ title: "Surveyor Field Assignments — TerraTrust AI" }] }),
  component: SurveyorAssignmentsPage,
});

function SurveyorAssignmentsPage() {
  const [assignments, setAssignments] = useState<SurveyorAssignmentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    loadSurveyorAssignments(user.id).then((props) => {
      setAssignments(props);
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <AppShell
      title="Field Assignments"
      subtitle="Cadastral & boundary verification jobs dispatched to licensed surveyors from official registry queues."
      requiredRole={["surveyor", "government", "admin"]}
    >
      <KpiRow
        items={[
          { label: "Active assignments", value: `${assignments.length}` },
          {
            label: "Submitted",
            value: `${assignments.filter((p) => p.assignmentStatus === "submitted").length}`,
          },
          {
            label: "Boundary reviews",
            value: `${assignments.filter((p) => p.boundary.length > 0).length}`,
          },
          {
            label: "Open issues",
            value: `${assignments.filter((p) => p.surveyorDecision === "correction_required").length}`,
          },
        ]}
      />
      <div className="mt-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="surface-card py-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-foreground">No Active Assignments</h3>
            <p className="text-xs text-muted-foreground mt-1">
              All submitted properties have been reviewed. New citizen submissions requiring field
              survey will appear here.
            </p>
          </div>
        ) : (
          <DataTable
            rows={assignments}
            columns={[
              {
                key: "passportId",
                label: "Parcel Passport",
                render: (r: SurveyorAssignmentProperty) => (
                  <Link
                    to="/surveyor/assignments/$id"
                    params={{ id: r.id }}
                    className="font-medium text-primary hover:underline font-mono text-xs"
                  >
                    {r.passportId}
                  </Link>
                ),
              },
              {
                key: "title",
                label: "Property Title",
                render: (r: SurveyorAssignmentProperty) => (
                  <span className="font-medium">{r.title}</span>
                ),
              },
              {
                key: "region",
                label: "Location",
                render: (r: SurveyorAssignmentProperty) => (
                  <span className="text-muted-foreground text-xs">
                    {r.address}, {r.region}
                  </span>
                ),
              },
              {
                key: "area",
                label: "Claimed Area",
                render: (r: SurveyorAssignmentProperty) => (
                  <span className="font-mono text-xs">{r.area?.toLocaleString()} m²</span>
                ),
              },
              {
                key: "status",
                label: "Survey Status",
                render: (r: SurveyorAssignmentProperty) => (
                  <Pill
                    tone={
                      r.surveyorDecision === "verified"
                        ? "success"
                        : r.surveyorDecision === "correction_required"
                          ? "warning"
                          : "info"
                    }
                  >
                    {r.surveyorDecision === "verified"
                      ? "Surveyor Verified"
                      : r.surveyorDecision === "correction_required"
                        ? "Correction Required"
                        : "Awaiting Survey"}
                  </Pill>
                ),
              },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}
