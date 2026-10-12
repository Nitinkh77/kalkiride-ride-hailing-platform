/**
 * @file app/login/page.tsx
 * @description User Login Route (/login).
 * 
 * Flow:
 * 1. Checks if user is already authenticated; if yes, redirects to their corresponding dashboard.
 * 2. Displays background backdrop and `LoginForm` component.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/services/auth.service";
import AuthBackground from "@/components/marketplace/auth-background";
import AuthBackdrop from "@/components/marketplace/auth-backdrop";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Log in | Kalki Ride",
  description: "Log in as a customer or driver.",
};

/**
 * Login Page Component.
 * 
 * @param {object} props - Contains searchParams promise.
 * @returns {Promise<JSX.Element>}
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string; redirectTo?: string }>;
}) {
  const session = await getSession();

  // Redirect authenticated visitors directly to their respective portals
  if (session) {
    redirect(
      session.role === "driver"
        ? "/dashboard/driver"
        : "/dashboard/customer"
    );
  }

  const { registered, error, redirectTo } = await searchParams;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-200">
      <AuthBackground />
      <AuthBackdrop />
      <section className="absolute left-1/2 top-1/2 z-10 w-[calc(100%-2rem)] max-w-90 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white px-7 py-8 shadow-2xl shadow-slate-900/30">
        <Link
          href="/"
          aria-label="Close and return to home screen"
          className="absolute right-4 top-4 text-xl leading-none text-slate-400 hover:text-slate-700 transition"
        >
          &times;
        </Link>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-700">
            <span className="text-blue-600">User</span> Login
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Sign in to continue with Kalki <span className="text-orange-500">Ride</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <p className="font-semibold">Authentication Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        {registered === "1" && (
          <p className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            Account created. You can log in now.
          </p>
        )}

        <LoginForm successRedirect={redirectTo} />

        <p className="mt-5 text-center text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
            Create one
          </Link>
          <br />
          <Link
            href="#"
            className="mt-2 inline-block font-semibold text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </Link>
        </p>
      </section>
    </main>
  );
}