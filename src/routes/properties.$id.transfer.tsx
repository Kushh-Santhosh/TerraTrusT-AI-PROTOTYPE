import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Field, Stepper } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { toast } from "sonner";

export const Route = createFileRoute("/properties/$id/transfer")({
  head: () => ({ meta: [{ title: "Transfer Property — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return (
    <AppShell title="Transfer Ownership" subtitle="Initiate title conveyance or partition with registry verification.">
      <Crumbs items={[{ label: "Properties", to: "/properties" }, { label: id, to: "/properties/$id" }, { label: "Transfer" }]} />
      <PropertySubNav propertyId={id} activeTab="transfer" />

      <Stepper steps={["Recipient", "Terms & Stamp Duty", "E-Sign", "Sub-Registrar Sync"]} current={1} />
      <div className="surface-card grid gap-4 p-6 md:grid-cols-2 mt-4">
        <Field label="Recipient registered email / phone">
          <Input placeholder="buyer@terratrust.ai" />
        </Field>
        <Field label="Recipient legal name (as per Aadhaar/PAN)">
          <Input placeholder="Kushal Santhosh" />
        </Field>
        <Field label="Conveyance type">
          <Input defaultValue="Registered Sale Deed" />
        </Field>
        <Field label="Agreed price (₹ INR)">
          <Input defaultValue="₹2,40,00,000" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Conveyance notes & stamp duty details">
            <Textarea rows={3} placeholder="Sub-registrar jurisdiction, token advance, stamp duty challan number…" />
          </Field>
        </div>
        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
          <Link to="/properties/$id" params={{ id }}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={() => toast.success("Draft conveyance initiated. Recipient notified for e-KYC.")}>
            Send for Recipient Signature
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
