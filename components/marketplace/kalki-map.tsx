/**
 * @file components/marketplace/kalki-map.tsx
 * @description Working Interactive Leaflet Map for KalkiRide.
 * 
 * Features:
 * 1. OpenStreetMap vector/raster tile rendering with automatic size invalidation.
 * 2. Draggable or clickable markers for pickup and drop location.
 * 3. Polyline route with animated car markers.
 * 4. Working floating controls: GPS locate, Recenter route, Zoom in, Zoom out.
 * 5. Top-left floating "Your current location" pill.
 */

"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng, PlaceSuggestion } from "@/types";
import { bearingBetween, createVehicleIcon } from "@/components/map/vehicle-markers";
import type { MapVehicleType } from "@/components/map/vehicle-svg";

// ─── Tiles ────────────────────────────────────────────────────────────────────
// Default: the official OpenStreetMap tile server (keyless, attribution required) in BOTH
// themes. Tiles are never filtered or recoloured.
// To use a dedicated dark/other provider (many require an API key), set:
//   NEXT_PUBLIC_MAP_TILES_LIGHT / NEXT_PUBLIC_MAP_TILES_DARK            (tile URL template)
//   NEXT_PUBLIC_MAP_ATTRIBUTION_LIGHT / NEXT_PUBLIC_MAP_ATTRIBUTION_DARK (provider's required credit)
// NEXT_PUBLIC_* values are visible in the browser, so restrict any key to your domain.
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const CUSTOM_LIGHT_URL = process.env.NEXT_PUBLIC_MAP_TILES_LIGHT;
const CUSTOM_DARK_URL = process.env.NEXT_PUBLIC_MAP_TILES_DARK;

// OpenStreetMap has no dark style and tiles are never filtered. Night mode keeps the standard
// map unless a dedicated dark provider is configured via NEXT_PUBLIC_MAP_TILES_DARK.
const TILE_SETS = {
  light: {
    url: CUSTOM_LIGHT_URL || OSM_URL,
    attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION_LIGHT || OSM_ATTRIBUTION,
  },
  dark: {
    url: CUSTOM_DARK_URL || CUSTOM_LIGHT_URL || OSM_URL,
    attribution:
      process.env.NEXT_PUBLIC_MAP_ATTRIBUTION_DARK ||
      process.env.NEXT_PUBLIC_MAP_ATTRIBUTION_LIGHT ||
      OSM_ATTRIBUTION,
  },
};
// True only when the basemap itself is dark (a configured dark provider)
const HAS_DARK_BASEMAP = Boolean(CUSTOM_DARK_URL);

function subscribeToTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const getIsDark = () => document.documentElement.classList.contains("dark");

// ─── Custom HTML DivIcons matching screenshot ────────────────────────────────

// Compact pins with a solid label. Colours follow the theme tokens (pickup red, destination saffron).
const MARKER_COLORS = {
  light: { pickup: "#d92d3a", destination: "#f4b544" },
  dark: { pickup: "#ff626a", destination: "#ffc04d" },
};

function pinSvg(fill: string, dot: string) {
  return `<svg width="28" height="36" viewBox="0 0 34 44" aria-hidden="true"><ellipse cx="17" cy="41" rx="7" ry="2.5" fill="#000" opacity=".25"/><path d="M17 40C17 40 4 26 4 16a13 13 0 0126 0C30 26 17 40 17 40Z" fill="${fill}" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/><circle cx="17" cy="16" r="5" fill="${dot}"/></svg>`;
}

function createEndpointIcon(kind: "pickup" | "destination", isDark: boolean) {
  const colors = isDark ? MARKER_COLORS.dark : MARKER_COLORS.light;
  const fill = kind === "pickup" ? colors.pickup : colors.destination;
  const dot = kind === "pickup" ? "#ffffff" : "#211c2d";
  const label = kind === "pickup" ? "Pickup" : "Destination";
  return L.divIcon({
    className: "kalki-pin",
    html: `<div style="display:flex;flex-direction:column;align-items:center;width:90px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));cursor:grab;">
      <span style="background:#211c2d;color:#fff;font:700 11px/1 system-ui,sans-serif;letter-spacing:.01em;padding:4px 7px;border-radius:6px;margin-bottom:2px;border:1px solid rgba(255,255,255,.85);white-space:nowrap;">${label}</span>
      ${pinSvg(fill, dot)}
    </div>`,
    iconSize: [90, 58],
    iconAnchor: [45, 55],
  });
}

