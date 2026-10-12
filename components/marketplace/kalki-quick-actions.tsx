/**
 * @file components/marketplace/kalki-quick-actions.tsx
 * @description Quick actions: Saved Places, Offers, Refer & Earn, Help & Support.
 * One connected panel (2x2 on phones, 1x4 on larger screens) with a consistent
 * line-icon set. Saffron marks the money actions, indigo the utility ones.
 */

"use client";

import React from "react";

interface KalkiQuickActionsProps {
  onOpenSavedPlaces: () => void;
  onOpenOffers: () => void;
  onOpenReferrals: () => void;
  onOpenSupport: () => void;
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function KalkiQuickActions({
  onOpenSavedPlaces,
  onOpenOffers,
  onOpenReferrals,
  onOpenSupport,
}: KalkiQuickActionsProps) {
  const indigo = "bg-blue-100 text-blue-700";
  const saffron = "bg-amber-100 text-amber-600";

  const actions = [
    {
      id: "saved-places",
      title: "Saved Places",
      subtitle: "Home, work & more",
      tone: indigo,
      onClick: onOpenSavedPlaces,
      icon: (
        <Icon>
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z" />
          <circle cx="12" cy="10" r="3" />
        </Icon>
      ),
    },
    {
      id: "offers",
      title: "Offers",
      subtitle: "See what's on",
      tone: saffron,
      onClick: onOpenOffers,
      icon: (
        <Icon>
          <path d="M12.59 2.59A2 2 0 0011.17 2H4a2 2 0 00-2 2v7.17a2 2 0 00.59 1.42l8.7 8.7a2.43 2.43 0 003.42 0l6.58-6.58a2.43 2.43 0 000-3.42z" />
          <circle cx="7.5" cy="7.5" r=".6" fill="currentColor" />
        </Icon>
      ),
    },
    {
      id: "refer-earn",
      title: "Refer & Earn",
      subtitle: "Give ₹50, get ₹50",
      tone: saffron,
      onClick: onOpenReferrals,
      icon: (
        <Icon>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
          <path d="M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 010 5" />
        </Icon>
      ),
    },
    {
      id: "support",
      title: "Help & Support",
      subtitle: "FAQs & safety",
      tone: indigo,
      onClick: onOpenSupport,
      icon: (
        <Icon>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="M4.93 4.93l4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24" />
        </Icon>
      ),
    },
  ];

  return (
    <section aria-label="Shortcuts" className="w-full">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-900/5 md:grid-cols-4">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={act.onClick}
            className="group flex min-h-[76px] items-center gap-3 bg-white px-4 py-3 text-left transition active:scale-[0.99] hover:bg-slate-50 focus-visible:relative focus-visible:z-10"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${act.tone}`}
            >
              {act.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold leading-tight text-slate-900">{act.title}</span>
              <span className="mt-0.5 block text-sm leading-snug text-slate-600">{act.subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
