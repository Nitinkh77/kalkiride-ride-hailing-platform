/**
 * @file services/fare.service.ts
 * @description Pure Fare Calculation Function.
 * 
 * Free of server dependencies or database drivers.
 * Safe to import in both client-side components and server-side actions/APIs.
 */

/**
 * Calculates total trip fare rounded cleanly to 2 decimal places.
 * 
 * @param {number} distanceKm - Distance in kilometers.
 * @param {number} pricePerKm - Platform rate per kilometer.
 * @returns {number} Computed fare amount.
 */
export function calculateFare(
  distanceKm: number,
  pricePerKm: number
): number {
  return Math.round(distanceKm * pricePerKm * 100) / 100;
}
