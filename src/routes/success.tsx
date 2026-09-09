import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/success")({
  head: () => ({ meta: [{ title: "Success — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell title="Success" subtitle="Your Property Passport has been minted.">
      <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <div className="rounded-full bg-success/10 p-4 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-display text-3xl">All set — Property Passport is live</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Authoritative AI valuation and cadastral records have been synchronized with your
          portfolio.
        </p>
        <div className="mt-2 flex gap-2">
          <Link to="/properties">
            <Button>View My Properties</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
