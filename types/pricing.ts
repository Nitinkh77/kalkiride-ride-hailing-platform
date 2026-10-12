/**
 * @file types/pricing.ts
 * @description Dynamic Pricing and Fare Calculation Types.
 */

/**
 * Platform pricing configuration currently active in the database.
 */
export interface ActivePricing {
  /** Cost per kilometer in the specified currency */
  pricePerKm: number;
  /** Currency code (e.g. 'Rs' or 'INR') */
  currency: string;
}

/**
 * Result returned when querying the active pricing rates.
 */
export type GetActivePricingResult =
  | { ok: true; data: ActivePricing }
  | { ok: false; error: "not_configured" | "db_error"; details?: unknown };
