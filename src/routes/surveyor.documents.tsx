import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill } from "@/components/ui-ext/Scaffold";
import { FileText } from "lucide-react";
import { loadSurveyorAssignments } from "@/lib/property-repository";
import { useAuth } from "@/lib/auth";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/surveyor/documents")({
  head: () => ({ meta: [{ title: "Surveyor Document Review — TerraTrust AI" }] }),
  component: SurveyorDocumentsPage,
});

function SurveyorDocumentsPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadSurveyorAssignments(user.id).then((rows) => {
      setProperties(rows);
      setLoading(false);
    });
  }, [user?.id]);

  const documents = properties.flatMap((property) =>
    property.documents.map((document) => ({ property, document })),
  );

  return (
    <AppShell
      title="Document Review"
      subtitle="Inspect documents attached to your persisted field assignments."
      requiredRole="surveyor"
    >
      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading assigned documents…
        </p>
      ) : documents.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No persisted documents are attached to your assignments.
          </p>
        </div>
      ) : (
        <DataTable
          rows={documents}
          columns={[
            {
              key: "property",
              label: "Property",
              render: (row) => (
                <Link
                  to="/surveyor/assignments/$id"
                  params={{ id: row.property.id }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {row.property.passportId}
                </Link>
              ),
            },
            {
              key: "name",
              label: "Filename",
              render: (row) => <span className="text-sm">{row.document.name}</span>,
            },
            {
              key: "kind",
              label: "Type",
              render: (row) => <Pill tone="info">{row.document.kind}</Pill>,
            },
            {
              key: "date",
              label: "Uploaded",
              render: (row) => (
                <span className="text-xs text-muted-foreground">{row.document.uploadedAt}</span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Pill tone={row.document.verified ? "success" : "warning"}>
                  {row.document.verified ? "Verified" : "Pending"}
                </Pill>
              ),
            },
          ]}
        />
      )}
    </AppShell>
  );
}
