/**
 * @file components/customer/location-input.tsx
 * @description Accessible Location Autocomplete Input Component.
 * 
 * Features:
 * 1. Debounced geocoding search (350ms delay) to conserve API bandwidth.
 * 2. Full keyboard accessibility (ArrowDown, ArrowUp, Enter to select, Escape to close).
 * 3. AbortController integration to cancel in-flight queries when user continues typing.
 * 4. Outside-click listener to dismiss the suggestions dropdown cleanly.
 */

"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { searchPlaces } from "@/services/location.service";
import type { PlaceSuggestion } from "@/types";

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion | null) => void;
}

/**
 * Autocomplete Input for picking Pickup and Destination addresses.
 * 
 * @param {LocationInputProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function LocationInput({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /**
   * Watches the input query string, debounces by 350ms, and queries the Photon service.
   */
  useEffect(() => {
    const query = value.trim();
    abortRef.current?.abort();

    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setSearchError(null);

      const result = await searchPlaces(query, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      setLoading(false);

      if (!result.ok) {
        setSuggestions([]);
        setSearchError(result.error.message);
        setOpen(false);
        return;
      }

      setSuggestions(result.data);
      setOpen(result.data.length > 0);
      setActiveIndex(-1);
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  /**
   * Dismisses the suggestion listbox when clicking outside the input container.
   */
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /**
   * Responds to user typing. Clears previously selected coordinates.
   */
  function handleChange(nextValue: string) {
    onChange(nextValue);
    onSelect(null);
    setOpen(true);
  }

  /**
   * Selects a place suggestion and populates the parent form state.
   */
  function handleSelect(place: PlaceSuggestion) {
    onChange(place.displayName);
    onSelect(place);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setSearchError(null);
  }

  /**
   * Enables arrow key list navigation and enter key selection.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "ArrowDown") {
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : 0
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current > 0 ? current - 1 : suggestions.length - 1
      );
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(suggestions[activeIndex]);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {loading && (
        <p className="mt-1 text-xs text-slate-500">Searching locations...</p>
      )}

      {searchError && (
        <p className="mt-1 text-xs text-red-600">{searchError}</p>
      )}

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {suggestions.map((place, index) => (
            <li key={place.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(place);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition ${
                  index === activeIndex
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                {place.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
