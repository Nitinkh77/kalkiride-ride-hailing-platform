# KalkiRide — Enterprise Modular Architecture

This project is built using **Industry-Standard Layered Clean Architecture** in Next.js (App Router), TypeScript, and Tailwind CSS.

---

## 🏛️ Architectural Overview

In production industry applications, mixing database queries, validation rules, raw TypeScript types, and UI components into monolithic files is considered an anti-pattern. KalkiRide separates every concern into its own dedicated layer:

```
┌────────────────────────────────────────────────────────┐
│                   UI Presentation Layer                │
│   (app/ routes, page.tsx, layout.tsx, components/)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              Controller / Action / API Layer           │
│     (app/actions/*, app/api/* standard REST routes)    │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
                ▼                        ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     Validation Schemas    │  │   Pure TypeScript Types │
│        (schemas/)         │  │         (types/)        │
│   • Zod input schemas     │  │   • Domain interfaces   │
│   • Field error rules     │  │   • Status unions       │
└───────────────────────────┘  └─────────────────────────┘
                │                        │
                └───────────┬────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Domain Services Layer                │
│                     (services/)                        │
│   • auth.service.ts     • ride.service.ts              │
│   • pricing.service.ts  • location.service.ts          │
│   • fare.service.ts                                    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Data & Infrastructure Layer              │
│    • Supabase PostgreSQL Database (lib/supabase.ts)    │
│    • OSRM Open Routing API                             │
│    • Komoot Photon Geocoding API                       │
│    • Jose Encrypted JWT Session Cookies                │
└────────────────────────────────────────────────────────┘
```

---

## 📂 Detailed Folder Organization

| Folder | Responsibility | Key Files |
| :--- | :--- | :--- |
| **`types/`** | **Pure TypeScript Type Definitions**.<br>Contains domain models, data transfer shapes, and statuses. Zero runtime overhead. | [`types/auth.ts`](file:///types/auth.ts)<br>[`types/ride.ts`](file:///types/ride.ts)<br>[`types/location.ts`](file:///types/location.ts)<br>[`types/pricing.ts`](file:///types/pricing.ts)<br>[`types/index.ts`](file:///types/index.ts) |
| **`schemas/`** | **Zod Input Validation Schemas**.<br>Ensures untrusted client inputs are validated before entering server logic or databases. | [`schemas/auth.schema.ts`](file:///schemas/auth.schema.ts)<br>[`schemas/ride.schema.ts`](file:///schemas/ride.schema.ts)<br>[`schemas/vehicle.schema.ts`](file:///schemas/vehicle.schema.ts)<br>[`schemas/index.ts`](file:///schemas/index.ts) |
| **`services/`** | **Business Logic & Persistence Layer**.<br>Executes database queries, crypto operations, pricing rules, and third-party APIs. | [`services/auth.service.ts`](file:///services/auth.service.ts)<br>[`services/ride.service.ts`](file:///services/ride.service.ts)<br>[`services/pricing.service.ts`](file:///services/pricing.service.ts)<br>[`services/fare.service.ts`](file:///services/fare.service.ts)<br>[`services/location.service.ts`](file:///services/location.service.ts) |
| **`components/`** | **Modular UI Component Library**.<br>Re-usable React components categorized by functional domain. | **`components/common/`** (Header, Toast)<br>**`components/auth/`** (Login, Signup)<br>**`components/customer/`** (Booking, Map, Tracking)<br>**`components/driver/`** (Nav, Active Trip, History, Vehicle)<br>**`components/marketplace/`** (Hero, Catalog) |
| **`app/api/`** | **Standard REST API Route Handlers**.<br>JSON endpoints matching industry convention for web & mobile clients. | `POST /api/auth/login`<br>`POST /api/auth/signup`<br>`POST /api/auth/logout`<br>`GET /api/customer/rides`<br>`GET /api/driver/rides` |
| **`app/actions/`** | **Next.js Server Action Controllers**.<br>Invoked directly by React 19 forms with automatic cache revalidation. | [`app/actions/auth.ts`](file:///app/actions/auth.ts)<br>[`app/actions/rides.ts`](file:///app/actions/rides.ts) |
| **`app/`** | **Routing Pages & Layouts**.<br>Thin pages delegating to the component and service layers. | `/` Home Marketplace<br>`/login` & `/signup`<br>`/dashboard/customer`<br>`/dashboard/driver/*` |

---

## 🔄 End-to-End Workflow Examples

### 1. Authentication Flow
```
User clicks "Login"
   ↓
LoginForm (components/auth/login-form.tsx)
   ↓
login action (app/actions/auth.ts)
   ↓
LoginSchema.safeParse (schemas/auth.schema.ts)
   ↓
authenticateUser (services/auth.service.ts)
   ├── Queries Supabase `users` table
   └── Verifies bcrypt password hash
   ↓
createSession (services/auth.service.ts)
   ├── Signs HS256 JWT
   └── Sets HTTP-only, SameSite Secure Cookie
   ↓
Redirect to /dashboard/customer or /dashboard/driver
```

### 2. Ride Booking & Live Telemetry Flow
```
Customer types address in LocationInput
   ↓
searchPlaces queries Photon Geocoding (services/location.service.ts)
   ↓
Customer selects Destination -> getRoute calculates OSRM driving path
   ↓
Customer clicks "Request ride" -> requestRide (app/actions/rides.ts)
   ↓
Ride created in database (services/ride.service.ts)
   ↓
Driver browses AvailableRides (/dashboard/driver/rides) -> clicks "Accept"
   ↓
acceptRide atomically claims trip (services/ride.service.ts)
   ↓
Driver's ActiveRideCard streams GPS position (navigator.geolocation.watchPosition)
   ↓
updateDriverLocation updates Supabase `rides.driver_lat/driver_lng`
   ↓
Customer's RideWaiting component live-polls coordinates and updates Driver ETA
```

---

## 🛠️ Testing & Debugging Guide

- **Run Dev Server**: `npm run dev` (starts on http://localhost:3000)
- **Check TypeScript & Linting**: `npm run lint`
- **Verify Production Build**: `npm run build`
