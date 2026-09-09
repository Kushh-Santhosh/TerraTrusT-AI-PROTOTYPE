import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { KpiRow, Pill, DataTable } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { FileCheck2, ArrowUpRight, ShieldCheck } from "lucide-react";
import {
  loadBankAuthorizedProperties,
  loadBankEligibleProperties,
} from "@/lib/property-repository";
import type { Property } from "@/lib/types";
import { useState, useEffect } from "react";
import { recordBankLoanApplication } from "@/lib/supabase-persistence";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/bank/")({
  head: () => ({ meta: [{ title: "Bank Underwriting Portal — TerraTrust AI" }] }),
  component: BankPage,
});

function formatInr(val: number): string {
  if (!val) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function BankPage() {
  const [authorizedProps, setAuthorizedProps] = useState<Property[]>([]);
  const [eligibleProps, setEligibleProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loanCount, setLoanCount] = useState(0);
  const [approvedLoanCount, setApprovedLoanCount] = useState(0);
  const [portfolioUnderwritten, setPortfolioUnderwritten] = useState(0);

  // Loan origination modal state
  const [selectedPropForLoan, setSelectedPropForLoan] = useState<Property | null>(null);
  const [loanAmount, setLoanAmount] = useState<number>(15000000);
  const [lendingBank, setLendingBank] = useState<string>("State Bank of India");
  const [loanNotes, setLoanNotes] = useState<string>("");
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

  useEffect(() => {
    Promise.all([
      loadBankAuthorizedProperties(),
      loadBankEligibleProperties(),
      supabase.from("bank_loan_applications").select("requested_amount_inr, status"),
    ]).then(([authorized, eligible, loans]) => {
      setAuthorizedProps(authorized);
      setEligibleProps(eligible);
      const rows = loans.data ?? [];
      setLoanCount(rows.length);
      setApprovedLoanCount(rows.filter((loan) => loan.status === "underwriting_approved").length);
      setPortfolioUnderwritten(
        rows
          .filter((loan) => loan.status === "underwriting_approved")
          .reduce((sum, loan) => sum + Number(loan.requested_amount_inr || 0), 0),
      );
      setLoading(false);
    });
  }, []);

  const totalValue = eligibleProps.reduce((sum, p) => sum + p.valuation, 0);

  // Generate pipeline tied directly to real verified properties in Supabase
  const pipeline = eligibleProps.map((p) => ({
    id: null,
    propertyId: p.id,
    parcel: p.passportId,
    title: p.title,
    borrower: p.owner || "Authenticated Property Owner",
    amount: formatInr(p.valuation),
    ltv: "65%",
    trust: p.trustScore,
    decision: "Eligible",
  }));

  const eligibleIds = new Set(eligibleProps.map((property) => property.id));
  const eligibilityReason = (property: Property) => {
    if (eligibleIds.has(property.id)) return "Eligible for underwriting";
    if (property.status === "disputed") return "Not eligible — Review case open";
    if (property.governmentDecision !== "approved") {
      return "Not eligible — Government verification pending";
    }
    if (property.surveyorDecision !== "verified") {
      return "Not eligible — Surveyor verification pending";
    }
    if (!property.documents.length || !property.documents.every((document) => document.verified)) {
      return "Not eligible — Required documents pending";
    }
    if (!property.valuation) return "Not eligible — Required valuation unavailable";
    return "Not eligible — Verification requirements incomplete";
  };

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
        <strong className="text-foreground">INSTITUTIONAL LENDING:</strong> Underwriting queue
        powered by authoritative Supabase Property Passports and live n8n AI valuations.
      </div>

      <KpiRow
        items={[
          { label: "Eligible Passports", value: `${eligibleProps.length}` },
          {
            label: "Avg. underwrite time",
            value: "—",
            hint: loanCount ? "Insufficient timestamp data" : "No completed underwriting cases yet",
          },
          {
            label: "Auto-approved rate",
            value: loanCount ? `${Math.round((approvedLoanCount / loanCount) * 100)}%` : "—",
          },
          { label: "Portfolio underwritten", value: formatInr(portfolioUnderwritten) },
        ]}
      />

      <div className="mt-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Property Intelligence</h3>
          <p className="text-xs text-muted-foreground">
            {authorizedProps.length} authorized property records · {eligibleProps.length} currently
            eligible for underwriting
          </p>
        </div>
        <Link to="/search" className="text-sm font-medium text-primary hover:underline">
          Search all properties
        </Link>
      </div>

      <div className="mt-3">
        {loading ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Loading authorized Property Passports…
          </p>
        ) : authorizedProps.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">No authorized property records found.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Property intelligence appears here from the canonical Supabase registry.
            </p>
          </div>
        ) : (
          <DataTable
            rows={authorizedProps}
            columns={[
              {
                key: "property",
                label: "Property / Passport",
                render: (property) => (
                  <Link
                    to="/properties/$id"
                    params={{ id: property.id }}
                    className="block font-medium text-primary hover:underline"
                  >
                    {property.title}
                    <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                      {property.passportId}
                    </span>
                  </Link>
                ),
              },
              {
                key: "location",
                label: "Location",
                render: (property) => `${property.region}, ${property.country}`,
              },
              {
                key: "area",
                label: "Area",
                render: (property) => `${property.area.toLocaleString()} m²`,
              },
              {
                key: "verification",
                label: "Verification",
                render: (property) => (
                  <Pill tone={property.status === "verified" ? "success" : "warning"}>
                    {property.status}
                  </Pill>
                ),
              },
              {
                key: "trust",
                label: "Trust",
                render: (property) => `${property.trustScore}/100`,
              },
              {
                key: "valuation",
                label: "Indicative valuation",
                render: (property) =>
                  property.valuation ? formatInr(property.valuation) : "Not available",
              },
              {
                key: "eligibility",
                label: "Eligibility",
                render: (property) => (
                  <Pill tone={eligibleIds.has(property.id) ? "success" : "warning"}>
                    {eligibilityReason(property)}
                  </Pill>
                ),
              },
            ]}
          />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Underwriting Pipeline</h3>
        <Link
          to="/bank/loans"
          className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          View full loan portfolio <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-3">
        {loading ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Loading eligible Property Passports…
          </p>
        ) : pipeline.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-medium text-foreground">No eligible verified properties found.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Properties must be fully verified and receive an authoritative valuation to appear in
              the bank underwriting book.
            </p>
          </div>
        ) : (
          <DataTable
            rows={pipeline}
            columns={[
              {
                key: "id",
                label: "Application",
                render: (r) => (
                  <span className="font-mono text-xs font-medium">{r.id ?? "Not originated"}</span>
                ),
              },
              {
                key: "p",
                label: "Parcel Passport",
                render: (r) => (
                  <Link
                    to="/properties/$id"
                    params={{ id: r.propertyId }}
                    className="font-mono text-xs text-primary hover:underline font-semibold"
                  >
                    {r.parcel}
                  </Link>
                ),
              },
              {
                key: "t",
                label: "Property Title",
                render: (r) => <span className="font-medium">{r.title}</span>,
              },
              {
                key: "b",
                label: "Borrower",
                render: (r) => <span className="text-muted-foreground text-xs">{r.borrower}</span>,
              },
              {
                key: "a",
                label: "Authoritative Valuation",
                render: (r) => (
                  <span className="font-mono font-medium text-primary">{r.amount}</span>
                ),
              },
              { key: "ltv", label: "LTV", render: (r) => r.ltv },
              {
                key: "trust",
                label: "Trust Score",
                render: (r) => (
                  <Pill tone={r.trust > 85 ? "success" : r.trust > 65 ? "warning" : "danger"}>
                    {r.trust}/100
                  </Pill>
                ),
              },
              {
                key: "d",
                label: "Decision",
                render: (r) => (
                  <Pill tone={r.decision === "Eligible" ? "success" : "warning"}>{r.decision}</Pill>
                ),
              },
              {
                key: "action",
                label: "Actions",
                render: (r) => (
                  <div className="flex items-center gap-1.5">
                    <Button asChild size="sm" variant="outline" className="text-xs h-7">
                      <Link to="/properties/$id/verify" params={{ id: r.propertyId }}>
                        Inspect Passport
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-7 bg-primary text-primary-foreground"
                      onClick={() => {
                        const target = eligibleProps.find((p) => p.id === r.propertyId);
                        if (target) {
                          setSelectedPropForLoan(target);
                          setLoanAmount(Math.round(target.valuation * 0.65));
                        }
                      }}
                    >
                      Originate Loan
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* Loan Origination Dialog */}
      {selectedPropForLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="surface-card w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-border">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Originate Institutional Mortgage Loan
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Secured by Verified Digital Property Passport ({selectedPropForLoan.passportId})
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedPropForLoan(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Verified Property & Legal Owner
                </label>
                <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-1">
                  <p className="font-medium text-foreground">{selectedPropForLoan.title}</p>
                  <p className="text-muted-foreground font-mono">
                    Owner: {selectedPropForLoan.owner} · Valuation:{" "}
                    {formatInr(selectedPropForLoan.valuation)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Lending Institution
                  </label>
                  <select
                    value={lendingBank}
                    onChange={(e) => setLendingBank(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground"
                  >
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="HDFC Bank Institutional">HDFC Bank Institutional</option>
                    <option value="ICICI Bank Mortgages">ICICI Bank Mortgages</option>
                    <option value="Axis Bank Secured Lending">Axis Bank Secured Lending</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Requested Loan Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs font-mono text-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    {formatInr(loanAmount)} (65% LTV)
                  </p>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Underwriting Assessment Notes
                </label>
                <textarea
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="e.g., Clean title verified via Government Registry and Bhoomi/Kaveri checks. GIS boundary verified by surveyor. Collateral approved."
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[64px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPropForLoan(null)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmittingLoan}
                  onClick={async () => {
                    setIsSubmittingLoan(true);
                    const res = await recordBankLoanApplication({
                      propertyId: selectedPropForLoan.id,
                      bankName: lendingBank,
                      requestedAmountInr: loanAmount,
                      ltvRatio: 65,
                      applicantName: selectedPropForLoan.owner,
                      notes: loanNotes,
                    });
                    setIsSubmittingLoan(false);

                    if (res.error) {
                      toast.error(`Loan origination failed: ${res.error}`);
                    } else {
                      toast.success(
                        `Loan request of ${formatInr(loanAmount)} submitted against ${selectedPropForLoan.passportId}.`,
                      );
                      setSelectedPropForLoan(null);
                    }
                  }}
                  className="rounded-full text-xs bg-primary text-primary-foreground"
                >
                  {isSubmittingLoan ? "Persisting to Supabase…" : "Submit for Underwriting"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
