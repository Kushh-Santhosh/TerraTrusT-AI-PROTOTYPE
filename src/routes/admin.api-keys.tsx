import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/api-keys")({
  head: () => ({ meta: [{ title: "API keys — Admin" }] }),
  component: Page,
});

const rows = [
  { name: "Karnataka Bhoomi Revenue Sync", token: "tt_live_KA_8f9a…3c21", scopes: ["registry:read","registry:write"], created: "2024-01-12", last: "2024-09-25 12:08" },
  { name: "State Bank of India — Digital Lending", token: "tt_live_SBI_a112…44ee", scopes: ["passport:read"], created: "2024-05-30", last: "2024-09-25 14:01" },
  { name: "Haryana Jamabandi Authority", token: "tt_live_HR_77bc…21de", scopes: ["registry:read","disputes:write"], created: "2024-02-08", last: "2024-09-24 19:44" },
  { name: "National GeoSpatial Portal (NGP)", token: "tt_live_NGP_e221…9911", scopes: ["public:read"], created: "2024-07-04", last: "2024-09-25 13:50" },
];

function Page() {
  const copyToken = (tok: string) => {
    navigator.clipboard?.writeText(tok);
    toast.success("API token masked preview copied");
  };

  return (
    <AppShell title="Institutional API Tokens" subtitle="Tokens that grant secured programmatic integration to TerraTrust." requiredRole="admin"
      actions={<Button className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Create API Token</Button>}>
      
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">PROTOTYPE API REGISTRY:</strong> Mock key management interface for banking APIs and land registry sync webhooks.
      </div>

      <DataTable rows={rows} columns={[
        { key: "n", label: "Client Integration", render: r => <span className="font-semibold text-xs text-foreground">{r.name}</span> },
        { key: "t", label: "Token Key", render: r => <span onClick={() => copyToken(r.token)} className="flex items-center gap-1.5 font-mono text-xs cursor-pointer hover:text-primary">{r.token} <Copy className="h-3 w-3 text-muted-foreground" /></span> },
        { key: "s", label: "Scopes", render: r => <div className="flex flex-wrap gap-1">{r.scopes.map(s => <Pill key={s} tone="info">{s}</Pill>)}</div> },
        { key: "c", label: "Provisioned", render: r => <span className="text-muted-foreground text-xs">{r.created}</span> },
        { key: "l", label: "Last Active", render: r => <span className="text-muted-foreground text-xs">{r.last}</span> },
      ]} />
    </AppShell>
  );
}
