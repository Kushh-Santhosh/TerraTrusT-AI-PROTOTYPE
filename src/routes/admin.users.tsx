import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, KpiRow, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: Page,
});

const rows = [
  { name: "Ananya Sharma", email: "ananya@terratrust.ai", role: "Citizen", region: "Bengaluru", joined: "2024-03-12", status: "Active" },
  { name: "Arjun Nair", email: "arjun@surveyor.in", role: "Surveyor", region: "Bengaluru", joined: "2023-11-04", status: "Active" },
  { name: "Officer K. Rao", email: "krao@karnataka.gov.in", role: "Officer", region: "Bengaluru", joined: "2022-08-19", status: "Active" },
  { name: "Mediator J. Sharma", email: "jsharma@revenue.gov.in", role: "Verifier", region: "Gurugram", joined: "2024-01-22", status: "Active" },
  { name: "State Bank of India — Underwriting", email: "ops@sbi.co.in", role: "Bank", region: "National", joined: "2024-05-30", status: "Active" },
  { name: "Rajesh Verma", email: "rverma@example.com", role: "Citizen", region: "Gurugram", joined: "2024-09-05", status: "Suspended" },
];

function Page() {
  return (
    <AppShell title="Platform Users & Access Management" subtitle="184,221 demonstration users across 6 role workspaces." requiredRole="admin"
      actions={<Button className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Invite User</Button>}>
      
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">PROTOTYPE USER INVENTORY:</strong> Sample user directories showcasing multi-role access control (RBAC) across Citizen, Surveyor, Officer, Verifier, and Bank roles.
      </div>

      <KpiRow items={[
        { label: "Active users", value: "184k", hint: "Sample prototype count" },
        { label: "Empanelled surveyors", value: "1,402" },
        { label: "Revenue officers", value: "284" },
        { label: "Suspended accounts", value: "12" },
      ]} />
      <div className="mt-6">
        <DataTable rows={rows} columns={[
          { key: "u", label: "User", render: r => (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{r.name.split(" ").map(x => x[0]).join("").slice(0,2)}</AvatarFallback></Avatar>
              <div><p className="font-semibold text-xs text-foreground">{r.name}</p><p className="text-[11px] text-muted-foreground">{r.email}</p></div>
            </div>
          )},
          { key: "role", label: "Role", render: r => <Pill tone="info">{r.role}</Pill> },
          { key: "region", label: "Jurisdiction", render: r => <span className="text-muted-foreground text-xs">{r.region}</span> },
          { key: "joined", label: "Joined", render: r => <span className="text-muted-foreground text-xs">{r.joined}</span> },
          { key: "s", label: "Status", render: r => <Pill tone={r.status === "Active" ? "success" : "danger"}>{r.status}</Pill> },
        ]} />
      </div>
    </AppShell>
  );
}
