/**
 * @file app/dashboard/customer/layout.tsx
 * @description Customer Portal Protected Layout.
 * 
 * Flow:
 * 1. Validates authenticated session via `getSession()`.
 * 2. Role Gate: If unauthenticated, redirects to `/login`. If driver, redirects to `/dashboard/driver`.
 * 3. Renders `AuthHeader` with customer badge and constrained-width main canvas.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/services/auth.service";
import AuthHeader from "@/components/common/auth-header";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Shared layout wrapper for Customer dashboard views.
 * 
 * @param {object} props - Children node wrapper.
 * @returns {Promise<JSX.Element>}
 */
export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
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