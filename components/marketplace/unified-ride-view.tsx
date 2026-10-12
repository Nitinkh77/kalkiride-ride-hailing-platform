/**
 * @file components/marketplace/unified-ride-view.tsx
 * @description Master Unified Single-Page View for KalkiRide.
 * 
 * Unifies Profile, Ride Booking, Live Telemetry, Ride History, and Map
 * into a single responsive page experience for both mobile and desktop.
 */

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getCustomerActiveRide,
  getCustomerRideById,
  getCustomerRideHistoryAction,
} from "@/app/actions/rides";
import { getRoute, reverseGeocode } from "@/services/location.service";
import type {
  PlaceSuggestion,
  RideSummary,
  UserProfile,
  LatLng,
} from "@/types";

import KalkiTopBar from "./kalki-top-bar";
import KalkiBookingCard from "./kalki-booking-card";
import { toMapVehicleType } from "@/components/map/vehicle-svg";
import KalkiVehicleSelector, {
  VEHICLE_OPTIONS,
  type KalkiVehicle,
} from "./kalki-vehicle-selector";
import KalkiQuickActions from "./kalki-quick-actions";
import KalkiPromoBanner from "./kalki-promo-banner";
import KalkiBottomNav, { type NavTab } from "./kalki-bottom-nav";
import KalkiRiderStatusView from "./kalki-rider-status-view";

// Drawers & Modals
import KalkiProfileDrawer from "./drawers/kalki-profile-drawer";
import KalkiRidesDrawer from "./drawers/kalki-rides-drawer";
import KalkiBookingModal from "./drawers/kalki-booking-modal";
import KalkiOffersDrawer from "./drawers/kalki-offers-drawer";
import KalkiSavedPlacesDrawer from "./drawers/kalki-saved-places-drawer";
import KalkiSupportDrawer from "./drawers/kalki-support-drawer";
import KalkiMenuDrawer from "./drawers/kalki-menu-drawer";

// Dynamically import Leaflet Map to avoid SSR window errors
const KalkiMap = dynamic(() => import("./kalki-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] sm:h-[380px] lg:h-[420px] w-full animate-pulse bg-slate-100 flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
        <span className="h-3 w-3 rounded-full bg-blue-500 animate-ping"></span>
        Loading Live Map...
      </div>
    </div>
  ),
});

// Map framing default (Indore city centre) until a real pickup is resolved or chosen.
// Its name is never written into the pickup field.
const DEFAULT_PICKUP: PlaceSuggestion = {
  id: "current-location",
  displayName: "Indore city centre",
  lat: 22.7196,
  lng: 75.8577,
};

interface UnifiedRideViewProps {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  pricePerKm: number;
  currency: string;
  initialActiveRide?: RideSummary | null;
  initialRideHistory?: RideSummary[];
}

