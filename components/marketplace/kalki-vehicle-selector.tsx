/**
 * @file components/marketplace/kalki-vehicle-selector.tsx
 * @description Choose Your Ride vehicle selection cards (radio group, scroll-snap on mobile).
 */

"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import React from "react";

export interface KalkiVehicle {
  id: string;
  name: string;
  priceText: string;
  imageSrc: string;
  baseFare: number;
  multiplier: number;
  etaMinutes: number;
  capacity: string;
}

export const VEHICLE_OPTIONS: KalkiVehicle[] = [
  {
    id: "bike",
    name: "Bike",
    priceText: "From ₹12",
    imageSrc: "/vehicles/bike.webp",
    baseFare: 12,
    multiplier: 0.7,
    etaMinutes: 2,
    capacity: "1 Person",
  },
  {
    id: "auto",
    name: "Auto",
    priceText: "From ₹25",
    imageSrc: "/vehicles/auto.webp",
    baseFare: 25,
    multiplier: 1.0,
    etaMinutes: 3,
    capacity: "3 Persons",
  },
  {
    id: "cab",
    name: "Cab",
    priceText: "From ₹60",
    imageSrc: "/vehicles/cab.webp",
    baseFare: 60,
    multiplier: 1.6,
    etaMinutes: 4,
    capacity: "4 Persons",
  },
  {
    id: "carpool",
    name: "Car Pool",
    priceText: "From ₹40",
    imageSrc: "/vehicles/carpool.webp",
    baseFare: 40,
    multiplier: 1.2,
    etaMinutes: 6,
    capacity: "4 Persons",
  },
];

interface KalkiVehicleSelectorProps {
  selectedId: string;
  onSelect: (vehicle: KalkiVehicle) => void;
  onViewAll?: () => void;
}

const SPRING = { type: "spring", stiffness: 520, damping: 38, mass: 0.8 } as const;

/** Photo on a fixed-ratio tile; falls back to the vehicle's initial if the image fails. */
function VehicleThumb({ vehicle, priority }: { vehicle: KalkiVehicle; priority: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-[66px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[var(--kr-vehicle-tile)]">
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-600" aria-hidden="true">
          {vehicle.name.charAt(0)}
        </span>
      ) : (
        <Image
          src={vehicle.imageSrc}
          alt={vehicle.name}
          fill
          sizes="104px"
          className="object-contain drop-shadow-[0_3px_3px_rgba(33,28,45,0.22)]"
          priority={priority}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default function KalkiVehicleSelector({
  selectedId,
  onSelect,
  onViewAll,
}: KalkiVehicleSelectorProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move the selection (roving radio-group behaviour)
  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    const last = VEHICLE_OPTIONS.length - 1;
    let next = index;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else return;
    e.preventDefault();
    onSelect(VEHICLE_OPTIONS[next]);
    refs.current[next]?.focus();
  }

  return (
    <section aria-labelledby="choose-ride-heading" className="mt-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="choose-ride-heading" className="text-[22px] font-bold tracking-tight text-slate-900">
          Choose a ride
        </h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="min-h-11 rounded-lg px-2 text-sm font-semibold text-blue-700 transition hover:underline"
          >
            View all
          </button>
        )}
      </div>

      <div role="radiogroup" aria-label="Vehicle type" className="border-y border-slate-200">
        {VEHICLE_OPTIONS.map((vehicle, index) => {
          const isSelected = selectedId === vehicle.id;
          return (
            <motion.button
              key={vehicle.id}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelect(vehicle)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              whileTap={{ scale: 0.985 }}
              transition={SPRING}
              className="relative flex min-h-[88px] w-full items-center border-b border-slate-200 px-3 py-2.5 text-left outline-none transition-colors last:border-b-0 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--kr-focus)]"
            >
              {/* Sliding selected surface + saffron accent (shared layout animation) */}
              {isSelected && (
                <>
                  <motion.span
                    layoutId="vehicle-selected-surface"
                    transition={SPRING}
                    aria-hidden
                    className="absolute inset-0 bg-blue-50"
                  />
                  <motion.span
                    layoutId="vehicle-selected-accent"
                    transition={SPRING}
                    aria-hidden
                    className="absolute inset-y-2 left-0 w-1 rounded-full bg-amber-400"
                  />
                </>
              )}
              <span className="relative z-10 flex w-full items-center gap-3 sm:gap-4">
                <VehicleThumb vehicle={vehicle} priority={vehicle.id === "bike"} />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold leading-tight text-slate-900">{vehicle.name}</span>
                  <span className="mt-1 block text-sm leading-snug text-slate-600 tabular-nums">
                    {vehicle.etaMinutes} min away · {vehicle.capacity}
                  </span>
                </span>
                <span className="shrink-0 text-[17px] font-bold text-slate-900 tabular-nums">{vehicle.priceText}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
