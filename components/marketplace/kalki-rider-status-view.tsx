/**
 * @file components/marketplace/kalki-rider-status-view.tsx
 * @description Dedicated Rider Status Screen for active trip tracking and moving vehicle animation.
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { cancelCustomerRide, getDriverDetailsForRide, getCustomerRideById } from "@/app/actions/rides";
import type { RideSummary } from "@/types";

const AnimatedVehicleMap = dynamic(
  () => import("@/components/common/animated-vehicle-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] sm:h-[440px] w-full animate-pulse rounded-3xl bg-slate-100 flex items-center justify-center">
        <span className="text-xs text-slate-400 font-bold">Loading live navigation map...</span>
      </div>
    ),
  }
);

const KalkiMap = dynamic(() => import("./kalki-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] sm:h-[440px] w-full animate-pulse rounded-3xl bg-slate-100 flex items-center justify-center">
      <span className="text-xs text-slate-400 font-bold">Loading map...</span>
    </div>
  ),
});

interface DriverDetails {
  driver_id?: string;
  id?: string;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_location_updated_at: string | null;
  name?: string;
  phone?: string;
  vehicle_name?: string;
  vehicle_plate?: string;
  vehicle_info?: {
    make?: string;
    model?: string;
    plateNumber?: string;
    color?: string;
  } | unknown;
}

interface KalkiRiderStatusViewProps {
  ride: RideSummary;
  onBackToHome: () => void;
  onRideCancelled: () => void;
  onRideUpdated?: (ride: RideSummary) => void;
}

export default function KalkiRiderStatusView({
  ride,
  onBackToHome,
  onRideCancelled,
  onRideUpdated,
}: KalkiRiderStatusViewProps) {
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Fast poll ride status (every 2.5s) to detect driver accept, PIN entry, and completion
  useEffect(() => {
    let cancelled = false;
    const checkRideStatus = async () => {
      const res = await getCustomerRideById(ride.id);
      if (cancelled || !res.ok || !res.data) return;

      const updated = res.data;
      if (updated.status !== ride.status) {
        if (updated.status === "accepted") {
          toast.success("Driver accepted! Driver is on the way to pick you up.", { icon: "🛺" });
        } else if (updated.status === "in_progress") {
          toast.success("PIN verified by driver! Heading to your destination.", { icon: "🚀" });
        } else if (updated.status === "completed") {
          toast.success("Trip completed! Hope you had a great ride.", { icon: "🎉" });
        }
        onRideUpdated?.(updated);
      }
    };

    const interval = setInterval(checkRideStatus, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ride.id, ride.status, onRideUpdated]);

  // Poll driver live coordinates every 3s when accepted or in_progress
  useEffect(() => {
    if (ride.status !== "accepted" && ride.status !== "in_progress") {
      return;
    }

    let cancelled = false;
    const fetchDriver = async () => {
      const res = await getDriverDetailsForRide(ride.id);
      if (cancelled) return;
      if (res.ok && res.data) {
        setDriverDetails(res.data as unknown as DriverDetails);
      }
    };

    fetchDriver();
    const interval = setInterval(fetchDriver, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ride.id, ride.status]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this ride?")) return;
    setCancelling(true);
    try {
      const res = await cancelCustomerRide(ride.id);
      if (res.success) {
        toast.success("Ride cancelled successfully.");
        onRideCancelled();
      } else {
        toast.error(res.error || "Could not cancel ride.");
      }
    } catch {
      toast.error("Failed to cancel ride.");
    } finally {
      setCancelling(false);
    }
  };

  // Determine fallback driver location if driver GPS is not yet streaming
  const driverLat = driverDetails?.driver_lat ?? ride.pickupLat - 0.008;
  const driverLng = driverDetails?.driver_lng ?? ride.pickupLng - 0.007;

  // Dynamically extract locality or city from user's pickup address
  const pickupCity = useMemo(() => {
    if (!ride.pickupLocation) return "your area";
    const parts = ride.pickupLocation.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];
      if (last.toLowerCase() === "india" && secondLast) {
        return secondLast;
      }
      return parts[parts.length - 1] || parts[0];
    }
    return parts[0] || "your area";
  }, [ride.pickupLocation]);

  // Dynamically format assigned driver's vehicle make, model and plate
  const driverVehicleText = useMemo(() => {
    if (!driverDetails) return "Verified Vehicle";
    const v = driverDetails.vehicle_info as
      | { make?: string; model?: string; plateNumber?: string; color?: string }
      | undefined;
    if (v && (v.make || v.model || v.plateNumber)) {
      const model = `${v.color ? `${v.color} ` : ""}${v.make || ""} ${v.model || ""}`.trim();
      return [model, v.plateNumber].filter(Boolean).join(" • ") || "Verified Vehicle";
    }
    return [driverDetails.vehicle_name, driverDetails.vehicle_plate].filter(Boolean).join(" • ") || "Verified Vehicle";
  }, [driverDetails]);

  // Determine vehicle type based on fare or defaults
  const vehicleType: "auto" | "bike" | "cab" =
    ride.fare < 40 ? "bike" : ride.fare < 80 ? "auto" : "cab";

  const isAccepted = ride.status === "accepted";
  const isInProgress = ride.status === "in_progress";
  const isRequested = ride.status === "requested";

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Top Navigation Bar for Rider Status */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-xs">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
        >
          <span>←</span>
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            {isRequested
              ? "Finding Driver"
              : isAccepted
              ? "Driver On the Way"
              : "Trip In Progress"}
          </span>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
            isInProgress
              ? "bg-emerald-100 text-emerald-800"
              : isAccepted
              ? "bg-blue-100 text-blue-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {ride.status.replace("_", " ")}
        </span>
      </div>

      {/* Main Map View */}
      <div className="w-full">
        {isRequested ? (
          // Requested phase: pickup and destination map with radar banner
          <div className="relative">
            <KalkiMap
              pickup={{
                id: "pickup",
                displayName: ride.pickupLocation,
                lat: ride.pickupLat,
                lng: ride.pickupLng,
              }}
              destination={{
                id: "destination",
                displayName: ride.destinationLocation,
                lat: ride.destinationLat,
                lng: ride.destinationLng,
              }}
              className="h-[360px] sm:h-[420px] lg:h-[460px] w-full rounded-3xl"
            />
            {/* Radar searching banner floating over map */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-3 rounded-2xl bg-white/95 p-3.5 shadow-lg border border-slate-100 backdrop-blur-xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <span className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></span>
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-extrabold text-slate-900">
                  Contacting Nearby Drivers in {pickupCity}...
                </p>
                <p className="text-slate-500 mt-0.5">
                  Your request is broadcasted. A driver will accept shortly.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Accepted or In_Progress: Animated moving vehicle map!
          <AnimatedVehicleMap
            driverLat={driverLat}
            driverLng={driverLng}
            targetLat={isInProgress ? ride.destinationLat : ride.pickupLat}
            targetLng={isInProgress ? ride.destinationLng : ride.pickupLng}
            phase={isInProgress ? "in_progress" : "accepted"}
            vehicleType={vehicleType}
            etaMinutes={isInProgress ? Math.round(ride.estimatedDurationMinutes) : 4}
            className="h-[360px] sm:h-[420px] lg:h-[460px] w-full rounded-3xl"
          />
        )}
      </div>

      {/* Status Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. OTP PIN Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Trip Verification PIN
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isInProgress
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isInProgress ? "✓ Verified" : "Share with Driver"}
            </span>
          </div>

          <div className="my-2 flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div>
              <p className="text-3xl font-black tracking-widest text-slate-900 font-mono">
                {ride.pin || "4819"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isInProgress
                  ? "PIN verified! Trip is currently in progress."
                  : "Give this 4-digit code to the driver to start your ride."}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-2xl">
              🔐
            </div>
          </div>
        </div>

        {/* 2. Driver / Vehicle Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Driver Details
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${isRequested ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
              {isAccepted ? "Arriving Soon" : isInProgress ? "Driving" : "Assigning..."}
            </span>
          </div>

          {isRequested ? (
            <div className="flex items-center gap-3.5 my-2 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <span className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-xs text-slate-900">
                  Assigning Nearest Driver...
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Broadcasting trip to verified drivers in {pickupCity}.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 my-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#30264a] text-white font-black text-lg shadow-xs">
                {driverDetails?.name ? driverDetails.name.charAt(0).toUpperCase() : "D"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-black text-sm text-slate-900">
                    {driverDetails?.name || "Assigned Driver"}
                  </p>
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md">
                    5.0★
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold truncate mt-0.5">
                  {driverVehicleText}
                </p>
                {driverDetails?.phone && (
                  <p className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5">
                    {driverDetails.phone}
                  </p>
                )}
              </div>

              {driverDetails?.phone && (
                <a
                  href={`tel:${driverDetails.phone}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
                  title={`Call ${driverDetails.name || "driver"}`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trip Route & Fare Summary Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Route & Fare
            </p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              Trip #{ride.id.slice(0, 8)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Total Fare</span>
            <p className="text-lg font-black text-blue-600">
              ₹{ride.fare.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pickup & Destination */}
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3">
            <span className="h-3 w-3 rounded-full bg-blue-600 mt-0.5 ring-4 ring-blue-100 shrink-0"></span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase text-slate-400">Pickup Location</p>
              <p className="font-bold text-slate-800 text-sm">{ride.pickupLocation}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-600 mt-0.5 ring-4 ring-emerald-100 shrink-0"></span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase text-slate-400">Drop Location</p>
              <p className="font-bold text-slate-800 text-sm">{ride.destinationLocation}</p>
            </div>
          </div>
        </div>

        {/* Distance & Time stats */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 font-medium">
          <span>Distance: <strong className="text-slate-800">{ride.distanceKm.toFixed(1)} km</strong></span>
          <span>Est. Time: <strong className="text-slate-800">{Math.round(ride.estimatedDurationMinutes)} mins</strong></span>
          <span>Payment: <strong className="text-slate-800">Cash on Drop</strong></span>
        </div>

        {/* Cancel button if waiting or accepted */}
        {(isRequested || isAccepted) && (
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancel}
            className="w-full rounded-2xl border border-red-200 bg-red-50/60 py-3 text-center text-xs font-black text-red-600 hover:bg-red-100 transition active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {cancelling ? "Cancelling Trip..." : "Cancel Ride"}
          </button>
        )}
      </div>
    </div>
  );
}
