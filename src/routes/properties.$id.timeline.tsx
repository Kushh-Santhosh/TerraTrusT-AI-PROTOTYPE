import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Pill } from "@/components/ui-ext/Scaffold";
import { Briefcase, ShieldCheck, Sparkles, Users2, Building2 } from "lucide-react";
import { PropertySubNav } from "@/components/property/PropertySubNav";

export const Route = createFileRoute("/properties/$id/timeline")({
  head: () => ({ meta: [{ title: "Timeline — TerraTrust AI" }] }),
  component: Page,
});

const events = [
  { at: "2024-09-20", role: "officer", icon: Building2, actor: "Bengaluru Urban Revenue Office", text: "Annual Bhoomi registry sync confirmed registered boundary and title." },
  { at: "2024-08-19", role: "citizen", icon: Sparkles, actor: "Ananya Sharma", text: "Uploaded BBMP Property Tax Receipt 2024-25." },
  { at: "2024-04-02", role: "verifier", icon: Users2, actor: "Indiranagar Ward Committee", text: "Received 5 neighborhood community attestations." },
  { at: "2024-03-20", role: "officer", icon: ShieldCheck, actor: "Karnataka Land Revenue Department", text: "Ownership confirmed on official registry — trust score raised to 96." },
  { at: "2024-03-15", role: "surveyor", icon: Briefcase, actor: "Surveyor Arjun Nair", text: "Cadastral boundary uploaded and verified (±0.4m tolerance)." },
  { at: "2024-03-15", role: "admin", icon: Sparkles, actor: "TerraTrust AI", text: "Initial AI valuation generated — ₹2.15 Cr." },
  { at: "2019-06-14", role: "citizen", icon: Sparkles, actor: "Ananya Sharma", text: "Property acquired via Registered Sale Deed and enrolled in TerraTrust." },
];

function Page() {
  const { id } = Route.useParams();
  return (
    <AppShell title="Property Timeline" subtitle="Immutable audit trail of registrations, surveyor audits, and revenue attestations.">
      <Crumbs items={[{ label: "Properties", to: "/properties" }, { label: id, to: "/properties/$id" }, { label: "Timeline" }]} />
      <PropertySubNav propertyId={id} activeTab="timeline" />

      <div className="surface-card p-6">
        <ol className="relative ml-2 space-y-6 border-l border-border pl-6">
          {events.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full bg-primary/10 ring-4 ring-background">
                <e.icon className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm text-foreground">{e.actor}</p>
                <Pill tone="info">{e.role}</Pill>
                <span className="text-xs text-muted-foreground">{e.at}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{e.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </AppShell>
  );
}
