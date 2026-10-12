/**
 * @file components/driver/active-ride-card.tsx
 * @description Driver Active Trip Management, PIN Verification & GPS Telemetry Card.
 *
 * Features:
 * 1. Background Geolocation Tracking: Streams driver GPS to server via `watchPosition`.
 * 2. PIN Entry Gate (status = 'accepted'): Driver enters customer's 4-digit Ride PIN
 *    upon arriving at pickup to START the ride (status → in_progress).
 * 3. Visual Trip Status: Pickup/destination, fare, distance, customer contact.
 * 4. Complete Ride Action: Invokes `completeRide` and redirects to history.
 */

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import { completeRide, updateDriverLocation, startRide } from "@/app/actions/rides";
import { getRoute } from "@/services/location.service";
import { useRouter } from "next/navigation";

// Leaflet map — client only (no SSR)
const DriverNavMap = dynamic(() => import("./driver-nav-map"), {
  ssr: false,
  loading: () => (
    <div className="h-64 sm:h-80 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
      <span className="text-xs text-slate-400 font-medium">Loading map…</span>
    </div>
  ),
});

interface Ride {
  id: string;
  pickup_location: string;
  destination_location: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  fare: number | string;
  distance_km?: number | null;
  status: string;
  rider_name?: string | null;
  rider_phone?: string | null;
}

interface ActiveRideCardProps {
  ride: Ride;
}

/**
 * Driver Active Trip Card with PIN verification and live GPS streaming.
 *
 * @param {ActiveRideCardProps} props - Component properties.
 * @returns {JSX.Element}
 */
