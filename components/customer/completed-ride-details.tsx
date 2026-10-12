/**
 * @file components/customer/completed-ride-details.tsx
 * @description Customer Completed Trip Receipt & Summary Screen.
 * 
 * Renders the final breakdown of a completed trip:
 * - Green success indicator banner.
 * - Formatted date/time, total distance, duration, and final fare in INR.
 * - Assigned driver identity and vehicle registration.
 * - "Book New Ride" action to return to booking view.
 */

"use client";

import { useEffect, useState } from "react";
import type { RideSummary } from "@/types";
import { getDriverDetailsForRide } from "@/app/actions/rides";
import { formatDuration } from "@/lib/format";

interface CompletedRideDetailsProps {
  ride: RideSummary;
  onBookNew: () => void;
}

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicle_info: unknown;
}

/**
 * Receipt view presented to a customer after their driver finishes the ride.
 * 
 * @param {CompletedRideDetailsProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function CompletedRideDetails({
  ride,
  onBookNew,
}: CompletedRideDetailsProps) {
  const [driver, setDriver] = useState<DriverInfo | null>(null);

  /**
   * Fetches final driver information for the receipt.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getDriverDetailsForRide(ride.id);
      if (cancelled) return;
      if (result.ok) {
        setDriver({
          id: result.data.id,
          name: result.data.name,
          phone: result.data.phone,
          vehicle_info: result.data.vehicle_info,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ride.id]);

  const formattedFare = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: ride.currency,
    maximumFractionDigits: 2,
  }).format(ride.fare);

  const rideDateTime = new Date(ride.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const vehicleInfo =
    driver?.vehicle_info && typeof driver.vehicle_info === "object"
      ? (driver.vehicle_info as {
          make?: string;
          model?: string;
          plateNumber?: string;
          color?: string;
        })
      : null;

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          Trip Finished
        </p>
        <h2 className="mt-1 text-2xl font-bold text-emerald-900">
          Ride Completed
        </h2>
      </div>

      <div className="mt-6 space-y-4 text-slate-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pickup
          </p>
          <p className="mt-1 text-sm font-medium">{ride.pickupLocation}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Destination
          </p>
          <p className="mt-1 text-sm font-medium">{ride.destinationLocation}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ride Date & Time
          </p>
          <p className="mt-1 text-sm">{rideDateTime}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs font-medium uppercase text-slate-500">
            Distance
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {ride.distanceKm} km
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs font-medium uppercase text-slate-500">
            Duration
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {formatDuration(ride.estimatedDurationMinutes)}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs font-medium uppercase text-slate-500">
            Total Fare
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">{formattedFare}</p>
        </div>
      </div>

      {driver && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Driver Details
          </p>

          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">Driver:</span> {driver.name}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Contact:</span> {driver.phone}
            </p>
            {vehicleInfo && (
              <>
                <p>
                  <span className="font-semibold text-slate-900">Vehicle:</span>{" "}
                  {vehicleInfo.make ?? ""} {vehicleInfo.model ?? ""}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Plate:</span>{" "}
                  <span className="font-mono">{vehicleInfo.plateNumber ?? "N/A"}</span>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBookNew}
        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
      >
        Book Another Ride
      </button>
    </div>
  );
}
