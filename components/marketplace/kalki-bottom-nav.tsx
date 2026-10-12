/**
 * @file components/marketplace/kalki-bottom-nav.tsx
 * @description Mobile Bottom Navigation Bar matching the user screenshot.
 */

"use client";

import React from "react";
import { motion } from "motion/react";

export type NavTab = "home" | "ride" | "offers" | "profile";

interface KalkiBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  hasActiveRide?: boolean;
}

export default function KalkiBottomNav({
  activeTab,
  onTabChange,
  hasActiveRide = false,
}: KalkiBottomNavProps) {
  const tabs = [
    {
      id: "home" as NavTab,
      label: "Home",
      icon: (
        <svg
          className="h-5 w-5"
          fill={activeTab === "home" ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={activeTab === "home" ? "2" : "1.8"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: "ride" as NavTab,
      label: "Ride",
      badge: hasActiveRide,
      icon: (
        <svg
          className="h-5 w-5"
          fill={activeTab === "ride" ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={activeTab === "ride" ? "2" : "1.8"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      ),
    },
    {
      id: "offers" as NavTab,
      label: "Offers",
      icon: (
        <svg
          className="h-5 w-5"
          fill={activeTab === "offers" ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={activeTab === "offers" ? "2" : "1.8"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v13m0-13V4a2 2 0 112 2h-2zm0 0V4a2 2 0 10-2 2h2zm-7 4h14a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1v-7a1 1 0 011-1z"
          />
        </svg>
      ),
    },
    {
      id: "profile" as NavTab,
      label: "Profile",
      icon: (
        <svg
          className="h-5 w-5"
          fill={activeTab === "profile" ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={activeTab === "profile" ? "2" : "1.8"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className="relative flex min-h-12 min-w-16 flex-col items-center justify-center rounded-lg px-4 py-1 cursor-pointer outline-none transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--kr-focus)]"
            >
              {/* Active Indicator Bar on Top or Bottom */}
              <div className="relative">
                <div
                  className={`transition-colors ${
                    isActive ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {tab.icon}
                </div>

                {tab.badge && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <span
                className={`text-xs font-semibold mt-1 transition-colors ${
                  isActive ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>

              {/* Active indicator slides between tabs */}
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.8 }}
                  aria-hidden
                  className="absolute -bottom-1 h-0.5 w-6 rounded-full bg-amber-400"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
