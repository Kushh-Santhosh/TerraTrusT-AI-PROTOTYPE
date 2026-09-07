import { useEffect, useRef, useState } from "react";
import { Map, Marker, LngLatBounds } from "maplibre-gl";
import { getBasemapStyle } from "@/lib/map-style";
import type { PropertyBoundary } from "@/lib/types";
import { MapPin } from "lucide-react";

interface PropertyCardMiniMapProps {
  coords?: { lat: number; lng: number };
  boundary?: PropertyBoundary[];
  title?: string;
  className?: string;
}

export function PropertyCardMiniMap({
  coords,
  boundary = [],
  title,
  className = "h-36 w-full",
}: PropertyCardMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Compute centroid if boundary exists, else fallback to coords, else Bengaluru
  const validBoundary = Array.isArray(boundary) && boundary.length >= 3;

  let centerLat = coords?.lat && coords.lat !== 0 ? coords.lat : 12.9716;
  let centerLng = coords?.lng && coords.lng !== 0 ? coords.lng : 77.5946;

  if (validBoundary) {
    const sumLat = boundary.reduce((acc, p) => acc + p.lat, 0);
    const sumLng = boundary.reduce((acc, p) => acc + p.lng, 0);
    centerLat = sumLat / boundary.length;
    centerLng = sumLng / boundary.length;
  }

  useEffect(() => {
    if (!containerRef.current) return;

    if (typeof Map.supported === "function" && !Map.supported()) {
      setMapError(true);
      return;
    }

    let map: Map;
    try {
      map = new Map({
        container: containerRef.current,
        style: getBasemapStyle(),
        center: [centerLng, centerLat],
        zoom: validBoundary ? 15 : 14,
        interactive: false,
        attributionControl: false,
      });
    } catch (err) {
      console.warn("MapLibre mini-map initialization error:", err);
      setMapError(true);
      return;
    }

    map.on("error", () => {
      // Non-fatal, tile load failures etc.
    });

    map.on("load", () => {
      mapRef.current = map;
      setIsLoaded(true);

      if (validBoundary) {
        // Construct closed polygon ring [lng, lat]
        const ring: [number, number][] = boundary.map((p) => [p.lng, p.lat]);
        if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
          ring.push([...ring[0]]);
        }

        const sourceId = "card-boundary-src";
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [ring],
            },
            properties: {},
          },
        });

        map.addLayer({
          id: "card-boundary-fill",
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#0284c7",
            "fill-opacity": 0.35,
          },
        });

        map.addLayer({
          id: "card-boundary-line",
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#0369a1",
            "line-width": 2,
          },
        });

        // Fit map bounds to actual property boundary
        try {
          const bounds = new LngLatBounds();
          ring.forEach((pt) => bounds.extend(pt));
          map.fitBounds(bounds, { padding: 18, duration: 0 });
        } catch {
          // ignore fit bounds error
        }
      }

      // Add small centroid marker
      const el = document.createElement("div");
      el.className = "terra-pin-marker";
      el.innerHTML = `
        <div style="width: 14px; height: 14px; background: #0284c7; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 8px rgba(2, 132, 199, 0.6);"></div>
      `;
      new Marker({ element: el }).setLngLat([centerLng, centerLat]).addTo(map);
    });

    return () => {
      try {
        map.remove();
      } catch {
        // ignore cleanup error
      }
      mapRef.current = null;
    };
  }, [centerLat, centerLng, validBoundary, JSON.stringify(boundary)]);

  return (
    <div className={`relative overflow-hidden bg-muted/40 ${className}`}>
      {/* MapLibre Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full pointer-events-none" />

      {/* Fallback if WebGL unavailable */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/70 text-xs text-muted-foreground p-3 text-center">
          <MapPin className="h-4 w-4 mr-1 text-primary shrink-0" />
          <span>{title || "Cadastral Parcel"} ({centerLat.toFixed(4)}, {centerLng.toFixed(4)})</span>
        </div>
      )}

      {/* Boundary status badge if no boundary submitted */}
      {!validBoundary && (
        <div className="absolute bottom-2 left-2 z-10 rounded bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm shadow-xs border border-border">
          Boundary not submitted
        </div>
      )}

      {/* OpenStreetMap Attribution */}
      <div className="absolute bottom-1 right-1 z-10 text-[8px] text-muted-foreground/80 bg-background/60 px-1 rounded pointer-events-none">
        &copy; OpenStreetMap
      </div>
    </div>
  );
}
