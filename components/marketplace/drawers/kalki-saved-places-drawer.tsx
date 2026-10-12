/**
 * @file components/marketplace/drawers/kalki-saved-places-drawer.tsx
 * @description Saved Places Drawer for KalkiRide.
 */

"use client";

import React from "react";
import DrawerShell from "@/components/common/drawer-shell";
import type { PlaceSuggestion } from "@/types";

interface KalkiSavedPlacesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlace: (place: PlaceSuggestion, target: "pickup" | "destination") => void;
}

const SAVED_PRESETS: Array<{
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
}> = [
  {
    name: "Home",
    type: "home",
    lat: 22.7533,
    lng: 75.8937,
    address: "Scheme 54, Vijay Nagar, Indore",
  },
  {
    name: "Work",
    type: "work",
    lat: 22.723,
    lng: 75.8835,
    address: "Industry House, Old Palasia, Indore",
  },
  {
    name: "Chhappan Dukan",
    type: "food",
    lat: 22.7244,
    lng: 75.8823,
    address: "New Palasia, 56 Dukan, Indore",
  },
  {
    name: "Indore Junction Railway Station",
    type: "station",
    lat: 22.7176,
    lng: 75.8682,
    address: "Chhoti Gwaltoli, Indore",
  },
  {
    name: "Devi Ahilya Bai Holkar Airport",
    type: "airport",
    lat: 22.7217,
    lng: 75.8011,
    address: "Depalpur Road, Indore",
  },
];

const ICON_PATHS: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  work: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  food: "M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3v11",
  station: "M7 3h10a2 2 0 012 2v10a3 3 0 01-3 3H8a3 3 0 01-3-3V5a2 2 0 012-2zM5 11h14M8 21l2-3M16 21l-2-3",
  airport: "M2 16l20-6-2-2-6 1-5-5-2 1 3 5-5 2-2-2-1 1 3 3z",
};

function PlaceIcon({ type }: { type: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={ICON_PATHS[type] ?? ICON_PATHS.home} />
      </svg>
    </span>
  );
}

export default function KalkiSavedPlacesDrawer({
  isOpen,
  onClose,
  onSelectPlace,
}: KalkiSavedPlacesDrawerProps) {
  return (
    <DrawerShell isOpen={isOpen} onClose={onClose} title="Saved Places">
      <p className="text-sm leading-relaxed text-slate-600">
        Suggested places in Indore. Choose one as your pickup or drop.
      </p>

      <ul className="mt-3 border-t border-slate-200">
        {SAVED_PRESETS.map((preset) => {
          const place: PlaceSuggestion = {
            id: `preset-${preset.type}`,
            displayName: `${preset.name} - ${preset.address}`,
            lat: preset.lat,
            lng: preset.lng,
          };
          return (
            <li key={preset.type} className="border-b border-slate-200 py-4">
              <div className="flex items-start gap-3">
                <PlaceIcon type={preset.type} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold leading-tight text-slate-900">{preset.name}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{preset.address}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 pl-[52px]">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPlace(place, "pickup");
                    onClose();
                  }}
                  className="min-h-11 rounded-lg bg-blue-700 px-3 text-sm font-bold text-white transition hover:bg-blue-800 active:scale-95"
                >
                  Set as pickup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPlace(place, "destination");
                    onClose();
                  }}
                  className="min-h-11 rounded-lg bg-amber-400 px-3 text-sm font-bold text-[var(--kr-on-brand)] transition hover:bg-amber-500 active:scale-95"
                >
                  Set as drop
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </DrawerShell>
  );
}
