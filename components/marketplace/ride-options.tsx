/**
 * @file components/marketplace/ride-options.tsx
 * @description Interactive KalkiRide vehicle selection cards.
 */

"use client";

import { useState } from "react";

interface RideOption {
  name: string;
  description: string;
  eta: string;
  seats: string;
  price: string;
  type: "bike" | "auto" | "cab" | "car";
  badge?: string;
  comingSoon?: boolean;
}

const rideOptions: RideOption[] = [
  {
    name: "Kalki Bike",
    description: "Beat traffic for quick solo trips.",
    eta: "2 min",
    seats: "1 seat",
    price: "From Rs 39",
    type: "bike",
    badge: "Quickest",
  },
  {
    name: "Kalki Auto",
    description: "An easy everyday ride around town.",
    eta: "4 min",
    seats: "3 seats",
    price: "From Rs 59",
    type: "auto",
    badge: "Popular",
  },
  {
    name: "Kalki Prime",
    description: "Comfortable rides for work or weekends.",
    eta: "5 min",
    seats: "4 seats",
    price: "From Rs 119",
    type: "cab",
  },
  {
    name: "Kalki XL",
    description: "More room for groups and luggage.",
    eta: "7 min",
    seats: "6 seats",
    price: "From Rs 199",
    type: "car",
    comingSoon: true,
  },
];

interface RideOptionsProps {
  onBook: (rideName: string) => void;
  fullScreen?: boolean;
}

/* -------------------------------------------------------
   Vehicle illustrations
------------------------------------------------------- */

