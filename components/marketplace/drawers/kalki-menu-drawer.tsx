/**
 * @file components/marketplace/drawers/kalki-menu-drawer.tsx
 * @description Slide-out Menu Drawer for KalkiRide navigation.
 */

"use client";

import React from "react";
import Link from "next/link";
import type { UserProfile } from "@/types";

interface KalkiMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  isAuthenticated: boolean;
  onOpenProfile: () => void;
  onOpenMyRides: () => void;
  onOpenOffers: () => void;
  onOpenSavedPlaces: () => void;
  onOpenSupport: () => void;
}

export default function KalkiMenuDrawer({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  onOpenProfile,
  onOpenMyRides,
  onOpenOffers,
  onOpenSavedPlaces,
  onOpenSupport,
}: KalkiMenuDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex h-full w-full max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900">
              Kalki<span className="text-amber-500">Ride</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {/* User Info Header if logged in */}
        {isAuthenticated && user && (
          <div
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            className="flex items-center gap-3 border-b border-slate-100 p-5 bg-slate-50/70 cursor-pointer hover:bg-slate-100 transition"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white font-black text-sm">
              {user.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-extrabold text-sm text-slate-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                View Account Profile →
              </p>
            </div>
          </div>
        )}

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-bold text-slate-700">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-100 transition"
          >
            <span>🏠</span>
            <span>Book a Ride (Home)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMyRides();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-100 transition"
          >
            <span>🚗</span>
            <span>My Rides & Trips</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-100 transition"
          >
            <span>👤</span>
            <span>Customer Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSavedPlaces();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-100 transition"
          >
            <span>📍</span>
            <span>Saved Places</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenOffers();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-100 transition"
          >
            <span>🎁</span>
            <span>Offers & ₹50 Referral</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSupport();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-100 transition"
          >
            <span>🎧</span>
            <span>24/7 Helpline & SOS</span>
          </button>

          <div className="border-t border-slate-100 my-2 pt-2">
            <Link
              href="/dashboard/driver"
              className="flex w-full items-center gap-3 rounded-xl p-3 text-blue-600 hover:bg-blue-50 transition"
            >
              <span>🚕</span>
              <span>Driver Console</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4">
          {isAuthenticated ? (
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="w-full rounded-xl border border-red-200 py-2.5 text-center text-xs font-bold text-red-600 hover:bg-red-50 transition"
              >
                Log Out
              </button>
            </form>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
