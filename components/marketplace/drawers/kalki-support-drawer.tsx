/**
 * @file components/marketplace/drawers/kalki-support-drawer.tsx
 * @description Help & Support drawer. The support number comes from
 * NEXT_PUBLIC_SUPPORT_PHONE; nothing is shown as a contact until it is configured.
 */

"use client";

import React from "react";
import DrawerShell from "@/components/common/drawer-shell";

interface KalkiSupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "";

const FAQS = [
  {
    q: "How is the trip fare calculated?",
    a: "Fares use a base charge (Bike ₹12, Auto ₹25, Cab ₹60) plus distance from road routing. You see the fare before you confirm.",
  },
  {
    q: "How do I redeem my referral ₹50?",
    a: "Share your referral code with a friend. Once they complete their first trip, the credit is applied to your account.",
  },
];

export default function KalkiSupportDrawer({ isOpen, onClose }: KalkiSupportDrawerProps) {
  return (
    <DrawerShell isOpen={isOpen} onClose={onClose} title="Help & Support">
      <section aria-labelledby="contact-heading">
        <h3 id="contact-heading" className="text-sm font-bold text-slate-900">
          Contact KalkiRide
        </h3>
        {SUPPORT_PHONE ? (
          <a
            href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-400 px-4 text-base font-extrabold text-[var(--kr-on-brand)] transition hover:bg-amber-500 active:scale-[0.99]"
          >
            Call {SUPPORT_PHONE}
          </a>
        ) : (
          <p className="mt-2 rounded-xl bg-slate-100 p-4 text-sm leading-relaxed text-slate-600">
            Phone support isn&apos;t available in the app yet.
          </p>
        )}
      </section>

      <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="emergency-heading">
        <h3 id="emergency-heading" className="text-sm font-bold text-slate-900">
          In an emergency
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          If you are in danger, call India&apos;s national emergency number. KalkiRide can&apos;t send help from this app.
        </p>
        <a
          href="tel:112"
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-base font-bold text-white transition hover:bg-slate-800 active:scale-[0.99]"
        >
          Call 112
        </a>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="faq-heading">
        <h3 id="faq-heading" className="text-sm font-bold text-slate-900">
          Common questions
        </h3>
        <div className="mt-1">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-slate-200 py-3">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                {f.q}
                <svg className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <p className="pb-1 pt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </DrawerShell>
  );
}
