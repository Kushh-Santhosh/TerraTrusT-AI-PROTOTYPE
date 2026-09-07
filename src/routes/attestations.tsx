import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/attestations")({
  head: () => ({ meta: [{ title: "Attestations — TerraTrust AI" }] }),
  component: AttestationsPage,
});

function AttestationsPage() {
  return (
    <AppShell
      title="Attestations Decommissioned"
      subtitle="Community attestations have been replaced by surveyor and cadastral registry verification."
    >
      <div className="surface-card max-w-xl p-8 text-center mx-auto my-12 border-destructive/30">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl text-foreground">Section Unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Community attestations are no longer used in TerraTrust AI. Property verification is orchestrated with institutional cadastral registries and licensed field surveyors.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link to="/verification">Go to Verification Hub</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
