/**
 * @file app/dashboard/driver/history/page.tsx
 * @description Driver Completed Ride History Page (/dashboard/driver/history).
 * 
 * Flow:
 * 1. Fetches all completed trips for the current driver via `getRideHistory()`.
 * 2. Computes cumulative completed trip totals, distance traveled, and gross earnings.
 * 3. Renders a card list of all past rides with pickup/destination and timestamps.
 */

import { getRideHistory } from "@/services/ride.service";
import { getSession } from "@/services/auth.service";
import { formatDuration } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Driver Ride History View Server Component.
 * 
 * @returns {Promise<JSX.Element>}
 */
export default async function RideHistoryPage() {
  const session = await getSession();
  const { rides, error } = await getRideHistory(session?.userId || "");

  const totalEarnings = rides.reduce(
    (sum, ride) => sum + (Number(ride.fare) || 0),
    0
  );

  const totalDistance = rides.reduce(
    (sum, ride) => sum + (Number(ride.distance_km) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Trip records</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
          Ride History
        </h1>
        <p className="mt-2 text-slate-600">
          Review all your completed trips, routes, customer details, and earnings.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Completed Trips
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {rides.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Distance
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {totalDistance.toFixed(1)} km
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Earned
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            ₹{totalEarnings.toFixed(0)}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {rides.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400 mb-4">
            📋
          </div>
          <h2 className="text-base font-bold text-slate-800">
            No completed rides yet
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            When you complete customer trips, your route summary and earnings will appear here.
          </p>
          <Link
            href="/dashboard/driver/rides"
            className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm"
          >
            Find available rides &rarr;
          </Link>
        </div>
      )}

      {rides.length > 0 && (
        <div className="space-y-4">
          {rides.map((ride) => {
            const formattedDate = ride.completed_at
              ? new Date(ride.completed_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : ride.created_at
              ? new Date(ride.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—";

            return (
              <div
                key={ride.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
              >
                {/* Status & Fare Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        ride.status === "completed"
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "border border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {ride.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formattedDate}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">
                      ₹{Number(ride.fare || 0).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Route: Pickup & Destination */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Pickup
                      </p>
                      <p className="text-sm font-medium text-slate-800">
                        {ride.pickup_location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Destination
                      </p>
                      <p className="text-sm font-medium text-slate-800">
                        {ride.destination_location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase text-slate-500">
                      Distance
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">
                      {ride.distance_km ? `${ride.distance_km} km` : "—"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase text-slate-500">
                      Duration
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">
                      {formatDuration(ride.estimated_duration_minutes)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase text-slate-500">
                      Earnings
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-blue-600">
                      ₹{Number(ride.fare || 0).toFixed(0)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase text-slate-500">
                      Ride ID
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800 truncate font-mono">
                      #{ride.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}