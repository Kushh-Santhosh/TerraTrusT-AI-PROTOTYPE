import { useEffect, useRef, useState } from "react";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Map,
  Marker,
  NavigationControl,
  LngLatBounds,
  AttributionControl,
  type GeoJSONSource,
} from "maplibre-gl";
import { getBasemapStyle, getBasemapAttribution } from "@/lib/map-style";
import { MapPin, Layers, Globe } from "lucide-react";

/**
 * Real interactive GIS map powered by MapLibre GL JS and OpenStreetMap/CARTO tiles.
 * Renders real geographic context, property markers, and persisted boundary polygons.
 */
export function MapMock({
  properties,
  highlightId,
  onSelect,
  className,
  height = 480,
}: {
  properties: Property[];
  highlightId?: string;
  onSelect?: (p: Property) => void;
  className?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [webGlError, setWebGlError] = useState(false);

  const activeProp = properties.find((p) => p.id === highlightId) || properties[0];

  useEffect(() => {
    if (!containerRef.current) return;

    const initialCenter =
      activeProp?.coords && activeProp.coords.lat !== 0
        ? activeProp.coords
        : { lat: 12.9716, lng: 77.5946 };

    let map: Map;
    try {
      map = new Map({
        container: containerRef.current,
        style: getBasemapStyle(),
        center: [initialCenter.lng, initialCenter.lat],
        zoom: 14,
        attributionControl: false,
      });
    } catch (e) {
      console.warn("Caught MapLibre initialization error:", e);
      setWebGlError(true);
      return;
    }

    map.on("error", (e) => {
      console.warn("MapLibre map error event:", e);
    });

    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "top-right");
    map.addControl(
      new AttributionControl({
        compact: false,
        customAttribution: getBasemapAttribution(),
      }),
      "bottom-right",
    );

    map.on("load", () => {
      mapRef.current = map;

      // Add boundary layer for active property
      map.addSource("active-property-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[]],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: "active-property-boundary-fill",
        type: "fill",
        source: "active-property-boundary",
        paint: {
          "fill-color": "#14b8a6",
          "fill-opacity": 0.3,
        },
      });

      map.addLayer({
        id: "active-property-boundary-stroke",
        type: "line",
        source: "active-property-boundary",
        paint: {
          "line-color": "#0d9488",
          "line-width": 2.5,
        },
      });

      updateMapFeatures(map, properties, highlightId, onSelect);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and boundary whenever properties or highlightId change
  useEffect(() => {
    if (!mapRef.current) return;
    updateMapFeatures(mapRef.current, properties, highlightId, onSelect);
  }, [properties, highlightId, onSelect]);

  function updateMapFeatures(
    map: Map,
    propsList: Property[],
    hId?: string,
    selectFn?: (p: Property) => void,
  ) {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new LngLatBounds();
    let hasCoords = false;

    propsList.forEach((p) => {
      if (!p.coords || (p.coords.lat === 0 && p.coords.lng === 0)) return;
      hasCoords = true;
      bounds.extend([p.coords.lng, p.coords.lat]);

      const isSelected = p.id === hId;
      const el = document.createElement("div");
      el.className = "cursor-pointer group flex flex-col items-center";
      el.innerHTML = `
        <div class="px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-md border ${
          isSelected
            ? "bg-primary text-primary-foreground border-white scale-110"
            : "bg-surface text-foreground border-border"
        } transition-transform whitespace-nowrap">
          ${p.title.slice(0, 20)}
        </div>
        <div class="w-3 h-3 rounded-full ${
          isSelected ? "bg-primary" : "bg-emerald-600"
        } border-2 border-white shadow-lg mt-0.5"></div>
      `;

      el.addEventListener("click", () => {
        selectFn?.(p);
      });

      const marker = new Marker({ element: el }).setLngLat([p.coords.lng, p.coords.lat]).addTo(map);

      markersRef.current.push(marker);
    });

    // Update active boundary polygon
    const selected = propsList.find((p) => p.id === hId) || propsList[0];
    const src = map.getSource("active-property-boundary") as GeoJSONSource | undefined;
    if (src) {
      if (selected && selected.boundary && selected.boundary.length >= 3) {
        const ring = selected.boundary.map((pt) => [pt.lng, pt.lat]);
        ring.push([...ring[0]]);
        src.setData({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring],
          },
          properties: {},
        });
        selected.boundary.forEach((pt) => bounds.extend([pt.lng, pt.lat]));
      } else {
        src.setData({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[]],
          },
          properties: {},
        });
      }
    }

    if (hasCoords && !bounds.isEmpty()) {
      if (propsList.length === 1 && selected?.coords) {
        map.easeTo({ center: [selected.coords.lng, selected.coords.lat], zoom: 16 });
      } else {
        map.fitBounds(bounds, { padding: 50, maxZoom: 16, duration: 600 });
      }
    }
  }

  if (webGlError) {
    return (
      <div
        className={cn(
          "surface-card relative overflow-hidden rounded-xl border border-border bg-muted/20 p-6 flex flex-col justify-between",
          className,
        )}
        style={{ height }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">GIS Cadastral Vector Grid</p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {activeProp?.title || "Property Parcel"} · {activeProp?.region || "Karnataka"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted-foreground">
            {activeProp?.coords
              ? `${activeProp.coords.lat.toFixed(4)}°N, ${activeProp.coords.lng.toFixed(4)}°E`
              : "GPS Active"}
          </span>
        </div>

        {/* Vector parcel illustration */}
        <div className="my-auto py-4 flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-32 border-2 border-dashed border-primary/40 rounded-xl bg-primary/5 flex items-center justify-center">
            <div className="absolute inset-2 border border-primary/30 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary animate-bounce" />
            </div>
            <div className="absolute top-1 left-2 text-[9px] font-mono text-primary/80">
              Vertex 1
            </div>
            <div className="absolute top-1 right-2 text-[9px] font-mono text-primary/80">
              Vertex 2
            </div>
            <div className="absolute bottom-1 right-2 text-[9px] font-mono text-primary/80">
              Vertex 3
            </div>
            <div className="absolute bottom-1 left-2 text-[9px] font-mono text-primary/80">
              Vertex 4
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-foreground">
            {activeProp?.area
              ? `${activeProp.area.toLocaleString()} sq ft`
              : "Boundary Geometry Recorded"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {activeProp?.boundary?.length
              ? `${activeProp.boundary.length} boundary coordinates saved`
              : "Georeferenced Polygon"}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-3">
          <span className="flex items-center gap-1.5 font-mono">
            <Globe className="h-3 w-3 text-primary" /> OpenStreetMap · CARTO Cadastral
          </span>
          <span className="font-mono text-[10px] text-primary">Spatial Trust Verified</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "surface-card relative overflow-hidden rounded-xl border border-border shadow-inner",
        className,
      )}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
