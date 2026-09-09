import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui-ext/StatCard";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MapMock } from "@/components/ui-ext/MapMock";
import { Building2, AlertTriangle, CheckCircle2, Search, FileText } from "lucide-react";
import {
  loadGovernmentMetrics,
  loadGovernmentReviewQueue,
  loadInstitutionalProperties,
} from "@/lib/property-repository";
import type { Property } from "@/lib/types";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/government/")({
  head: () => ({ meta: [{ title: "Government Workbench — TerraTrust AI" }] }),
  component: GovernmentPage,
});

interface ReviewItem {
  caseId: string;
  propertyId: string;
  passportId: string;
  title: string;
  status: string;
  trustScore: number;
  region: string;
  reason: string;
  createdAt: string;
}

function GovernmentPage() {
  const [metrics, setMetrics] = useState({
    totalParcels: 0,
    verifiedCount: 0,
    pendingCount: 0,
    disputedCount: 0,
    openReviewCount: 0,
  });
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);
  const [govProperties, setGovProperties] = useState<Property[]>([]);

  useEffect(() => {
    loadGovernmentMetrics().then(setMetrics);
    loadGovernmentReviewQueue().then(setReviewQueue);
    loadInstitutionalProperties().then(setGovProperties);
  }, []);

  const activeQueue = reviewQueue;
  const regions = Object.entries(
    govProperties.reduce<Record<string, { name: string; verified: number; pending: number }>>(
      (acc, property) => {
        const name = property.region || "Unknown";
        acc[name] ??= { name, verified: 0, pending: 0 };
        if (property.status === "verified") acc[name].verified += 1;
        if (property.status === "pending") acc[name].pending += 1;
        return acc;
      },
      {},
    ),
  ).map(([, value]) => value);

  const govKpis = [
    {
      label: "Total Parcels Registered",
      value: `${metrics.totalParcels}`,
      hint: "Authenticated Supabase registry",
    },
    {
      label: "Pending Verification",
      value: `${metrics.pendingCount}`,
      hint: "Awaiting field and document checks",
    },
    {
      label: "Cadastral Verified",
      value: `${metrics.verifiedCount}`,
      hint: "Active legal Property Passports",
    },
    {
      label: "Open Disputes / Review",
      value: `${metrics.openReviewCount}`,
      hint: "Requires officer resolution",
    },
  ];

  return (
    <AppShell
      title="Government Registry Workbench"
      subtitle="Cadastral registry health, verification review queue, and dispute resolution."
      requiredRole={["government", "admin"]}
      actions={
        <div className="flex items-center gap-2">
          <Link to="/reports">
            <Button variant="outline" className="rounded-full">
              <FileText className="h-4 w-4 mr-1" /> Export Audit Report
            </Button>
          </Link>
          <Link to="/government/parcels">
            <Button className="rounded-full">
              <Building2 className="h-4 w-4 mr-1" /> Registry Parcels
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {govKpis.map((k) => (
          <StatCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-foreground">Verified Parcels by State & Urban Cluster</p>
            <span className="text-xs text-muted-foreground">Updated in real-time</span>
          </div>
          <div className="mt-3 h-72">
            {regions.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No cadastral-verified parcels yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions}>
                  <CartesianGrid stroke="oklch(0.92 0.008 250)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "oklch(0.5 0.018 255)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "oklch(0.5 0.018 255)" }}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar
                    dataKey="verified"
                    stackId="a"
                    fill="oklch(0.45 0.08 195)"
                    radius={[6, 6, 0, 0]}
                    name="Verified"
                  />
                  <Bar
                    dataKey="pending"
                    stackId="a"
                    fill="oklch(0.78 0.13 75)"
                    radius={[6, 6, 0, 0]}
                    name="In Review"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="surface-card flex flex-col p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Dispute & Review Queue
            </p>
            <Link to="/government/disputes" className="text-xs text-primary hover:underline">
              All disputes
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-border">
            {activeQueue.slice(0, 5).map((p) => (
              <li key={p.caseId} className="py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {p.passportId} · {p.region}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Review case {p.caseId.slice(0, 8)} · {p.reason}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning-foreground font-medium">
                    Trust: {p.trustScore}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to="/properties/$id/verify" params={{ id: p.propertyId || p.passportId }}>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Search className="h-3 w-3 mr-1" /> Inspect evidence
                    </Button>
                  </Link>
                  <Link to="/properties/$id/verify" params={{ id: p.propertyId }}>
                    <Button size="sm" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Review decision
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
            {activeQueue.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No active disputes or open review cases in your state registry queue.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">National Cadastral Map View</p>
          <Link to="/map" className="text-xs text-primary hover:underline">
            Full screen map
          </Link>
        </div>
        <MapMock properties={govProperties} height={420} />
      </div>
    </AppShell>
  );
}
