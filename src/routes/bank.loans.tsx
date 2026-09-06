import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, DataTable, KpiRow, Pill } from "@/components/ui-ext/Scaffold";

export const Route = createFileRoute("/bank/loans")({
  head: () => ({ meta: [{ title: "Loan Book — TerraTrust AI" }] }),
  component: Page,
});

const loans = [
  { id: "LN-2241", parcel: "KA-BLR-0412", borrower: "Vikram Malhotra", principal: "₹1,45,00,000", outstanding: "₹1,32,00,000", rate: "8.75%", status: "Performing", since: "2024-04-12" },
  { id: "LN-2238", parcel: "MH-PUN-0891", borrower: "Sunita Sharma", principal: "₹2,20,00,000", outstanding: "₹1,98,40,000", rate: "8.90%", status: "Performing", since: "2024-03-30" },
  { id: "LN-2210", parcel: "KA-MYS-0143", borrower: "Deepak Rao", principal: "₹65,00,000", outstanding: "₹59,20,000", rate: "9.15%", status: "Performing", since: "2024-02-12" },
  { id: "LN-2188", parcel: "DL-GUR-0518", borrower: "Rajesh Singhania", principal: "₹4,10,00,000", outstanding: "₹3,88,00,000", rate: "8.65%", status: "Watch", since: "2023-12-04" },
  { id: "LN-2104", parcel: "KA-BLR-0992", borrower: "Anil Kulkarni", principal: "₹85,00,000", outstanding: "₹79,12,000", rate: "9.50%", status: "Default", since: "2023-08-19" },
];

function Page() {
  return (
    <AppShell
      title="Loan book"
      subtitle="Institutional mortgages secured by TerraTrust Property Passports."
      requiredRole={["bank", "admin"]}
    >
      <Crumbs items={[{ label: "Bank", to: "/bank" }, { label: "Loans" }]} />
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">PROTOTYPE SAMPLE DATA:</strong> Simulated institutional mortgage loan book for demonstration purposes.
      </div>
      <KpiRow
        items={[
          { label: "Total Outstanding", value: "₹248.5 Cr" },
          { label: "Performing", value: "94.1%" },
          { label: "On watch", value: "4.3%" },
          { label: "In default", value: "1.6%" },
        ]}
      />
      <div className="mt-6">
        <DataTable
          rows={loans}
          columns={[
            { key: "id", label: "Loan ID", render: r => <span className="font-mono text-xs font-medium">{r.id}</span> },
            { key: "p", label: "Parcel ID", render: r => <span className="font-mono text-xs">{r.parcel}</span> },
            { key: "b", label: "Borrower", render: r => <span className="font-medium">{r.borrower}</span> },
            { key: "pr", label: "Principal", render: r => <span className="font-mono">{r.principal}</span> },
            { key: "os", label: "Outstanding", render: r => <span className="font-mono">{r.outstanding}</span> },
            { key: "rate", label: "Interest Rate", render: r => r.rate },
            {
              key: "s",
              label: "Status",
              render: r => (
                <Pill tone={r.status === "Performing" ? "success" : r.status === "Watch" ? "warning" : "danger"}>
                  {r.status}
                </Pill>
              ),
            },
            { key: "sn", label: "Origination Date", render: r => <span className="text-muted-foreground">{r.since}</span> },
          ]}
        />
      </div>
    </AppShell>
  );
}
