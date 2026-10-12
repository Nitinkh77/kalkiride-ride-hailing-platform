/**
 * @file components/customer/ride-waiting.tsx
 * @description Customer Live Ride Tracking & Waiting Screen.
 * 
 * Features:
 * 1. Live Driver Polling (every 4s) when ride is accepted or in progress.
 * 2. Calculates and displays live driver ETA to customer pickup point.
 * 3. Shows driver name, phone number, vehicle plate, make, model, and color.
 * 4. Displays real-time status transitions: "requested" -> "accepted" -> "in_progress".
 */

"use client";

import type { RideSummary } from "@/types";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getDriverDetailsForRide, cancelCustomerRide } from "@/app/actions/rides";
import { getRoute } from "@/services/location.service";
import { formatDuration, getRidePin } from "@/lib/format";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Dynamically imported — Leaflet requires browser APIs (no SSR)
const DriverTrackingMap = dynamic(() => import("./driver-tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="h-64 sm:h-80 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
      <span className="text-xs text-slate-400 font-medium">Loading map…</span>
    </div>
  ),
});

interface RideWaitingProps {
  /** Summary of the active ride */
  ride: RideSummary;
  /** Optional callback fired when the ride is cancelled */
  onCancel?: () => void;
}

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicle_info: unknown;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_location_updated_at: string | null;
}

