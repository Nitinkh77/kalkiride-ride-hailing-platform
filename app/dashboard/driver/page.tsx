/**
 * @file app/dashboard/driver/page.tsx
 * @description Driver Dashboard Overview Page (/dashboard/driver).
 * 
 * Flow:
 * 1. Fetches driver stats, profile, and current active trip in parallel via service layer.
 * 2. Renders summary metrics cards (Available, Active, Completed, Total Earnings).
 * 3. Shows active trip banner if trip is in progress.
 * 4. Displays quick action tiles linking to available rides, history, and vehicle profile.
 */

import Link from "next/link";
import {
  getDriverStats,
  getDriverProfile,
  getActiveRide,
} from "@/services/ride.service";
import { getSession } from "@/services/auth.service";

export const dynamic = "force-dynamic";

/**
 * Driver Dashboard Overview Server Component.
 * 
 * @returns {Promise<JSX.Element>}
 */
export default async function DriverDashboardPage() {
  const session = await getSession();
  const driverId = session?.userId || "";

  // Parallel data fetching for fast load
  const [statsResult, profileResult, activeRideResult] = await Promise.all([
    getDriverStats(driverId),
    getDriverProfile(driverId),
    getActiveRide(driverId),
  ]);

  const stats = statsResult.stats;
  const profile = profileResult.user;
  const activeRide = activeRideResult.ride;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">Welcome back</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
          Driver Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Hello {profile?.name || "Driver"}, here is your summary and live ride status.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Available
            </p>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              Nearby
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
            {stats?.availableRides ?? 0}
          </p>
          <Link
            href="/dashboard/driver/rides"
            className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Browse requests &rarr;
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active Trip
            </p>
            {stats?.activeRides ? (
              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 animate-pulse">
                In progress
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                Idle
              </span>
            )}
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
            {stats?.activeRides ?? 0}
          </p>
          <Link
            href="/dashboard/driver/active"
            className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View trip &rarr;
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completed
            </p>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
              Finished
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
            {stats?.completedRides ?? 0}
          </p>
          <Link
            href="/dashboard/driver/history"
            className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Trip history &rarr;
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Earnings
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              Payout
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
            ₹{(stats?.totalEarnings ?? 0).toFixed(0)}
          </p>
          <Link
            href="/dashboard/driver/history"
            className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View breakdown &rarr;
          </Link>
        </div>
      </div>

      {/* Active Ride Banner */}
      {activeRide && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                  Ongoing Ride ({activeRide.status})
                </span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                You have an active trip in progress
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                From: <span className="font-semibold text-slate-800">{activeRide.pickup_location}</span> &rarr;{" "}
                To: <span className="font-semibold text-slate-800">{activeRide.destination_location}</span>
              </p>
            </div>
            <Link
              href="/dashboard/driver/active"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-600 shadow-sm"
            >
              Manage Active Trip &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/driver/rides"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-lg mb-3">
              🚗
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
              Available Rides
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Find and accept ride requests from nearby customers.
            </p>
          </Link>

          <Link
            href="/dashboard/driver/active"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 font-bold text-lg mb-3">
              ⚡
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
              Active Trip
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              View your route, navigation, and complete the current trip.
            </p>
          </Link>

          <Link
            href="/dashboard/driver/history"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 font-bold text-lg mb-3">
              📋
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
              Ride History
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Review completed rides, timestamps, fares, and earnings.
            </p>
          </Link>

          <Link
            href="/dashboard/driver/vehicle"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold text-lg mb-3">
              🛺
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
              Vehicle & Profile
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Update your registered vehicle details and account info.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}