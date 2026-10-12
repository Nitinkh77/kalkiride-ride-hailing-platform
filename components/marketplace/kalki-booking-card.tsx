/**
 * @file components/marketplace/kalki-booking-card.tsx
 * @description Floating Route and Booking Card matching the user screenshot.
 * Uses direct debounced location search with dropdown under each field.
 */

"use client";

import { motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { searchPlaces } from "@/services/location.service";
import type { PlaceSuggestion } from "@/types";

interface KalkiBookingCardProps {
  pickupText: string;
  destinationText: string;
  onPickupChange: (text: string) => void;
  onDestinationChange: (text: string) => void;
  onPickupSelect: (place: PlaceSuggestion | null) => void;
  onDestinationSelect: (place: PlaceSuggestion | null) => void;
  onSelectQuickChip: (type: "home" | "work") => void;
  onBookRide: () => void;
  onLocateMe: () => void;
  isCalculatingRoute?: boolean;
  disabled?: boolean;
  onSwap?: () => void;
  pickupPlaceholder?: string;
  ctaLabel?: string;
}

export default function KalkiBookingCard({
  pickupText,
  destinationText,
  onPickupChange,
  onDestinationChange,
  onPickupSelect,
  onDestinationSelect,
  onSelectQuickChip,
  onBookRide,
  onLocateMe,
  isCalculatingRoute = false,
  disabled = false,
  onSwap,
  pickupPlaceholder = "Enter pickup location",
  ctaLabel = "Book my ride",
}: KalkiBookingCardProps) {
  // Pickup search state
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const pickupAbortRef = useRef<AbortController | null>(null);
  const pickupRef = useRef<HTMLDivElement>(null);
  const isTypingPickupRef = useRef(false);

  // Destination search state
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destLoading, setDestLoading] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const destAbortRef = useRef<AbortController | null>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const isTypingDestRef = useRef(false);

  // Debounced search for Pickup - only runs when user actively types
  useEffect(() => {
    if (!isTypingPickupRef.current) {
      setPickupSuggestions([]);
      setPickupOpen(false);
      return;
    }

    const q = pickupText.trim();
    pickupAbortRef.current?.abort();

    if (q.length < 2) {
      setPickupSuggestions([]);
      setPickupOpen(false);
      return;
    }

    const controller = new AbortController();
    pickupAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setPickupLoading(true);
      const res = await searchPlaces(q, controller.signal);
      if (controller.signal.aborted) return;
      setPickupLoading(false);

      if (res.ok && res.data.length > 0) {
        setPickupSuggestions(res.data);
        setPickupOpen(true);
      } else {
        setPickupSuggestions([]);
        setPickupOpen(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pickupText]);

  // Debounced search for Destination - only runs when user actively types
  useEffect(() => {
    if (!isTypingDestRef.current) {
      setDestSuggestions([]);
      setDestOpen(false);
      return;
    }

    const q = destinationText.trim();
    destAbortRef.current?.abort();

    if (q.length < 2) {
      setDestSuggestions([]);
      setDestOpen(false);
      return;
    }

    const controller = new AbortController();
    destAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setDestLoading(true);
      const res = await searchPlaces(q, controller.signal);
      if (controller.signal.aborted) return;
      setDestLoading(false);

      if (res.ok && res.data.length > 0) {
        setDestSuggestions(res.data);
        setDestOpen(true);
      } else {
        setDestSuggestions([]);
        setDestOpen(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destinationText]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickupRef.current && !pickupRef.current.contains(e.target as Node)) {
        setPickupOpen(false);
        isTypingPickupRef.current = false;
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setDestOpen(false);
        isTypingDestRef.current = false;
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPickup = (place: PlaceSuggestion) => {
    isTypingPickupRef.current = false;
    pickupAbortRef.current?.abort();
    setPickupLoading(false);
    setPickupOpen(false);
    setPickupSuggestions([]);
    onPickupChange(place.displayName);
    onPickupSelect(place);
  };

  const handleSelectDest = (place: PlaceSuggestion) => {
    isTypingDestRef.current = false;
    destAbortRef.current?.abort();
    setDestLoading(false);
    setDestOpen(false);
    setDestSuggestions([]);
    onDestinationChange(place.displayName);
    onDestinationSelect(place);
  };

  return (
    <div className="relative z-10 mt-6 w-full">
      <div className="rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_16px_36px_-16px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 sm:p-4">
        {/* Route Fields Container */}
        <div className="relative space-y-2">
          {onSwap && (
            <button
              type="button"
              onClick={onSwap}
              aria-label="Swap pickup and destination"
              className="absolute right-14 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-900/10 transition hover:text-blue-600 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" /></svg>
            </button>
          )}
          {/* Pickup Location Row */}
          <div ref={pickupRef} className="relative">
            <div className="kalki-field flex items-center gap-3 rounded-xl border border-transparent bg-slate-100 px-3.5 py-3 transition focus-within:border-amber-400 focus-within:bg-white focus-within:ring-1 focus-within:ring-amber-400/60">
              <div className="flex flex-col items-center pl-1">
                <span className="h-3 w-3 rounded-full bg-[var(--kr-pickup)] ring-4 ring-[var(--kr-pickup)]/25"></span>
                <span className="w-0.5 h-6 bg-slate-200 mt-1"></span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight text-slate-500">
                  Pickup location
                </p>
                <input
                  type="text"
                  aria-label="Pickup location"
                  autoComplete="off"
                  value={pickupText}
                  onChange={(e) => {
                    isTypingPickupRef.current = true;
                    onPickupChange(e.target.value);
                    onPickupSelect(null);
                  }}
                  onFocus={() => {
                    if (isTypingPickupRef.current && pickupSuggestions.length > 0) setPickupOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pickupSuggestions.length > 0) {
                      e.preventDefault();
                      handleSelectPickup(pickupSuggestions[0]);
                    }
                  }}
                  placeholder={pickupPlaceholder}
                  className="w-full truncate bg-transparent text-[15px] font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* GPS crosshair / Use Current Location */}
              <button
                type="button"
                onClick={() => {
                  isTypingPickupRef.current = false;
                  setPickupOpen(false);
                  setPickupSuggestions([]);
                  onLocateMe();
                }}
                title="Use current location"
                aria-label="Use current location"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition active:scale-95 cursor-pointer"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2v3m0 14v3m10-10h-3M5 12H2"
                  />
                </svg>
              </button>
            </div>

            {/* Pickup Suggestions Dropdown */}
            {pickupOpen && pickupSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {pickupSuggestions.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectPickup(place)}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span className="truncate">{place.displayName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {pickupLoading && (
              <div className="absolute right-12 top-4">
                <span className="h-3 w-3 block rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></span>
              </div>
            )}
          </div>

          {/* Drop Location Row */}
          <div ref={destRef} className="relative">
            <div className="kalki-field flex items-center gap-3 rounded-xl border border-transparent bg-slate-100 px-3.5 py-3 transition focus-within:border-amber-400 focus-within:bg-white focus-within:ring-1 focus-within:ring-amber-400/60">
              <div className="flex flex-col items-center pl-1">
                <span className="h-3 w-3 rounded-full bg-amber-400 ring-4 ring-amber-100"></span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight text-slate-500">
                  Drop location
                </p>
                <input
                  type="text"
                  aria-label="Drop location"
                  autoComplete="off"
                  value={destinationText}
                  onChange={(e) => {
                    isTypingDestRef.current = true;
                    onDestinationChange(e.target.value);
                    onDestinationSelect(null);
                  }}
                  onFocus={() => {
                    if (isTypingDestRef.current && destSuggestions.length > 0) setDestOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && destSuggestions.length > 0) {
                      e.preventDefault();
                      handleSelectDest(destSuggestions[0]);
                    }
                  }}
                  placeholder="Enter destination"
                  className="w-full truncate bg-transparent text-[15px] font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Chevron Right */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Destination Suggestions Dropdown */}
            {destOpen && destSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {destSuggestions.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectDest(place)}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition flex items-center gap-2"
                    >
                      <span className="text-amber-500">📍</span>
                      <span className="truncate">{place.displayName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {destLoading && (
              <div className="absolute right-12 top-4">
                <span className="h-3 w-3 block rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></span>
              </div>
            )}
          </div>
        </div>

        {/* Shortcut Quick Chips: Home, Work, Rajkumar Bridge */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => onSelectQuickChip("home")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer"
          >
            <svg
              className="h-3.5 w-3.5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectQuickChip("work")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer"
          >
            <svg
              className="h-3.5 w-3.5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Work</span>
          </button>
        </div>

        {/* Primary CTA */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 520, damping: 38 }}
          disabled={disabled || isCalculatingRoute}
          onClick={onBookRide}
          className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 text-base font-extrabold text-[var(--kr-on-brand)] shadow-[0_10px_24px_-10px_rgba(224,160,44,0.9)] transition hover:bg-amber-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCalculatingRoute ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#22212a]/30 border-t-[#22212a]" />
              Calculating route…
            </>
          ) : (
            ctaLabel
          )}
        </motion.button>
      </div>
    </div>
  );
}
