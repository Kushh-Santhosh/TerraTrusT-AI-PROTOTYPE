import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Portal Removed — TerraTrust AI" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <AppShell
      title="Portal Unavailable"
      subtitle="The Community role and verification portal have been decommissioned."
    >
      <div className="surface-card max-w-xl p-8 text-center mx-auto my-12 border-destructive/30">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl text-foreground">Portal Decommissioned</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Community verification is no longer an active application role or portal in TerraTrust AI. All land verification, cadastral review, and collateral underwriting are handled through Citizen, Surveyor, Government, and Bank portals.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
