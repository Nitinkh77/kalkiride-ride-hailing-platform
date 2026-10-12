/**
 * @file app/ride-details/layout.tsx
 * @description Dedicated Ride Details & Booking Layout (/ride-details).
 * 
 * Flow:
 * 1. Checks customer authentication via `getSession()`.
 * 2. Unauthenticated visitors redirect to `/login?redirectTo=/ride-details`.
 * 3. Driver sessions redirect to `/dashboard/driver`.
 * 4. Renders top `AuthHeader` with role="customer" and full-width container.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/services/auth.service";
import AuthHeader from "@/components/common/auth-header";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function RideDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirectTo=/ride-details");
  }

  if (session.role !== "customer") {
    redirect("/dashboard/driver");
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader
        role="customer"
        userName={user?.name ?? "Customer"}
        userEmail={user?.email}
      />
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">{children}</main>
    </div>
  );
}
