/**
 * @file services/location.service.ts
 * @description Geocoding and Routing Services (Photon & OSRM APIs).
 * 
 * Provides:
 * 1. Place Autocomplete using the Komoot Photon open API.
 * 2. Route calculation and geometry path polylines using Project-OSRM.
 */

import type {
  LatLng,
  LocationError,
  LocationResult,
  PlaceSuggestion,
  RouteEstimate,
} from "@/types";

const PHOTON_BASE = "https://photon.komoot.io/api/";
const OSRM_BASE = "https://router.project-osrm.org";
const OSRM_PROFILE = "driving";
const DEFAULT_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;

/**
 * Categorizes network and fetch errors into typed LocationError representations.
 */
function classifyFetchError(err: unknown): LocationError {
  if (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "AbortError"
  ) {
    return { code: "aborted", message: "Request aborted." };
  }

  if (err instanceof Error) {
    return { code: "network", message: err.message };
  }

  return { code: "unknown", message: "Unknown location error." };
}

type PhotonFeature = {
  geometry?: {
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

/**
 * Transforms a raw GeoJSON feature into a normalized `PlaceSuggestion`.
 */
function toSuggestion(feature: PhotonFeature): PlaceSuggestion | null {
  const coords = feature.geometry?.coordinates;

  if (
    !Array.isArray(coords) ||
    coords.length < 2 ||
    typeof coords[0] !== "number" ||
    typeof coords[1] !== "number" ||
    !Number.isFinite(coords[0]) ||
    !Number.isFinite(coords[1])
  ) {
    return null;
  }

  // GeoJSON coordinates order: [longitude, latitude]
  const lng = coords[0];
  const lat = coords[1];
  const props = feature.properties ?? {};

  const osmType = typeof props.osm_type === "string" ? props.osm_type : "";
  const osmId =
    typeof props.osm_id === "number" || typeof props.osm_id === "string"
      ? String(props.osm_id)
      : "";

  const id = osmId ? `${osmType}${osmId}` : `${lat},${lng}`;

  const parts: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 0) {
      parts.push(value.trim());
    }
  };

  push(props.name);

  const houseNumber = typeof props.housenumber === "string" ? props.housenumber.trim() : "";
  const street = typeof props.street === "string" ? props.street.trim() : "";
  const streetLine = [houseNumber, street].filter(Boolean).join(" ");
  if (streetLine) parts.push(streetLine);

  push(props.city);
  push(props.state);
  push(props.country);

  // Remove consecutive duplicates
  const deduped: string[] = [];
  for (const part of parts) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== part) {
      deduped.push(part);
    }
  }

  const displayName = deduped.join(", ") || "Unknown location";
  const kind = typeof props.type === "string" ? props.type : undefined;

  return { id, displayName, lat, lng, kind };
}

/**
 * Searches for place suggestions using the Photon geocoding API.
 * 
 * @param {string} query - Location text query typed by user.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation when typing rapidly.
 * @returns {Promise<LocationResult<PlaceSuggestion[]>>}
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<LocationResult<PlaceSuggestion[]>> {
  const q = query.trim();

  if (q.length < MIN_QUERY_LENGTH) {
    return { ok: true, data: [] };
  }

  const url = `${PHOTON_BASE}?q=${encodeURIComponent(q)}&limit=${DEFAULT_LIMIT}`;

  try {
    const res = await fetch(url, { signal });

    if (res.status === 429) {
      return {
        ok: false,
        error: { code: "rate_limited", message: "Location search rate limit reached. Please slow down." },
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: { code: "network", message: `Location search failed (${res.status}).` },
      };
    }

    const payload = await res.json();
    if (
      typeof payload !== "object" ||
      payload === null ||
      (payload as { type?: unknown }).type !== "FeatureCollection"
    ) {
      return { ok: false, error: { code: "parse", message: "Unexpected location response format." } };
    }

    const features = (payload as { features?: unknown }).features;
    if (!Array.isArray(features)) {
      return { ok: false, error: { code: "parse", message: "Unexpected location features." } };
    }

    const results: PlaceSuggestion[] = [];
    for (const feature of features) {
      const suggestion = toSuggestion(feature as PhotonFeature);
      if (suggestion) results.push(suggestion);
    }

    return { ok: true, data: results };
  } catch (err) {
    return { ok: false, error: classifyFetchError(err) };
  }
}

/**
 * Reverse geocodes latitude and longitude into a readable `PlaceSuggestion`.
 * Uses the Komoot Photon open reverse geocoding API.
 * 
 * @param {number} lat - Latitude in degrees.
 * @param {number} lng - Longitude in degrees.
 * @param {AbortSignal} [signal] - Optional abort signal.
 * @returns {Promise<LocationResult<PlaceSuggestion>>}
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<LocationResult<PlaceSuggestion>> {
  const url = `${PHOTON_BASE.replace(/\/api\/?$/, "")}/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

  try {
    const res = await fetch(url, { signal });

    if (res.status === 429) {
      return {
        ok: false,
        error: { code: "rate_limited", message: "Reverse geocoding rate limit reached." },
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: { code: "network", message: `Reverse geocoding failed (${res.status}).` },
      };
    }

    const payload = await res.json();
    const features = payload?.features;

    if (Array.isArray(features) && features.length > 0) {
      const suggestion = toSuggestion(features[0] as PhotonFeature);
      if (suggestion) {
        return { ok: true, data: suggestion };
      }
    }

    // Fallback if no specific feature matched
    return {
      ok: true,
      data: {
        id: `gps-${lat.toFixed(5)},${lng.toFixed(5)}`,
        displayName: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
        kind: "current_location",
      },
    };
  } catch (err) {
    return { ok: false, error: classifyFetchError(err) };
  }
}


/**
 * Parses GeoJSON line coordinates into an array of LatLng points.
 */
