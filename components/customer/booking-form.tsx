/**
 * @file components/customer/booking-form.tsx
 * @description Master Customer Booking & Lifecycle Orchestrator Component.
 * 
 * Responsibilities:
 * 1. Coordinates route planning with auto-complete via `LocationField`.
 * 2. Fetches real-time driving route geometry and road distance from OSRM.
 * 3. Previews interactive polyline road paths and distance indicator on `RideMap`.
 * 4. Displays vehicle category selection (`RideOptions`) and booking drawer (`RideBooking`).
 * 5. Seamlessly transitions through 3 lifecycle states:
 *    - Phase A: Route input, Map preview, Vehicle Selection, and Fare Estimation.
 *    - Phase B: Active Ride live waiting & telemetry tracking (`RideWaiting`).
 *    - Phase C: Completed trip receipt & review (`CompletedRideDetails`).
 */

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getCustomerActiveRide,
  getCustomerRideById,
} from "@/app/actions/rides";
import { getRoute } from "@/services/location.service";
import type {
  RideSummary,
  PlaceSuggestion,
  RouteEstimate,
} from "@/types";
import LocationField from "@/components/marketplace/location-field";
import RideOptions from "@/components/marketplace/ride-options";
import RideBooking from "@/components/marketplace/ride-booking";
import RideWaiting from "./ride-waiting";
import CompletedRideDetails from "./completed-ride-details";

/**
 * Checks if two place suggestions represent identical geographical points.
 */
function isSameLocation(a: PlaceSuggestion, b: PlaceSuggestion): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  const distance = Math.hypot(a.lat - b.lat, a.lng - b.lng);
  return distance < 0.0005;
}

// Dynamically import Leaflet Map to prevent SSR `window is not defined` errors
const RideMap = dynamic(() => import("./map"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
  ),
});


interface BookingFormProps {
  /** Active price per kilometer */
  pricePerKm: number;
  /** Currency abbreviation */
  currency: string;
  /** Initial active ride if already in progress on page load */
  initialRide?: RideSummary;
  /** Initial pre-filled pickup place */
  initialPickup?: PlaceSuggestion | null;
  /** Initial pre-filled destination place */
  initialDestination?: PlaceSuggestion | null;
}

