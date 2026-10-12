/**
 * @file app/dashboard/customer/page.tsx
 * @description Customer Account & Profile Dashboard (/dashboard/customer).
 * 
 * Features:
 * 1. Customer profile overview (Name, Email, Phone, Membership date).
 * 2. Active ride notification banner linking directly to `/ride-details`.
 * 3. Recent ride history list with trip distances, dates, statuses, and fares.
 * 4. Quick-action button to initiate new bookings on `/ride-details`.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/services/auth.service";
import { getActiveRideForCustomer, getCustomerRideHistory } from "@/services/ride.service";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Customer Dashboard | KalkiRide",
  description: "Manage your account, view trip history, and book rides.",
};

export default async function CustomerDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "customer") {
    redirect("/dashboard/driver");
  }

  const [activeRide, historyResult, userResult] = await Promise.all([
    getActiveRideForCustomer(session.userId),
    getCustomerRideHistory(session.userId),
    supabase
      .from("users")
      .select("name, email, phone, created_at")
      .eq("id", session.userId)
      .maybeSingle(),
  ]);

  const customerUser = userResult.data;
  const recentRides = historyResult.ok && historyResult.data ? historyResult.data : [];

  return (
    <div className="space-y-8">
      {/* Active Trip Banner */}
      {activeRide.ok && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/90 p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-blue-600"></span>
            </span>
            <div>
              <p className="font-semibold text-blue-900">
                You have an active ride in progress
              </p>
              <p className="text-xs text-blue-700">
                Status: <strong className="capitalize">{activeRide.data.status.replace("_", " ")}</strong> • To: {activeRide.data.destinationLocation}
              </p>
            </div>
          </div>
          <Link
            href="/ride-details"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm"
          >
            Track live on Ride Details →
          </Link>
        </div>
      )}

      {/* Profile Overview Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Customer Portal
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              Welcome back, {customerUser?.name ?? "Rider"}!
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your personal information and view your ride activity.
            </p>
          </div>
          <Link
            href="/ride-details"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm"
          >
            + Book a new ride
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </span>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {customerUser?.email ?? "Not specified"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Phone Number
            </span>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {customerUser?.phone ?? "Not specified"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Account Status
            </span>
            <p className="mt-1 text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Active Verified
            </p>
          </div>
        </div>
      </section>

      {/* Ride History Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Your Ride History</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Review your past trips, fare receipts, and completed destinations.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {recentRides.length} {recentRides.length === 1 ? "Trip" : "Trips"}
          </span>
        </div>

        {recentRides.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm font-medium text-slate-600">No rides booked yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              When you book rides, they will appear here along with distance and fare receipts.
            </p>
            <Link
              href="/ride-details"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Book your first ride
            </Link>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-100">
            {recentRides.map((ride) => (
              <div key={ride.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        ride.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : ride.status === "requested"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                      }`}>
                        {ride.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ride.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-800 font-medium">
                      <span>{ride.pickupLocation}</span>
                      <span className="mx-2 text-slate-400">→</span>
                      <span>{ride.destinationLocation}</span>
                    </div>
                  </div>
                  <div className="text-right sm:self-center">
                    <p className="text-base font-bold text-slate-800">
                      {ride.currency} {ride.fare.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ride.distanceKm.toFixed(1)} km
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}