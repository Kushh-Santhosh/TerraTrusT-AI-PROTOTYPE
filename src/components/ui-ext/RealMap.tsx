import { useEffect, useRef, useState, useCallback } from "react";
import {
  Map,
  Marker,
  NavigationControl,
  LngLatBounds,
  AttributionControl,
  type StyleSpecification,
  type GeoJSONSource,
} from "maplibre-gl";
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
  Search,
  MapPin,
  Crosshair,
  PenTool,
  Upload,
  FileCode,
  RotateCcw,
  Maximize2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Compass,
  Check,
  X,
  Loader2,
} from "lucide-react";

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

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    state?: string;
    country?: string;
  };
}

export interface RealMapProps {
  initialCenter: LatLng;
  boundary: LatLng[];
  onChange?: (boundary: LatLng[], areaSqm: number) => void;
  onLocationChange?: (center: LatLng) => void;
  onAddressSelect?: (result: NominatimResult) => void;
  className?: string;
  height?: number | string;
  readOnly?: boolean;
  enableLocationPicker?: boolean;
}

export function RealMap({
  initialCenter,
  boundary,
  onChange,
  onLocationChange,
  onAddressSelect,
  className = "",
  height = 480,
  readOnly = false,
  enableLocationPicker = true,
}: RealMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const locationMarkerRef = useRef<Marker | null>(null);
  const vertexMarkersRef = useRef<Marker[]>([]);

  // Local state
  const [currentLocation, setCurrentLocation] = useState<LatLng>(initialCenter);
  const [isDrawing, setIsDrawing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeVertexIndex, setActiveVertexIndex] = useState<number | null>(null);

  const fileInputGeoJsonRef = useRef<HTMLInputElement>(null);
  const fileInputKmlRef = useRef<HTMLInputElement>(null);

  // Live area calculations
  const areaSqm = calculatePolygonArea(boundary);
  const areaAcres = (areaSqm * 0.000247105).toFixed(3);
  const areaHectares = (areaSqm / 10000).toFixed(3);

  // 1. Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 16,
      attributionControl: false,
    });

    // Add navigation controls (zoom, compass)
    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right"
    );

    // Add attribution
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution: "TerraTrust AI GIS · User-submitted boundary",
      }),
      "bottom-right"
    );

    map.on("load", () => {
      mapRef.current = map;

      // Add GeoJSON polygon source & layers for boundary
      map.addSource("property-boundary-source", {
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

      // Polygon fill layer
      map.addLayer({
        id: "property-boundary-fill",
        type: "fill",
        source: "property-boundary-source",
        paint: {
          "fill-color": "#14b8a6", // teal-500
          "fill-opacity": 0.25,
        },
      });

      // Polygon stroke layer
      map.addLayer({
        id: "property-boundary-stroke",
        type: "line",
        source: "property-boundary-source",
        paint: {
          "line-color": "#0d9488", // teal-600
          "line-width": 2.5,
          "line-dasharray": [2, 1],
        },
      });

      // Create property center pin marker
      const pinEl = document.createElement("div");
      pinEl.className = "property-pin-marker cursor-grab";
      pinEl.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -top-7 flex flex-col items-center">
            <div class="bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full text-[10px] shadow-md border border-white flex items-center gap-1 whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Property Pin
            </div>
            <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-primary"></div>
          </div>
          <div class="w-4 h-4 rounded-full bg-primary/30 animate-ping absolute"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-lg"></div>
        </div>
      `;

      const marker = new Marker({
        element: pinEl,
        draggable: !readOnly && enableLocationPicker,
      })
        .setLngLat([initialCenter.lng, initialCenter.lat])
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const newCoords: LatLng = {
          lat: Number(lngLat.lat.toFixed(6)),
          lng: Number(lngLat.lng.toFixed(6)),
        };
        setCurrentLocation(newCoords);
        onLocationChange?.(newCoords);
      });

      locationMarkerRef.current = marker;

      // Handle map click
      map.on("click", (e) => {
        if (readOnly) return;

        // If in boundary drawing mode, append vertex
        if (isDrawingRef.current) {
          const newPt: LatLng = {
            lat: Number(e.lngLat.lat.toFixed(6)),
            lng: Number(e.lngLat.lng.toFixed(6)),
          };
          const updated = [...boundaryRef.current, newPt];
          const newArea = calculatePolygonArea(updated);
          onChangeRef.current?.(updated, newArea);
          setSuccessMsg(`Added boundary vertex #${updated.length}`);
          setTimeout(() => setSuccessMsg(null), 2000);
        } else if (enableLocationPicker) {
          // Relocate property pin
          const newPt: LatLng = {
            lat: Number(e.lngLat.lat.toFixed(6)),
            lng: Number(e.lngLat.lng.toFixed(6)),
          };
          marker.setLngLat([newPt.lng, newPt.lat]);
          setCurrentLocation(newPt);
          onLocationChange?.(newPt);
        }
      });

      // Synchronize initial boundary and vertex handles immediately on load
      syncBoundaryToMap(map, boundaryRef.current, readOnly);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Use refs to avoid stale closures in map callbacks
  const isDrawingRef = useRef(isDrawing);
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  const boundaryRef = useRef(boundary);
  useEffect(() => {
    boundaryRef.current = boundary;
  }, [boundary]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Synchronizes boundary polygon and draggable vertex markers
  const syncBoundaryToMap = useCallback((map: Map, bList: LatLng[], isReadOnly: boolean) => {
    const source = map.getSource("property-boundary-source") as GeoJSONSource | undefined;
    if (source) {
      if (bList.length >= 3) {
        const ring = bList.map((p) => [p.lng, p.lat]);
        ring.push([...ring[0]]);
        source.setData({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring],
          },
          properties: {},
        });
      } else {
        source.setData({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[]],
          },
          properties: {},
        });
      }
    }

    // Clean up existing vertex markers
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];

    // Add interactive draggable markers for each vertex
    bList.forEach((pt, index) => {
      const vEl = document.createElement("div");
      vEl.className =
        "vertex-handle group cursor-move flex items-center justify-center -translate-x-1/2 -translate-y-1/2";
      vEl.innerHTML = `
        <div class="w-4 h-4 rounded-full bg-white border-2 border-teal-600 shadow-md flex items-center justify-center transition-transform hover:scale-125 hover:bg-teal-50">
          <span class="text-[8px] font-bold text-teal-800 leading-none">${index + 1}</span>
        </div>
      `;

      vEl.addEventListener("click", (e) => {
        e.stopPropagation();
        setActiveVertexIndex(index);
      });

      const vMarker = new Marker({
        element: vEl,
        draggable: !isReadOnly,
      })
        .setLngLat([pt.lng, pt.lat])
        .addTo(map);

      vMarker.on("drag", () => {
        const lngLat = vMarker.getLngLat();
        const updated = [...boundaryRef.current];
        updated[index] = {
          lat: Number(lngLat.lat.toFixed(6)),
          lng: Number(lngLat.lng.toFixed(6)),
        };

        const src = map.getSource("property-boundary-source") as GeoJSONSource | undefined;
        if (src && updated.length >= 3) {
          const ring = updated.map((p) => [p.lng, p.lat]);
          ring.push([...ring[0]]);
          src.setData({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [ring],
            },
            properties: {},
          });
        }
      });

      vMarker.on("dragend", () => {
        const lngLat = vMarker.getLngLat();
        const updated = [...boundaryRef.current];
        updated[index] = {
          lat: Number(lngLat.lat.toFixed(6)),
          lng: Number(lngLat.lng.toFixed(6)),
        };
        const newArea = calculatePolygonArea(updated);
        onChangeRef.current?.(updated, newArea);
      });

      vertexMarkersRef.current.push(vMarker);
    });
  }, []);

  // 2. Synchronize initialCenter / external center changes
  useEffect(() => {
    if (!mapRef.current || !locationMarkerRef.current) return;
    const currentLngLat = locationMarkerRef.current.getLngLat();
    if (
      Math.abs(currentLngLat.lat - initialCenter.lat) > 0.00001 ||
      Math.abs(currentLngLat.lng - initialCenter.lng) > 0.00001
    ) {
      locationMarkerRef.current.setLngLat([initialCenter.lng, initialCenter.lat]);
      setCurrentLocation(initialCenter);
      mapRef.current.easeTo({
        center: [initialCenter.lng, initialCenter.lat],
        duration: 500,
      });
    }
  }, [initialCenter.lat, initialCenter.lng]);

  // 3. Update Polygon Layers and Vertex Markers whenever boundary changes
  useEffect(() => {
    if (mapRef.current) {
      syncBoundaryToMap(mapRef.current, boundary, readOnly);
    }
  }, [boundary, readOnly, syncBoundaryToMap]);

  // 4. "Use My Current Location" Handler
  const handleUseCurrentLocation = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const coords: LatLng = {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
        };

        setCurrentLocation(coords);
        onLocationChange?.(coords);

        if (mapRef.current && locationMarkerRef.current) {
          locationMarkerRef.current.setLngLat([coords.lng, coords.lat]);
          mapRef.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 17,
            speed: 1.4,
          });
        }

        setSuccessMsg(`Captured device coordinates: ${coords.lat}, ${coords.lng}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMsg(
              "Location permission was denied. You can manually pan, zoom, or search for your property location."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMsg(
              "Location information is unavailable. Please select your property location manually on the map."
            );
            break;
          case err.TIMEOUT:
            setErrorMsg(
              "The request to obtain your location timed out. Please try again or search by address."
            );
            break;
          default:
            setErrorMsg(`Unable to get location: ${err.message}`);
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 5. OpenStreetMap Nominatim Address Search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setErrorMsg(null);
    setIsSearching(true);
    try {
      // Nominatim search API with countrycodes=in filter for India
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=in&addressdetails=1&limit=5`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Geocoding failed with status: ${res.status}`);
      }

      const data: NominatimResult[] = await res.json();
      setSearchResults(data);

      if (data.length === 0) {
        setErrorMsg(`No locations found for "${query}". Try searching with city or landmark name.`);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to search location. Check your network connection."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (res: NominatimResult) => {
    const lat = Number(parseFloat(res.lat).toFixed(6));
    const lng = Number(parseFloat(res.lon).toFixed(6));
    const coords: LatLng = { lat, lng };

    setCurrentLocation(coords);
    setSearchResults([]);
    setSearchQuery(res.display_name.split(",")[0] || searchQuery);
    onLocationChange?.(coords);
    onAddressSelect?.(res);

    if (mapRef.current && locationMarkerRef.current) {
      locationMarkerRef.current.setLngLat([lng, lat]);
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 17,
        speed: 1.4,
      });
    }

    setSuccessMsg(`Centered map on: ${res.display_name.slice(0, 50)}…`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 6. Delete Active Vertex
  const removeVertex = (index: number) => {
    if (readOnly || boundary.length <= 3) {
      setErrorMsg("A boundary polygon must contain at least 3 vertices.");
      return;
    }
    const updated = boundary.filter((_, i) => i !== index);
    const newArea = calculatePolygonArea(updated);
    onChange?.(updated, newArea);
    setActiveVertexIndex(null);
    setSuccessMsg(`Removed vertex #${index + 1}`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // 7. Reset to default 50m parcel around current location
  const handleResetToPresetParcel = () => {
    const dLat = 0.00045; // ~50m
    const dLng = 0.00045;
    const square: LatLng[] = [
      { lat: Number((currentLocation.lat - dLat).toFixed(6)), lng: Number((currentLocation.lng - dLng).toFixed(6)) },
      { lat: Number((currentLocation.lat + dLat).toFixed(6)), lng: Number((currentLocation.lng - dLng).toFixed(6)) },
      { lat: Number((currentLocation.lat + dLat).toFixed(6)), lng: Number((currentLocation.lng + dLng).toFixed(6)) },
      { lat: Number((currentLocation.lat - dLat).toFixed(6)), lng: Number((currentLocation.lng + dLng).toFixed(6)) },
    ];
    const newArea = calculatePolygonArea(square);
    onChange?.(square, newArea);
    setSuccessMsg("Boundary set to 50m parcel around center coordinates");
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 8. Recenter / Fit Map to Boundary
  const handleFitToBoundary = () => {
    if (!mapRef.current) return;
    if (boundary.length === 0) {
      mapRef.current.easeTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 16 });
      return;
    }

    const bounds = new LngLatBounds();
    boundary.forEach((pt) => bounds.extend([pt.lng, pt.lat]));
    mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 18, duration: 800 });
  };

  // 9. GeoJSON File Import
  const handleGeoJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseAndValidateGeoJson(text);
      onChange?.(parsed.coords, parsed.area);

      // Fit map to imported boundary
      if (mapRef.current && parsed.coords.length > 0) {
        const bounds = new LngLatBounds();
        parsed.coords.forEach((pt) => bounds.extend([pt.lng, pt.lat]));
        mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 18, duration: 800 });

        // Also update center pin to centroid
        const avgLat = parsed.coords.reduce((s, p) => s + p.lat, 0) / parsed.coords.length;
        const avgLng = parsed.coords.reduce((s, p) => s + p.lng, 0) / parsed.coords.length;
        const centroid: LatLng = { lat: Number(avgLat.toFixed(6)), lng: Number(avgLng.toFixed(6)) };
        setCurrentLocation(centroid);
        onLocationChange?.(centroid);
        locationMarkerRef.current?.setLngLat([centroid.lng, centroid.lat]);
      }

      setSuccessMsg(
        `Successfully imported GeoJSON: ${parsed.coords.length} vertices (${parsed.area.toLocaleString()} m²)`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to parse GeoJSON file.");
    } finally {
      if (fileInputGeoJsonRef.current) fileInputGeoJsonRef.current.value = "";
    }
  };

  // 10. KML File Import
  const handleKmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseAndValidateKml(text);
      onChange?.(parsed.coords, parsed.area);

      // Fit map to imported boundary
      if (mapRef.current && parsed.coords.length > 0) {
        const bounds = new LngLatBounds();
        parsed.coords.forEach((pt) => bounds.extend([pt.lng, pt.lat]));
        mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 18, duration: 800 });

        const avgLat = parsed.coords.reduce((s, p) => s + p.lat, 0) / parsed.coords.length;
        const avgLng = parsed.coords.reduce((s, p) => s + p.lng, 0) / parsed.coords.length;
        const centroid: LatLng = { lat: Number(avgLat.toFixed(6)), lng: Number(avgLng.toFixed(6)) };
        setCurrentLocation(centroid);
        onLocationChange?.(centroid);
        locationMarkerRef.current?.setLngLat([centroid.lng, centroid.lat]);
      }

      setSuccessMsg(
        `Successfully imported KML: ${parsed.coords.length} vertices (${parsed.area.toLocaleString()} m²)`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to parse KML file.");
    } finally {
      if (fileInputKmlRef.current) fileInputKmlRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search & Location Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 flex gap-1.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="map-address-search-input"
              type="text"
              placeholder="Search Indian locations (e.g. CMR University, Bengaluru, Pune)…"
              className="h-9 pl-9 pr-8 text-xs w-full bg-surface"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            id="map-search-btn"
            type="submit"
            size="sm"
            variant="secondary"
            className="h-9 text-xs px-3 shrink-0"
            disabled={isSearching}
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
          </Button>

          {/* Autocomplete / Results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg divide-y divide-border text-xs">
              {searchResults.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted/70 transition-colors rounded-md"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <div className="flex-1 truncate">
                    <p className="font-medium text-foreground truncate">
                      {item.display_name.split(",")[0]}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.display_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Current Location Button */}
        <Button
          id="btn-current-location"
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="h-9 text-xs gap-1.5 shrink-0 rounded-md"
          title="Detect and fly to your device's live GPS coordinates"
        >
          {isLocating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <Crosshair className="h-3.5 w-3.5 text-primary" />
          )}
          <span>{isLocating ? "Acquiring GPS…" : "Use my current location"}</span>
        </Button>
      </div>

      {/* Control Bar & Boundary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-2 text-xs">
        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-surface px-2 py-1 font-mono text-[11px] font-semibold text-foreground border border-border">
            Calculated Area: {areaSqm.toLocaleString()} m²
          </span>
          <span className="hidden sm:inline-block text-[11px] text-muted-foreground">
            ({areaAcres} acres · {areaHectares} ha)
          </span>
          <span className="rounded bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">
            {boundary.length} Vertices
          </span>
          <span className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground border border-border">
            Map context · User-submitted boundary
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!readOnly && (
            <>
              {/* Boundary Drawing Mode Toggle */}
              <Button
                id="btn-toggle-draw-boundary"
                type="button"
                size="sm"
                variant={isDrawing ? "default" : "outline"}
                className={`h-7 text-xs gap-1 ${
                  isDrawing ? "bg-primary text-primary-foreground font-semibold" : ""
                }`}
                onClick={() => setIsDrawing(!isDrawing)}
                title={isDrawing ? "Click on map to place polygon vertices" : "Start drawing polygon"}
              >
                <PenTool className="h-3 w-3" />
                {isDrawing ? "Finish Drawing" : "Draw Boundary"}
              </Button>

              {/* GeoJSON File Upload */}
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
                className="h-7 text-xs gap-1"
                onClick={() => fileInputGeoJsonRef.current?.click()}
                title="Import GeoJSON Polygon"
              >
                <Upload className="h-3 w-3 text-primary" />
                GeoJSON
              </Button>

              {/* KML File Upload */}
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
                className="h-7 text-xs gap-1"
                onClick={() => fileInputKmlRef.current?.click()}
                title="Import Google Earth KML"
              >
                <FileCode className="h-3 w-3 text-accent-foreground" />
                KML
              </Button>

              {/* Preset Parcel Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleResetToPresetParcel}
                title="Generate standard 50m parcel around center coordinates"
              >
                <RotateCcw className="h-3 w-3" />
                Preset
              </Button>
            </>
          )}

          {/* Fit to Boundary */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleFitToBoundary}
            title="Fit map view to boundary polygon"
          >
            <Maximize2 className="h-3 w-3" />
            Fit
          </Button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-2.5 text-xs text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Drawing mode instructional banner */}
      {isDrawing && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary font-medium">
          <div className="flex items-center gap-2">
            <PenTool className="h-3.5 w-3.5 animate-pulse" />
            <span>Drawing Mode: Click anywhere on the real map to add polygon corners. Drag handles to reposition.</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-6 text-[11px] px-2"
            onClick={() => setIsDrawing(false)}
          >
            Done
          </Button>
        </div>
      )}

      {/* Real MapLibre Canvas Container */}
      <div className="relative w-full rounded-xl border border-border overflow-hidden shadow-inner bg-muted/40">
        <div
          ref={mapContainerRef}
          id="gis-boundary-canvas"
          style={{ height: typeof height === "number" ? `${height}px` : height }}
          className="w-full h-full"
        />

        {/* Selected Vertex Floating Action Menu */}
        {activeVertexIndex !== null && !readOnly && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
            <span className="font-semibold text-foreground">
              Vertex #{activeVertexIndex + 1} Selected
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              ({boundary[activeVertexIndex]?.lat.toFixed(5)}, {boundary[activeVertexIndex]?.lng.toFixed(5)})
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-6 text-[11px] gap-1 px-2 ml-1"
              onClick={() => removeVertex(activeVertexIndex)}
              disabled={boundary.length <= 3}
            >
              <Trash2 className="h-3 w-3" />
              Delete Vertex
            </Button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground ml-1"
              onClick={() => setActiveVertexIndex(null)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Lat/Lng and Coordinate Synchronizer Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>
            Selected Position: <strong className="font-mono text-foreground">{currentLocation.lat.toFixed(6)}° N</strong>,{" "}
            <strong className="font-mono text-foreground">{currentLocation.lng.toFixed(6)}° E</strong> (WGS84)
          </span>
        </div>
        <p className="text-[10px]">
          Drag pin or click map to update property location. Drag vertex numbers to reshape boundary.
        </p>
      </div>
    </div>
  );
}
