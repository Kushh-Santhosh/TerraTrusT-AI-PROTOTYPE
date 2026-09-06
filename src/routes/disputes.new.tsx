import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Field, Stepper } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/disputes/new")({
  head: () => ({ meta: [{ title: "File Dispute — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="File a Land Dispute" subtitle="Submit a formal tenure challenge or boundary overlap claim with evidentiary documents.">
      <Crumbs items={[{ label: "Disputes", to: "/disputes" }, { label: "New Filing" }]} />
      <Stepper steps={["Property & Survey", "Claim Details", "Evidentiary Documents", "Collectorate Review"]} current={1} />
      <div className="surface-card space-y-4 p-6 mt-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Target property"><Input defaultValue="TT-5512-GG — Gurugram Commercial Plot" /></Field>
          <Field label="Dispute category"><Input defaultValue="Survey boundary & deed overlap" /></Field>
        </div>
        <Field label="Detailed statement" hint="Describe the dispute clearly. Revenue mediators and survey officials will review this evidentiary record.">
          <Textarea rows={5} defaultValue="An unverified party presented a duplicate agreement to sell claiming the same survey plot at Sector 29, Gurugram. The claimed boundary overlaps with my registered cadastral naksha by 38%." />
        </Field>
        <Field label="Counter-party legal name / identifier (if known)"><Input placeholder="Legal name or registered PAN / Aadhaar" /></Field>
        <div className="flex justify-end gap-2">
          <Link to="/disputes"><Button variant="outline">Cancel</Button></Link>
          <Button>Continue to Evidentiary Uploads</Button>
        </div>
      </div>
    </AppShell>
  );
}