interface MapControllerProps {
  pickup: LatLng;
  destination?: LatLng | null;
  routeCoordinates?: LatLng[];
  onMapClick?: (lat: number, lng: number) => void;
}

// Extra top/right padding keeps the route clear of the location pill and map controls
const FIT_OPTIONS: L.FitBoundsOptions = {
  paddingTopLeft: [40, 84],
  paddingBottomRight: [76, 40],
  maxZoom: 16,
};

function MapController({
  pickup,
  destination,
  routeCoordinates,
  onMapClick,
}: MapControllerProps) {
  const map = useMap();

  // Keep tiles complete on mount and whenever the container resizes (sheet, orientation, drawer)
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 250);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);

  // Adjust viewport to fit locations or route
  useEffect(() => {
    if (!destination) {
      map.setView([pickup.lat, pickup.lng], 15, { animate: true });
      return;
    }

    try {
      if (routeCoordinates && routeCoordinates.length > 1) {
        const bounds = L.latLngBounds(
          routeCoordinates.map((c) => [c.lat, c.lng])
        );
        map.fitBounds(bounds, FIT_OPTIONS);
      } else {
        const bounds = L.latLngBounds(
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng]
        );
        map.fitBounds(bounds, FIT_OPTIONS);
      }
    } catch {
      // Map may not be ready yet
    }
  }, [map, pickup.lat, pickup.lng, destination, routeCoordinates]);

  // Listen for click events on map
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

interface KalkiMapProps {
  pickup: PlaceSuggestion;
  destination: PlaceSuggestion | null;
  routeCoordinates?: LatLng[];
  onOpenPickupSelect?: () => void;
  onLocateMe?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  onPickupDrag?: (lat: number, lng: number) => void;
  onDestinationDrag?: (lat: number, lng: number) => void;
  /** Vehicle category drawn for the illustrative route markers. */
  vehicleType?: MapVehicleType;
  className?: string;
}

