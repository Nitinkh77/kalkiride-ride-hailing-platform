/**
 * @file components/marketplace/ride-booking.tsx
 * @description Marketplace Trip Booking Details Drawer/Section.
 * 
 * Allows users who picked a category on the landing page or `/ride-book` to
 * review route distance, calculated fare, and confirm their booking request.
 */

"use client";

import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { requestRide } from "@/app/actions/rides";
import { calculateFare } from "@/services/fare.service";
import { getRoute } from "@/services/location.service";
import { formatDuration } from "@/lib/format";
import type { PlaceSuggestion, RouteEstimate, RideRequestFormState, RideSummary } from "@/types";

interface RideBookingProps {
  rideName: string;
  pickup: PlaceSuggestion;
  destination: PlaceSuggestion;
  pricePerKm: number | null;
  currency: string;
  onClose: () => void;
  onSuccess?: (ride: RideSummary) => void;
}

const initialState: RideRequestFormState = {};

export default function RideBooking({
  rideName,
  pickup,
  destination,
  pricePerKm,
  currency,
  onClose,
  onSuccess,
}: RideBookingProps) {
  const [state, formAction, pending] = useActionState(requestRide, initialState);
  const [route, setRoute] = useState<RouteEstimate | null>(null);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);

  /**
   * Fetches driving route and travel time between pickup and destination.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadRoute() {
      setRouteLoading(true);
      setRouteError(null);

      const result = await getRoute(
        { lat: pickup.lat, lng: pickup.lng },
        { lat: destination.lat, lng: destination.lng },
        controller.signal
      );

      if (controller.signal.aborted) return;

      setRouteLoading(false);
      if (!result.ok) {
        setRouteError(result.error.message);
        return;
      }

      setRoute(result.data);
    }

    loadRoute();
    return () => controller.abort();
  }, [pickup, destination]);

  useEffect(() => {
    if (state?.message) toast.error(state.message);
    if (state?.errors) toast.error("Please check the ride details and try again.");
    if (state?.ride) {
      toast.success("Your ride request was sent.");
      onSuccess?.(state.ride);
    }
  }, [state, onSuccess]);

  const estimatedFare =
    route && pricePerKm !== null
      ? calculateFare(route.distanceKm, pricePerKm)
      : null;

  if (state?.ride) {
    return (
      <section className="w-full border-y border-blue-100 bg-blue-50">
        <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
          <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Ride requested
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              Your {rideName} is on its way
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              We will show the driver details as soon as a driver accepts your request.
            </p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <span className="block text-xs text-slate-500">Distance</span>
                <strong>{state.ride.distanceKm.toFixed(1)} km</strong>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Estimated time</span>
                <strong>{formatDuration(state.ride.estimatedDurationMinutes)}</strong>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Estimated fare</span>
                <strong>{state.ride.currency} {state.ride.fare.toFixed(2)}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Back to ride options
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full border-y border-blue-100 bg-blue-50">
      <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
        <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Booking details
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-800">
                Book {rideName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xl leading-none text-slate-400 hover:text-slate-700 transition"
              aria-label="Close booking details"
            >
              &times;
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
              <span className="block text-xs font-semibold text-slate-500">Pickup</span>
              <p className="mt-1 text-sm font-semibold text-slate-800">{pickup.displayName}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
              <span className="block text-xs font-semibold text-slate-500">Destination</span>
              <p className="mt-1 text-sm font-semibold text-slate-800">{destination.displayName}</p>
            </div>
          </div>

          {routeLoading && (
            <p className="mt-5 text-sm text-blue-600 font-medium">Calculating distance and fare...</p>
          )}
          {routeError && (
            <p className="mt-5 text-sm text-red-600 font-medium">{routeError}</p>
          )}

          {route && (
            <div className="mt-5 grid grid-cols-3 gap-3 border-y border-slate-100 py-4 text-center">
              <div>
                <span className="block text-xs text-slate-500">Distance</span>
                <strong className="text-sm text-slate-800">{route.distanceKm.toFixed(1)} km</strong>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Duration</span>
                <strong className="text-sm text-slate-800">{formatDuration(route.durationMinutes)}</strong>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Estimated fare</span>
                <strong className="text-sm text-slate-800">
                  {estimatedFare === null ? "Unavailable" : `${currency} ${estimatedFare.toFixed(2)}`}
                </strong>
              </div>
            </div>
          )}

          <form action={formAction} className="mt-6">
            <input type="hidden" name="pickupLocation" value={pickup.displayName} />
            <input type="hidden" name="pickupLat" value={pickup.lat} />
            <input type="hidden" name="pickupLng" value={pickup.lng} />
            <input type="hidden" name="destinationLocation" value={destination.displayName} />
            <input type="hidden" name="destinationLat" value={destination.lat} />
            <input type="hidden" name="destinationLng" value={destination.lng} />
            <button
              type="submit"
              disabled={!route || routeLoading || pending}
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-sm"
            >
              {pending ? "Requesting ride..." : "Confirm and book ride"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
