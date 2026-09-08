import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, DataTable, KpiRow, Pill } from "@/components/ui-ext/Scaffold";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/bank/loans")({
  head: () => ({ meta: [{ title: "Loan Book — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("bank_loan_applications")
      .select("id, property_id, applicant_name, requested_amount_inr, ltv_ratio, status, created_at, properties(passport_id)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLoans((data ?? []).map((loan) => ({
          id: loan.id,
          parcel: loan.properties?.passport_id ?? loan.property_id,
          borrower: loan.applicant_name,
          principal: `₹${Number(loan.requested_amount_inr).toLocaleString("en-IN")}`,
          outstanding: "Pending underwriting",
          rate: `${loan.ltv_ratio}% LTV`,
          status: loan.status === "underwriting_approved" ? "Approved" : loan.status,
          since: loan.created_at.slice(0, 10),
        })));
      });
  }, []);

  return (
    <AppShell
      title="Loan book"
      subtitle="Institutional mortgages secured by TerraTrust Property Passports."
      requiredRole={["bank", "admin"]}
    >
      <Crumbs items={[{ label: "Bank", to: "/bank" }, { label: "Loans" }]} />
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">INSTITUTIONAL MORTGAGE BOOK:</strong> Active institutional mortgages secured by verified TerraTrust Property Passports.
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
