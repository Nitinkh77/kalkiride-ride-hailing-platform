/**
 * @file components/marketplace/drawers/kalki-offers-drawer.tsx
 * @description Offers and Referral drawer for KalkiRide.
 */

"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import DrawerShell from "@/components/common/drawer-shell";

interface KalkiOffersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COUPONS = [
  {
    code: "FIRSTTRIP",
    badge: "20% off",
    text: "20% off your first auto or bike ride in Indore.",
  },
  {
    code: "INDOREMETRO",
    badge: "₹15 off",
    text: "Flat ₹15 off trips starting or ending near Indore metro and bus stations.",
  },
];

export default function KalkiOffersDrawer({ isOpen, onClose }: KalkiOffersDrawerProps) {
  const [copied, setCopied] = useState(false);
  const code = "KALKI50";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referral code copied");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy. Please select the code and copy it manually.");
    }
  }

  return (
    <DrawerShell isOpen={isOpen} onClose={onClose} title="Offers & Rewards">
      {/* Referral: one solid brand surface, no gradient */}
      <section className="rounded-2xl bg-[#30264a] p-5 text-white">
        <span className="inline-block rounded-md bg-[#f4b544] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--kr-on-brand)]">
          Refer &amp; earn
        </span>
        <h3 className="mt-3 text-2xl font-extrabold tracking-tight">Give ₹50, Get ₹50</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[#eae5f4]">
          Share your referral code with friends in Indore. They get ₹50 off their first ride and you get ₹50 credit.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#fff9f0] p-2 pl-4">
          <span className="font-mono text-lg font-extrabold tracking-[0.2em] text-[var(--kr-on-brand)]">{code}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-11 rounded-lg bg-[#f4b544] px-4 text-sm font-extrabold text-[var(--kr-on-brand)] transition hover:bg-[#e0a02c] active:scale-95"
          >
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="coupons-heading">
        <h3 id="coupons-heading" className="text-sm font-bold text-slate-900">
          Coupons
        </h3>
        <ul className="mt-1 border-t border-slate-200">
          {COUPONS.map((c) => (
            <li key={c.code} className="flex items-start justify-between gap-4 border-b border-slate-200 py-4">
              <div className="min-w-0">
                <p className="font-mono text-sm font-extrabold tracking-wide text-slate-900">{c.code}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.text}</p>
              </div>
              <span className="shrink-0 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                {c.badge}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Coupon redemption at checkout isn&apos;t available in the app yet, so these are shown for information only.
        </p>
      </section>
    </DrawerShell>
  );
}
