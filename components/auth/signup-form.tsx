/**
 * @file components/auth/signup-form.tsx
 * @description Client-side User Registration Form Component.
 * 
 * Features:
 * 1. Role Toggle: Switch dynamically between 'customer' and 'driver'.
 * 2. Conditional Fields: Displays vehicle information inputs (make, model, year, plate, color)
 *    only when the driver role is selected.
 * 3. React 19 `useActionState`: Binds form submission to the `signup` server action.
 * 4. Toast error notifications for server or client-side HTML5 validation errors.
 */

"use client";

import { useActionState, useEffect, useState } from "react";
import { signup } from "@/app/actions/auth";
import type { SignupFormState } from "@/types";
import toast from "react-hot-toast";
import { GoogleButton } from "./google-button";

const initialState: SignupFormState = undefined;

interface SignupFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlateNumber: string;
  vehicleColor: string;
}

const initialValues: SignupFormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehiclePlateNumber: "",
  vehicleColor: "",
};

interface SignupFormProps {
  /** Optional target path to redirect upon successful registration */
  successRedirect?: string;
}

/**
 * Interactive User Registration Form Component.
 * 
 * @param {SignupFormProps} props - Component properties.
 * @returns {JSX.Element}
 */
export function SignupForm({ successRedirect }: SignupFormProps) {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [role, setRole] = useState<"customer" | "driver">("customer");
  const [values, setValues] = useState<SignupFormValues>(initialValues);

  /**
   * Synchronizes text changes with internal React state.
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  /**
   * Listens for server-side validation error messages and alerts user via toasts.
   */
  useEffect(() => {
    const errorMessages = [
      state?.message,
      ...Object.values(state?.errors ?? {}).flat(),
    ].filter((message): message is string => Boolean(message));

    errorMessages.forEach((message) => toast.error(message));
  }, [state]);

  return (
    <form
      action={formAction}
      onInvalid={(event) => {
        const field = event.target as HTMLInputElement;
        toast.error(field.validationMessage);
      }}
      className="flex flex-col gap-5"
    >
      {successRedirect && (
        <input type="hidden" name="redirectTo" value={successRedirect} />
      )}

      {/* Name Input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-semibold text-slate-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          autoComplete="name"
          placeholder="Enter your name"
          value={values.name}
          onChange={handleChange}
          className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>

      {/* Email Input */}
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

      {/* Phone Input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="Enter your phone number"
          value={values.phone}
          onChange={handleChange}
          className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Create a password"
          value={values.password}
          onChange={handleChange}
          className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
        <p className="text-xs text-slate-500">
          At least 8 characters, with a letter and a number.
        </p>
      </div>

      {/* Role Selector Radio Group */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-slate-700">I am a</legend>
        <div className="flex gap-5">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="customer"
              checked={role === "customer"}
              onChange={() => setRole("customer")}
              required
            />
            Customer
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="driver"
              checked={role === "driver"}
              onChange={() => setRole("driver")}
            />
            Driver
          </label>
        </div>
      </fieldset>

      {/* Driver-only conditional vehicle inputs */}
      {role === "driver" && (
        <div className="flex flex-col gap-4 rounded border border-slate-300 p-4 bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-700">Vehicle information</p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehicleMake" className="text-sm font-semibold text-slate-700">
              Make / Manufacturer
            </label>
            <input
              id="vehicleMake"
              name="vehicleMake"
              type="text"
              placeholder="e.g. Bajaj, Piaggio"
              value={values.vehicleMake}
              onChange={handleChange}
              className="h-12 rounded-xl border text-slate-900 border-slate-300 px-4 text-base outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehicleModel" className="text-sm font-semibold text-slate-700">
              Model
            </label>
            <input
              id="vehicleModel"
              name="vehicleModel"
              type="text"
              placeholder="e.g. Compact RE"
              value={values.vehicleModel}
              onChange={handleChange}
              className="h-12 rounded-xl border text-slate-900 border-slate-300 px-4 text-base outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehicleYear" className="text-sm font-semibold text-slate-700">
              Year of Manufacture
            </label>
            <input
              id="vehicleYear"
              name="vehicleYear"
              type="number"
              min={1900}
              max={2100}
              placeholder="2023"
              value={values.vehicleYear}
              onChange={handleChange}
              className="h-12 rounded-xl border text-slate-900 border-slate-300 px-4 text-base outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehiclePlateNumber" className="text-sm font-semibold text-slate-700">
              Plate Number
            </label>
            <input
              id="vehiclePlateNumber"
              name="vehiclePlateNumber"
              type="text"
              placeholder="DL 01 AB 1234"
              value={values.vehiclePlateNumber}
              onChange={handleChange}
              className="h-12 rounded-xl border text-slate-900 border-slate-300 px-4 text-base uppercase outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehicleColor" className="text-sm font-semibold text-slate-700">
              Color
            </label>
            <input
              id="vehicleColor"
              name="vehicleColor"
              type="text"
              placeholder="Yellow & Green"
              value={values.vehicleColor}
              onChange={handleChange}
              className="h-12 rounded-xl border text-slate-900 border-slate-300 px-4 text-base outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 bg-white"
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 rounded-xl bg-amber-400 px-4 text-base font-extrabold text-[var(--kr-on-brand)] transition hover:bg-amber-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
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
      <GoogleButton
        redirectTo={successRedirect}
        role={role}
        mode="signup"
        text={role === "driver" ? "Sign up as Driver with Google" : "Sign up with Google"}
      />
    </form>
  );
}
