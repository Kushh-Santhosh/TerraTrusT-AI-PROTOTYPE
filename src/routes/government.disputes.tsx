import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill, KpiRow } from "@/components/ui-ext/Scaffold";
import { loadGovernmentReviewQueue } from "@/lib/property-repository";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/government/disputes")({
  head: () => ({ meta: [{ title: "Govt. disputes — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const [cases, setCases] = useState<Awaited<ReturnType<typeof loadGovernmentReviewQueue>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGovernmentReviewQueue().then((data) => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell
      title="Active Land Disputes Queue"
      subtitle="Inter-jurisdictional disputes and title challenges routed to revenue officers."
      requiredRole={["government", "admin"]}
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">DISPUTE DOCKET:</strong> Active mediation queue
        integrating surveyor Naksha verifications and Sub-Registrar records.
      </div>

      <KpiRow
        items={[
          { label: "Open cases", value: `${cases.length}`, hint: "Active review cases" },
          {
            label: "Pending properties",
            value: `${cases.filter((item) => item.status === "pending").length}`,
          },
          {
            label: "Verified cases",
            value: `${cases.filter((item) => item.status === "verified").length}`,
          },
          {
            label: "Disputed cases",
            value: `${cases.filter((item) => item.status === "disputed").length}`,
          },
        ]}
      />
      <div className="mt-6">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading review cases…</p>
        ) : cases.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No persisted Government review cases are open.
          </p>
        ) : (
          <DataTable
            rows={cases}
            columns={[
              {
                key: "id",
                label: "Case ID",
                render: (r) => (
                  <Link
                    to="/properties/$id/verify"
                    params={{ id: r.propertyId }}
                    className="font-mono text-xs hover:text-primary font-semibold"
                  >
                    {r.caseId}
                  </Link>
                ),
              },
              {
                key: "parcel",
                label: "Passport ID",
                render: (r) => <span className="font-mono text-xs">{r.passportId}</span>,
              },
              {
                key: "kind",
                label: "Review Reason",
                render: (r) => <span className="text-xs">{r.reason}</span>,
              },
              {
                key: "region",
                label: "Jurisdiction",
                render: (r) => <span className="text-muted-foreground text-xs">{r.region}</span>,
              },
              {
                key: "created",
                label: "Created",
                render: (r) => (
                  <span className="text-xs">
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </span>
                ),
              },
              {
                key: "s",
                label: "Status",
                render: (r) => (
                  <Pill
                    tone={
                      r.status === "verified"
                        ? "success"
                        : r.status === "disputed"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {r.status}
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