export default function KalkiMap({
  pickup,
  destination,
  routeCoordinates = [],
  onOpenPickupSelect,
  onLocateMe,
  onMapClick,
  onPickupDrag,
  onDestinationDrag,
  vehicleType = "cab",
  className = "h-[340px] sm:h-[400px] lg:h-[440px] w-full",
}: KalkiMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const tileErrors = useRef(0);
  const [tilesFailed, setTilesFailed] = useState(false);
  const isDark = useSyncExternalStore(subscribeToTheme, getIsDark, () => false);
  const tiles = isDark ? TILE_SETS.dark : TILE_SETS.light;
  const darkBasemap = isDark && HAS_DARK_BASEMAP;
  const pickupIcon = useMemo(() => createEndpointIcon("pickup", isDark), [isDark]);
  const destinationIcon = useMemo(() => createEndpointIcon("destination", isDark), [isDark]);
  const [tilesReady, setTilesReady] = useState(false);

  const center: [number, number] = useMemo(() => [
    destination ? (pickup.lat + destination.lat) / 2 : pickup.lat,
    destination ? (pickup.lng + destination.lng) / 2 : pickup.lng,
  ], [pickup.lat, pickup.lng, destination]);

  // Illustrative vehicle markers placed on the real route geometry and rotated to its
  // bearing. The app has no live driver coordinates here, so these are not drivers.
  const routePositions = useMemo<[number, number][]>(
    () => routeCoordinates.map((p) => [p.lat, p.lng]),
    [routeCoordinates],
  );

  const vehicleMarkers = useMemo(() => {
    if (routeCoordinates.length <= 8) return [];
    return [0.38, 0.68].map((fraction) => {
      const idx = Math.floor(routeCoordinates.length * fraction);
      const here = routeCoordinates[idx];
      const ahead = routeCoordinates[Math.min(idx + 3, routeCoordinates.length - 1)];
      return { pos: here, icon: createVehicleIcon(vehicleType, bearingBetween(here, ahead)) };
    });
  }, [routeCoordinates, vehicleType]);

  // Working Map Controls
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleCenterRoute = () => {
    if (!mapRef.current) return;
    if (destination) {
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      );
      mapRef.current.fitBounds(bounds, FIT_OPTIONS);
    } else {
      mapRef.current.setView([pickup.lat, pickup.lng], 15, { animate: true });
    }
  };

  return (
    <div className={`relative overflow-hidden w-full ${className}`}>
      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        ref={(instance) => {
          if (instance) {
            mapRef.current = instance;
          }
        }}
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          key={isDark ? "tiles-dark" : "tiles-light"}
          attribution={tiles.attribution}
          url={tiles.url}
                    maxZoom={19}
          eventHandlers={{
            tileerror: () => {
              tileErrors.current += 1;
              if (tileErrors.current >= 6) setTilesFailed(true);
            },
            tileload: () => {
              setTilesReady(true);
              if (tileErrors.current > 0) {
                tileErrors.current = 0;
                setTilesFailed(false);
              }
            },
          }}
        />

        {/* Pickup animated dot / draggable marker */}
        <Marker
          position={[pickup.lat, pickup.lng]}
          icon={pickupIcon}
          draggable={Boolean(onPickupDrag)}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              onPickupDrag?.(pos.lat, pos.lng);
            },
          }}
        />

        {/* Destination pin with badge / draggable */}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
            draggable={Boolean(onDestinationDrag)}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                onDestinationDrag?.(pos.lat, pos.lng);
              },
            }}
          />
        )}

        {/* Road route: casing + line, colours chosen per theme for contrast */}
        {routePositions.length > 0 && (
          <>
            <Polyline
              positions={routePositions}
              interactive={false}
              pathOptions={{
                color: darkBasemap ? "#100d18" : "#ffffff",
                weight: 9,
                opacity: darkBasemap ? 0.9 : 0.95,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={routePositions}
              interactive={false}
              pathOptions={{
                color: darkBasemap ? "#b8a9f0" : "#3f3260",
                weight: 5,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {/* Illustrative vehicles on the route (non-interactive, below the pins) */}
        {vehicleMarkers.map((m, idx) => (
          <Marker
            key={`vehicle-${idx}-${m.pos.lat}-${m.pos.lng}-${vehicleType}`}
            position={[m.pos.lat, m.pos.lng]}
            icon={m.icon}
            interactive={false}
            keyboard={false}
            zIndexOffset={-200}
          />
        ))}

        <MapController
          pickup={pickup}
          destination={destination}
          routeCoordinates={routeCoordinates}
          onMapClick={onMapClick}
        />
      </MapContainer>

      {!tilesReady && !tilesFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-slate-100 animate-pulse"
        >
          <span className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-600">Loading map…</span>
        </div>
      )}

      {tilesFailed && (
        <div
          role="status"
          className="absolute inset-x-3 top-16 z-10 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-md"
        >
          Map tiles couldn&apos;t load. Check your connection and try again.
        </div>
      )}

      {vehicleMarkers.length > 0 && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
          Illustrative vehicles · not live
        </div>
      )}

      {/* Floating Top-Left "Your current location" Pill */}
      <button
        type="button"
        onClick={onOpenPickupSelect}
        className="absolute top-4 left-4 z-10 flex items-center gap-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-slate-100 backdrop-blur-xs transition hover:bg-white active:scale-98 max-w-[85%] md:max-w-sm text-left cursor-pointer"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div className="min-w-0 pr-1">
          <p className="text-[11px] font-bold text-slate-800 leading-tight">
            Pickup
          </p>
          <p className="truncate text-xs text-slate-500 font-medium">
            {pickup.displayName || "Current Location"}
          </p>
        </div>
        <svg
          className="h-4 w-4 shrink-0 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Floating Top-Right Working Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* GPS Target / Locate Me */}
        <button
          type="button"
          onClick={onLocateMe}
          title="Locate my position (GPS)"
          aria-label="Locate my position (GPS)"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-100 backdrop-blur-xs transition hover:bg-slate-50 hover:text-blue-600 active:scale-95 cursor-pointer"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2v3m0 14v3m10-10h-3M5 12H2"
            />
          </svg>
        </button>

        {/* Center / Recenter Route */}
        <button
          type="button"
          onClick={handleCenterRoute}
          title="Recenter route bounds"
          aria-label="Recenter route bounds"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-100 backdrop-blur-xs transition hover:bg-slate-50 hover:text-blue-600 active:scale-95 cursor-pointer"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </button>

        {/* Zoom In Button */}
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-100 backdrop-blur-xs text-base font-bold hover:bg-slate-50 hover:text-blue-600 active:scale-95 cursor-pointer"
        >
          +
        </button>

        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-100 backdrop-blur-xs text-base font-bold hover:bg-slate-50 hover:text-blue-600 active:scale-95 cursor-pointer"
        >
          −
        </button>
      </div>
    </div>
  );
}
