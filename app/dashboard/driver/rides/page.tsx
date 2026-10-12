/**
 * @file app/dashboard/driver/rides/page.tsx
 * @description Driver Available Rides Marketplace (/dashboard/driver/rides).
 * 
 * Flow:
 * 1. Fetches all unassigned requested rides via `getAvailableRides()`.
 * 2. Renders each available trip as an interactive `RideCard` with distance and accept button.
 * 3. Shows empty state when no rides are currently waiting.
 */

import { getAvailableRides } from "@/services/ride.service";
import { RideCard } from "@/components/driver/ride-card";

export const dynamic = "force-dynamic";

/**
 * Available Rides Page Server Component.
 * 
 * @returns {Promise<JSX.Element>}
 */
export default async function AvailableRidesPage() {
  const { rides, error } = await getAvailableRides();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Live requests</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
          Available Rides
        </h1>
        <p className="mt-2 text-slate-600">
          {rides.length} {rides.length === 1 ? "ride request" : "ride requests"} waiting nearby.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {rides.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400 mb-4">
            🚗
          </div>
          <h2 className="text-base font-bold text-slate-800">
            No ride requests right now
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            New ride requests from customers will appear here automatically.
          </p>
        </div>
      )}

      {rides.length > 0 && (
        <div className="space-y-4">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );
}