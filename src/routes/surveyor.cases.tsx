import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill } from "@/components/ui-ext/Scaffold";
import { AlertTriangle } from "lucide-react";
import { loadSurveyorAssignments } from "@/lib/property-repository";
import { useAuth } from "@/lib/auth";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/surveyor/cases")({
  head: () => ({ meta: [{ title: "Surveyor Cases & Issues — TerraTrust AI" }] }),
  component: SurveyorCasesPage,
});

function SurveyorCasesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadSurveyorAssignments(user.id).then((rows) => {
      setProperties(
        rows.filter(
          (property) =>
            property.surveyorDecision === "correction_required" || property.status === "pending",
        ),
      );
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <AppShell
      title="Cases & Issues"
      subtitle="Boundary and evidence issues requiring action on your assigned properties."
      requiredRole="surveyor"
    >
      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading assigned cases…</p>
      ) : properties.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No open field issues are present in your assignments.
          </p>
        </div>
      ) : (
        <DataTable
          rows={properties}
          columns={[
            {
              key: "property",
              label: "Property",
              render: (row) => (
                <Link
                  to="/surveyor/assignments/$id"
                  params={{ id: row.id }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {row.passportId}
                </Link>
              ),
            },
            {
              key: "title",
              label: "Title",
              render: (row) => <span className="text-sm">{row.title}</span>,
            },
            {
              key: "reason",
              label: "Issue",
              render: (row) => (
                <span className="text-xs text-muted-foreground">
                  {row.surveyorNotes || "Field review required"}
                </span>
              ),
            },
            {
              key: "status",
              label: "Property Status",
              render: (row) => (
                <Pill tone={row.status === "disputed" ? "danger" : "warning"}>{row.status}</Pill>
              ),
            },
          ]}
        />
      )}
    </AppShell>
  );
}
