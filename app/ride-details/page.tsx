/**
 * @file app/ride-details/page.tsx
 * @description Dedicated Ride Booking & Real-Time Telemetry Tracking Page (/ride-details).
 * 
 * Features:
 * 1. Reads initial pickup/destination search parameters passed from the homepage search box.
 * 2. Pre-populates route coordinates so users never have to enter locations twice.
 * 3. Shows real-time road path, distance calculation, map preview, and vehicle options.
 * 4. Displays live "Waiting for driver approval" and active telemetry tracking upon confirmation.
 */

import type { Metadata } from "next";
import { getSession } from "@/services/auth.service";
import { getActivePricing } from "@/services/pricing.service";
import { getActiveRideForCustomer } from "@/services/ride.service";
import BookingForm from "@/components/customer/booking-form";
import type { PlaceSuggestion } from "@/types";

export const metadata: Metadata = {
  title: "Ride Details | KalkiRide",
  description: "Set your route, select vehicle options, and track live driver approval.",
};

interface RideDetailsPageProps {
  searchParams: Promise<{
    pickup?: string;
    pickupLat?: string;
    pickupLng?: string;
    destination?: string;
    destinationLat?: string;
    destinationLng?: string;
  }>;
}

export default async function RideDetailsPage({
  searchParams,
}: RideDetailsPageProps) {
  const session = await getSession();
  const params = await searchParams;

  const [activeRide, pricing] = await Promise.all([
    session ? getActiveRideForCustomer(session.userId) : Promise.resolve({ ok: false as const }),
    getActivePricing(),
  ]);

  if (!pricing.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-800">
          Booking temporarily unavailable
        </h1>
        <p className="mt-2 text-sm text-red-700">
          Unable to fetch platform pricing. Please refresh or try again in a few moments.
        </p>
      </div>
    );
  }

  // Pre-fill initial pickup from search parameters if provided
  const initialPickup: PlaceSuggestion | null =
    params.pickup && params.pickupLat && params.pickupLng
      ? {
          id: `pickup-${params.pickupLat}-${params.pickupLng}`,
          displayName: params.pickup,
          lat: parseFloat(params.pickupLat),
          lng: parseFloat(params.pickupLng),
        }
      : params.pickup
        ? {
            id: `pickup-${params.pickup}`,
            displayName: params.pickup,
            lat: 0,
            lng: 0,
          }
        : null;

  // Pre-fill initial destination from search parameters if provided
  const initialDestination: PlaceSuggestion | null =
    params.destination && params.destinationLat && params.destinationLng
      ? {
          id: `dest-${params.destinationLat}-${params.destinationLng}`,
          displayName: params.destination,
          lat: parseFloat(params.destinationLat),
          lng: parseFloat(params.destinationLng),
        }
      : params.destination
        ? {
            id: `dest-${params.destination}`,
            displayName: params.destination,
            lat: 0,
            lng: 0,
          }
        : null;

  return (
    <div className="w-full">
      <BookingForm
        pricePerKm={pricing.data.pricePerKm}
        currency={pricing.data.currency}
        initialRide={activeRide.ok ? activeRide.data : undefined}
        initialPickup={initialPickup}
        initialDestination={initialDestination}
      />
    </div>
  );
}
