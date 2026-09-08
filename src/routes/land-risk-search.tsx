import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { loadOwnedProperties, loadPropertyById, loadPropertyVerification } from "@/lib/property-repository";
import { getRiskIndicators } from "@/lib/property-intel";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/land-risk-search")({
  head: () => ({ meta: [{ title: "Land Risk Search — TerraTrust AI" }] }),
  component: LandRiskSearch,
});

function LandRiskSearch() {
  const { user } = useAuth();
  const { propertyId } = Route.useSearch() as { propertyId?: string };
  const [query, setQuery] = useState(propertyId ?? "");
  const [property, setProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [risk, setRisk] = useState<number | null>(null);
  const [verification, setVerification] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) void search(propertyId);
  }, [propertyId]);

  async function search(value = query) {
    setMessage(null);
    setProperty(null);
    if (!user?.id || !value.trim()) return;
    const owned = await loadOwnedProperties(user.id);
    const selected = owned.find((item) => item.id === value || item.passportId.toLowerCase() === value.trim().toLowerCase());
    if (!selected) {
      setMessage("No property found.");
      return;
    }
    const authoritative = await loadPropertyById(selected.id);
    if (!authoritative) {
      setMessage("No property found.");
      return;
    }
    const result = await loadPropertyVerification(authoritative.id);
    const payload = result?.result as Record<string, unknown> | undefined;
    setProperty(authoritative);
    setRisk(typeof payload?.riskScore === "number" ? payload.riskScore : Math.round(getRiskIndicators(authoritative).reduce((sum, item) => sum + item.score, 0) / 6));
    setVerification(typeof payload?.status === "string" ? payload.status : authoritative.status);
  }

  return (
    <AppShell title="Search Land Risk" subtitle="Check the verification and risk status of a property." requiredRole="citizen">
      <div className="surface-card flex flex-col gap-3 p-5 sm:flex-row">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by Passport ID or property ID" />
        <Button onClick={() => void search() }><Search className="mr-1.5 h-4 w-4" /> Search</Button>
      </div>
      {message && <p className="mt-5 rounded-lg border border-border p-5 text-sm text-muted-foreground">{message}</p>}
      {property && (
        <div className="surface-card mt-5 space-y-5 p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-muted-foreground">Property</p><p className="font-mono text-lg font-semibold">{property.passportId}</p></div>{verification === "verified" ? <ShieldCheck className="h-6 w-6 text-success" /> : <ShieldAlert className="h-6 w-6 text-warning" />}</div>
          <div className="grid gap-4 sm:grid-cols-3"><Metric label="Verification" value={verification === "manual_review" ? "Manual Review" : verification ?? "Pending"} /><Metric label="Trust Score" value={`${property.trustScore} / 100`} /><Metric label="Risk Score" value={risk == null ? "Unavailable" : `${risk} / 100`} /></div>
          <Link to="/properties/$id" params={{ id: property.id }}><Button variant="outline">View Property</Button></Link>
        </div>
      )}
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-muted/40 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>; }