import { config, type StyleSpecification } from "maplibre-gl";

// Configure MapLibre web worker URL to point to static worker asset in public/, avoiding bundling 404s
if (typeof window !== "undefined" && config) {
  config.WORKER_URL = "/maplibre-gl-worker.mjs";
}

/**
 * Returns the active MapLibre raster style specification.
 *
 * If VITE_CARTO_API_KEY is configured in the environment, uses official CARTO
 * Voyager tiles with the authenticated ?api_key query parameter.
 *
 * If no CARTO key is provided, falls back cleanly to the official OpenStreetMap
 * Standard raster tile service (https://tile.openstreetmap.org/{z}/{x}/{y}.png),
 * providing crisp, watermark-free basemap tiles under standard ODbL attribution.
 */
export function getBasemapStyle(): StyleSpecification {
  const cartoKey =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_CARTO_API_KEY
      ? (import.meta.env.VITE_CARTO_API_KEY as string).trim()
      : "";

  if (cartoKey) {
    return {
      version: 8,
      sources: {
        "carto-voyager": {
          type: "raster",
          tiles: [
            `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=${cartoKey}`,
            `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=${cartoKey}`,
            `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=${cartoKey}`,
          ],
          tileSize: 256,
          maxzoom: 20,
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
  }

  // Official OpenStreetMap Standard Tile Layer — free of proprietary watermark & API-key requirements
  return {
    version: 8,
    sources: {
      "osm-standard": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: "osm-standard-layer",
        type: "raster",
        source: "osm-standard",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

export function getBasemapAttribution(): string {
  const cartoKey =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_CARTO_API_KEY
      ? (import.meta.env.VITE_CARTO_API_KEY as string).trim()
      : "";

  return cartoKey
    ? "TerraTrust AI GIS · © OpenStreetMap contributors, © CARTO"
    : "TerraTrust AI GIS · © OpenStreetMap contributors";
}

export function getBasemapProviderInfo() {
  const cartoKey =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_CARTO_API_KEY
      ? (import.meta.env.VITE_CARTO_API_KEY as string).trim()
      : "";

  return {
    provider: cartoKey
      ? ("CARTO Voyager (authenticated)" as const)
      : ("OpenStreetMap Standard" as const),
    keyConfigured: !!cartoKey,
    tilePattern: cartoKey
      ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=***"
      : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  };
}
