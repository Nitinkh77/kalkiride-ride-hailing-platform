/**
 * @file app/signup/page.tsx
 * @description User Registration Page Route (/signup).
 * 
 * Flow:
 * 1. Checks current session; redirects active users away from registration.
 * 2. Renders `SignupForm` component with customer/driver toggle and validation.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/services/auth.service";
import AuthBackground from "@/components/marketplace/auth-background";
import AuthBackdrop from "@/components/marketplace/auth-backdrop";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create your account | Kalki Ride",
  description: "Sign up as a customer or driver.",
};

/**
 * User Registration Page Component.
 * 
 * @returns {Promise<JSX.Element>}
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const session = await getSession();

  if (session) {
    redirect(
      session.role === "driver"
        ? "/dashboard/driver"
        : "/dashboard/customer"
    );
  }

  const params = searchParams ? await searchParams : {};
  const { error, redirectTo } = params;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-200">
      <AuthBackground />
      <AuthBackdrop />
      <section className="absolute left-1/2 top-1/2 z-10 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-107.5 -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white px-7 py-8 shadow-2xl shadow-slate-900/30">
        <Link
          href="/"
          aria-label="Close and return to home screen"
          className="absolute right-4 top-4 text-xl leading-none text-slate-400 hover:text-slate-700 transition"
        >
          &times;
        </Link>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-700">
            <span className="text-blue-600">Create</span> Account
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Join Kalki <span className="text-orange-500">Ride</span> as a customer or driver
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        <SignupForm successRedirect={redirectTo} />

        <p className="mt-5 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}