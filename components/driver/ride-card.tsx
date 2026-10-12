/**
 * @file components/driver/ride-card.tsx
 * @description Driver Available Ride Card Component.
 *
 * Flow:
 * 1. Driver sees ride request (pickup, destination, fare, ETA).
 * 2. Clicks "Accept Ride" → immediately claims the ride (no PIN at this step).
 * 3. Driver is redirected to Active Trip page to navigate to pickup.
 * 4. PIN is entered on the Active Trip page when the driver ARRIVES at pickup to START the ride.
 */

"use client";

import { useState } from "react";
import { acceptRide } from "@/app/actions/rides";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/format";

interface Ride {
  id: string;
  pickup_location: string;
  destination_location: string;
  distance_km: number | null;
  estimated_duration_minutes: number | null;
  fare: number | null;
  currency: string | null;
  created_at: string;
}

interface RideCardProps {
  ride: Ride;
}

/**
 * Ride Card for available unassigned ride requests.
 *
 * @param {RideCardProps} props - Component properties.
 * @returns {JSX.Element | null}
 */
export function RideCard({ ride }: RideCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeclined, setIsDeclined] = useState(false);

  /**
   * Directly accepts the ride and navigates to the active trip screen.
   * PIN verification happens later when driver arrives at pickup to start the ride.
   */
  const handleAcceptClick = async () => {
    setLoading(true);
    setError(null);

    const res = await acceptRide(ride.id);
    if (!res.success) {
      setError(res.error || "Failed to accept ride. It may have been claimed by another driver.");
      setLoading(false);
    } else {
      router.push("/dashboard/driver/active");
    }
  };

  if (isDeclined) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 flex items-center justify-between transition">
        <span>Ride request was declined.</span>
        <button
          type="button"
          onClick={() => setIsDeclined(false)}
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-blue-700">
              New Request
            </span>
            <span>
              {new Date(ride.created_at).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Pickup and Destination */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Pickup
                </p>
                <p className="text-sm font-medium text-slate-800 break-words">
                  {ride.pickup_location}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Destination
                </p>
                <p className="text-sm font-medium text-slate-800 break-words">
                  {ride.destination_location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fare & Metrics */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-2xl font-bold text-slate-900">
            ₹{Number(ride.fare || 0).toFixed(0)}
          </div>
          <div className="text-xs text-slate-500">
            {ride.distance_km ? `${ride.distance_km} km` : "—"} · {formatDuration(ride.estimated_duration_minutes)}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Accept & Decline Actions */}
      <div className="mt-6 border-t border-slate-100 pt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleAcceptClick}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Accepting...
            </>
          ) : (
            "Accept Ride"
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsDeclined(true)}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
