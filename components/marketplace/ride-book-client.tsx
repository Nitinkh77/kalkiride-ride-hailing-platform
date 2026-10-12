/**
 * @file components/marketplace/ride-book-client.tsx
 * @description Dedicated Ride Booking Client View.
 * 
 * Features:
 * 1. Independent Pickup and Destination selection inputs.
 * 2. Visual Route Preview on Leaflet Map with total calculated driving distance.
 * 3. Ride category selector (`RideOptions`).
 * 4. Smooth scrolling into the active booking drawer once a ride type is selected.
 */

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LocationField from "@/components/marketplace/location-field";
import { getRoute } from "@/services/location.service";
import type { PlaceSuggestion, RouteEstimate } from "@/types";
import RideBooking from "@/components/marketplace/ride-booking";
import RideOptions from "@/components/marketplace/ride-options";

const RideMap = dynamic(() => import("@/components/customer/map"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
  ),
});

interface RideBookClientProps {
  canBook: boolean;
  pricePerKm: number | null;
  currency: string;
  initialPickup: PlaceSuggestion | null;
  initialDestination: PlaceSuggestion | null;
  onBack?: () => void;
}

/**
 * Ride Booking View Client Component.
 * 
 * @param {RideBookClientProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function RideBookClient({
  canBook,
  pricePerKm,
  currency,
  initialPickup,
  initialDestination,
  onBack,
}: RideBookClientProps) {
  const router = useRouter();
  const [pickupText, setPickupText] = useState(initialPickup?.displayName ?? "");
  const [destinationText, setDestinationText] = useState(initialDestination?.displayName ?? "");
  const [pickup, setPickup] = useState<PlaceSuggestion | null>(initialPickup);
  const [destination, setDestination] = useState<PlaceSuggestion | null>(initialDestination);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteEstimate | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const bookingRef = useRef<HTMLDivElement | null>(null);

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  }

  function handlePickupSelect(place: PlaceSuggestion | null) {
    setPickup(place);
    setRoute(null);
  }

  function handleDestinationSelect(place: PlaceSuggestion | null) {
    setDestination(place);
    setRoute(null);
  }

  useEffect(() => {
    if (selectedRide) {
      bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedRide]);

  /**
   * Recalculates OSRM driving path preview whenever user modifies coordinates.
   */
  useEffect(() => {
    if (!pickup || !destination) {
      return;
    }

    const pickupLocation = pickup;
    const destinationLocation = destination;
    const controller = new AbortController();

    async function loadPreviewRoute() {
      setRouteLoading(true);
      const result = await getRoute(
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: destinationLocation.lat, lng: destinationLocation.lng },
        controller.signal
      );

      if (controller.signal.aborted) return;

      setRouteLoading(false);
      setRoute(result.ok ? result.data : null);

      if (!result.ok) toast.error(result.error.message);
    }

    loadPreviewRoute();
    return () => controller.abort();
  }, [pickup, destination]);

  /**
   * Confirms ride selection and verifies user authentication.
   */
  function handleBook(rideName: string) {
    if (!pickup || !destination) {
      toast.error("Select a pickup and destination first.");
      return;
    }

    if (!canBook) {
      toast("Log in to book your ride");
      router.push("/login");
      return;
    }

    setSelectedRide(rideName);
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 text-slate-900">
      <section className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Plan your trip
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                Set your route, then choose a ride
              </h1>
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Back
            </button>
          </div>

          <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
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
                fieldType="pickup"
                showCurrentLocation={true}
              />
              <LocationField
                placeholder="Search destination"
                value={destinationText}
                onChange={setDestinationText}
                onSelect={handleDestinationSelect}
                dotClassName="bg-orange-500"
                fieldType="destination"
                showCurrentLocation={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview section */}
      {pickup && destination && !selectedRide && (
        <section className="w-full bg-slate-50 px-5 pb-10 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
                  Route preview is unavailable.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Vehicle selection options */}
      <RideOptions onBook={handleBook} />

      {/* Booking confirmation section */}
      {selectedRide && pickup && destination && (
        <div ref={bookingRef}>
          <RideBooking
            rideName={selectedRide}
            pickup={pickup}
            destination={destination}
            pricePerKm={pricePerKm}
            currency={currency}
            onClose={() => setSelectedRide(null)}
            onSuccess={() => {
              router.push("/ride-details");
            }}
          />
        </div>
      )}
    </main>
  );
}
