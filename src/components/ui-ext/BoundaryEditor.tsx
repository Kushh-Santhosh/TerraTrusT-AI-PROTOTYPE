import { useState, useRef, useEffect, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type LatLng,
  calculatePolygonArea,
  coordsToGeoJson,
  parseAndValidateGeoJson,
  parseAndValidateKml,
} from "@/lib/gis-utils";
import {
  Upload,
  FileCode,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  RotateCcw,
} from "lucide-react";

interface BoundaryEditorProps {
  initialCenter: LatLng;
  boundary: LatLng[];
  onChange: (boundary: LatLng[], areaSqm: number) => void;
  className?: string;
  readOnly?: boolean;
}

export function BoundaryEditor({
  initialCenter,
  boundary,
  onChange,
  className = "",
  readOnly = false,
}: BoundaryEditorProps) {
  const [zoom, setZoom] = useState(17);
  const [center, setCenter] = useState<LatLng>(initialCenter);
  const [activeVertex, setActiveVertex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragVertexIndex, setDragVertexIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputGeoJsonRef = useRef<HTMLInputElement>(null);
  const fileInputKmlRef = useRef<HTMLInputElement>(null);

  // Sync center if initialCenter changes significantly
  useEffect(() => {
    if (
      Math.abs(initialCenter.lat - center.lat) > 0.05 ||
      Math.abs(initialCenter.lng - center.lng) > 0.05
    ) {
      setCenter(initialCenter);
    }
  }, [initialCenter.lat, initialCenter.lng]);

  // Calculate live area
  const areaSqm = calculatePolygonArea(boundary);
  const areaAcres = (areaSqm * 0.000247105).toFixed(3);
  const areaHectares = (areaSqm / 10000).toFixed(3);

  // Web Mercator coordinate projections
  const project = useCallback(
    (lat: number, lng: number, z: number) => {
      const sinLat = Math.sin((lat * Math.PI) / 180);
      const clampedSinLat = Math.max(-0.9999, Math.min(0.9999, sinLat));
      const scale = 256 * Math.pow(2, z);
      const x = scale * (lng / 360 + 0.5);
      const y = scale * (0.5 - Math.log((1 + clampedSinLat) / (1 - clampedSinLat)) / (4 * Math.PI));
      return { x, y };
    },
    [],
  );

  const unproject = useCallback(
    (x: number, y: number, z: number) => {
      const scale = 256 * Math.pow(2, z);
      const lng = (x / scale - 0.5) * 360;
      const y2 = 0.5 - y / scale;
      const lat = (90 - (360 * Math.atan(Math.exp(-y2 * 2 * Math.PI))) / Math.PI);
      return { lat, lng };
    },
    [],
  );

  // Convert lat/lng to container pixel coordinates relative to viewport center
  const latLngToScreen = useCallback(
    (pt: LatLng, width: number, height: number): { x: number; y: number } => {
      const centerProj = project(center.lat, center.lng, zoom);
      const ptProj = project(pt.lat, pt.lng, zoom);
      return {
        x: width / 2 + (ptProj.x - centerProj.x),
        y: height / 2 + (ptProj.y - centerProj.y),
      };
    },
    [center, zoom, project],
  );

  // Convert screen coordinates to lat/lng
  const screenToLatLng = useCallback(
    (screenX: number, screenY: number, width: number, height: number): LatLng => {
      const centerProj = project(center.lat, center.lng, zoom);
      const worldX = centerProj.x + (screenX - width / 2);
      const worldY = centerProj.y + (screenY - height / 2);
      return unproject(worldX, worldY, zoom);
    },
    [center, zoom, project, unproject],
  );

  // Handle vertex drag
  const handlePointerDownVertex = (index: number, e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragVertexIndex(index);
    setActiveVertex(index);
    setErrorMsg(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    if (dragVertexIndex !== null && !readOnly) {
      const newPt = screenToLatLng(curX, curY, rect.width, rect.height);
      const updated = boundary.map((pt, i) => (i === dragVertexIndex ? newPt : pt));
      const newArea = calculatePolygonArea(updated);
      onChange(updated, newArea);
    } else if (isDraggingMap && dragStart) {
      const dx = curX - dragStart.x;
      const dy = curY - dragStart.y;
      const centerProj = project(center.lat, center.lng, zoom);
      const newCenter = unproject(centerProj.x - dx, centerProj.y - dy, zoom);
      setCenter(newCenter);
      setDragStart({ x: curX, y: curY });
    }
  };

  const handlePointerUp = () => {
    setDragVertexIndex(null);
    setIsDraggingMap(false);
    setDragStart(null);
  };

  const handleMapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target instanceof SVGElement && e.target.classList.contains("vertex-handle")) {
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Add vertex on click
  const handleAddVertexOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || isDraggingMap || dragVertexIndex !== null) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const newPt = screenToLatLng(clickX, clickY, rect.width, rect.height);

    const updated = [...boundary, newPt];
    const newArea = calculatePolygonArea(updated);
    onChange(updated, newArea);
    setActiveVertex(updated.length - 1);
    setSuccessMsg(`Added vertex #${updated.length}`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Delete active vertex
  const removeVertex = (index: number) => {
    if (readOnly || boundary.length <= 3) {
      setErrorMsg("A polygon must have at least 3 vertices.");
      return;
    }
    const updated = boundary.filter((_, i) => i !== index);
    const newArea = calculatePolygonArea(updated);
    onChange(updated, newArea);
    setActiveVertex(null);
    setSuccessMsg(`Removed vertex #${index + 1}`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Create default polygon around center
  const resetToDefaultSquare = () => {
    const dLat = 0.00045; // ~50 meters
    const dLng = 0.00045;
    const square: LatLng[] = [
      { lat: Number((center.lat - dLat).toFixed(6)), lng: Number((center.lng - dLng).toFixed(6)) },
      { lat: Number((center.lat + dLat).toFixed(6)), lng: Number((center.lng - dLng).toFixed(6)) },
      { lat: Number((center.lat + dLat).toFixed(6)), lng: Number((center.lng + dLng).toFixed(6)) },
      { lat: Number((center.lat - dLat).toFixed(6)), lng: Number((center.lng + dLng).toFixed(6)) },
    ];
    const newArea = calculatePolygonArea(square);
    onChange(square, newArea);
    setSuccessMsg("Boundary set to 50m parcel around center coordinates");
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Recenter map on polygon vertices
  const recenterOnPolygon = () => {
    if (boundary.length === 0) {
      setCenter(initialCenter);
      return;
    }
    const avgLat = boundary.reduce((s, p) => s + p.lat, 0) / boundary.length;
    const avgLng = boundary.reduce((s, p) => s + p.lng, 0) / boundary.length;
    setCenter({ lat: Number(avgLat.toFixed(6)), lng: Number(avgLng.toFixed(6)) });
  };

  // GeoJSON file upload handler
  const handleGeoJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseAndValidateGeoJson(text);
      onChange(parsed.coords, parsed.area);

      // Re-center on loaded coordinates
      const avgLat = parsed.coords.reduce((s, p) => s + p.lat, 0) / parsed.coords.length;
      const avgLng = parsed.coords.reduce((s, p) => s + p.lng, 0) / parsed.coords.length;
      setCenter({ lat: avgLat, lng: avgLng });

      setSuccessMsg(`Successfully imported GeoJSON: ${parsed.coords.length} vertices (${parsed.area.toLocaleString()} m²)`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to parse GeoJSON file.");
    } finally {
      if (fileInputGeoJsonRef.current) fileInputGeoJsonRef.current.value = "";
    }
  };

  // KML file upload handler
  const handleKmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseAndValidateKml(text);
      onChange(parsed.coords, parsed.area);

      // Re-center on loaded coordinates
      const avgLat = parsed.coords.reduce((s, p) => s + p.lat, 0) / parsed.coords.length;
      const avgLng = parsed.coords.reduce((s, p) => s + p.lng, 0) / parsed.coords.length;
      setCenter({ lat: avgLat, lng: avgLng });

      setSuccessMsg(`Successfully imported KML: ${parsed.coords.length} vertices (${parsed.area.toLocaleString()} m²)`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to parse KML file.");
    } finally {
      if (fileInputKmlRef.current) fileInputKmlRef.current.value = "";
    }
  };

  // Calculate screen points for SVG rendering
  const width = 800;
  const height = 450;
  const screenPoints = boundary.map((pt) => latLngToScreen(pt, width, height));
  const svgPointsString = screenPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Generate OpenStreetMap slippy tiles for backdrop
  const centerProj = project(center.lat, center.lng, zoom);
  const centerTileX = Math.floor(centerProj.x / 256);
  const centerTileY = Math.floor(centerProj.y / 256);
  const tileOffsets = [-1, 0, 1];
  const maxTile = Math.pow(2, zoom);

  const tiles = [];
  for (const dx of tileOffsets) {
    for (const dy of tileOffsets) {
      const tx = (centerTileX + dx + maxTile) % maxTile;
      const ty = centerTileY + dy;
      if (ty >= 0 && ty < maxTile) {
        const left = width / 2 + ((centerTileX + dx) * 256 - centerProj.x);
        const top = height / 2 + ((centerTileY + dy) * 256 - centerProj.y);
        tiles.push({
          url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
          left,
          top,
          key: `${zoom}-${tx}-${ty}`,
        });
      }
    }
  }

  const gridPatternId = useId();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground">Vertices:</span>
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono font-medium">
            {boundary.length} points
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="font-semibold text-foreground">Calculated Area:</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono font-semibold text-primary">
            {areaSqm.toLocaleString("en-IN")} m²
          </span>
          <span className="text-xs text-muted-foreground">
            ({areaAcres} acres / {areaHectares} ha)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <input
                ref={fileInputGeoJsonRef}
                type="file"
                accept=".geojson,.json"
                className="hidden"
                id="geojson-upload-input"
                onChange={handleGeoJsonUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => fileInputGeoJsonRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                Upload GeoJSON
              </Button>

              <input
                ref={fileInputKmlRef}
                type="file"
                accept=".kml"
                className="hidden"
                id="kml-upload-input"
                onChange={handleKmlUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => fileInputKmlRef.current?.click()}
              >
                <FileCode className="h-3.5 w-3.5 text-accent-foreground" />
                Upload KML
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-muted-foreground"
                onClick={resetToDefaultSquare}
                title="Generate default parcel boundary around center coordinates"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Preset Parcel
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={recenterOnPolygon}
            title="Recenter view on boundary"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Recenter
          </Button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interactive Map Viewport */}
      <div
        ref={containerRef}
        id="gis-boundary-canvas"
        className="relative h-[450px] w-full select-none overflow-hidden rounded-xl border border-border bg-muted/40 shadow-inner cursor-crosshair"
        onPointerDown={handleMapPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleAddVertexOnClick}
      >
        {/* Real OpenStreetMap Slippy Tiles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-85">
          {tiles.map((t) => (
            <img
              key={t.key}
              src={t.url}
              alt=""
              className="absolute h-[256px] w-[256px] object-cover filter contrast-95"
              style={{ left: `${t.left}px`, top: `${t.top}px` }}
              onError={(e) => {
                // Graceful fallback tile if OSM is blocked or offline
                (e.target as HTMLImageElement).style.opacity = "0.2";
              }}
            />
          ))}
        </div>

        {/* Vector SVG Layer for Boundary Polygon */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 h-full w-full pointer-events-auto"
        >
          <defs>
            <pattern id={gridPatternId} width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />

          {/* Polygon Fill & Outline */}
          {screenPoints.length >= 3 && (
            <polygon
              points={svgPointsString}
              fill="rgba(20, 184, 166, 0.28)"
              stroke="#0d9488"
              strokeWidth="2.5"
              strokeDasharray={readOnly ? "none" : "none"}
              className="transition-all duration-75"
            />
          )}

          {/* Polylines if fewer than 3 points */}
          {screenPoints.length < 3 && screenPoints.length > 1 && (
            <polyline
              points={svgPointsString}
              fill="none"
              stroke="#0d9488"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Polygon Center Label */}
          {screenPoints.length >= 3 && (
            <text
              x={screenPoints.reduce((acc, p) => acc + p.x, 0) / screenPoints.length}
              y={screenPoints.reduce((acc, p) => acc + p.y, 0) / screenPoints.length}
              textAnchor="middle"
              className="fill-teal-950 dark:fill-teal-100 font-mono text-[11px] font-bold pointer-events-none drop-shadow-md"
            >
              {areaSqm.toLocaleString()} m²
            </text>
          )}

          {/* Draggable Vertex Handles */}
          {!readOnly &&
            screenPoints.map((pt, i) => {
              const isActive = activeVertex === i;
              return (
                <g key={`vertex-${i}`} className="cursor-grab active:cursor-grabbing">
                  {/* Outer pulse ring for active vertex */}
                  {isActive && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="16"
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="2"
                      className="animate-ping opacity-75"
                    />
                  )}
                  {/* Invisible larger hit target */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="18"
                    fill="transparent"
                    className="vertex-handle cursor-move"
                    onPointerDown={(e) => handlePointerDownVertex(i, e)}
                  />
                  {/* Visible Vertex Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? "7" : "5.5"}
                    fill={isActive ? "#0d9488" : "#ffffff"}
                    stroke="#0f766e"
                    strokeWidth="2.5"
                    className="vertex-handle transition-transform hover:scale-125"
                    onPointerDown={(e) => handlePointerDownVertex(i, e)}
                  />
                  {/* Index badge */}
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="fill-foreground font-mono text-[10px] font-bold pointer-events-none drop-shadow"
                  >
                    #{i + 1}
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Floating Zoom & Pan Controls */}
        <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-lg border border-border bg-surface/90 p-1 backdrop-blur shadow-md">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(20, z + 1))}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted text-foreground transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(10, z - 1))}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted text-foreground transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        {/* Legend & Instructions Badge */}
        <div className="absolute bottom-3 left-3 rounded-lg border border-border bg-surface/90 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur shadow-sm flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-600" />
          <span>Double-click map to add point · Drag points to adjust boundary</span>
        </div>

        {/* Center Coordinates readout */}
        <div className="absolute bottom-3 right-3 rounded-lg border border-border bg-surface/90 px-2.5 py-1 text-[10px] font-mono text-muted-foreground backdrop-blur">
          {center.lat.toFixed(5)}°N, {center.lng.toFixed(5)}°E · z{zoom}
        </div>
      </div>

      {/* Vertices Coordinates Table */}
      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-foreground">Boundary Polygon Coordinate Table</p>
          {!readOnly && boundary.length < 3 && (
            <p className="text-[11px] text-warning">Minimum 3 coordinates required to define a valid boundary</p>
          )}
        </div>

        <div className="max-h-36 overflow-y-auto divide-y divide-border">
          {boundary.map((pt, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between py-1.5 px-2 text-xs transition ${
                activeVertex === idx ? "bg-primary/10 rounded font-medium" : "hover:bg-muted/40"
              }`}
              onClick={() => setActiveVertex(idx)}
            >
              <span className="font-mono text-muted-foreground w-8">#{idx + 1}</span>
              <span className="font-mono text-foreground flex-1">
                Lat: <span className="text-primary">{pt.lat.toFixed(6)}</span>, Lng:{" "}
                <span className="text-primary">{pt.lng.toFixed(6)}</span>
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVertex(idx);
                  }}
                  className="text-muted-foreground hover:text-destructive p-1 transition"
                  title="Remove this point"
                  disabled={boundary.length <= 3}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
