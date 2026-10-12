/**
 * @file components/marketplace/auth-modal.tsx
 * @description Authentication Dialog Overlay Modal.
 * 
 * Supports switching dynamically between Login and Signup forms.
 */

"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

type AuthMode = "login" | "signup";

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitch: () => void;
}

export default function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#22212a]/55 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.section initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 460, damping: 36 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[28rem] overflow-y-auto rounded-2xl bg-white px-5 py-7 shadow-2xl sm:px-8 sm:py-9"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          &times;
        </button>
        <div className="mb-7 pr-8 text-center sm:pr-0">
          <h2 id="auth-modal-title" className="text-2xl font-extrabold tracking-tight text-slate-900">
            <span className="text-blue-600">{mode === "login" ? "User" : "Create"}</span>{" "}
            {mode === "login" ? "Login" : "Account"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {mode === "login"
              ? "Sign in to continue with Kalki Ride"
              : "Join Kalki Ride and start booking"}
          </p>
        </div>

        {mode === "login" ? (
          <LoginForm successRedirect="/ride-details" />
        ) : (
          <SignupForm successRedirect="/ride-details" />
        )}

        <p className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-bold text-blue-700 underline-offset-4 hover:underline"
          >
            {mode === "login" ? "Create one" : "Login"}
          </button>
        </p>
      </motion.section>
    </div>
  );
}
