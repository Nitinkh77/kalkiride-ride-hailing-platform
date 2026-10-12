/**
 * @file lib/format.ts
 * @description Formatting utilities for KalkiRide platform.
 * 
 * Provides:
 * 1. `formatDuration`: Converts minutes into clean "X hr Y min" strings (e.g. 203 min -> "3 hr 23 min").
 * 2. `getRidePin`: Deterministic 4-digit OTP/PIN generator matching rider and driver screens.
 */

/**
 * Formats a duration in minutes into a human-friendly "X hr Y min" or "Y min" format.
 * 
 * Examples:
 * - 45 -> "45 min"
 * - 60 -> "1 hr"
 * - 90 -> "1 hr 30 min"
 * - 203 -> "3 hr 23 min"
 * - 5313 -> "88 hr 33 min"
 * 
 * @param {number | null | undefined} minutes - Duration in minutes.
 * @returns {string} Formatted duration.
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(minutes) || minutes <= 0) {
    return "—";
  }

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Generates a deterministic 4-digit Ride PIN / OTP for a given ride ID.
 * Ensures the rider and driver always have the exact same matching 4-digit PIN.
 *
 * @param {string} rideId - The unique ID of the ride.
 * @returns {string} 4-digit PIN (e.g. "4827").
 */
export function getRidePin(rideId: string): string {
  if (!rideId) return "1234";
  let hash = 0;
  for (let i = 0; i < rideId.length; i++) {
    hash = (hash * 31 + rideId.charCodeAt(i)) >>> 0;
  }
  const pinNum = 1000 + (hash % 9000);
  return pinNum.toString();
}
