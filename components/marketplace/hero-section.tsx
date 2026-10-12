/**
 * @file components/marketplace/hero-section.tsx
 * @description Landing Page Hero Header & Quick Location Search Component.
 * 
 * Features:
 * 1. Global Branding & Top Navigation Header (Login / Sign Up or Dashboard buttons).
 * 2. Hero Marketing Copy with customer ratings and referral incentive.
 * 3. Quick Route Search Box with Pickup and Destination fields.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCustomerActiveRide } from "@/app/actions/rides";
import type { PlaceSuggestion, RideSummary } from "@/types";
import LocationField from "./location-field";

/**
 * Checks if two place suggestions represent identical geographical points.
 */
function isSameLocation(a: PlaceSuggestion, b: PlaceSuggestion): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  const distance = Math.hypot(a.lat - b.lat, a.lng - b.lng);
  return distance < 0.0005;
}

interface HeroSectionProps {
  isAuthenticated: boolean;
  onContinue?: () => void;
  onPickupChange: (pickup: PlaceSuggestion | null) => void;
  onDestinationChange: (destination: PlaceSuggestion | null) => void;
  initialActiveRide?: RideSummary | null;
}

/**
 * Hero section for the KalkiRide public landing page.
 * 
 * @param {HeroSectionProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function HeroSection({
  isAuthenticated,
  onContinue,
  onPickupChange,
  onDestinationChange,
  initialActiveRide,
}: HeroSectionProps) {
  const router = useRouter();
  const [activeRide, setActiveRide] = useState<RideSummary | null>(initialActiveRide ?? null);
  const [pickupText, setPickupText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [pickupPlace, setPickupPlace] = useState<PlaceSuggestion | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<PlaceSuggestion | null>(null);

  // Sync active ride state on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    getCustomerActiveRide().then((res) => {
      if (!cancelled && res.ok) {
        setActiveRide(res.data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const hasActiveRide = Boolean(
    activeRide &&
      (activeRide.status === "requested" ||
        activeRide.status === "accepted" ||
        activeRide.status === "in_progress")
  );

  function handleGoToMyRides() {
    toast("Check into your My Rides to track your active trip.", {
      icon: "🚗",
      duration: 4000,
    });
    router.push("/ride-details");
  }

  function handlePickupSelect(place: PlaceSuggestion | null) {
    if (place && destinationPlace && isSameLocation(place, destinationPlace)) {
      toast.error("Pickup and destination cannot be the same location.");
      setPickupPlace(null);
      setPickupText("");
      return;
    }
    setPickupPlace(place);
    onPickupChange(place);
    if (place) {
      setPickupText(place.displayName);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("kalkiride_pickup", JSON.stringify(place));
      }
    } else if (typeof window !== "undefined") {
      sessionStorage.removeItem("kalkiride_pickup");
    }
  }

  function handleDestinationSelect(place: PlaceSuggestion | null) {
    if (place && pickupPlace && isSameLocation(place, pickupPlace)) {
      toast.error("Destination cannot be the same as pickup.");
      setDestinationPlace(null);
      setDestinationText("");
      return;
    }
    setDestinationPlace(place);
    onDestinationChange(place);
    if (place) {
      setDestinationText(place.displayName);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("kalkiride_destination", JSON.stringify(place));
      }
    } else if (typeof window !== "undefined") {
      sessionStorage.removeItem("kalkiride_destination");
    }
  }


  /**
   * Guides user to /ride-details with pre-filled locations.
   * If unauthenticated, routes through /login with redirectTo set to /ride-details.
   */
  function handleBookRide() {
    if (hasActiveRide) {
      handleGoToMyRides();
      return;
    }

    if (!pickupText.trim()) {
      toast.error("Please enter a pickup location.");
      return;
    }

    if (!destinationText.trim()) {
      toast.error("Please enter a destination.");
      return;
    }

    if (pickupPlace && destinationPlace && isSameLocation(pickupPlace, destinationPlace)) {
      toast.error("Pickup and destination cannot be the same location.");
      return;
    }

    const params = new URLSearchParams();
    if (pickupPlace) {
      params.set("pickup", pickupPlace.displayName);
      params.set("pickupLat", pickupPlace.lat.toString());
      params.set("pickupLng", pickupPlace.lng.toString());
    } else if (pickupText.trim()) {
      params.set("pickup", pickupText.trim());
    }

    if (destinationPlace) {
      params.set("destination", destinationPlace.displayName);
      params.set("destinationLat", destinationPlace.lat.toString());
      params.set("destinationLng", destinationPlace.lng.toString());
    } else if (destinationText.trim()) {
      params.set("destination", destinationText.trim());
    }


    const query = params.toString() ? `?${params.toString()}` : "";
    const targetUrl = `/ride-details${query}`;
    if (onContinue) {
      onContinue();
      return;
    }

    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent(targetUrl)}`);
      return;
    }

    router.push(targetUrl);
  }

  return (
    <section className="flex min-h-screen flex-col border-b border-slate-200 bg-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-800">
            Kalki<span className="text-orange-500">Ride</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <Link href="/ride-details" className="hover:text-blue-600 transition">Book a ride</Link>
            <a href="#referrals" className="hover:text-blue-600 transition">Refer & earn</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition">How it works</a>
          </nav>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/ride-details" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition">
                My rides
              </Link>
              <form action="/api/logout" method="post">
                <button type="submit" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition">
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Link href="/login" className="text-blue-600 hover:text-blue-700 transition">Login</Link>
              <Link href="/signup" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow-sm transition">Sign up</Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Content Body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Move your way</p>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl">
              Your city. Your ride. <span className="text-blue-600">Your choice.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Compare every ride option before you book, with clear pricing and a driver ready when you are.
            </p>
            <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-600">
              <span><strong className="text-slate-800">4.8/5</strong> rider rating</span>
              <span><strong className="text-slate-800">24/7</strong> availability</span>
              <span><strong className="text-slate-800">50 Rs</strong> per referral</span>
            </div>
          </div>

          {/* Quick Route Search Card */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-7 group overflow-hidden">
            {/* Active Ride Banner */}
            {hasActiveRide && (
              <div
                onClick={handleGoToMyRides}
                className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-amber-900 shadow-xs cursor-pointer hover:bg-amber-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-600"></span>
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Active Ride in Progress
                    </p>
                    <p className="text-xs text-amber-800">
                      You already have a trip booked. Check into your My Rides.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 hover:text-blue-700 underline shrink-0">
                  View &rarr;
                </span>
              </div>
            )}

            <h2 className="text-lg font-bold text-slate-800">Where are you going?</h2>
            <p className="mt-1 text-sm text-slate-500">See the best ride for your route.</p>

            <div className="mt-5 space-y-3">
              <LocationField
                placeholder="Search pickup location"
                value={pickupText}
                onChange={setPickupText}
                onSelect={handlePickupSelect}
                dotClassName="bg-blue-600"
                showCurrentLocation={true}
                fieldType="pickup"
                disabled={hasActiveRide}
              />
              <LocationField
                placeholder="Search destination"
                value={destinationText}
                onChange={setDestinationText}
                onSelect={handleDestinationSelect}
                dotClassName="bg-orange-500"
                showCurrentLocation={false}
                fieldType="destination"
                disabled={hasActiveRide}
              />
            </div>

            <button
              type="button"
              disabled={hasActiveRide}
              onClick={hasActiveRide ? handleGoToMyRides : handleBookRide}
              className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition ${
                hasActiveRide
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 hover:bg-slate-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {hasActiveRide ? "Book my ride (Ride already active)" : "Book my ride"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              {hasActiveRide
                ? "Please finish your ongoing trip before booking another ride."
                : "No booking or payment until you confirm."}
            </p>

            {/* Hover overlay covering entire width of 'Where are you going?' card */}
            {hasActiveRide && (
              <div
                onClick={handleGoToMyRides}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-xs p-6 text-center text-white opacity-0 transition-opacity duration-200 hover:opacity-100 cursor-pointer shadow-lg"
                title="Click anywhere to check into your My Rides"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl mb-3 shadow-inner">
                  🚗
                </div>
                <p className="text-base font-bold text-white">
                  You already booked a ride!
                </p>
                <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-200">
                  You have an active ride in progress. Click anywhere on this card to <strong>check into your My Rides</strong>.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition">
                  Check into My Rides &rarr;
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
