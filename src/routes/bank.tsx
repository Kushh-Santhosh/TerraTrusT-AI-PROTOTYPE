import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { KpiRow, Pill, DataTable } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { FileCheck2, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/bank")({
  head: () => ({ meta: [{ title: "Bank Underwriting Portal — TerraTrust AI" }] }),
  component: Page,
});

const pipeline = [
  { id: "MTG-7821", parcel: "KA-BLR-0412", borrower: "Vikram Malhotra", amount: "₹1.45 Cr", ltv: "65%", trust: 96, decision: "Approved" },
  { id: "MTG-7815", parcel: "MH-PUN-0891", borrower: "Sunita Sharma", amount: "₹2.20 Cr", ltv: "60%", trust: 92, decision: "Approved" },
  { id: "MTG-7809", parcel: "KA-MYS-0143", borrower: "Deepak Rao", amount: "₹65 Lakh", ltv: "70%", trust: 71, decision: "Review" },
  { id: "MTG-7795", parcel: "DL-GUR-0518", borrower: "Rajesh Singhania", amount: "₹4.10 Cr", ltv: "68%", trust: 42, decision: "Declined" },
];

function Page() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  if (pathname !== "/bank") return <Outlet />;

  return (
    <AppShell
      title="Bank origination & underwriting"
      subtitle="Underwriting dashboard of Property Passports shared with institutional lenders."
      requiredRole={["bank", "admin"]}
      actions={
        <Button asChild className="rounded-full">
          <Link to="/bank/loans">
            <FileCheck2 className="h-4 w-4 mr-1" /> Active Loan Book
          </Link>
        </Button>
      }
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">PROTOTYPE SAMPLE DATA:</strong> Simulated institutional mortgage underwriting queue for demonstration purposes.
      </div>

      <KpiRow
        items={[
          { label: "Active applications", value: "184" },
          { label: "Avg. underwrite time", value: "1.8d", hint: "↓ 32% YoY" },
          { label: "Auto-approved rate", value: "62%" },
          { label: "Portfolio underwritten", value: "₹248.5 Cr" },
        ]}
      />

      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Underwriting Pipeline</h3>
        <Link to="/bank/loans" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
          View full loan portfolio <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-3">
        <DataTable
          rows={pipeline}
          columns={[
            {
              key: "id",
              label: "Application",
              render: r => <span className="font-mono text-xs font-medium">{r.id}</span>,
            },
            {
              key: "p",
              label: "Parcel Passport",
              render: r => (
                <Link to="/properties" className="font-mono text-xs text-primary hover:underline">
                  {r.parcel}
                </Link>
              ),
            },
            { key: "b", label: "Borrower", render: r => <span className="font-medium">{r.borrower}</span> },
            { key: "a", label: "Amount", render: r => <span className="font-mono">{r.amount}</span> },
            { key: "ltv", label: "LTV", render: r => r.ltv },
            {
              key: "t",
              label: "Trust Score",
              render: r => (
                <Pill tone={r.trust > 85 ? "success" : r.trust > 65 ? "warning" : "danger"}>
                  {r.trust}/100
                </Pill>
              ),
            },
            {
              key: "d",
              label: "Decision",
              render: r => (
                <Pill tone={r.decision === "Approved" ? "success" : r.decision === "Review" ? "warning" : "danger"}>
                  {r.decision}
                </Pill>
              ),
            },
            {
              key: "action",
              label: "Action",
              render: r => (
                <Button asChild size="sm" variant="outline">
                  <Link to="/valuation">Valuate</Link>
                </Button>
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
