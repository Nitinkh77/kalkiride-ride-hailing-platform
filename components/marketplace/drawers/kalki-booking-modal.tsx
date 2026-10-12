/**
 * @file components/marketplace/drawers/kalki-booking-modal.tsx
 * @description Ride Booking Confirmation Modal for the single-page KalkiRide app.
 */

"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { requestRide } from "@/app/actions/rides";
import type { PlaceSuggestion, RideSummary } from "@/types";
import type { KalkiVehicle } from "../kalki-vehicle-selector";

interface KalkiBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickup: PlaceSuggestion;
  destination: PlaceSuggestion;
  vehicle: KalkiVehicle;
  distanceKm: number;
  durationMinutes: number;
  pricePerKm: number;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onRideBooked: (ride: RideSummary) => void;
}

export default function KalkiBookingModal({
  isOpen,
  onClose,
  pickup,
  destination,
  vehicle,
  distanceKm,
  durationMinutes,
  pricePerKm,
  isAuthenticated,
  onRequireAuth,
  onRideBooked,
}: KalkiBookingModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "wallet">("cash");

  // Escape to close and lock page scroll while the dialog is open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate fare estimate based on vehicle and platform rate
  const rawFare = Math.max(
    vehicle.baseFare,
    vehicle.baseFare + distanceKm * pricePerKm * vehicle.multiplier
  );
  const finalFare = Math.round(rawFare);

  async function handleConfirmBooking() {
    if (!isAuthenticated) {
      toast("Please log in or sign up to book your ride.");
      onRequireAuth();
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("pickupLocation", pickup.displayName);
      formData.set("pickupLat", pickup.lat.toString());
      formData.set("pickupLng", pickup.lng.toString());
      formData.set("destinationLocation", destination.displayName);
      formData.set("destinationLat", destination.lat.toString());
      formData.set("destinationLng", destination.lng.toString());

      const res = await requestRide({}, formData);

      if (!res) {
        toast.error("Could not book ride. Please try again.");
        return;
      }

      if ("errors" in res && res.errors) {
        const firstError = Object.values(res.errors)[0]?.[0];
        toast.error(firstError || "Could not book ride.");
        return;
      }

      if ("message" in res && res.message) {
        toast.error(res.message);
        return;
      }

      if ("ride" in res && res.ride) {
        toast.success("Ride requested successfully! Driver assigned soon.");
        onRideBooked(res.ride as unknown as RideSummary);
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const stroke = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paymentMethods = [
    {
      id: "cash" as const,
      label: "Cash on drop",
      icon: (
        <svg {...stroke}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      ),
    },
    {
      id: "upi" as const,
      label: "UPI / QR",
      icon: (
        <svg {...stroke}>
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M12 18h.01" />
        </svg>
      ),
    },
    {
      id: "wallet" as const,
      label: "Kalki Wallet",
      icon: (
        <svg {...stroke}>
          <path d="M19 7V4a1 1 0 00-1-1H5a2 2 0 000 4h15a1 1 0 011 1v4h-3a2 2 0 000 4h3a1 1 0 001-1v-2a1 1 0 00-1-1" />
          <path d="M3 5v14a2 2 0 002 2h15a1 1 0 001-1v-4" />
        </svg>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#22212a]/55 p-4"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal card: header stays put, content scrolls */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 460, damping: 36 }}
        className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <h3 id="booking-modal-title" className="text-lg font-extrabold tracking-tight text-slate-900">
            Confirm your {vehicle.name} ride
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {/* Route */}
          <div className="space-y-4 rounded-xl bg-slate-100 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[var(--kr-pickup)] ring-4 ring-[var(--kr-pickup)]/25" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Pickup</p>
                <p className="text-sm font-semibold leading-snug text-slate-900">{pickup.displayName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-amber-400 ring-4 ring-amber-400/25" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Destination</p>
                <p className="text-sm font-semibold leading-snug text-slate-900">{destination.displayName}</p>
              </div>
            </div>
          </div>

          {/* Trip metrics */}
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-100 px-2 py-3">
              <dt className="text-xs font-semibold text-slate-500">Distance</dt>
              <dd className="mt-1 text-base font-bold text-slate-900 tabular-nums">{distanceKm.toFixed(1)} km</dd>
            </div>
            <div className="rounded-xl bg-slate-100 px-2 py-3">
              <dt className="text-xs font-semibold text-slate-500">Est. time</dt>
              <dd className="mt-1 text-base font-bold text-slate-900 tabular-nums">{Math.round(durationMinutes)} min</dd>
            </div>
            <div className="rounded-xl bg-slate-100 px-2 py-3 ring-1 ring-amber-400/70">
              <dt className="text-xs font-semibold text-slate-500">Total fare</dt>
              <dd className="mt-1 text-xl font-bold leading-none text-slate-900 tabular-nums">₹{finalFare}</dd>
            </div>
          </dl>

          {/* Payment */}
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-bold text-slate-900">Payment option</legend>
            <div role="radiogroup" aria-label="Payment option" className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const selected = paymentMode === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPaymentMode(method.id)}
                    className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-bold transition active:scale-[0.98] ${
                      selected
                        ? "border-amber-400 bg-blue-50 text-slate-900 ring-1 ring-amber-400"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className={selected ? "text-amber-600" : "text-slate-500"}>{method.icon}</span>
                    {method.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Confirm */}
        <div className="shrink-0 border-t border-slate-200 px-5 py-4 sm:px-6">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 520, damping: 38 }}
            disabled={submitting}
            onClick={handleConfirmBooking}
            className="flex h-14 w-full items-center justify-between rounded-xl bg-amber-400 px-5 text-[var(--kr-on-brand)] shadow-[0_10px_24px_-10px_rgba(224,160,44,0.9)] transition hover:bg-amber-500 active:scale-[0.99] disabled:opacity-60"
          >
            <span className="text-base font-extrabold">
              {submitting ? "Booking your ride…" : `Confirm & request ${vehicle.name}`}
            </span>
            <span className="text-lg font-extrabold tabular-nums">₹{finalFare}</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
