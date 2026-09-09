import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Layers, Calendar, Maximize2 } from "lucide-react";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { useState, useEffect } from "react";
import { getPropertyById } from "@/lib/property-repository";
import { properties as fallbackProperties } from "@/lib/mock-data";
import type { Property } from "@/lib/types";
import { MapMock } from "@/components/ui-ext/MapMock";

export const Route = createFileRoute("/properties/$id/satellite")({
  head: () => ({ meta: [{ title: "Satellite — TerraTrust AI" }] }),
  component: Page,
});

const snapshots = [
  { date: "2024-09-01", source: "Sentinel-2 (ISRO / ESA)", cloud: "3%" },
  { date: "2024-03-04", source: "Planet Labs High-Res", cloud: "0%" },
  { date: "2023-08-22", source: "Sentinel-2 Multi-Spectral", cloud: "8%" },
  { date: "2022-12-15", source: "Cartosat-3 Imagery", cloud: "1%" },
];

function Page() {
  const { id } = Route.useParams();
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    getPropertyById(id).then((p) => {
      if (p) {
        setProperty(p);
      } else {
        const found = fallbackProperties.find((item) => item.id === id);
        if (found) setProperty(found);
      }
    });
  }, [id]);

  const p = property || fallbackProperties.find((item) => item.id === id) || fallbackProperties[0];

  return (
    <AppShell
      title="Satellite Imagery"
      subtitle="Multi-temporal optical earth observation & vegetative change detection."
      actions={
        <>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-1" /> Compare Dates
          </Button>
          <Button>
            <Maximize2 className="h-4 w-4 mr-1" /> Full Screen
          </Button>
        </>
      }
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: p.title || id, to: `/properties/${id}` },
          { label: "Satellite" },
        ]}
      />
      <PropertySubNav propertyId={id} activeTab="satellite" />

      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">SATELLITE COMPARISON:</strong> Multi-epoch satellite
        scans for ground boundary alignment and encroachment monitoring.
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="surface-card relative h-[60vh] overflow-hidden rounded-xl border border-border">
          <MapMock properties={[p]} highlightId={p.id} height={500} />
          <div className="absolute right-4 top-4 z-10 flex gap-2 pointer-events-none">
            <Pill tone="info">
              <Layers className="h-3 w-3 inline mr-1" /> Sentinel-2 · 2024-09-01
            </Pill>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available Snapshots
          </p>
          {snapshots.map((s) => (
            <button
              key={s.date}
              className="surface-card w-full p-3 text-left transition hover:border-primary/50 cursor-pointer"
            >
              <p className="text-sm font-medium text-foreground">{s.date}</p>
              <p className="text-xs text-muted-foreground">
                {s.source} · cloud {s.cloud}
              </p>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
