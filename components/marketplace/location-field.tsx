/**
 * @file components/marketplace/location-field.tsx
 * @description Production-Grade Location Autocomplete & Geolocation Field.
 * 
 * Features:
 * 1. Debounced geocoding search (300ms) with Photon API and abort signals.
 * 2. Instant "Use Current Location" GPS detection with reverse geocoding.
 * 3. Robust click-outside and Escape key handling to prevent sticky or duplicate dropdowns.
 * 4. Responsive UI with clear button, animated loading spinners, and styled place suggestions.
 * 5. Full keyboard navigation (ArrowUp, ArrowDown, Enter, Escape).
 */

"use client";

import { useEffect, useRef, useState, useId } from "react";
import toast from "react-hot-toast";
import { searchPlaces, reverseGeocode } from "@/services/location.service";
import type { PlaceSuggestion } from "@/types";

interface LocationFieldProps {
  value: string;
  placeholder: string;
  dotClassName: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion | null) => void;
  showCurrentLocation?: boolean;
  disabled?: boolean;
  fieldType?: "pickup" | "destination";
}

/**
 * Enhanced Location Search Input with auto-complete and GPS current location support.
 */
export default function LocationField({
  value,
  placeholder,
  dotClassName,
  onChange,
  onSelect,
  showCurrentLocation = true,
  disabled = false,
  fieldType,
}: LocationFieldProps) {
  const isPickup =
    fieldType === "pickup" ||
    placeholder.toLowerCase().includes("pickup") ||
    dotClassName.includes("blue");

  const isDestination =
    fieldType === "destination" ||
    placeholder.toLowerCase().includes("destination") ||
    dotClassName.includes("orange");

  const allowCurrentLocation =
    showCurrentLocation !== undefined
      ? showCurrentLocation
      : !isDestination;

  const searchLabel = isPickup
    ? "Searching pickup location..."
    : isDestination
    ? "Searching destination location..."
    : "Searching location...";

  const emptyLabel = isPickup
    ? "No matching pickup places found"
    : isDestination
    ? "No matching destination places found"
    : "No matching places found";
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Start false on server (prevents hydration mismatch), sync to real value on client mount
  const [isPlaceSelected, setIsPlaceSelected] = useState<boolean>(false);
  const [prevValue, setPrevValue] = useState(value);

  // Sync isPlaceSelected on client after mount to reflect pre-filled values from sessionStorage/props
  useEffect(() => {
    if (value && value.trim().length > 0) {
      setIsPlaceSelected(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listId = useId();

  // If value prop changes externally (e.g. cleared or prefilled from parent/URL)
  if (value !== prevValue) {
    setPrevValue(value);
    if (!value || value.trim().length === 0) {
      setIsPlaceSelected(false);
      setOpen(false);
      setSuggestions([]);
    }
  }

  // Close dropdown on outside click or escape key press
  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounced place suggestions query with immediate searching indicator
  useEffect(() => {
    // If a place has been chosen or passed, do NOT search
    if (isPlaceSelected) return;

    const query = value.trim();
    abortRef.current?.abort();

    if (query.length < 2) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const timer = window.setTimeout(async () => {
      const result = await searchPlaces(query, controller.signal);


      if (controller.signal.aborted) return;

      setLoading(false);
      if (!result.ok) {
        setSuggestions([]);
        if (result.error.code !== "aborted") {
          toast.error(result.error.message);
        }
        return;
      }

      setSuggestions(result.data);
      setOpen(true);
      setActiveIndex(-1);
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, isPlaceSelected]);

  // Handle Current Location Detection
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await reverseGeocode(latitude, longitude);

          setIsPlaceSelected(true);
          setSuggestions([]);
          setOpen(false);

          if (res.ok && res.data) {
            onChange(res.data.displayName);
            onSelect(res.data);
            toast.success("Location set from GPS.");
          } else {
            const fallback: PlaceSuggestion = {
              id: `gps-${latitude.toFixed(4)},${longitude.toFixed(4)}`,
              displayName: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              lat: latitude,
              lng: longitude,
              kind: "current_location",
            };
            onChange(fallback.displayName);
            onSelect(fallback);
            toast.success("Location set from GPS coordinates.");
          }
        } catch {
          toast.error("Failed to resolve location address.");
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied. Please allow GPS access in browser.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("GPS position unavailable. Please search manually.");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out. Please try again.");
            break;
          default:
            toast.error("Unable to retrieve current location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleSelectPlace = (place: PlaceSuggestion) => {
    setIsPlaceSelected(true);
    setSuggestions([]);
    setOpen(false);
    onChange(place.displayName);
    onSelect(place);
  };

  const handleClear = () => {
    setIsPlaceSelected(false);
    setSuggestions([]);
    setOpen(false);
    onChange("");
    onSelect(null);
    inputRef.current?.focus();
  };

  // Keyboard navigation inside suggestions list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!isPlaceSelected) {
          setOpen(true);
        }
      }
      return;
    }

    const totalOptions = suggestions.length + (allowCurrentLocation ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < totalOptions ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allowCurrentLocation && activeIndex === 0) {
        handleUseCurrentLocation();
      } else {
        const itemIdx = allowCurrentLocation ? activeIndex - 1 : activeIndex;
        if (suggestions[itemIdx]) {
          handleSelectPlace(suggestions[itemIdx]);
        }
      }
    }
  };

  // Dropdown is shown when open and place is not chosen, whenever searching, suggestions exist, or empty current location
  const showDropdown =
    open &&
    !isPlaceSelected &&
    (loading || suggestions.length > 0 || value.trim().length >= 2 || (allowCurrentLocation && value.trim().length === 0));

  return (

    <div ref={containerRef} className="relative w-full">
      <label className="flex h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 shadow-xs transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300">
        {/* Origin / Destination Indicator Dot */}
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClassName} ring-4 ring-slate-100`}
          aria-hidden="true"
        />

        {/* Text Input Field */}
        <input
          ref={inputRef}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const newVal = event.target.value;
            setIsPlaceSelected(false);
            onChange(newVal);
            onSelect(null);
            if (newVal.trim().length < 2) {
              setSuggestions([]);
              setLoading(false);
              setOpen(newVal.trim().length === 0 && allowCurrentLocation);
            } else {
              setLoading(true);
              setOpen(true);
            }
          }}

          onFocus={() => {
            // Once user has passed/selected data, DO NOT re-open the dropdown on focus/click!
            if (isPlaceSelected && value.trim().length > 0) {
              setOpen(false);
              return;
            }
            // If empty, show GPS current location option if enabled
            if (value.trim().length === 0 && allowCurrentLocation) {
              setOpen(true);
              return;
            }
            // If suggestions exist and not selected, reopen
            if (!isPlaceSelected && suggestions.length > 0) {
              setOpen(true);
            }
          }}

          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showDropdown}
          className="h-full min-w-0 flex-1 bg-transparent py-0 text-sm text-slate-800 placeholder:text-slate-400 outline-none disabled:opacity-50"
        />

        {/* Loading Indicator */}
        {loading && (
          <span
            role="status"
            aria-label="Searching locations"
            className="flex items-center gap-0.5 text-blue-500 shrink-0"
          >
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
          </span>
        )}

        {/* Clear Button */}
        {value.trim().length > 0 && !loading && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear location"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {/* Direct GPS Quick Trigger Button */}
        {allowCurrentLocation && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            title="Use current location"
            aria-label="Use current location"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition shrink-0 ${
              gpsLoading
                ? "bg-blue-50 text-blue-600 animate-pulse"
                : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            {gpsLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            )}
          </button>
        )}
      </label>

      {/* Floating Suggestions & GPS Dropdown Menu */}
      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all"
        >
          {/* Active Backend Geocoding Live Searching Indicator */}
          {loading && (
            <li className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-xs animate-pulse ${
              isDestination ? "bg-orange-50/80 text-orange-800" : "bg-blue-50/80 text-blue-700"
            }`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                isDestination ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${isDestination ? "text-orange-950" : "text-blue-900"}`}>
                  {searchLabel}
                </p>
                <p className={`truncate ${isDestination ? "text-orange-700/80" : "text-blue-600/80"}`}>
                  for &ldquo;{value}&rdquo;
                </p>
              </div>
            </li>
          )}

          {/* Current Location Action Row */}
          {allowCurrentLocation && (
            <li role="option" aria-selected={activeIndex === 0}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleUseCurrentLocation}
                disabled={gpsLoading}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  activeIndex === 0 ? "bg-blue-50 text-blue-700" : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  {gpsLoading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">
                    {gpsLoading ? "Detecting your location..." : "Use current location"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Auto-detect pickup using device GPS
                  </p>
                </div>
              </button>
            </li>
          )}

          {/* Divider between Current Location and Place Search Results */}
          {showCurrentLocation && (suggestions.length > 0 || loading) && (
            <li className="my-1 border-t border-slate-100" role="presentation" />
          )}

          {/* Place Search Suggestions */}
          {!loading && suggestions.map((place, idx) => {
            const optionIndex = showCurrentLocation ? idx + 1 : idx;
            const parts = place.displayName.split(",");
            const title = parts[0]?.trim() || place.displayName;
            const subtitle = parts.slice(1).join(",").trim();

            return (
              <li
                key={place.id}
                role="option"
                aria-selected={activeIndex === optionIndex}
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectPlace(place)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeIndex === optionIndex
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                    <svg
                      className="h-4 w-4 text-slate-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">{title}</p>
                    {subtitle && (
                      <p className="truncate text-xs text-slate-500">{subtitle}</p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}

          {/* Empty Search State */}
          {!loading && suggestions.length === 0 && value.trim().length >= 2 && (
            <li className="flex items-center gap-3 rounded-lg bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{emptyLabel}</p>
                <p className="truncate text-slate-500">Try searching with city, colony, or landmark name</p>
              </div>
            </li>
          )}
        </ul>
      )}

    </div>
  );
}

