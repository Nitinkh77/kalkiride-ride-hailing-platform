/**
 * @file types/location.ts
 * @description Geolocation, Mapping, and Routing Domain Types.
 * 
 * Shared, runtime-free types for the location layer. Safe to import
 * from both client and server modules.
 */

/**
 * Standard Latitude and Longitude coordinate pair.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Place suggestion returned by the Photon geocoding service.
 */
export interface PlaceSuggestion {
  /** Stable unique key — e.g. OpenStreetMap identifier or coordinate pair */
  id: string;
  /** Human-readable place name (e.g., "Connaught Place, New Delhi") */
  displayName: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Location category (e.g., "house", "street", "city") */
  kind?: string;
}

/**
 * Standardized error codes for location and routing operations.
 */
export type LocationErrorCode =
  | "network"
  | "rate_limited"
  | "not_found"
  | "parse"
  | "aborted"
  | "unknown";

/**
 * Encapsulates an error from a geocoding or routing query.
 */
export interface LocationError {
  code: LocationErrorCode;
  message: string;
}

/**
 * Driving route estimation returned by OSRM.
 */
export interface RouteEstimate {
  /** Total driving distance in kilometers */
  distanceKm: number;
  /** Estimated travel time in minutes */
  durationMinutes: number;
  /** Array of coordinates representing the driving path for map polylines */
  routeCoordinates: LatLng[];
}

/**
 * Discriminated union result pattern used across location helpers.
 * Guarantees callers explicitly check `ok` without needing try/catch blocks.
 */
export type LocationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: LocationError };
