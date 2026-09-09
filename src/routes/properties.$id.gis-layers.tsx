import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Pill } from "@/components/ui-ext/Scaffold";
import { useState, useEffect } from "react";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { getPropertyById } from "@/lib/property-repository";
import { properties as fallbackProperties } from "@/lib/mock-data";
import type { Property } from "@/lib/types";
import { MapMock } from "@/components/ui-ext/MapMock";

export const Route = createFileRoute("/properties/$id/gis-layers")({
  head: () => ({ meta: [{ title: "GIS Layers — TerraTrust AI" }] }),
  component: Page,
});

const layers = [
  {
    name: "Cadastral parcels",
    source: "Karnataka Bhoomi / Revenue Dept",
    on: true,
    color: "oklch(0.55 0.18 250)",
  },
  {
    name: "Zoning (residential)",
    source: "BMRDA / BBMP Master Plan 2031",
    on: true,
    color: "oklch(0.65 0.18 60)",
  },
  {
    name: "Flood risk overlay",
    source: "NDMA / CWC Flood Atlas",
    on: false,
    color: "oklch(0.55 0.18 30)",
  },
  {
    name: "Power grid proximity",
    source: "BESCOM 11kV Feeder Network",
    on: true,
    color: "oklch(0.7 0.16 90)",
  },
  { name: "Road network", source: "OpenStreetMap India", on: true, color: "oklch(0.4 0.02 250)" },
  {
    name: "Schools & Colleges (1km)",
    source: "Karnataka Dept of School Education",
    on: false,
    color: "oklch(0.6 0.16 200)",
  },
  {
    name: "Hospitals (3km)",
    source: "National Health Portal India",
    on: false,
    color: "oklch(0.6 0.18 350)",
  },
];

function Page() {
  const { id } = Route.useParams();
  const [state, setState] = useState(layers);
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
      title="GIS Layers"
      subtitle="Toggle spatial data overlays and inspect parcel surroundings."
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: p.title || id, to: `/properties/${id}` },
          { label: "GIS Layers" },
        ]}
      />
      <PropertySubNav propertyId={id} activeTab="gis-layers" />

      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">CADASTRAL GIS LAYERS:</strong> Indian municipal zoning,
        survey parcel grids, and infrastructure overlays.
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="surface-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Spatial Overlays
          </p>
          <div className="mt-3 space-y-2">
            {state.map((l, i) => (
              <label
                key={l.name}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm cursor-pointer hover:bg-muted/40 transition"
              >
                <input
                  type="checkbox"
                  checked={l.on}
                  onChange={() =>
                    setState(state.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: l.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs text-foreground truncate">{l.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{l.source}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="surface-card relative h-[65vh] overflow-hidden rounded-xl border border-border">
          <MapMock properties={[p]} highlightId={p.id} height={500} />
          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
            {state
              .filter((l) => l.on)
              .map((l) => (
                <Pill key={l.name} tone="info">
                  {l.name}
                </Pill>
              ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
