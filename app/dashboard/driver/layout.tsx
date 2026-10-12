/**
 * @file app/dashboard/driver/layout.tsx
 * @description Driver Portal Protected Layout.
 * 
 * Flow:
 * 1. Checks current session via `getSession()`.
 * 2. Role Gate: If unauthenticated, redirects to `/login`. If customer, redirects to `/dashboard/customer`.
 * 3. Renders `AuthHeader`, desktop `DriverNav` sidebar, mobile tab navigation, and active child view.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/services/auth.service";
import AuthHeader from "@/components/common/auth-header";
import DriverNav from "@/components/driver/driver-nav";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Shared layout wrapper for all Driver dashboard views.
 * 
 * @param {object} props - Children node wrapper.
 * @returns {Promise<JSX.Element>}
 */
export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "driver") {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global authenticated header with driver badge and logout */}
      <AuthHeader
        role="driver"
        userName={user?.name ?? "Driver"}
        userEmail={user?.email}
      />

      <div className="flex w-full flex-1 min-h-[calc(100vh-4rem)]">
        {/* Desktop left vertical sidebar */}
        <aside className="w-56 lg:w-60 shrink-0 hidden md:flex flex-col border-r border-slate-200 bg-white">
          <DriverNav />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          {/* Mobile responsive horizontal navigation */}
          <div className="md:hidden mb-4">
            <DriverNav mobile />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}