export function ActiveRideCard({ ride }: ActiveRideCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Driver's live GPS position (set by watchPosition, used to render map)
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  // ── PIN state (used only when status === 'accepted' to start the ride) ──────
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  const isLocationSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "geolocation" in navigator;

  /**
   * Activates device GPS watchPosition while ride is active.
   * Streams updated latitude/longitude to `updateDriverLocation` AND stores locally for map.
   */
  useEffect(() => {
    if (!ride.id) return;
    if (ride.status !== "accepted" && ride.status !== "in_progress") return;
    if (!isLocationSupported) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Store locally so map updates smoothly
        setDriverPos({ lat: latitude, lng: longitude });
        const result = await updateDriverLocation(ride.id, latitude, longitude);
        if (!result.ok) {
          console.warn("Driver location update failed:", result.error);
        }
      },
      (geoError) => {
        const message =
          geoError.code === 1
            ? "Location access was denied. Please allow location in your browser for live tracking."
            : geoError.code === 2
            ? "Location position is temporarily unavailable."
            : "Location request timed out.";
        console.warn("Driver location error:", message);
        setError(message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [ride.id, ride.status, isLocationSupported]);

  /**
   * Recalculates ETA whenever driver moves.
   * When accepted: ETA to pickup. When in_progress: ETA to destination.
   */
  useEffect(() => {
    if (!driverPos) return;
    let cancelled = false;
    const targetLat = ride.status === "in_progress" ? ride.destination_lat : ride.pickup_lat;
    const targetLng = ride.status === "in_progress" ? ride.destination_lng : ride.pickup_lng;

    (async () => {
      const result = await getRoute(
        { lat: driverPos.lat, lng: driverPos.lng },
        { lat: targetLat, lng: targetLng }
      );
      if (!cancelled && result.ok) {
        setEta(result.data.durationMinutes);
      }
    })();

    return () => { cancelled = true; };
  }, [driverPos, ride.status, ride.pickup_lat, ride.pickup_lng, ride.destination_lat, ride.destination_lng]);

  // ── PIN input handlers ──────────────────────────────────────────────────────

  const handleDigitChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setPinError(null);
    const next = [...pinDigits];
    if (val.length === 0) { next[index] = ""; setPinDigits(next); return; }
    next[index] = val[val.length - 1];
    setPinDigits(next);
    if (index < 3) inputRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      inputRefs[index + 1].current?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleStartRide();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setPinDigits(next);
    setPinError(null);
    inputRefs[Math.min(pasted.length, 3)].current?.focus();
  };

  /**
   * Verifies the entered PIN with the server and transitions ride to in_progress.
   */
  const handleStartRide = async () => {
    const entered = pinDigits.join("");
    if (entered.length < 4) {
      setPinError("Please enter the complete 4-digit PIN.");
      const firstEmpty = pinDigits.findIndex((d) => !d);
      inputRefs[firstEmpty !== -1 ? firstEmpty : 0].current?.focus();
      return;
    }

    setPinLoading(true);
    setPinError(null);

    const res = await startRide(ride.id, entered);
    if (!res.success) {
      setPinError(res.error || "Incorrect PIN. Please try again.");
      setPinDigits(["", "", "", ""]);
      inputRefs[0].current?.focus();
      setPinLoading(false);
    } else {
      router.refresh();
    }
  };

  /**
   * Completes the trip and records final status in database.
   */
  const handleComplete = async () => {
    if (!confirm("Are you sure you want to mark this ride as completed?")) return;
    setLoading(true);
    setError(null);

    const res = await completeRide(ride.id);
    if (res.success) {
      router.refresh();
      router.push("/dashboard/driver/history");
    } else {
      setError(res.error || "Failed to complete ride");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Status Header */}
      <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
            {ride.status === "accepted" ? "Accepted — Head to Pickup" : "In Progress — Live Navigation"}
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {ride.status === "in_progress" ? "Streaming GPS" : "GPS Active"}
        </span>
      </div>

      {/* ── Navigation Map ──────────────────────────────────────────────── */}
      {(ride.status === "accepted" || ride.status === "in_progress") && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {ride.status === "accepted" ? "Navigate to Pickup" : "En Route to Destination"}
            </p>
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 border border-green-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
              </span>
              {driverPos ? "Live GPS" : "Road Telemetry"}
            </span>
          </div>
          <DriverNavMap
            driverLat={driverPos?.lat ?? (ride.status === "in_progress" ? ride.pickup_lat : ride.pickup_lat - 0.006)}
            driverLng={driverPos?.lng ?? (ride.status === "in_progress" ? ride.pickup_lng : ride.pickup_lng - 0.005)}
            targetLat={ride.status === "in_progress" ? ride.destination_lat : ride.pickup_lat}
            targetLng={ride.status === "in_progress" ? ride.destination_lng : ride.pickup_lng}
            phase={ride.status as "accepted" | "in_progress"}
            vehicleType={Number(ride.fare || 0) < 40 ? "bike" : Number(ride.fare || 0) < 80 ? "auto" : "cab"}
            etaMinutes={eta}
          />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Route Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-3 w-3 rounded-full bg-blue-600 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pickup Location</p>
              <p className="text-base font-semibold text-slate-900 break-words mt-0.5">{ride.pickup_location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-1 h-3 w-3 rounded-full bg-orange-500 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Destination Location</p>
              <p className="text-base font-semibold text-slate-900 break-words mt-0.5">{ride.destination_location}</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Trip Fare</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">₹{Number(ride.fare || 0).toFixed(0)}</p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Distance</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {ride.distance_km ? `${ride.distance_km} km` : "—"}
            </p>
          </div>

          {ride.rider_name && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 col-span-2 sm:col-span-1">
              <p className="text-xs font-medium uppercase text-slate-500">Customer</p>
              <p className="mt-1 text-base font-bold text-slate-900 truncate">{ride.rider_name}</p>
              {ride.rider_phone && <p className="text-xs text-slate-500">{ride.rider_phone}</p>}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-3 font-semibold text-amber-700 hover:text-amber-900"
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── PIN Gate: only shown when accepted (driver at pickup) ─────────── */}
        {ride.status === "accepted" && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Enter Ride PIN to Start</p>
                  <p className="text-[11px] text-slate-600">Ask the customer for their 4-digit PIN to begin the trip.</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                {/* 4 Digit Inputs */}
                <div className="flex items-center gap-2">
                  {pinDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      placeholder="–"
                      onChange={(e) => handleDigitChange(idx, e)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      aria-label={`PIN digit ${idx + 1}`}
                      className={`h-11 w-11 rounded-xl border text-center text-xl font-bold bg-white text-slate-900 shadow-xs transition focus:outline-none focus:ring-2 ${
                        pinError
                          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                          : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-emerald-100/60 transition"
                >
                  {showPin ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>

                {/* Start Ride Button */}
                <button
                  type="button"
                  onClick={handleStartRide}
                  disabled={pinLoading}
                  className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
                >
                  {pinLoading ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Verifying…
                    </>
                  ) : (
                    "Start Ride"
                  )}
                </button>
              </div>

              {pinError && (
                <p className="mt-2.5 text-xs font-semibold text-red-600">{pinError}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Complete Ride (only when in_progress) ────────────────────────── */}
        {ride.status === "in_progress" && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? "Completing Trip..." : "Complete Ride"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