function BikeIcon() {
  return (
    <svg
      viewBox="0 0 180 100"
      className="h-24 w-36 object-contain"
      fill="none"
    >
      <circle cx="45" cy="75" r="18" stroke="currentColor" strokeWidth="5" />
      <circle cx="135" cy="75" r="18" stroke="currentColor" strokeWidth="5" />

      <path
        d="M45 75L70 45L98 75L45 75Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      <path
        d="M70 45L88 45L105 75"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M88 45L99 35"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M98 75L120 50L135 75"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M70 45L62 34"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AutoIcon() {
  return (
    <svg
      viewBox="0 0 200 110"
      className="h-24 w-36 object-contain"
      fill="none"
    >
      <circle cx="55" cy="82" r="17" stroke="currentColor" strokeWidth="5" />
      <circle cx="148" cy="82" r="17" stroke="currentColor" strokeWidth="5" />

      <path
        d="M35 82V48C35 38 43 30 53 30H128C141 30 151 39 156 51L164 72C167 78 162 82 156 82H35Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      <path
        d="M52 32L62 54H143L133 32"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      <path
        d="M35 61H160"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        d="M48 82H62M141 82H155"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CabIcon() {
  return (
    <svg
      viewBox="0 0 210 110"
      className="h-24 w-40 object-contain"
      fill="none"
    >
      <circle cx="55" cy="82" r="16" stroke="currentColor" strokeWidth="5" />
      <circle cx="158" cy="82" r="16" stroke="currentColor" strokeWidth="5" />

      <path
        d="M30 80V57C30 50 35 45 42 45H53L69 26H136L154 45H169C177 45 182 51 182 58V80H30Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      <path
        d="M69 27L61 47H151L136 27"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      <path
        d="M31 64H181"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        d="M43 80H65M148 80H170"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg
      viewBox="0 0 220 110"
      className="h-24 w-40 object-contain"
      fill="none"
    >
      <circle cx="55" cy="82" r="16" stroke="currentColor" strokeWidth="5" />
      <circle cx="165" cy="82" r="16" stroke="currentColor" strokeWidth="5" />

      <path
        d="M27 80V58C27 51 33 46 40 46H54L72 26H143L166 46H181C188 46 193 51 193 58V80H27Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      <path
        d="M73 27L65 48H165L143 27"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      <path
        d="M29 64H192"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        d="M43 80H67M153 80H177"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VehicleIcon({ type }: { type: RideOption["type"] }) {
  switch (type) {
    case "bike":
      return <BikeIcon />;

    case "auto":
      return <AutoIcon />;

    case "cab":
      return <CabIcon />;

    case "car":
      return <CarIcon />;

    default:
      return null;
  }
}

/* -------------------------------------------------------
   Main Component
------------------------------------------------------- */

export default function RideOptions({
  onBook,
  fullScreen = false,
}: RideOptionsProps) {
  const [selectedRide, setSelectedRide] = useState("Kalki Bike");

  const handleSelect = (ride: RideOption) => {
    if (ride.comingSoon) return;

    setSelectedRide(ride.name);
    onBook(ride.name);
  };

  return (
    <section
      id="rides"
      className={`w-full bg-slate-50 ${
        fullScreen ? "flex min-h-screen items-center" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* ------------------------------------------------
            Section Header
        ------------------------------------------------ */}
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
              Ride options
            </p>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Choose Your Ride
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Pick the ride that fits your journey.
            </p>
          </div>

          <button
            type="button"
            className="hidden items-center gap-2 text-sm font-bold text-slate-900 transition hover:text-blue-600 sm:flex"
          >
            View All
            <span className="text-lg">→</span>
          </button>
        </div>

        {/* ------------------------------------------------
            Ride Cards
        ------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {rideOptions.map((ride) => {
            const isSelected = selectedRide === ride.name;

            return (
              <button
                key={ride.name}
                type="button"
                disabled={ride.comingSoon}
                onClick={() => handleSelect(ride)}
                className={`group relative flex min-h-[250px] flex-col overflow-hidden rounded-[24px] border-2 bg-white text-left transition-all duration-300
                  ${
                    isSelected
                      ? "border-blue-500 shadow-[0_10px_35px_rgba(37,99,235,0.15)]"
                      : "border-slate-100 shadow-sm hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  }
                  ${
                    ride.comingSoon
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  }
                `}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md">
                    ✓
                  </div>
                )}

                {/* Badge */}
                {ride.badge && (
                  <div
                    className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide
                    ${
                      ride.badge === "Quickest"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {ride.badge}
                  </div>
                )}

                {ride.comingSoon && (
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                    Coming Soon
                  </div>
                )}

                {/* Vehicle Image Area */}
                <div
                  className={`flex h-[130px] items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-blue-50"
                      : "bg-gradient-to-br from-slate-50 to-white"
                  }`}
                >
                  <div
                    className={`transition-transform duration-300 ${
                      !ride.comingSoon
                        ? "group-hover:scale-105"
                        : ""
                    } ${
                      ride.type === "bike"
                        ? "text-blue-600"
                        : ride.type === "auto"
                        ? "text-emerald-600"
                        : ride.type === "cab"
                        ? "text-slate-700"
                        : "text-orange-500"
                    }`}
                  >
                    <VehicleIcon type={ride.type} />
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
                      {ride.name.replace("Kalki ", "")}
                    </h3>

                    <span className="whitespace-nowrap text-xs font-bold text-slate-400">
                      {ride.eta}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm">
                    {ride.description}
                  </p>

                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {ride.seats}
                      </p>

                      <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                        {ride.price}
                      </p>
                    </div>

                    <span
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                        ride.comingSoon
                          ? "bg-slate-100 text-slate-400"
                          : isSelected
                          ? "bg-[#30264a] text-white"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                      }`}
                    >
                      {ride.comingSoon ? "Soon" : "Select"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------
            Selected Ride Summary
        ------------------------------------------------ */}
        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <span className="text-xl">🚕</span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Selected ride
                </p>

                <h3 className="mt-0.5 text-lg font-extrabold text-slate-900">
                  {selectedRide}
                </h3>

                <p className="text-sm text-slate-500">
                  Driver will be assigned after confirmation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onBook(selectedRide)}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#3f3260] px-6 py-4 text-sm font-extrabold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] sm:w-auto"
            >
              Book My Ride

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-lg text-slate-900">
                →
              </span>
            </button>
          </div>
        </div>

        {/* Mobile View All */}
        <button
          type="button"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-900 sm:hidden"
        >
          View All Rides
          <span>→</span>
        </button>

      </div>
    </section>
  );
}