/**
 * @file components/driver/driver-nav-map.tsx
 * @description Driver Navigation Map with moving vehicle toward destination.
 */

"use client";

import dynamic from "next/dynamic";
import React from "react";

const AnimatedVehicleMap = dynamic(
  () => import("@/components/common/animated-vehicle-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-80 w-full animate-pulse rounded-2xl bg-slate-100 flex items-center justify-center">
        <span className="text-xs text-slate-400 font-bold">Loading driver navigation map...</span>
      </div>
    ),
  }
);

interface DriverNavMapProps {
  driverLat: number;
  driverLng: number;
  targetLat: number;
  targetLng: number;
  phase: "accepted" | "in_progress";
  etaMinutes?: number | null;
  vehicleType?: "auto" | "bike" | "cab" | "car";
}

export default function DriverNavMap({
  driverLat,
  driverLng,
  targetLat,
  targetLng,
  phase,
  etaMinutes,
  vehicleType = "auto",
}: DriverNavMapProps) {
  return (
    <AnimatedVehicleMap
      driverLat={driverLat}
      driverLng={driverLng}
      targetLat={targetLat}
      targetLng={targetLng}
      phase={phase}
      vehicleType={vehicleType}
      etaMinutes={etaMinutes}
      className="h-64 sm:h-80 w-full"
    />
  );
}
