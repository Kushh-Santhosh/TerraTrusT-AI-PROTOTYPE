import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { RealMap } from "@/components/ui-ext/RealMap";
import { getProperties } from "@/lib/property-repository";
import { properties as fallbackProps } from "@/lib/mock-data";
import { useState, useEffect } from "react";
import { Layers, Filter, Plus, Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "GIS Cadastral Map — TerraTrust AI" }] }),
  component: MapPage,
});

function MapPage() {
  const [items, setItems] = useState<Property[]>(fallbackProps);
  const [sel, setSel] = useState<Property>(fallbackProps[0]);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    getProperties().then((res) => {
      if (res && res.length > 0) {
        setItems(res);
        setSel(res[0]);
      }
    });
  }, []);

  const filtered = items.filter(
    (p) =>
      p.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.passportId.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <AppShell
      title="GIS Cadastral Map"
      subtitle="Spatial view of every parcel in your portfolio and state revenue cadastre."
      actions={
        <>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/properties/new">
              <Plus className="h-4 w-4 mr-1" /> Add Boundary
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="surface-card flex h-fit flex-col gap-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9 text-xs"
              placeholder="Search parcels, surveys…"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{filtered.length} Parcels Mapped</span>
            <span className="font-mono text-[10px] text-primary">MapLibre GL</span>
          </div>
          <div className="-mx-1 max-h-[500px] divide-y divide-border overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSel(p)}
                className={`flex w-full flex-col items-start gap-1 px-3 py-3 text-left text-sm hover:bg-muted transition ${
                  sel.id === p.id ? "bg-primary/10 border-l-2 border-primary" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <p className="font-medium text-xs truncate max-w-[170px]">{p.title}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  {p.passportId} · {p.region}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid gap-4">
          <div className="surface-card overflow-hidden p-2">
            <RealMap
              key={sel.id}
              initialCenter={sel.coords || { lat: 12.9716, lng: 77.5946 }}
              boundary={sel.boundary || []}
              secondaryBoundary={sel.surveyorBoundary || undefined}
              secondaryBoundaryLabel="OFFICIAL SURVEYOR BOUNDARY"
              boundaryLabel={`SUBMITTED PARCEL (${sel.passportId})`}
              readOnly={true}
              height={560}
            />
          </div>
          <div className="surface-card flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Active Cadastral Parcel
              </p>
              <p className="font-display text-xl font-bold">{sel.title}</p>
              <p className="text-xs text-muted-foreground">
                Centroid: {sel.coords?.lat?.toFixed(5) ?? "12.9716"},{" "}
                {sel.coords?.lng?.toFixed(5) ?? "77.5946"} · Area: {sel.area?.toLocaleString() ?? 0}{" "}
                m²
              </p>
            </div>
            <Link to="/properties/$id" params={{ id: sel.id }}>
              <Button className="rounded-full">Open Passport</Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