/**
 * Live Ride Waiting and In-Progress Status Screen.
 * 
 * @param {RideWaitingProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function RideWaiting({ ride, onCancel }: RideWaitingProps) {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [driverEta, setDriverEta] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  /**
   * Cancels the active ride request and clears stored session locations.
   */
  const handleCancelRide = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this ride request?"
    );
    if (!confirmed) return;

    setCancelling(true);
    const res = await cancelCustomerRide(ride.id);

    if (res.success) {
      toast.success("Ride cancelled successfully.");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("kalkiride_pickup");
        sessionStorage.removeItem("kalkiride_destination");
      }
      if (onCancel) {
        onCancel();
      } else {
        router.refresh();
      }
    } else {
      toast.error(res.error || "Failed to cancel ride. Please try again.");
      setCancelling(false);
    }
  };

  /**
   * Polls the driver assignment details every 4 seconds once accepted.
   */
  useEffect(() => {
    if (ride.status !== "accepted" && ride.status !== "in_progress") {
      return;
    }

    let cancelled = false;

    const loadDriver = async () => {
      const result = await getDriverDetailsForRide(ride.id);
      if (!cancelled && result.ok) {
        setDriver(result.data);
      }
    };

    loadDriver();
    const interval = window.setInterval(loadDriver, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [ride.id, ride.status]);

  const showDriverEta =
    driver?.driver_lat != null &&
    driver?.driver_lng != null &&
    (ride.status === "accepted" || ride.status === "in_progress");

  /**
   * Recalculates driver ETA to pickup location (or destination when in_progress)
   * whenever driver GPS location shifts.
   */
  useEffect(() => {
    if (
      !showDriverEta ||
      driver?.driver_lat == null ||
      driver?.driver_lng == null
    ) {
      return;
    }

    let cancelled = false;

    const calculateDriverEta = async () => {
      const targetLat =
        ride.status === "in_progress" ? ride.destinationLat : ride.pickupLat;
      const targetLng =
        ride.status === "in_progress" ? ride.destinationLng : ride.pickupLng;

      const result = await getRoute(
        { lat: driver.driver_lat!, lng: driver.driver_lng! },
        { lat: targetLat, lng: targetLng }
      );

      if (!cancelled && result.ok) {
        setDriverEta(result.data.durationMinutes);
      }
    };

    calculateDriverEta();
    return () => {
      cancelled = true;
    };
  }, [
    showDriverEta,
    driver?.driver_lat,
    driver?.driver_lng,
    ride.status,
    ride.pickupLat,
    ride.pickupLng,
    ride.destinationLat,
    ride.destinationLng,
  ]);

  const formattedFare = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: ride.currency,
    maximumFractionDigits: 2,
  }).format(ride.fare);

  const vehicleInfo =
    driver?.vehicle_info &&
    typeof driver.vehicle_info === "object"
      ? (driver.vehicle_info as {
          make?: string;
          model?: string;
          plateNumber?: string;
          color?: string;
        })
      : null;

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Ride Status
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            {ride.status === "requested"
              ? "Waiting for a driver to accept..."
              : ride.status === "accepted"
                ? "Driver accepted your ride"
                : "Ride in progress"}
          </h2>
        </div>

        {/* Top Cancel Action Button */}
        {ride.status !== "completed" && (
          <button
            type="button"
            onClick={handleCancelRide}
            disabled={cancelling}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 hover:border-red-300 transition disabled:opacity-50 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {cancelling ? "Cancelling..." : "Cancel Ride"}
          </button>
        )}
      </div>

      {ride.status === "requested" && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-blue-900 shadow-sm">
          <span className="relative flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-blue-600"></span>
          </span>
          <div>
            <p className="text-sm font-semibold">Broadcasted to nearby drivers</p>
            <p className="text-xs text-blue-700">
              Your ride request has been sent. Please wait while a driver reviews and approves your trip.
            </p>
          </div>
        </div>
      )}

      {/* Ride details summary */}
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Ride ID</p>
          <p className="mt-1 text-sm font-mono text-slate-600">{ride.id}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Status</p>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-700">
            {ride.status.replace("_", " ")}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Pickup</p>
          <p className="mt-1 text-sm text-slate-700">{ride.pickupLocation}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Destination</p>
          <p className="mt-1 text-sm text-slate-700">{ride.destinationLocation}</p>
        </div>
      </div>

      {/* Key Metrics Grid */}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
          <p className="text-xs font-medium uppercase text-slate-500">Distance</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{ride.distanceKm} km</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
          <p className="text-xs font-medium uppercase text-slate-500">Estimated time</p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {formatDuration(ride.estimatedDurationMinutes)}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
          <p className="text-xs font-medium uppercase text-slate-500">Fare</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{formattedFare}</p>
        </div>
      </div>

      {(ride.status === "accepted" || ride.status === "in_progress") && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {ride.status === "in_progress" ? "Driver Heading to Destination" : "Driver Approaching You"}
            </p>
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 border border-green-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
              </span>
              {driver?.driver_lat != null ? "Live Tracking" : "Road Telemetry"}
            </span>
          </div>
          <DriverTrackingMap
            driverLat={driver?.driver_lat ?? (ride.status === "in_progress" ? ride.pickupLat : ride.pickupLat - 0.007)}
            driverLng={driver?.driver_lng ?? (ride.status === "in_progress" ? ride.pickupLng : ride.pickupLng - 0.006)}
            targetLat={ride.status === "in_progress" ? ride.destinationLat : ride.pickupLat}
            targetLng={ride.status === "in_progress" ? ride.destinationLng : ride.pickupLng}
            phase={(ride.status === "in_progress" ? "in_progress" : "accepted") as "accepted" | "in_progress"}
            vehicleType={Number(ride.fare || 0) < 40 ? "bike" : Number(ride.fare || 0) < 80 ? "auto" : "cab"}
            etaMinutes={driverEta ?? (ride.status === "in_progress" ? Math.round(ride.estimatedDurationMinutes) : 4)}
          />
        </div>
      )}

      {/* ── Driver info card ─────────────────────────────────────────── */}
      {driver && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Assigned Driver Details
          </p>

          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">Name:</span> {driver.name}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Phone:</span> {driver.phone}
            </p>
            {vehicleInfo && (
              <>
                <p>
                  <span className="font-semibold text-slate-900">Vehicle:</span>{" "}
                  {vehicleInfo.make ?? ""} {vehicleInfo.model ?? ""}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Plate Number:</span>{" "}
                  <span className="font-mono">{vehicleInfo.plateNumber ?? "N/A"}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Color:</span>{" "}
                  {vehicleInfo.color ?? "N/A"}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ride PIN (OTP) Card */}
      {ride.status !== "completed" && (
        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-900">Ride PIN</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {(ride.pin ?? getRidePin(ride.id)).split("").map((digit, idx) => (
                    <span
                      key={idx}
                      className="flex h-11 w-9 sm:h-12 sm:w-10 items-center justify-center rounded-lg border border-indigo-200 bg-white text-xl sm:text-2xl font-black text-indigo-900 shadow-xs"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-700/90 sm:max-w-xs">
              <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Share this PIN with your driver when your ride starts.</span>
            </div>
          </div>
        </div>
      )}

      {/* Driver ETA display */}
      {showDriverEta && driverEta !== null && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Driver estimated time to Pickup
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">
            ~ {formatDuration(driverEta)}
          </p>
        </div>
      )}


      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          {ride.status === "requested"
            ? "Searching for nearby drivers... You'll see their details here immediately when accepted."
            : ride.status === "accepted"
              ? "Your driver is heading to your pickup location."
              : "Your trip is currently underway. Enjoy your ride!"}
        </p>
      </div>

      {/* Bottom Cancel Trip Section */}
      {ride.status !== "completed" && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-5">
          <div>
            <p className="text-xs font-semibold text-slate-700">Need to cancel this ride?</p>
            <p className="text-[11px] text-slate-500">
              You can cancel this request without penalty before the driver finishes the trip.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancelRide}
            disabled={cancelling}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 hover:border-red-300 transition disabled:opacity-50 shrink-0"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {cancelling ? "Cancelling trip..." : "Cancel This Ride"}
          </button>
        </div>
      )}
    </div>
  );
}
