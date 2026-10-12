/**
 * @file components/common/theme-toggle.tsx
 * @description Light / Dark / System control. Compact cycle button on phones, segmented
 * control with a sliding indicator from the sm breakpoint up. Persisted via lib/theme.ts.
 */

"use client";

import { useId, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import {
  getPreference,
  setPreference,
  subscribe,
  type ThemePreference,
} from "@/lib/theme";

const SPRING = { type: "spring", stiffness: 520, damping: 38, mass: 0.8 } as const;
const ORDER: ThemePreference[] = ["light", "dark", "system"];
const LABEL: Record<ThemePreference, string> = { light: "Light", dark: "Dark", system: "System" };

function Icon({ pref }: { pref: ThemePreference }) {
  const common = {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (pref === "light")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  if (pref === "dark")
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function usePreference() {
  return useSyncExternalStore<ThemePreference>(subscribe, getPreference, () => "system");
}

export default function ThemeToggle() {
  const pref = usePreference();
  const groupId = useId();
  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];

  return (
    <>
      {/* Phones: one compact button that cycles */}
      <motion.button
        type="button"
        onClick={() => setPreference(next)}
        whileTap={{ scale: 0.92 }}
        transition={SPRING}
        aria-label={`Theme: ${LABEL[pref]}. Switch to ${LABEL[next]}`}
        title={`Theme: ${LABEL[pref]}`}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 sm:hidden"
      >
        <Icon pref={pref} />
      </motion.button>

      {/* sm and up: segmented control */}
      <div
        role="radiogroup"
        aria-label="Theme"
        className="hidden items-center gap-0.5 rounded-full bg-slate-100 p-1 sm:flex"
      >
        {ORDER.map((option) => {
          const active = pref === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={LABEL[option]}
              title={LABEL[option]}
              onClick={() => setPreference(option)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--kr-focus)] ${
                active ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`theme-indicator-${groupId}`}
                  transition={SPRING}
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-slate-900/10"
                />
              )}
              <span className="relative z-10">
                <Icon pref={option} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
