/**
 * @file components/auth/login-form.tsx
 * @description Client-side Login Form Component.
 * 
 * Features:
 * 1. Uses React 19 `useActionState` hook bound to the `login` server action.
 * 2. Manages controlled form state for email and password inputs.
 * 3. Catches server-side validation messages and renders feedback using toasts.
 * 4. Disables the submit button while authentication request is in flight (`pending`).
 */

"use client";

import { useActionState, useEffect, useState } from "react";
import { login } from "@/app/actions/auth";
import type { LoginFormState } from "@/types";
import toast from "react-hot-toast";
import { GoogleButton } from "./google-button";

const initialState: LoginFormState = undefined;

const initialValues = {
  email: "",
  password: "",
};

interface LoginFormProps {
  /** Optional target path to redirect after a successful login */
  successRedirect?: string;
}

/**
 * Interactive Login Form component.
 * 
 * @param {LoginFormProps} props - Component properties.
 * @returns {JSX.Element}
 */
export function LoginForm({ successRedirect }: LoginFormProps) {
  // Bind form action to the server action
  const [state, formAction, pending] = useActionState(login, initialState);
  const [values, setValues] = useState(initialValues);

  /**
   * Updates controlled form input state on every keystroke.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} event - DOM input change event.
   */
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  /**
   * Observes the server action's returned state and displays error toasts if validation fails.
   */
  useEffect(() => {
    const errorMessages = [
      state?.message,
      ...(state?.errors?.email ?? []),
      ...(state?.errors?.password ?? []),
    ].filter((message): message is string => Boolean(message));

    errorMessages.forEach((message) => toast.error(message));
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {successRedirect && (
        <input type="hidden" name="redirectTo" value={successRedirect} />
      )}

      {/* Email input field */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email"
          value={values.email}
          onChange={handleChange}
          className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>

      {/* Password input field */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>

      {/* Submit button with loading state */}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 rounded-xl bg-amber-400 px-4 text-base font-extrabold text-[var(--kr-on-brand)] transition hover:bg-amber-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Logging in..." : "Login"}
      </button>

      {/* Social Auth Divider */}
      <div className="relative my-1 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative bg-white px-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Or continue with
        </div>
      </div>

      {/* Google OAuth Button */}
      <GoogleButton redirectTo={successRedirect} />
    </form>
  );
}