function parseRouteCoordinates(geometry: unknown): LatLng[] {
  if (
    typeof geometry !== "object" ||
    geometry === null ||
    (geometry as { type?: unknown }).type !== "LineString"
  ) {
    return [];
  }

  const coordinates = (geometry as { coordinates?: unknown }).coordinates;
  if (!Array.isArray(coordinates)) return [];

  const routeCoordinates: LatLng[] = [];
  for (const coordinate of coordinates) {
    if (
      Array.isArray(coordinate) &&
      coordinate.length >= 2 &&
      typeof coordinate[0] === "number" &&
      typeof coordinate[1] === "number" &&
      Number.isFinite(coordinate[0]) &&
      Number.isFinite(coordinate[1])
    ) {
      // OSRM GeoJSON format: [longitude, latitude]
      routeCoordinates.push({ lat: coordinate[1], lng: coordinate[0] });
    }
  }

  return routeCoordinates;
}

/**
 * Calculates the driving route, distance, and duration between two coordinates using OSRM.
 * 
 * Note on OSRM API: Coordinate ordering in OSRM URL paths is `{lng},{lat};{lng},{lat}`.
 * 
 * @param {LatLng} pickup - Pickup latitude and longitude.
 * @param {LatLng} destination - Destination latitude and longitude.
 * @param {AbortSignal} [signal] - Optional abort signal.
 * @returns {Promise<LocationResult<RouteEstimate>>}
 */
export async function getRoute(
  pickup: LatLng,
  destination: LatLng,
  signal?: AbortSignal
): Promise<LocationResult<RouteEstimate>> {
  const coords = `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE}/route/v1/${OSRM_PROFILE}/${coords}?overview=full&geometries=geojson&alternatives=false&steps=false`;

  try {
    const res = await fetch(url, { signal });

    if (res.status === 429) {
      return {
        ok: false,
        error: { code: "rate_limited", message: "Routing service rate limit reached. Please retry shortly." },
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: { code: "network", message: `Routing service failed (${res.status}).` },
      };
    }

    const payload = await res.json();
    if (
      typeof payload !== "object" ||
      payload === null ||
      (payload as { code?: unknown }).code !== "Ok"
    ) {
      return { ok: false, error: { code: "not_found", message: "No route found between these locations." } };
    }

    const routes = (payload as { routes?: unknown }).routes;
    if (!Array.isArray(routes) || routes.length === 0) {
      return { ok: false, error: { code: "not_found", message: "No route found." } };
    }

    const first = routes[0] as {
      distance?: unknown;
      duration?: unknown;
      geometry?: unknown;
    };

    if (
      typeof first.distance !== "number" ||
      typeof first.duration !== "number" ||
      !Number.isFinite(first.distance) ||
      !Number.isFinite(first.duration)
    ) {
      return { ok: false, error: { code: "parse", message: "Unexpected routing data." } };
    }

    // Distance in metres -> km rounded to 3 decimals
    const distanceKm = Math.round((first.distance / 1000) * 1000) / 1000;
    // Duration in seconds -> minutes rounded
    const durationMinutes = Math.round(first.duration / 60);
    const routeCoordinates = parseRouteCoordinates(first.geometry);

    return {
      ok: true,
      data: {
        distanceKm,
        durationMinutes,
        routeCoordinates,
      },
    };
  } catch (err) {
    return { ok: false, error: classifyFetchError(err) };
  }
}
