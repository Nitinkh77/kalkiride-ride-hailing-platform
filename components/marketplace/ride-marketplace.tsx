/**
 * @file components/marketplace/ride-marketplace.tsx
 * @description Main Marketplace Landing & Ride Discovery Page View.
 * 
 * Flow:
 * 1. Layer 1: Hero Section with Location Search and Header (`HeroSection`).
 * 2. Layer 2: Referral code & reward banner ("Refer & earn Rs 50").
 * 3. Layer 3: Value proposition 3-step explanation ("How it works").
 * 4. Layer 4: Transition to full `RideBookClient` when pickup and destination are selected.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { PlaceSuggestion, RideSummary } from "@/types";
import HeroSection from "./hero-section";
import RideBookClient from "./ride-book-client";

const referralCode = "KALKI50";

interface RideMarketplaceProps {
  isAuthenticated: boolean;
  pricePerKm: number | null;
  currency: string;
  initialActiveRide?: RideSummary | null;
}

/**
 * Public Ride Marketplace Home View Component.
 * 
 * @param {RideMarketplaceProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function RideMarketplace({
  isAuthenticated,
  pricePerKm,
  currency,
  initialActiveRide,
}: RideMarketplaceProps) {
  const router = useRouter();
  const [pickup, setPickup] = useState<PlaceSuggestion | null>(null);
  const [destination, setDestination] = useState<PlaceSuggestion | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  /**
   * Validates authentication and route selections before opening the booking drawer.
   */
  function handleContinue() {
    const params = new URLSearchParams();
    if (pickup) {
      params.set("pickup", pickup.displayName);
      params.set("pickupLat", pickup.lat.toString());
      params.set("pickupLng", pickup.lng.toString());
    }
    if (destination) {
      params.set("destination", destination.displayName);
      params.set("destinationLat", destination.lat.toString());
      params.set("destinationLng", destination.lng.toString());
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const targetUrl = `/ride-details${query}`;

    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent(targetUrl)}`);
      return;
    }

    router.push(targetUrl);
  }

  /**
   * Copies promo code to user's system clipboard.
   */
  async function copyReferralCode() {
    await navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied to clipboard!");
  }

  if (bookingOpen && pickup && destination) {
    return (
      <RideBookClient
        canBook={isAuthenticated}
        pricePerKm={pricePerKm}
        currency={currency}
        initialPickup={pickup}
        initialDestination={destination}
        onBack={() => setBookingOpen(false)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Layer 1: Hero navigation & route search */}
      <HeroSection
        isAuthenticated={isAuthenticated}
        onContinue={handleContinue}
        onPickupChange={setPickup}
        onDestinationChange={setDestination}
        initialActiveRide={initialActiveRide}
      />

      {/* Layer 2: Referral reward section */}
      <section id="referrals" className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
              Refer & earn
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              Give a friend Rs 50 off. Get Rs 50 back.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Share your referral code after signing up. Your reward is added when your friend completes their first ride.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-2">
            <span className="px-3 text-sm font-bold tracking-[0.2em] text-orange-300">
              {referralCode}
            </span>
            <button
              type="button"
              onClick={copyReferralCode}
              className="rounded-md bg-orange-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-orange-400 transition"
            >
              Copy code
            </button>
          </div>
        </div>
      </section>

      {/* Layer 3: Value proposition explanation */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["01", "Pick a route", "Tell us where you are and where you want to go."],
            ["02", "Compare options", "Choose the ride that fits your time, group, and budget."],
            ["03", "Ride with ease", "Track your driver and pay after a smooth trip."],
          ].map(([number, title, description]) => (
            <div key={number} className="border-l-2 border-blue-600 pl-5">
              <span className="text-xs font-bold tracking-[0.18em] text-orange-500">
                {number}
              </span>
              <h3 className="mt-2 font-bold text-slate-800">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-500">
        KalkiRide makes everyday travel simple, clear, and comfortable.
      </footer>
    </main>
  );
}
