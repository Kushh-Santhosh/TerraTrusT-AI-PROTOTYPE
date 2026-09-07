import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { KpiRow } from "@/components/ui-ext/Scaffold";

export const Route = createFileRoute("/government/permits")({
  head: () => ({ meta: [{ title: "Permits — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell
      title="Municipal & Revenue Permits"
      subtitle="Construction approvals, subdivision layout permits, and land-use conversions."
      requiredRole={["government", "admin"]}
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">MUNICIPAL PERMITS DESK:</strong> Official workflow
        tracking municipal building plan sanctions, NA conversions, and subdivision clearances.
      </div>

      <KpiRow
        items={[
          { label: "Active permits", value: "0", hint: "Permit connector not configured" },
          { label: "Approved YTD", value: "0" },
          { label: "Avg. processing", value: "Not available" },
          { label: "Appeals pending", value: "0" },
        ]}
      />
      <div className="mt-6">
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          No authenticated BBMP/BDA permit connector is configured. This workspace does not
          fabricate permit records.
        </div>
      </div>
    </AppShell>
  );
}
