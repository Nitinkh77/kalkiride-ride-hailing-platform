/**
 * @file components/auth/google-button.tsx
 * @description Sleek "Continue with Google" OAuth Button.
 * 
 * Used across:
 * 1. Login page (/login)
 * 2. Signup page (/signup)
 * 3. Marketplace Auth Modal (Hero / Header)
 */

"use client";

import { useState } from "react";

interface GoogleButtonProps {
  /** Optional target path to redirect after a successful Google login */
  redirectTo?: string;
  /** Optional role preference ("customer" | "driver") */
  role?: "customer" | "driver";
  /** Optional authentication mode ("login" | "signup") */
  mode?: "login" | "signup";
  /** Custom label text */
  text?: string;
}

export function GoogleButton({
  redirectTo,
  role = "customer",
  mode,
  text = "Continue with Google",
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);
    const params = new URLSearchParams();
    if (redirectTo) params.set("redirectTo", redirectTo);
    if (role) params.set("role", role);
    if (mode) params.set("mode", mode);
    const qs = params.toString();
    window.location.href = `/api/auth/google${qs ? `?${qs}` : ""}`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-800 transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span>{loading ? "Redirecting to Google…" : text}</span>
    </button>
  );
}
