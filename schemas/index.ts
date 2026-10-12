/**
 * @file schemas/index.ts
 * @description Central export index for all Zod validation schemas in KalkiRide.
 * 
 * Allows modules to import schemas cleanly from `@/schemas`.
 * Example: import { SignupSchema, LoginSchema, RideRequestSchema } from "@/schemas";
 */

export * from "./auth.schema";
export * from "./ride.schema";
export * from "./vehicle.schema";
