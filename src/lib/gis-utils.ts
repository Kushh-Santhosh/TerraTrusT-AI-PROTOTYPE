// GIS and Geometry Utilities for TerraTrust AI
// Supports coordinate conversions, geodesic polygon area calculation, GeoJSON parsing/validation, and KML importing.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoJsonGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

export interface GeoJsonFeature {
  type: "Feature";
  geometry: GeoJsonGeometry;
  properties?: Record<string, unknown>;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export type GeoJsonObject = GeoJsonGeometry | GeoJsonFeature | GeoJsonFeatureCollection;

/**
 * Calculates the geodesic surface area of a polygon defined by lat/lng coordinates in square meters
 * using the spherical Shoelace formula on WGS84 earth radius.
 */
export function calculatePolygonArea(coords: LatLng[]): number {
  if (!coords || coords.length < 3) return 0;

  const RADIUS = 6378137; // Earth's mean radius in meters (WGS84)
  const len = coords.length;
  let area = 0;

  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];

    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * RADIUS * RADIUS) / 4);
  return Math.round(area);
}

/**
 * Converts coordinates to RFC 7946 GeoJSON Polygon format [lng, lat]
 */
export function coordsToGeoJson(coords: LatLng[]): GeoJsonGeometry {
  if (coords.length === 0) {
    return { type: "Polygon", coordinates: [[]] };
  }
  const ring = coords.map((c) => [c.lng, c.lat]);
  // GeoJSON linear rings must close
  if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
    ring.push([...ring[0]]);
  }
  return {
    type: "Polygon",
    coordinates: [ring],
  };
}

/**
 * Parses and validates raw GeoJSON text or object. Returns array of LatLng vertices or throws error.
 */
export function parseAndValidateGeoJson(input: string | object): { coords: LatLng[]; area: number } {
  let parsed: unknown;
  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new Error("Invalid JSON format: Could not parse GeoJSON file.");
    }
  } else {
    parsed = input;
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid GeoJSON: Root must be a JSON object.");
  }

  const obj = parsed as Record<string, unknown>;

  let coordinates: number[][][] | undefined;

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    const polygonFeature = obj.features.find((f: any) => f?.geometry?.type === "Polygon" || f?.geometry?.type === "MultiPolygon");
    if (!polygonFeature || !polygonFeature.geometry) {
      throw new Error("GeoJSON FeatureCollection does not contain any Polygon or MultiPolygon features.");
    }
    coordinates = polygonFeature.geometry.coordinates;
  } else if (obj.type === "Feature" && obj.geometry && typeof obj.geometry === "object") {
    const geom = obj.geometry as Record<string, unknown>;
    if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
      coordinates = geom.coordinates as number[][][];
    } else {
      throw new Error(`Unsupported geometry type: ${geom.type}. Only Polygon/MultiPolygon are supported.`);
    }
  } else if (obj.type === "Polygon") {
    coordinates = obj.coordinates as number[][][];
  } else if (obj.type === "MultiPolygon") {
    const multi = obj.coordinates as number[][][][];
    if (Array.isArray(multi) && multi.length > 0) {
      coordinates = multi[0];
    }
  } else {
    throw new Error(`Invalid GeoJSON type: "${obj.type}". Expected Polygon, MultiPolygon, Feature, or FeatureCollection.`);
  }

  if (!Array.isArray(coordinates) || coordinates.length === 0 || !Array.isArray(coordinates[0])) {
    throw new Error("GeoJSON geometry contains no coordinate rings.");
  }

  const ring = coordinates[0];
  if (ring.length < 3) {
    throw new Error("Polygon boundary must contain at least 3 vertices.");
  }

  const coords: LatLng[] = [];
  for (let i = 0; i < ring.length; i++) {
    const pt = ring[i];
    if (!Array.isArray(pt) || pt.length < 2) {
      throw new Error(`Malformed coordinate at index ${i}: Expected [longitude, latitude].`);
    }
    const [lng, lat] = pt;
    if (typeof lng !== "number" || isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error(`Invalid longitude ${lng} at index ${i}. Must be between -180 and 180.`);
    }
    if (typeof lat !== "number" || isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude ${lat} at index ${i}. Must be between -90 and 90.`);
    }

    // Skip the closing redundant point if identical to first
    if (i === ring.length - 1 && coords.length > 0 && Math.abs(coords[0].lat - lat) < 1e-7 && Math.abs(coords[0].lng - lng) < 1e-7) {
      continue;
    }

    coords.push({ lat, lng });
  }

  if (coords.length < 3) {
    throw new Error("Polygon boundary must contain at least 3 unique vertices.");
  }

  const area = calculatePolygonArea(coords);
  return { coords, area };
}

/**
 * Parses KML XML string, extracts coordinates from <Polygon><outerBoundaryIs><LinearRing><coordinates>,
 * and returns validated LatLng vertices or throws error.
 */
export function parseAndValidateKml(kmlString: string): { coords: LatLng[]; area: number } {
  if (!kmlString || typeof kmlString !== "string") {
    throw new Error("Empty or invalid KML data provided.");
  }

  // Look for coordinates tags
  const coordRegex = /<coordinates[\s\S]*?>([\s\S]*?)<\/coordinates>/gi;
  const matches = [...kmlString.matchAll(coordRegex)];

  if (matches.length === 0) {
    throw new Error("No <coordinates> block found in KML file. Ensure this is a valid KML polygon export.");
  }

  // Find the coordinate block with polygon coordinates
  let bestCoords: LatLng[] = [];
  for (const match of matches) {
    const rawText = match[1].trim();
    if (!rawText) continue;

    // Split on whitespace or newlines
    const tuples = rawText.split(/\s+/).filter(Boolean);
    const parsedPts: LatLng[] = [];

    for (const tuple of tuples) {
      const parts = tuple.split(",").map((s) => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const [lng, lat] = parts;
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          parsedPts.push({ lat, lng });
        }
      }
    }

    // Check if last point closes the ring
    if (
      parsedPts.length > 3 &&
      Math.abs(parsedPts[0].lat - parsedPts[parsedPts.length - 1].lat) < 1e-7 &&
      Math.abs(parsedPts[0].lng - parsedPts[parsedPts.length - 1].lng) < 1e-7
    ) {
      parsedPts.pop();
    }

    if (parsedPts.length >= 3 && parsedPts.length > bestCoords.length) {
      bestCoords = parsedPts;
    }
  }

  if (bestCoords.length < 3) {
    throw new Error("Could not extract a valid polygon with at least 3 coordinates from KML.");
  }

  const area = calculatePolygonArea(bestCoords);
  return { coords: bestCoords, area };
}

/**
 * Indian States and Union Territories list for standardized localization
 */
export const INDIAN_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type IndianStateOrUT = (typeof INDIAN_STATES_AND_UTS)[number];