export default function UnifiedRideView({
  isAuthenticated,
  currentUser,
  pricePerKm,
  initialActiveRide = null,
  initialRideHistory = [],
}: UnifiedRideViewProps) {
  // Navigation & Drawers state: default to "ride" status screen if user already has an active trip!
  const [activeTab, setActiveTab] = useState<NavTab>(initialActiveRide ? "ride" : "home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRidesOpen, setIsRidesOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isOffersOpen, setIsOffersOpen] = useState(false);
  const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Active Ride & History state
  const [activeRide, setActiveRide] = useState<RideSummary | null>(initialActiveRide);
  const [rideHistory, setRideHistory] = useState<RideSummary[]>(initialRideHistory);
  const lastActiveRideIdRef = useRef<string | null>(initialActiveRide?.id ?? null);

  // Location and Route state: fetch current location, destination initially empty
  const [pickup, setPickup] = useState<PlaceSuggestion>(DEFAULT_PICKUP);
  const [destination, setDestination] = useState<PlaceSuggestion | null>(null);
  const [pickupText, setPickupText] = useState("");
  const [isLocating, setIsLocating] = useState(true);
  const [destinationText, setDestinationText] = useState("");

  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Vehicle selection state (Default: Bike as in screenshot)
  const [selectedVehicle, setSelectedVehicle] = useState<KalkiVehicle>(VEHICLE_OPTIONS[0]);

  // Handle Bottom Nav Tab changes
  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === "profile") {
      setIsProfileOpen(true);
    } else if (tab === "ride") {
      if (!activeRide) {
        setIsRidesOpen(true);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (tab === "offers") {
      setIsOffersOpen(true);
    } else if (tab === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Close modals helper
  const closeAllDrawers = () => {
    setIsProfileOpen(false);
    setIsRidesOpen(false);
    setIsOffersOpen(false);
    setIsSavedPlacesOpen(false);
    setIsSupportOpen(false);
    setIsMenuOpen(false);
    setIsBookingModalOpen(false);
  };

  // Calculate real OSRM route whenever pickup or destination change
  useEffect(() => {
    let cancelled = false;

    const fetchRoute = async () => {
      if (!destination) {
        setRouteCoordinates([]);
        return;
      }
      setIsCalculatingRoute(true);
      try {
        const res = await getRoute(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: destination.lat, lng: destination.lng }
        );
        if (cancelled) return;

        if (res.ok && res.data) {
          setRouteCoordinates(res.data.routeCoordinates || []);
          setDistanceKm(res.data.distanceKm);
          setDurationMinutes(res.data.durationMinutes);
        } else {
          setRouteCoordinates([
            { lat: pickup.lat, lng: pickup.lng },
            { lat: (pickup.lat + destination.lat) / 2 + 0.002, lng: (pickup.lng + destination.lng) / 2 + 0.001 },
            { lat: destination.lat, lng: destination.lng },
          ]);
          const dist = Math.hypot(pickup.lat - destination.lat, pickup.lng - destination.lng) * 111;
          setDistanceKm(Number(dist.toFixed(1)));
          setDurationMinutes(Math.round(dist * 3));
        }
      } catch {
        // Graceful fallback
      } finally {
        if (!cancelled) {
          setIsCalculatingRoute(false);
        }
      }
    };

    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [pickup, destination]);

  // Active Ride Poller (queries active ride state every 4s if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const poll = async () => {
      const res = await getCustomerActiveRide();
      if (cancelled) return;

      if (res.ok && res.data) {
        setActiveRide(res.data);
        lastActiveRideIdRef.current = res.data.id;
        return;
      }

      // If active ride ended, check if it was completed
      if (!res.ok && res.error === "not_found" && lastActiveRideIdRef.current) {
        const finishedId = lastActiveRideIdRef.current;
        lastActiveRideIdRef.current = null;
        setActiveRide(null);

        // Refresh ride history
        getCustomerRideHistoryAction().then((histRes) => {
          if (!cancelled && histRes.ok && histRes.data) {
            setRideHistory(histRes.data);
          }
        });

        // Fetch completed ride receipt toast
        getCustomerRideById(finishedId).then((finalRes) => {
          if (!cancelled && finalRes.ok && finalRes.data?.status === "completed") {
            toast.success("Trip completed! Hope you enjoyed your KalkiRide.", { icon: "🎉" });
          }
        });
      }
    };

    const timer = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isAuthenticated]);

  // GPS Locate User
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    toast.loading("Locating your position...", { id: "gps-locate" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const rev = await reverseGeocode(lat, lng);
        toast.dismiss("gps-locate");

        const newPlace: PlaceSuggestion = {
          id: `gps-${lat}-${lng}`,
          displayName: rev.ok ? rev.data.displayName : `My Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          lat,
          lng,
        };

        setPickup(newPlace);
        setPickupText(newPlace.displayName);
        toast.success("Location updated to your GPS position!");
      },
      () => {
        toast.dismiss("gps-locate");
        toast.error("Couldn't get your location. Allow location access or enter a pickup.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Automatically fetch current GPS location on initial page load
  useEffect(() => {
    let cancelled = false;

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          try {
            const rev = await reverseGeocode(lat, lng);
            if (cancelled) return;

            const name = rev.ok
              ? rev.data.displayName
              : `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

            const gpsPlace: PlaceSuggestion = {
              id: `gps-init-${lat.toFixed(4)}-${lng.toFixed(4)}`,
              displayName: name,
              lat,
              lng,
            };

            setPickup(gpsPlace);
            setPickupText(name);
            setIsLocating(false);
          } catch {
            if (cancelled) return;
            const fallbackGps: PlaceSuggestion = {
              id: `gps-init-${lat}-${lng}`,
              displayName: "Current Location",
              lat,
              lng,
            };
            setPickup(fallbackGps);
            setPickupText("Current location");
            setIsLocating(false);
          }
        },
        (err) => {
          console.warn("Initial auto-geolocation could not be obtained:", err);
          if (!cancelled) setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Quick Chips Shortcut: Home, Work
  const handleSelectQuickChip = (type: "home" | "work") => {
    let targetPlace: PlaceSuggestion;

    if (type === "home") {
      targetPlace = {
        id: "chip-home",
        displayName: "Home - Scheme 54, Vijay Nagar, Indore",
        lat: 22.7533,
        lng: 75.8937,
      };
    } else {
      targetPlace = {
        id: "chip-work",
        displayName: "Work - Industry House, Palasia, Indore",
        lat: 22.723,
        lng: 75.8835,
      };
    }

    // Set as destination
    setDestination(targetPlace);
    setDestinationText(targetPlace.displayName);
    toast.success(`Destination set to ${targetPlace.displayName.split(" - ")[0]}!`);
  };

  // Saved place selection from drawer
  const handleSelectSavedPlace = (place: PlaceSuggestion, target: "pickup" | "destination") => {
    if (target === "pickup") {
      setPickup(place);
      setPickupText(place.displayName);
    } else {
      setDestination(place);
      setDestinationText(place.displayName);
    }
    toast.success(`${target === "pickup" ? "Pickup" : "Destination"} updated!`);
  };

  // Click on map to set destination
  const handleMapClick = async (lat: number, lng: number) => {
    const rev = await reverseGeocode(lat, lng);
    const place: PlaceSuggestion = {
      id: `map-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      displayName: rev.ok ? rev.data.displayName : `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
    };
    setDestination(place);
    setDestinationText(place.displayName);
    toast.success("Destination pinned from map!");
  };

  // Drag pickup marker on map
  const handlePickupDrag = async (lat: number, lng: number) => {
    const rev = await reverseGeocode(lat, lng);
    const place: PlaceSuggestion = {
      id: `pickup-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      displayName: rev.ok ? rev.data.displayName : `Pickup (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
    };
    setPickup(place);
    setPickupText(place.displayName);
    toast.success("Pickup location updated!");
  };

  // Drag destination marker on map
  const handleDestinationDrag = async (lat: number, lng: number) => {
    const rev = await reverseGeocode(lat, lng);
    const place: PlaceSuggestion = {
      id: `dest-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      displayName: rev.ok ? rev.data.displayName : `Destination (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
    };
    setDestination(place);
    setDestinationText(place.displayName);
    toast.success("Destination updated!");
  };

  // Initiate Booking
  const handleBookRide = () => {
    if (activeRide) {
      setIsRidesOpen(true);
      toast("You currently have an active ride in progress.", { icon: "🚗" });
      return;
    }

    // Typed text only counts once it matches a chosen place (suggestion, saved place,
    // GPS fix or map pin), so the booking never uses stale coordinates.
    if (!pickupText.trim()) {
      toast.error("Please enter a pickup location.");
      return;
    }
    if (pickupText !== pickup.displayName) {
      toast.error("Choose your pickup from the suggestions.");
      return;
    }

    if (!destinationText.trim()) {
      toast.error("Please enter a destination to proceed.");
      return;
    }
    if (!destination || destinationText !== destination.displayName) {
      toast.error("Choose your destination from the suggestions.");
      return;
    }

    // Open booking confirmation modal
    setIsBookingModalOpen(true);
  };

  // Swap pickup and destination (only available once a destination is chosen)
  const handleSwapRoute = () => {
    if (!destination) return;
    const prevPickup = pickup;
    const prevPickupText = pickupText;
    setPickup(destination);
    setPickupText(destinationText);
    setDestination(prevPickup);
    setDestinationText(prevPickupText);
  };

  return (
    <div className="kr-ambient min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-8 selection:bg-amber-400 selection:text-slate-950">
      {/* 1. Header matching the screenshot */}
      <KalkiTopBar
        onOpenMyRides={() => {
          if (activeRide) {
            setActiveTab("ride");
          } else {
            setIsRidesOpen(true);
          }
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        hasActiveRide={Boolean(activeRide)}
        userName={currentUser?.name}
      />

      {/* Main Single-Page Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2">
        {activeTab === "ride" && activeRide ? (
          <KalkiRiderStatusView
            ride={activeRide}
            onBackToHome={() => setActiveTab("home")}
            onRideUpdated={(updated) => setActiveRide(updated)}
            onRideCancelled={() => {
              setActiveRide(null);
              setActiveTab("home");
            }}
          />
        ) : (
          <div className="w-full">
            {/* Active Ride Floating Banner on Home */}
            {activeRide && (
              <div
                onClick={() => setActiveTab("ride")}
                className="mb-4 flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-amber-950 cursor-pointer hover:bg-amber-500/20 transition shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase text-amber-900">
                      Active Ride in Progress • {activeRide.status.replace("_", " ")}
                    </p>
                    <p className="text-xs text-amber-800">
                      Tap here to view live driver map & moving vehicle →
                    </p>
                  </div>
                </div>
                <span className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xs">
                  View Status →
                </span>
              </div>
            )}

            {/* Two-column booking composition: copy + form (left), map (right) */}
            <div className="lg:grid lg:grid-cols-[minmax(400px,480px)_1fr] lg:gap-12 xl:gap-16">
              {/* Map: full-bleed on top for mobile, sticky on the right for desktop */}
              <div className="-mx-4 sm:mx-0 lg:sticky lg:top-24 lg:order-2 lg:self-start">
                <div className="overflow-hidden sm:rounded-3xl lg:shadow-[0_24px_60px_-24px_rgba(10,47,31,0.45)]">
                  <KalkiMap
                    pickup={pickup}
                    destination={destination}
                    routeCoordinates={routeCoordinates}
                    onOpenPickupSelect={() => setIsSavedPlacesOpen(true)}
                    onLocateMe={handleLocateMe}
                    onMapClick={handleMapClick}
                    onPickupDrag={handlePickupDrag}
                    onDestinationDrag={handleDestinationDrag}
                    vehicleType={toMapVehicleType(selectedVehicle.id)}
                    className="h-[300px] w-full sm:h-[380px] lg:h-[calc(100vh-9rem)] lg:max-h-[720px] lg:min-h-[500px]"
                  />
                </div>
              </div>

              {/* Left column. On mobile it rises over the map like a bottom sheet */}
              <div className="relative z-10 -mx-4 -mt-6 rounded-t-3xl bg-slate-50 px-4 pb-4 pt-6 sm:mx-0 sm:mt-0 sm:rounded-none sm:px-0 sm:pt-8 lg:order-1 lg:pt-4">
                <h1 className="text-[2.25rem] font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-[2.75rem] lg:text-[3.1rem]">
                  Your city.
                  <br />
                  <span className="text-blue-700 underline decoration-amber-400 decoration-[5px] underline-offset-[7px]">Your ride.</span>
                </h1>
                <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600 sm:text-[17px]">
                  Book a bike, auto or cab in seconds. See your fare before you confirm.
                </p>

                <KalkiBookingCard
                  pickupText={pickupText}
                  destinationText={destinationText}
                  onPickupChange={setPickupText}
                  onDestinationChange={setDestinationText}
                  onPickupSelect={(p) => {
                    if (p) {
                      setPickup(p);
                      setPickupText(p.displayName);
                    }
                  }}
                  onDestinationSelect={(d) => {
                    if (d) {
                      setDestination(d);
                      setDestinationText(d.displayName);
                    }
                  }}
                  onSelectQuickChip={handleSelectQuickChip}
                  onBookRide={handleBookRide}
                  onLocateMe={handleLocateMe}
                  onSwap={destination ? handleSwapRoute : undefined}
                  pickupPlaceholder={isLocating ? "Locating your position…" : "Enter pickup location"}
                  ctaLabel={`Book ${selectedVehicle.name}`}
                  isCalculatingRoute={isCalculatingRoute}
                />

                <KalkiVehicleSelector
                  selectedId={selectedVehicle.id}
                  onSelect={(veh) => {
                    setSelectedVehicle(veh);
                  }}
                  onViewAll={() => toast("All vehicle categories are available in Indore")}
                />
              </div>
            </div>

            <div className="mt-8 space-y-6">
            {/* 5. Quick Actions 4-Grid */}
            <KalkiQuickActions
              onOpenSavedPlaces={() => setIsSavedPlacesOpen(true)}
              onOpenOffers={() => setIsOffersOpen(true)}
              onOpenReferrals={() => setIsOffersOpen(true)}
              onOpenSupport={() => setIsSupportOpen(true)}
            />

            {/* 6. Promotional Special Offer Banner */}
            <KalkiPromoBanner onReferNow={() => setIsOffersOpen(true)} />
            </div>
          </div>
        )}
      </main>

      {/* 7. Bottom Navigation Bar (Mobile / Responsive) */}
      <KalkiBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasActiveRide={Boolean(activeRide)}
      />

      {/* ─── Integrated Drawers & Modals (All on this ONE PAGE) ─── */}

      {/* Profile Drawer */}
      <KalkiProfileDrawer
        isOpen={isProfileOpen}
        onClose={closeAllDrawers}
        user={currentUser}
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => {
          closeAllDrawers();
          window.location.href = "/login";
        }}
        totalTrips={rideHistory.length}
      />

      {/* My Rides Drawer (Active ride tracking + past trips) */}
      <KalkiRidesDrawer
        isOpen={isRidesOpen}
        onClose={closeAllDrawers}
        activeRide={activeRide}
        rideHistory={rideHistory}
        onCancelActiveRide={() => {
          setActiveRide(null);
          toast.success("Your ride was cancelled.");
        }}
        onBookNewRide={() => {
          closeAllDrawers();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Booking Confirmation Modal */}
      {destination && (
        <KalkiBookingModal
          isOpen={isBookingModalOpen}
          onClose={closeAllDrawers}
          pickup={pickup}
          destination={destination}
          vehicle={selectedVehicle}
          distanceKm={distanceKm}
          durationMinutes={durationMinutes}
          pricePerKm={pricePerKm}
          isAuthenticated={isAuthenticated}
          onRequireAuth={() => {
            window.location.href = `/login?redirectTo=${encodeURIComponent("/")}`;
          }}
          onRideBooked={(newRide) => {
            setActiveRide(newRide);
            setIsBookingModalOpen(false);
            setActiveTab("ride");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Offers & Referral Drawer */}
      <KalkiOffersDrawer
        isOpen={isOffersOpen}
        onClose={closeAllDrawers}
      />

      {/* Saved Places Drawer */}
      <KalkiSavedPlacesDrawer
        isOpen={isSavedPlacesOpen}
        onClose={closeAllDrawers}
        onSelectPlace={handleSelectSavedPlace}
      />

      {/* Help & Support Drawer */}
      <KalkiSupportDrawer
        isOpen={isSupportOpen}
        onClose={closeAllDrawers}
      />

      {/* Hamburger Menu Drawer */}
      <KalkiMenuDrawer
        isOpen={isMenuOpen}
        onClose={closeAllDrawers}
        user={currentUser}
        isAuthenticated={isAuthenticated}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenMyRides={() => setIsRidesOpen(true)}
        onOpenOffers={() => setIsOffersOpen(true)}
        onOpenSavedPlaces={() => setIsSavedPlacesOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
      />
    </div>
  );
}
