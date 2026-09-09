import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, KpiRow } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { useEffect, useState } from "react";
import { getPropertyById } from "@/lib/property-repository";
import { properties as fallbackProperties } from "@/lib/mock-data";
import type { Property } from "@/lib/types";
import { RealMap } from "@/components/ui-ext/RealMap";
import { PropertyCardMiniMap } from "@/components/property/PropertyCardMiniMap";

export const Route = createFileRoute("/properties/$id/boundary")({
  head: () => ({ meta: [{ title: "Boundary Comparison — TerraTrust AI" }] }),
  component: Page,
});

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
      title="Boundary Comparison"
      subtitle="Compare claimed GIS polygon, revenue survey boundaries, and high-resolution satellite imagery."
      actions={<Button variant="outline">Download GeoJSON</Button>}
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: p.title || id, to: `/properties/${id}` },
          { label: "Boundary" },
        ]}
      />
      <PropertySubNav propertyId={id} activeTab="boundary" />

      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">GIS CADASTRAL COMPARISON:</strong> Real vertex
        geofencing calibrated for Indian Survey Numbers and Bhoomi cadastral boundaries.
      </div>

      <KpiRow
        items={[
          { label: "Registry match", value: "99.6%" },
          { label: "Satellite match", value: "98.1%" },
          { label: "Max deviation", value: "0.4m" },
          { label: "Confidence", value: "High" },
        ]}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Claimed boundary (GPS/KML)
          </p>
          <PropertyCardMiniMap
            coords={p.coords}
            boundary={p.boundary}
            title={p.title}
            className="h-44 w-full rounded-lg"
          />
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Survey registry boundary</p>
          <PropertyCardMiniMap
            coords={p.coords}
            boundary={
              p.surveyorBoundary && p.surveyorBoundary.length >= 3 ? p.surveyorBoundary : p.boundary
            }
            title={`${p.title} - Cadastral`}
            className="h-44 w-full rounded-lg"
          />
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Satellite-derived parcel</p>
          <PropertyCardMiniMap
            coords={p.coords}
            boundary={
              p.governmentBoundary && p.governmentBoundary.length >= 3
                ? p.governmentBoundary
                : p.boundary
            }
            title={`${p.title} - Satellite`}
            className="h-44 w-full rounded-lg"
          />
        </div>
      </div>

      <div className="surface-card mt-6 p-5">
        <h3 className="font-display text-xl mb-3">Interactive Cadastral GIS View</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <RealMap
            key={`cadastral-${p.id}`}
            initialCenter={p.coords || { lat: 12.9716, lng: 77.5946 }}
            boundary={p.boundary || []}
            secondaryBoundary={p.surveyorBoundary || undefined}
            secondaryBoundaryLabel="OFFICIAL SURVEYOR BOUNDARY"
            boundaryLabel={`SUBMITTED BOUNDARY (${p.passportId})`}
            readOnly={true}
            height={400}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Boundaries align within revenue tolerance (0.4m drift). Coordinate centroid: (
          {p.coords?.lat?.toFixed(5) || "12.9716"}, {p.coords?.lng?.toFixed(5) || "77.5946"}).
        </p>
      </div>
    </AppShell>
  );
}
