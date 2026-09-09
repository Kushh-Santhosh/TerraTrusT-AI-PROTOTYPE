import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Field } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Mail, Banknote, Building2 } from "lucide-react";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { toast } from "sonner";

export const Route = createFileRoute("/properties/$id/share")({
  head: () => ({ meta: [{ title: "Share — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const shareUrl = `https://terratrust.ai/p/${id}/v/9F2A-1C7B`;

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    toast.success("Verifiable share link copied to clipboard!");
  };

  return (
    <AppShell
      title="Share Property Passport"
      subtitle="Issue a cryptographically verifiable share link or dispatch directly to an institution."
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: id, to: "/properties/$id" },
          { label: "Share" },
        ]}
      />
      <PropertySubNav propertyId={id} activeTab="share" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-6">
          <p className="font-display text-lg font-semibold text-foreground">
            Verifiable Share Link
          </p>
          <div className="flex gap-2">
            <Input readOnly value={shareUrl} className="font-mono text-xs" />
            <Button variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
          <Field label="Expires after">
            <Input defaultValue="7 days (configurable)" />
          </Field>
          <Field label="Access control">
            <Input defaultValue="View-only · redacts Aadhaar & personal contact info" />
          </Field>
        </div>
        <div className="surface-card space-y-3 p-6">
          <p className="font-display text-lg font-semibold text-foreground">
            Direct Institutional Dispatch
          </p>
          {[
            { icon: Banknote, name: "State Bank of India — Home Loan Underwriting" },
            { icon: Building2, name: "Bhoomi Revenue & Sub-Registrar Office" },
            { icon: Banknote, name: "HDFC Bank — Collateral Verification" },
            { icon: Mail, name: "Custom Official Email Address" },
          ].map((o) => (
            <button
              key={o.name}
              onClick={() => toast.success(`Passport package dispatched to ${o.name}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left text-sm hover:bg-muted/70 cursor-pointer transition"
            >
              <o.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-xs text-foreground">{o.name}</span>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
