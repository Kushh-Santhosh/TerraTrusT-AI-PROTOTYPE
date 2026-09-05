import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, KpiRow } from "@/components/ui-ext/Scaffold";

export const Route = createFileRoute("/government/audit")({
  head: () => ({ meta: [{ title: "Audit Trail — TerraTrust AI" }] }),
  component: Page,
});

const rows = [
  { at: "2024-09-25 14:21", actor: "Officer V. Rao", action: "Approved Khata mutation permit PMT-44021", target: "KA-BLR-0412", ip: "103.21.x.x" },
  { at: "2024-09-25 13:08", actor: "TerraTrust AI Engine", action: "Flagged duplicate encumbrance deed", target: "DL-GUR-0518", ip: "system" },
  { at: "2024-09-25 11:42", actor: "Tehsildar P. Joshi", action: "Reassigned boundary dispute to land surveyor", target: "D-3318", ip: "103.21.x.x" },
  { at: "2024-09-24 16:30", actor: "Officer S. Patil", action: "Bulk sync 1,402 Bhoomi survey entries", target: "Karnataka State", ip: "103.21.x.x" },
  { at: "2024-09-24 09:15", actor: "Admin Operator", action: "Granted licensed surveyor credential", target: "u_8821", ip: "103.21.x.x" },
];

function Page() {
  return (
    <AppShell
      title="Audit trail"
      subtitle="Cryptographic, immutable ledger of every officer and AI engine event on the cadastre."
      requiredRole={["government", "admin"]}
    >
      <KpiRow
        items={[
          { label: "Ledger entries today", value: "1,284" },
          { label: "Officers active", value: "62" },
          { label: "AI validation events", value: "9,184" },
          { label: "Integrity anomalies", value: "0" },
        ]}
      />
      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={[
            { key: "at", label: "Timestamp (IST)", render: r => <span className="font-mono text-xs">{r.at}</span> },
            { key: "actor", label: "Actor", render: r => <span className="font-medium">{r.actor}</span> },
            { key: "action", label: "Action Logged", render: r => r.action },
            { key: "target", label: "Target Entity", render: r => <span className="font-mono text-xs">{r.target}</span> },
            { key: "ip", label: "IP / Source", render: r => <span className="text-muted-foreground">{r.ip}</span> },
          ]}
        />
      </div>
    </AppShell>
  );
}
