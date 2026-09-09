import { useMemo } from "react";
import type { PropertyBoundary } from "@/lib/types";
import { MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const validBoundary =
    Array.isArray(boundary) &&
    boundary.length >= 3 &&
    boundary.every(
      (p) =>
        typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng),
    );
  const hasValidCoords = Boolean(
    coords &&
    typeof coords.lat === "number" &&
    typeof coords.lng === "number" &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lng) &&
    coords.lat !== 0 &&
    coords.lng !== 0,
  );

  const centerLat = hasValidCoords
    ? coords!.lat
    : validBoundary
      ? boundary.reduce((acc, p) => acc + p.lat, 0) / boundary.length
      : null;
  const centerLng = hasValidCoords
    ? coords!.lng
    : validBoundary
      ? boundary.reduce((acc, p) => acc + p.lng, 0) / boundary.length
      : null;

  const { svgPoints, centroidSvg } = useMemo(() => {
    if (!validBoundary) {
      return { svgPoints: "", centroidSvg: null };
    }

    const lats = boundary.map((p) => p.lat);
    const lngs = boundary.map((p) => p.lng);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);

    // Padding margin to prevent clipping
    const latSpan = Math.max(maxLat - minLat, 0.0004);
    const lngSpan = Math.max(maxLng - minLng, 0.0004);
    const padLat = latSpan * 0.25;
    const padLng = lngSpan * 0.25;

    minLat -= padLat;
    maxLat += padLat;
    minLng -= padLng;
    maxLng += padLng;

    const width = 300;
    const height = 180;

    const pts = boundary.map((p) => {
      const x = ((p.lng - minLng) / (maxLng - minLng)) * width;
      const y = height - ((p.lat - minLat) / (maxLat - minLat)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const cLat = centerLat ?? (minLat + maxLat) / 2;
    const cLng = centerLng ?? (minLng + maxLng) / 2;
    const cX = ((cLng - minLng) / (maxLng - minLng)) * width;
    const cY = height - ((cLat - minLat) / (maxLat - minLat)) * height;

    return {
      svgPoints: pts.join(" "),
      centroidSvg: { x: cX, y: cY },
    };
  }, [boundary, validBoundary, centerLat, centerLng]);

  return (
    <div
      className={`relative overflow-hidden bg-slate-900 border-b border-border/40 select-none ${className}`}
    >
      {/* Cartographic background grid */}
      <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cadastral-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary/50"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cadastral-grid)" />
      </svg>

      {/* Cadastral Polygon or Unavailable fallback */}
      {validBoundary ? (
        <svg
          viewBox="0 0 300 180"
          className="absolute inset-0 h-full w-full preserve-3d"
          preserveAspectRatio="xMidYMid meet"
        >
          <polygon
            points={svgPoints}
            className="fill-primary/25 stroke-primary stroke-[2.5]"
            strokeLinejoin="round"
          />

          {svgPoints.split(" ").map((pt, i) => {
            const [x, y] = pt.split(",").map(Number);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                className="fill-white stroke-primary stroke-[1.5]"
              />
            );
          })}

          {centroidSvg && (
            <circle
              cx={centroidSvg.x}
              cy={centroidSvg.y}
              r="4"
              className="fill-emerald-400 stroke-slate-950 stroke-1"
            />
          )}
        </svg>
      ) : hasValidCoords && centerLat !== null && centerLng !== null ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
          <div className="relative mb-1 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full bg-primary/20 animate-ping absolute" />
            <div className="h-6 w-6 rounded-full bg-primary/30 border border-primary flex items-center justify-center relative">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-foreground/90 font-mono">
            {centerLat.toFixed(4)}° N, {centerLng.toFixed(4)}° E
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium mt-0.5">
            <AlertCircle className="h-2.5 w-2.5" />
            Boundary polygon pending survey
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-950/60">
          <AlertCircle className="h-6 w-6 text-muted-foreground/60 mb-1" />
          <span className="text-[11px] font-medium text-muted-foreground">
            Location / boundary unavailable
          </span>
          <span className="text-[9px] text-muted-foreground/60 mt-0.5">
            No GPS coordinates recorded
          </span>
        </div>
      )}

      {/* Coordinate & GIS Badge Overlay */}
      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] pointer-events-none">
        {centerLat !== null && centerLng !== null ? (
          <span className="rounded bg-background/80 backdrop-blur-sm px-1.5 py-0.5 font-mono text-muted-foreground border border-border/40 truncate max-w-[170px]">
            {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
          </span>
        ) : (
          <span className="rounded bg-background/80 backdrop-blur-sm px-1.5 py-0.5 font-mono text-muted-foreground/60 border border-border/40 text-[9px]">
            No GPS Fix
          </span>
        )}
        {validBoundary && (
          <span className="inline-flex items-center gap-1 rounded bg-primary/20 backdrop-blur-sm px-1.5 py-0.5 font-medium text-primary border border-primary/30">
            <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
            {boundary.length} vertices
          </span>
        )}
      </div>
    </div>
  );
}
