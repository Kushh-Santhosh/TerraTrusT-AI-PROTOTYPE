import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, KpiRow } from "@/components/ui-ext/Scaffold";
import { loadGovernmentAuditLogs } from "@/lib/property-repository";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/government/audit")({
  head: () => ({ meta: [{ title: "Audit Trail — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof loadGovernmentAuditLogs>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGovernmentAuditLogs().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell
      title="Audit trail"
      subtitle="Cryptographic, immutable ledger of every officer and AI engine event on the cadastre."
      requiredRole={["government", "admin"]}
    >
      <KpiRow
        items={[
          { label: "Visible ledger entries", value: `${rows.length}` },
          {
            label: "Officer events",
            value: `${rows.filter((row) => row.actor_role === "government").length}`,
          },
          {
            label: "AI/system events",
            value: `${rows.filter((row) => row.actor_role === "system").length}`,
          },
          { label: "Integrity anomalies", value: "Not configured" },
        ]}
      />
      <div className="mt-6">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading audit events…</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No Government-visible audit events are persisted.
          </p>
        ) : (
          <DataTable
            rows={rows}
            columns={[
              {
                key: "at",
                label: "Timestamp (IST)",
                render: (r) => (
                  <span className="font-mono text-xs">
                    {new Date(r.created_at).toLocaleString("en-IN")}
                  </span>
                ),
              },
              {
                key: "actor",
                label: "Actor",
                render: (r) => <span className="font-medium">{r.actor_role || "system"}</span>,
              },
              {
                key: "action",
                label: "Action Logged",
                render: (r) => r.action || r.event || r.detail || "Recorded event",
              },
              {
                key: "target",
                label: "Target Entity",
                render: (r) => (
                  <span className="font-mono text-xs">{r.property_id || "platform"}</span>
                ),
              },
              {
                key: "ip",
                label: "Source",
                render: (r) => <span className="text-muted-foreground">Audit log</span>,
              },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}
