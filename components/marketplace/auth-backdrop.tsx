/**
 * @file components/marketplace/auth-backdrop.tsx
 * @description Blurred Backdrop Overlay for Authentication Modals.
 * 
 * Closes modal on Escape key press or background click, routing back to `/`.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthBackdrop() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        router.push("/");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <Link
      href="/"
      aria-label="Close and return to home screen"
      className="fixed inset-0 z-0 bg-slate-950/45 backdrop-blur-sm transition"
    />
  );
}
