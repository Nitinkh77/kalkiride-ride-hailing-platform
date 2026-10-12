/**
 * @file components/marketplace/kalki-top-bar.tsx
 * @description Header bar matching the user screenshot for KalkiRide.
 */

"use client";

import React from "react";
import ThemeToggle from "@/components/common/theme-toggle";

interface KalkiTopBarProps {
  onOpenMyRides: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
  hasActiveRide?: boolean;
  userName?: string | null;
}

export default function KalkiTopBar({
  onOpenMyRides,
  onOpenProfile,
  onOpenMenu,
  hasActiveRide = false,
  userName,
}: KalkiTopBarProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {/* Stylized 'K' Ribbon Logo */}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
            <svg viewBox="0 0 40 40" fill="none" className="h-9 w-9 text-blue-700">
              <path
                d="M10 6L10 34"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M30 8L15 22L30 34"
                stroke="#f4b544"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="21" cy="20" r="3" fill="#f4b544" />
            </svg>
          </div>

          <div>
            <div className="flex items-baseline">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Kalki<span className="text-blue-600">Ride</span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide -mt-1">
              Move Your Way
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* "My Rides" Pill Button */}
          <button
            type="button"
            onClick={onOpenMyRides}
            className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition active:scale-95"
          >
            {hasActiveRide && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border border-white"></span>
              </span>
            )}
            <svg
              className="h-4 w-4 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>My Rides</span>
          </button>

          {/* Profile Circle Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            title={userName ? `Profile: ${userName}` : "Open Profile"}
            aria-label="Open Profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition active:scale-95"
          >
            {userName ? (
              <span className="text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </button>

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={onOpenMenu}
            title="Menu"
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
