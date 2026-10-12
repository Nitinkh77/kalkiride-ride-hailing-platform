/**
 * @file components/marketplace/drawers/kalki-profile-drawer.tsx
 * @description Customer Profile Drawer for the unified single-page KalkiRide app.
 */

"use client";

import React from "react";
import Link from "next/link";
import type { UserProfile } from "@/types";

interface KalkiProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  isAuthenticated: boolean;
  onOpenLogin?: () => void;
  totalTrips?: number;
}

export default function KalkiProfileDrawer({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  totalTrips = 0,
}: KalkiProfileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-amber-500"></span>
            <h2 className="text-lg font-black text-slate-900">Your Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isAuthenticated && user ? (
            <>
              {/* Profile Card */}
              <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#3f3260] p-5 text-white shadow-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-2xl font-black text-slate-900 shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : "R"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-extrabold text-white">
                      {user.name}
                    </h3>
                  </div>
                  <p className="truncate text-xs text-slate-300 font-medium">
                    {user.email}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {user.phone || "+91 98765 43210"}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Active Verified
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Trips
                  </span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {totalTrips}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rating
                  </span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    4.9★
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rewards
                  </span>
                  <p className="text-lg font-black text-amber-600 mt-0.5">
                    ₹50
                  </p>
                </div>
              </div>

              {/* Account Details Form/List */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Account Details
                </p>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500 font-medium">Role</span>
                  <span className="font-extrabold capitalize text-slate-800">
                    {user.role} Rider
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500 font-medium">Member Since</span>
                  <span className="font-semibold text-slate-800">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })
                      : "2026"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500 font-medium">Default City</span>
                  <span className="font-semibold text-slate-800">Indore, MP</span>
                </div>
              </div>

              {/* Driver Portal Link if applicable */}
              <Link
                href="/dashboard/driver"
                className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-4 transition hover:bg-blue-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                    🚗
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900">
                      Driver Mode
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Switch to driver console & rides
                    </p>
                  </div>
                </div>
                <span className="text-blue-600 font-bold text-xs">Switch →</span>
              </Link>

              {/* Logout Button */}
              <form action="/api/logout" method="post">
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-red-200 bg-red-50/60 py-3 text-center text-xs font-extrabold text-red-600 hover:bg-red-100 transition active:scale-98"
                >
                  Log Out of KalkiRide
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                👋
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Welcome to KalkiRide
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Log in or sign up to manage your rides, save your home and work places, and earn ₹50 rewards.
                </p>
              </div>
              <div className="pt-4 space-y-2">
                <Link
                  href="/login"
                  className="block w-full rounded-2xl bg-blue-600 py-3 text-center text-sm font-extrabold text-white shadow-md hover:bg-blue-700 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full rounded-2xl border border-slate-200 py-3 text-center text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition"
                >
                  Create New Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
