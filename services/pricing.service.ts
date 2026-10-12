/**
 * @file services/pricing.service.ts
 * @description Dynamic Pricing Service (Database Queries).
 * 
 * Fetches the active platform rate per kilometer from Supabase.
 */

import "server-only";
import { supabase } from "@/lib/supabase";
import { calculateFare } from "@/services/fare.service";
import type { ActivePricing, GetActivePricingResult } from "@/types";

export { calculateFare };
export type { ActivePricing, GetActivePricingResult };

/**
 * Fetches the currently active pricing configuration from the database.
 * 
 * @returns {Promise<GetActivePricingResult>} Result object with active pricing or error.
 */
export async function getActivePricing(): Promise<GetActivePricingResult> {
  const { data, error } = await supabase
    .from("pricing_config")
    .select("price_per_km, currency")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: "db_error",
      details: error,
    };
  }

  if (!data) {
    return {
      ok: false,
      error: "not_configured",
    };
  }

  const pricePerKm = Number(data.price_per_km);

  if (!Number.isFinite(pricePerKm) || pricePerKm <= 0) {
    return {
      ok: false,
      error: "db_error",
      details: `Invalid price_per_km in database: ${String(data.price_per_km)}`,
    };
  }

  return {
    ok: true,
    data: {
      pricePerKm,
      currency: String(data.currency),
    },
  };
}
