/**
 * @file app/dashboard/driver/active/page.tsx
 * @description Driver Live Trip & Navigation Page (/dashboard/driver/active).
 * 
 * Flow:
 * 1. Fetches current driver's active trip via `getActiveRide()`.
 * 2. If an active trip exists, renders `ActiveRideCard` with live GPS telemetry tracking.
 * 3. If idle, shows an empty state prompting the driver to look for nearby requests.
 */

import { getActiveRide } from "@/services/ride.service";
import { getSession } from "@/services/auth.service";
import { ActiveRideCard } from "@/components/driver/active-ride-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Driver Active Trip View Server Component.
 * 
 * @returns {Promise<JSX.Element>}
 */
export default async function ActiveRidePage() {
  const session = await getSession();
  const { ride, error } = await getActiveRide(session?.userId || "");

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Trip navigation</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
          Active Trip
        </h1>
        <p className="mt-2 text-slate-600">
          {ride ? "You currently have an ongoing trip in progress." : "No active ride right now."}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!ride && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400 mb-4">
            ⚡
          </div>
          <h2 className="text-base font-bold text-slate-800">
            No active trip
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            When you accept a ride request, live route tracking and customer details will appear here.
          </p>
          <Link
            href="/dashboard/driver/rides"
            className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm"
          >
            Browse available rides &rarr;
          </Link>
        </div>
      )}

      {ride && <ActiveRideCard ride={ride} />}
    </div>
  );
}