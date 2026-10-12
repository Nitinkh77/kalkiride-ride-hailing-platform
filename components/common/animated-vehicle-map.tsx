/**
 * @file components/common/animated-vehicle-map.tsx
 * @description Real-Time Interactive Navigation Map with Animated Moving Vehicle SVG.
 * 
 * Works on both Customer (Rider Status) and Driver Navigation views.
 * Features:
 * 1. Phase "accepted": Shows Driver position, User pickup location, and connecting route.
 * 2. Phase "in_progress": Shows moving Car or Auto Rickshaw SVG progressing smoothly
 *    along the road route towards the destination, rotating along the road curves.
 * 3. Responsive Leaflet map with OpenStreetMap tiles and automatic size invalidation.
 */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { getRoute } from "@/services/location.service";
import type { LatLng } from "@/types";
import { createVehicleIcon } from "@/components/map/vehicle-markers";
import { toMapVehicleType } from "@/components/map/vehicle-svg";

// User current location / pickup marker
const pickupPinIcon = L.divIcon({
  className: "custom-pickup-pin",
  html: `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(217, 45, 58, 0.25); animation: ping 1.6s infinite;"></span>
      <div style="width: 16px; height: 16px; border-radius: 50%; background: #d92d3a; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(217,45,58,0.55); position: relative; z-index: 2;"></div>
    </div>
    <style>@keyframes ping{75%,100%{transform:scale(1.6);opacity:0}}</style>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Destination marker
const destinationPinIcon = L.divIcon({
  className: "custom-dest-pin",
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.22));">
      <div style="background: #211c2d; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; white-space: nowrap; margin-bottom: 2px; border: 1px solid rgba(255,255,255,0.85);">
        Destination
      </div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background: #f4b544; border: 3px solid #ffffff;"></div>
      <div style="width: 2px; height: 8px; background: #f4b544; margin-top: -1px;"></div>
    </div>
  `,
  iconSize: [90, 48],
  iconAnchor: [45, 48],
});

function calculateBearing(p1: [number, number], p2: [number, number]): number {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

interface MapViewportProps {
  positions: [number, number][];
}

function MapViewportController({ positions }: MapViewportProps) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (positions.length < 2) return;
    try {
      map.fitBounds(L.latLngBounds(positions), {
        padding: [60, 60],
        maxZoom: 16,
      });
    } catch {
      // safe fallback
    }
  }, [map, positions]);

  return null;
}

export interface AnimatedVehicleMapProps {
  driverLat: number;
  driverLng: number;
  targetLat: number;
  targetLng: number;
  phase: "accepted" | "in_progress" | "requested";
  vehicleType?: "auto" | "bike" | "cab" | "car";
  etaMinutes?: number | null;
  className?: string;
}

