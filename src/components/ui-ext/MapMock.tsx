import { useEffect, useRef } from "react";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Map,
  Marker,
  NavigationControl,
  LngLatBounds,
  AttributionControl,
  type StyleSpecification,
  type GeoJSONSource,
} from "maplibre-gl";

// Standard OpenStreetMap / CARTO raster tile styles requiring no private key
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "carto-voyager": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-voyager-layer",
      type: "raster",
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

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

  const activeProp = properties.find((p) => p.id === highlightId) || properties[0];

  useEffect(() => {
    if (!containerRef.current) return;

    const initialCenter =
      activeProp?.coords && activeProp.coords.lat !== 0
        ? activeProp.coords
        : { lat: 12.9716, lng: 77.5946 };

    const map = new Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "top-right");
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution: "TerraTrust AI GIS · Map context",
      }),
      "bottom-right"
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
    selectFn?: (p: Property) => void
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

      const marker = new Marker({ element: el })
        .setLngLat([p.coords.lng, p.coords.lat])
        .addTo(map);

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

  return (
    <div
      className={cn(
        "surface-card relative overflow-hidden rounded-xl border border-border shadow-inner",
        className
      )}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
