import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill, KpiRow } from "@/components/ui-ext/Scaffold";
import { loadSurveyorAssignments } from "@/lib/property-repository";
import type { Property } from "@/lib/types";
import { useState, useEffect } from "react";
import { Briefcase, Loader2 } from "lucide-react";

export const Route = createFileRoute("/surveyor/assignments")({
  head: () => ({ meta: [{ title: "Surveyor Field Assignments — TerraTrust AI" }] }),
  component: SurveyorAssignmentsPage,
});

function SurveyorAssignmentsPage() {
  const [assignments, setAssignments] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveyorAssignments().then((props) => {
      setAssignments(props);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell
      title="Field Assignments"
      subtitle="Cadastral & boundary verification jobs dispatched to licensed surveyors from official registry queues."
      requiredRole={["surveyor", "admin"]}
    >
      <KpiRow
        items={[
          { label: "Active assignments", value: `${assignments.length}` },
          { label: "Due this week", value: `${Math.min(assignments.length, 3)}` },
          { label: "Avg. turnaround", value: "2.4d" },
          { label: "Survey quality rating", value: "4.95 / 5" },
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
              All submitted properties have been reviewed. New citizen submissions requiring field survey will appear here.
            </p>
          </div>
        ) : (
          <DataTable
            rows={assignments}
            columns={[
              {
                key: "passportId",
                label: "Parcel Passport",
                render: (r: Property) => (
                  <Link
                    to="/surveyor/assignments/$id"
                    params={{ id: r.id }}
                    className="font-medium text-primary hover:underline font-mono text-xs"
                  >
                    {r.passportId}
                  </Link>
                ),
              },
              { key: "title", label: "Property Title", render: (r: Property) => <span className="font-medium">{r.title}</span> },
              { key: "region", label: "Location", render: (r: Property) => <span className="text-muted-foreground text-xs">{r.address}, {r.region}</span> },
              {
                key: "area",
                label: "Claimed Area",
                render: (r: Property) => <span className="font-mono text-xs">{r.area?.toLocaleString()} m²</span>,
              },
              {
                key: "status",
                label: "Survey Status",
                render: (r: Property) => (
                  <Pill tone={r.surveyorDecision === "verified" ? "success" : r.surveyorDecision === "correction_required" ? "warning" : "info"}>
                    {r.surveyorDecision === "verified" ? "Surveyor Verified" : r.surveyorDecision === "correction_required" ? "Correction Required" : "Awaiting Survey"}
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