export default function AnimatedVehicleMap({
  driverLat,
  driverLng,
  targetLat,
  targetLng,
  phase,
  vehicleType = "auto",
  etaMinutes,
  className = "h-[340px] sm:h-[400px] lg:h-[450px] w-full",
}: AnimatedVehicleMapProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(true);

  // Animated moving vehicle progress index (from 0 to routeCoords.length - 1)
  const [progressIndex, setProgressIndex] = useState(0);

  // Helper to densify route points so the vehicle glides smoothly without jumping
  function densifyRoute(coords: [number, number][], maxStepKm = 0.03): [number, number][] {
    if (coords.length < 2) return coords;
    const result: [number, number][] = [coords[0]];
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const dLat = p2[0] - p1[0];
      const dLng = p2[1] - p1[1];
      const dist = Math.hypot(dLat, dLng) * 111; // ~km
      const steps = Math.max(1, Math.ceil(dist / maxStepKm));
      for (let s = 1; s <= steps; s++) {
        const frac = s / steps;
        result.push([p1[0] + dLat * frac, p1[1] + dLng * frac]);
      }
    }
    return result;
  }

  // Fetch route between origin and target
  useEffect(() => {
    let cancelled = false;
    const originLat = driverLat;
    const originLng = driverLng;

    (async () => {
      setRouteLoading(true);
      const res = await getRoute(
        { lat: originLat, lng: originLng },
        { lat: targetLat, lng: targetLng }
      );

      if (!cancelled && res.ok && res.data && res.data.routeCoordinates.length > 0) {
        const rawCoords = res.data.routeCoordinates.map(
          (c: LatLng) => [c.lat, c.lng] as [number, number]
        );
        const smoothCoords = densifyRoute(rawCoords, 0.025);
        setRouteCoords(smoothCoords);
        setProgressIndex(0);
      } else if (!cancelled) {
        // Fallback straight line densified
        const rawCoords: [number, number][] = [
          [originLat, originLng],
          [(originLat + targetLat) / 2 + 0.001, (originLng + targetLng) / 2 - 0.001],
          [targetLat, targetLng],
        ];
        setRouteCoords(densifyRoute(rawCoords, 0.02));
        setProgressIndex(0);
      }
      if (!cancelled) setRouteLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [driverLat, driverLng, targetLat, targetLng, phase]);

  // Smooth continuous animation of the vehicle along the route towards destination
  useEffect(() => {
    if (phase !== "in_progress" || routeCoords.length < 2) return;

    let animId: number;
    let lastTime = performance.now();
    let currentIdx = 0;
    let pauseCounter = 0;

    const animate = (now: number) => {
      const delta = now - lastTime;
      // Step forward along dense points every 160ms for smooth progress
      if (delta > 160) {
        lastTime = now;
        if (currentIdx >= routeCoords.length - 1) {
          // Pause at destination for ~2.5 seconds, then repeat demo smoothly
          pauseCounter++;
          if (pauseCounter > 15) {
            pauseCounter = 0;
            currentIdx = 0;
            setProgressIndex(0);
          }
        } else {
          currentIdx++;
          setProgressIndex(currentIdx);
        }
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [phase, routeCoords]);

  // Current position and bearing angle of the moving vehicle
  const { currentPos, bearingAngle } = useMemo(() => {
    if (phase === "in_progress" && routeCoords.length > 1) {
      const safeIndex = Math.min(progressIndex, routeCoords.length - 1);
      const p1 = routeCoords[safeIndex] || [driverLat, driverLng];
      const nextIdx = Math.min(safeIndex + 1, routeCoords.length - 1);
      const p2 = routeCoords[nextIdx] || p1;
      const angle = calculateBearing(p1, p2);
      return { currentPos: p1, bearingAngle: angle };
    }

    // Phase accepted: vehicle positioned at driverLat/driverLng facing pickup
    const angle = calculateBearing([driverLat, driverLng], [targetLat, targetLng]);
    return { currentPos: [driverLat, driverLng] as [number, number], bearingAngle: angle };
  }, [phase, routeCoords, progressIndex, driverLat, driverLng, targetLat, targetLng]);

  // Dynamic Leaflet DivIcon for the vehicle (shared top-down artwork)
  const vehicleIcon = useMemo(
    () => createVehicleIcon(toMapVehicleType(vehicleType), bearingAngle),
    [vehicleType, bearingAngle],
  );

  const center: [number, number] = [
    (driverLat + targetLat) / 2,
    (driverLng + targetLng) / 2,
  ];

  const positions: [number, number][] = [
    [driverLat, driverLng],
    [targetLat, targetLng],
  ];

  const isInProgress = phase === "in_progress";

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200 shadow-md ${className}`}>
      <MapContainer
        center={center}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* 1. Moving Vehicle Marker (Auto / Car / Bike SVG) */}
        <Marker position={currentPos} icon={vehicleIcon} />

        {/* 2. Target Marker: Pickup (when accepted) or Destination (when in_progress) */}
        <Marker
          position={[targetLat, targetLng]}
          icon={isInProgress ? destinationPinIcon : pickupPinIcon}
        />

        {/* 3. Trajectory Polyline */}
        {routeCoords.length > 0 && (
          <>
            {/* Full remaining route */}
            <Polyline
              positions={routeCoords}
              color={isInProgress ? "#3f3260" : "#5e4c8e"}
              weight={5}
              opacity={0.85}
              dashArray={isInProgress ? undefined : "10 6"}
            />
            {/* Progress trail if in progress */}
            {isInProgress && progressIndex > 0 && (
              <Polyline
                positions={routeCoords.slice(0, progressIndex + 1)}
                color="#10b981"
                weight={6}
                opacity={0.95}
              />
            )}
          </>
        )}

        <MapViewportController positions={positions} />
      </MapContainer>

      {/* Floating Status & ETA Badge */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2 shadow-md border border-slate-100 backdrop-blur-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black text-slate-800">
            {isInProgress ? "En Route to Destination" : "Driver Approaching"}
          </span>
          {etaMinutes != null && (
            <span className="ml-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700">
              {etaMinutes < 1 ? "Arrived" : `~${etaMinutes}m`}
            </span>
          )}
        </div>

        {/* Vehicle Badge */}
        <div className="rounded-xl bg-slate-900/90 px-3 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-xs">
          {vehicleType === "auto"
            ? "🛺 Auto Rickshaw"
            : vehicleType === "bike"
            ? "🏍️ Kalki Bike"
            : "🚕 Kalki Cab"}
        </div>
      </div>

      {/* Live Routing Indicator */}
      {routeLoading && (
        <div className="absolute top-4 left-4 z-10 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm border border-slate-100 backdrop-blur-xs flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></span>
          Calculating Road Path...
        </div>
      )}

      {/* Legend pill at bottom */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-xl bg-white/95 px-3 py-2 shadow-md border border-slate-100 backdrop-blur-xs text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-400 border border-white"></span>
          <span className="font-bold text-slate-700">
            {isInProgress ? "Moving Vehicle" : "Driver"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-3 w-3 rounded-full ${
              isInProgress ? "bg-emerald-600" : "bg-blue-600"
            } border border-white`}
          ></span>
          <span className="font-bold text-slate-700">
            {isInProgress ? "Destination" : "Your Pickup"}
          </span>
        </div>
      </div>
    </div>
  );
}
