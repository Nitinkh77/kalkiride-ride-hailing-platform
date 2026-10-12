/**
 * @file components/common/auth-header.tsx
 * @description Global Authenticated Header Navigation Bar with Profile Dropdown Menu.
 * 
 * Features:
 * 1. Clean minimalistic bar with brand logo on the left.
 * 2. Center navigation completely removed per UX requirements.
 * 3. Interactive Profile Menu in top-right corner with user avatar, name, email,
 *    links to "Book a ride" (/ride-details) and "Account & History" (/dashboard/customer),
 *    and a secure logout button.
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { UserRole } from "@/types";

interface AuthHeaderProps {
  /** The role of the currently authenticated user */
  role: UserRole;
  /** Optional user display name */
  userName?: string;
  /** Optional user email address */
  userEmail?: string;
}

/**
 * Top navigation bar displayed on Customer and Driver dashboards.
 * 
 * @param {AuthHeaderProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function AuthHeader({
  role,
  userName = "User",
  userEmail,
}: AuthHeaderProps) {
  const isDriver = role === "driver";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div
        className={`flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 ${
          isDriver ? "w-full" : "mx-auto max-w-7xl"
        }`}
      >
        {/* Brand Logo Link */}
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-800">
          Kalki<span className="text-orange-500">Ride</span>
        </Link>

        {/* Center is kept completely clean */}
        <div className="flex-1" />

        {/* Right Corner Profile & Actions */}
        <div className="relative flex items-center gap-3" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 text-left transition hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {/* User Avatar Circle */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
              {initials}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            {/* User Name & Role Label */}
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {userName}
              </p>
              <p className="text-[10px] font-medium text-slate-500 capitalize">
                {role}
              </p>
            </div>

            {/* Dropdown Chevron */}
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-12 mt-2 w-72 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xl shadow-slate-900/10 transition-all duration-150 animate-in fade-in slide-in-from-top-2">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-inner">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {userName}
                  </p>
                  {userEmail && (
                    <p className="truncate text-xs text-slate-500">
                      {userEmail}
                    </p>
                  )}
                  <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {isDriver ? "Driver Partner" : "Customer Account"}
                  </span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="py-1">
                {!isDriver ? (
                  <>
                    <Link
                      href="/ride-details"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        🚗
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">Book a ride</p>
                        <p className="text-[11px] font-normal text-slate-500">
                          Route planner & active tracking
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/dashboard/customer"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        📋
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">Account & History</p>
                        <p className="text-[11px] font-normal text-slate-500">
                          Personal profile & trip receipts
                        </p>
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard/driver"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                    >
                      <span>📊</span> Driver Dashboard
                    </Link>
                    <Link
                      href="/dashboard/driver/active"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                    >
                      <span>🛰️</span> Active Trip
                    </Link>
                    <Link
                      href="/dashboard/driver/rides"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                    >
                      <span>🚖</span> Available Requests
                    </Link>
                  </>
                )}
              </div>

              {/* Logout Button */}
              <div className="border-t border-slate-100 pt-1">
                <form action="/api/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Log out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
