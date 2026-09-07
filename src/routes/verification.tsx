import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { properties } from "@/lib/mock-data";
import { CheckCircle2, XCircle, Users2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/verification")({
  head: () => ({ meta: [{ title: "Verification — TerraTrust AI" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const queue = properties.filter(p => p.status !== "verified");
  return (
    <AppShell title="Verification Status & Pipeline" subtitle="Cadastral registry validation, n8n verification runs, and automated compliance tracking.">
      <div className="grid gap-4 md:grid-cols-3">
        <Tile icon={ShieldCheck} v="18" l="Total Parcels Evaluated" />
        <Tile icon={CheckCircle2} v="94%" l="Cadastral Compliance Rate" />
        <Tile icon={Users2} v="15" l="Active In-Review Queue" />
      </div>

      <p className="mt-8 mb-3 text-sm font-medium text-foreground">Registry Verification Queue</p>
      <div className="grid gap-4">
        {queue.map(p => (
          <div key={p.id} className="surface-card flex flex-wrap items-center gap-4 p-5">
            <div className="flex-1 min-w-64">
              <div className="flex items-center gap-2"><p className="font-medium">{p.title}</p><StatusBadge status={p.status} /></div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.passportId} · {p.address}</p>
              <p className="mt-1 text-sm text-muted-foreground">Automated multi-layer verification via n8n orchestrator and cadastral GIS validation.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="rounded-full">
                <a href={`/properties/${p.id}/verify`}>
                  <ShieldCheck className="h-4 w-4 mr-1 text-primary" /> Inspect Verification
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Tile({ icon: Icon, v, l }: { icon: any; v: string; l: string }) {
  return (
    <div className="surface-card flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <div>
        <p className="font-display text-3xl">{v}</p>
        <p className="text-xs text-muted-foreground">{l}</p>
      </div>
    </div>
  );
}