/**
 * Customer Ride Booking and Status Coordinator Component.
 * 
 * @param {BookingFormProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function BookingForm({
  pricePerKm,
  currency,
  initialRide,
  initialPickup,
  initialDestination,
}: BookingFormProps) {
  const [currentRide, setCurrentRide] = useState<RideSummary | null>(
    initialRide ?? null
  );
  const [completedRide, setCompletedRide] = useState<RideSummary | null>(null);
  const lastRideIdRef = useRef<string | null>(initialRide?.id ?? null);

  const activeRide = currentRide;

  useEffect(() => {
    if (activeRide) {
      lastRideIdRef.current = activeRide.id;
    }
  }, [activeRide]);

  /**
   * Heartbeat Poller: Queries active ride state every 4s.
   * If a ride disappears from active status, fetches it to check if it was marked "completed".
   */
  useEffect(() => {
    let cancelled = false;

    const pollRide = async () => {
      const result = await getCustomerActiveRide();
      if (cancelled) return;

      if (result.ok) {
        setCurrentRide(result.data);
        lastRideIdRef.current = result.data.id;
        return;
      }

      if (result.error !== "not_found") {
        return;
      }

      // If active ride finished, verify completion
      const lastId = lastRideIdRef.current;
      if (!lastId) {
        setCurrentRide(null);
        return;
      }

      const final = await getCustomerRideById(lastId);
      if (cancelled) return;

      const isLegitCompleted =
        final.ok &&
        final.data.status === "completed" &&
        (!final.data.completedAt || !final.data.completedAt.startsWith("1970"));

      if (isLegitCompleted) {
        setCompletedRide(final.data);
      }
      setCurrentRide(null);
    };

    const intervalId = setInterval(pollRide, 4000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // Initialize from props only (SSR-safe). SessionStorage is loaded after mount in useEffect below.
  const [pickup, setPickup] = useState<PlaceSuggestion | null>(initialPickup ?? null);
  const [destination, setDestination] = useState<PlaceSuggestion | null>(initialDestination ?? null);
  const [pickupText, setPickupText] = useState<string>(initialPickup?.displayName ?? "");
  const [destinationText, setDestinationText] = useState<string>(initialDestination?.displayName ?? "");

  // After mount: restore from sessionStorage only if no prop values were provided.
  // This runs client-side only, so it never causes a hydration mismatch.
  useEffect(() => {
    if (!initialPickup) {
      try {
        const stored = sessionStorage.getItem("kalkiride_pickup");
        if (stored) {
          const parsed: PlaceSuggestion = JSON.parse(stored);
          setPickup(parsed);
          setPickupText(parsed.displayName ?? "");
        }
      } catch { /* ignore */ }
    }
    if (!initialDestination) {
      try {
        const stored = sessionStorage.getItem("kalkiride_destination");
        if (stored) {
          const parsed: PlaceSuggestion = JSON.parse(stored);
          setDestination(parsed);
          setDestinationText(parsed.displayName ?? "");
        }
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedRide, setSelectedRide] = useState<string | null>(null);

  // Route preview state
  const [route, setRoute] = useState<RouteEstimate | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const bookingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedRide) {
      bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedRide]);

  function handlePickupSelect(place: PlaceSuggestion | null) {
    if (place && destination && isSameLocation(place, destination)) {
      toast.error("Pickup and destination cannot be the same location.");
      setPickup(null);
      setPickupText("");
      return;
    }
    setPickup(place);
    setRoute(null);
    if (place && typeof window !== "undefined") {
      sessionStorage.setItem("kalkiride_pickup", JSON.stringify(place));
    } else if (!place && typeof window !== "undefined") {
      sessionStorage.removeItem("kalkiride_pickup");
    }
  }

  function handleDestinationSelect(place: PlaceSuggestion | null) {
    if (place && pickup && isSameLocation(place, pickup)) {
      toast.error("Destination cannot be the same as pickup.");
      setDestination(null);
      setDestinationText("");
      return;
    }
    setDestination(place);
    setRoute(null);
    if (place && typeof window !== "undefined") {
      sessionStorage.setItem("kalkiride_destination", JSON.stringify(place));
    } else if (!place && typeof window !== "undefined") {
      sessionStorage.removeItem("kalkiride_destination");
    }
  }

  const isSamePoint = pickup && destination && isSameLocation(pickup, destination);
  const displayRouteError = isSamePoint
    ? "Pickup and destination cannot be the same location."
    : routeError;

  /**
   * Automatically calculates OSRM driving route whenever both pickup and destination are selected.
   */
  useEffect(() => {
    if (!pickup || !destination || isSameLocation(pickup, destination)) {
      return;
    }

    const pickupLocation = pickup;
    const destinationLocation = destination;
    const controller = new AbortController();


    async function calculateRoute() {
      setRouteLoading(true);
      setRouteError(null);
      setRoute(null);

      const result = await getRoute(
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: destinationLocation.lat, lng: destinationLocation.lng },
        controller.signal
      );

      if (controller.signal.aborted) {
        return;
      }

      setRouteLoading(false);

      if (!result.ok) {
        setRouteError(result.error.message);
        return;
      }

      setRoute(result.data);
    }

    calculateRoute();

    return () => {
      controller.abort();
    };
  }, [pickup, destination]);


  // Phase C: Completed Trip Receipt
  if (completedRide) {
    return (
      <div className="mx-auto max-w-3xl">
        <CompletedRideDetails
          ride={completedRide}
          onBookNew={() => {
            // Clear the ref FIRST so the poller cannot re-hydrate
            // the same completed ride on the next tick.
            lastRideIdRef.current = null;
            setCompletedRide(null);
            setCurrentRide(null);
            setPickup(null);
            setDestination(null);
            setPickupText("");
            setDestinationText("");
            setSelectedRide(null);
            setRoute(null);
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("kalkiride_pickup");
              sessionStorage.removeItem("kalkiride_destination");
            }
          }}
        />
      </div>
    );
  }

  // Phase B: Active Ride Tracking & Telemetry
  if (activeRide) {
    return (
      <div className="mx-auto max-w-3xl">
        <RideWaiting
          ride={activeRide}
          onCancel={() => {
            setCurrentRide(null);
            setCompletedRide(null);
            setSelectedRide(null);
            setRoute(null);
            setPickup(null);
            setDestination(null);
            setPickupText("");
            setDestinationText("");
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("kalkiride_pickup");
              sessionStorage.removeItem("kalkiride_destination");
            }
          }}
        />
      </div>
    );
  }

  // Phase A: Rich Location Picker, Route Preview, Vehicles & Booking Drawer
  return (
    <div className="space-y-8">
      {/* Plan Your Trip Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Plan your trip
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              Set your route, then choose a ride
            </h1>
          </div>
        </div>

        {/* Location Selection Box */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <p className="text-sm font-bold text-slate-800">Your route</p>
            <p className="mt-1 text-xs text-slate-500">
              Select both locations to see accurate ride estimates.
            </p>
          </div>
          <div className="grid w-full gap-4 lg:grid-cols-2">
            <LocationField
              placeholder="Search pickup location"
              value={pickupText}
              onChange={setPickupText}
              onSelect={handlePickupSelect}
              dotClassName="bg-blue-600"
              showCurrentLocation={true}
              fieldType="pickup"
            />
            <LocationField
              placeholder="Search destination"
              value={destinationText}
              onChange={setDestinationText}
              onSelect={handleDestinationSelect}
              dotClassName="bg-orange-500"
              showCurrentLocation={false}
              fieldType="destination"
            />
          </div>

        </div>
      </section>

      {/* Map Preview section */}
      {pickup && destination && !selectedRide && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Route preview
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-800">
            Your selected locations
          </h2>
          <div className="mt-5 rounded-lg bg-blue-600 px-5 py-4 text-white">
            <span className="block text-xs font-semibold uppercase tracking-wide text-blue-100">
              Total distance
            </span>
            <strong className="mt-1 block text-2xl">
              {routeLoading ? "Calculating..." : route ? `${route.distanceKm.toFixed(1)} km` : "Unavailable"}
            </strong>
          </div>
          <div className="mt-5 overflow-hidden rounded-xl">
            {routeLoading ? (
              <div className="h-80 w-full animate-pulse rounded-xl bg-slate-100" />
            ) : route ? (
              <RideMap
                pickup={{ lat: pickup.lat, lng: pickup.lng }}
                destination={{ lat: destination.lat, lng: destination.lng }}
                routeCoordinates={route.routeCoordinates}
              />
            ) : (
              <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {displayRouteError ?? "Route preview is unavailable."}
              </p>

            )}
          </div>
        </section>
      )}

      {/* Vehicle selection options */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <RideOptions
          onBook={(rideName) => {
            setSelectedRide(rideName);
          }}
        />
      </section>

      {/* Booking confirmation drawer */}
      {selectedRide && pickup && destination && (
        <div ref={bookingRef}>
          <RideBooking
            rideName={selectedRide}
            pickup={pickup}
            destination={destination}
            pricePerKm={pricePerKm}
            currency={currency}
            onClose={() => setSelectedRide(null)}
            onSuccess={(newRide) => {
              setCurrentRide(newRide);
              setSelectedRide(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
