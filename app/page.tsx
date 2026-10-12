/**
 * @file app/page.tsx
 * @description Unified Single-Page Application Route (/).
 * 
 * Features:
 * 1. Checks current authentication session in parallel with platform pricing.
 * 2. Fetches customer profile, active ride, and ride history in parallel.
 * 3. Renders the UnifiedRideView containing Map, Route Booking, Vehicle Selection,
 *    Quick Actions, Promotional Banner, and Drawers (Profile, Rides, Offers).
 */

import type { Metadata } from "next";
import { getSession } from "@/services/auth.service";
import { getActivePricing } from "@/services/pricing.service";
import { getActiveRideForCustomer, getCustomerRideHistory } from "@/services/ride.service";
import { supabase } from "@/lib/supabase";
import UnifiedRideView from "@/components/marketplace/unified-ride-view";
import type { UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KalkiRide | Fast, Transparent & Reliable City Rides",
  description:
    "Book autos, bikes, and cabs with upfront pricing, live tracking, and ₹50 referral rewards.",
};

export default async function Home() {
  const session = await getSession();

  const pricingPromise = getActivePricing();

  const activeRidePromise =
    session?.userId && session.role === "customer"
      ? getActiveRideForCustomer(session.userId)
      : Promise.resolve({ ok: false as const, error: "no_session" });

  const historyPromise =
    session?.userId && session.role === "customer"
      ? getCustomerRideHistory(session.userId)
      : Promise.resolve({ ok: false as const, error: "no_session" });

  const userPromise = session?.userId
    ? supabase
        .from("users")
        .select("id, name, email, phone, role, created_at")
        .eq("id", session.userId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [pricing, activeRideResult, historyResult, userResult] =
    await Promise.all([
      pricingPromise,
      activeRidePromise,
      historyPromise,
      userPromise,
    ]);

  const initialActiveRide = activeRideResult.ok ? activeRideResult.data : null;
  const initialRideHistory = historyResult.ok && historyResult.data ? historyResult.data : [];
  const currentUser: UserProfile | null = userResult.data as UserProfile | null;

  return (
    <UnifiedRideView
      isAuthenticated={Boolean(session)}
      currentUser={currentUser}
      pricePerKm={pricing.ok ? pricing.data.pricePerKm : 14}
      currency={pricing.ok ? pricing.data.currency : "₹"}
      initialActiveRide={initialActiveRide}
      initialRideHistory={initialRideHistory}
    />
  );
}
