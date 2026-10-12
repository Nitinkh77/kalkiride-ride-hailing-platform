/**
 * @file components/marketplace/drawers/kalki-rides-drawer.tsx
 * @description My Rides & Active Trip Drawer for the single-page KalkiRide app.
 */

"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { cancelCustomerRide } from "@/app/actions/rides";
import type { RideSummary } from "@/types";

interface KalkiRidesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRide: RideSummary | null;
  rideHistory: RideSummary[];
  onCancelActiveRide: () => void;
  onBookNewRide: () => void;
}

export default function KalkiRidesDrawer({
  isOpen,
  onClose,
  activeRide,
  rideHistory,
  onCancelActiveRide,
  onBookNewRide,
}: KalkiRidesDrawerProps) {
  const [cancelling, setCancelling] = useState(false);

  if (!isOpen) return null;

  async function handleCancelRide() {
    if (!activeRide) return;
    if (!confirm("Are you sure you want to cancel this ride?")) return;

    setCancelling(true);
    try {
      const res = await cancelCustomerRide(activeRide.id);
      if (res.success) {
        toast.success("Ride cancelled successfully.");
        onCancelActiveRide();
      } else {
        toast.error(res.error || "Could not cancel ride.");
      }
    } catch {
      toast.error("An error occurred while cancelling.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-blue-600"></span>
            <h2 className="text-lg font-black text-slate-900">My Rides</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Trip Banner if currently riding */}
          {activeRide ? (
            <div className="rounded-3xl border-2 border-blue-500 bg-blue-50/50 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                    Live Active Trip
                  </span>
                </div>
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white capitalize">
                  {activeRide.status.replace("_", " ")}
                </span>
              </div>

              {/* OTP PIN Card */}
              {activeRide.pin && (
                <div className="flex items-center justify-between rounded-2xl bg-white p-3.5 border border-blue-100 shadow-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Share OTP PIN with Driver
                    </p>
                    <p className="text-2xl font-black tracking-widest text-slate-900 mt-0.5">
                      {activeRide.pin}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-600">
                      Required to start
                    </span>
                  </div>
                </div>
              )}

              {/* Route */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600 mt-1"></span>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Pickup</p>
                    <p className="font-bold text-slate-800">{activeRide.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 mt-1"></span>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Dropoff</p>
                    <p className="font-bold text-slate-800">{activeRide.destinationLocation}</p>
                  </div>
                </div>
              </div>

              {/* Fare & Distance */}
              <div className="flex items-center justify-between border-t border-blue-100 pt-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Estimated Fare</span>
                  <p className="text-base font-black text-slate-900">
                    ₹{activeRide.fare.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Distance</span>
                  <p className="text-base font-black text-slate-900">
                    {activeRide.distanceKm.toFixed(1)} km
                  </p>
                </div>
              </div>

              {/* Cancel Button */}
              {activeRide.status === "requested" && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelRide}
                  className="w-full rounded-2xl border border-red-200 bg-white py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition active:scale-98 disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Ride"}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm font-bold text-slate-700">No active ride right now</p>
              <p className="text-xs text-slate-400 mt-1">
                Set your pickup and drop location on the home screen to book your ride!
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookNewRide();
                }}
                className="mt-4 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                Book a Ride Now →
              </button>
            </div>
          )}

          {/* Past Ride History List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Ride History ({rideHistory.length})
              </h3>
            </div>

            {rideHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Your completed rides will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {rideHistory.map((trip) => (
                  <div
                    key={trip.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-2xs hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span
                        className={`font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-[10px] ${
                          trip.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : trip.status === "requested"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {trip.status}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {new Date(trip.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="truncate font-bold text-slate-800">
                        <span className="text-blue-600 mr-1.5">●</span>
                        {trip.pickupLocation}
                      </p>
                      <p className="truncate font-bold text-slate-800">
                        <span className="text-emerald-600 mr-1.5">●</span>
                        {trip.destinationLocation}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/60 mt-3 pt-2 text-xs">
                      <span className="text-slate-500 font-medium">
                        {trip.distanceKm.toFixed(1)} km
                      </span>
                      <span className="font-extrabold text-slate-900">
                        ₹{trip.fare.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
