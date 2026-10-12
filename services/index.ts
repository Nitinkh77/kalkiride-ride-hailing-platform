/**
 * @file services/index.ts
 * @description Central export index for all services in KalkiRide.
 * 
 * Allows modules to import any service function cleanly from `@/services`.
 * Example: import { createRide, getActivePricing, calculateFare } from "@/services";
 */

export * from "./auth.service";
export * from "./ride.service";
export * from "./pricing.service";
export * from "./fare.service";
export * from "./location.service";
