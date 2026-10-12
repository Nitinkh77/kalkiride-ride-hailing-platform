/**
 * @file lib/theme.ts
 * @description Tiny external store for the Light / Dark / System theme preference.
 * The `dark` class on <html> is the single source of truth for styling; the
 * pre-paint script in app/layout.tsx applies it before first render (no flash).
 */

export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "kalki-theme";

/** Inline script string executed in <head> before paint. Keep in sync with applyTheme(). */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||((t!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

const listeners = new Set<() => void>();

export function getPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(pref: ThemePreference): void {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setPreference(pref: ThemePreference): void {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage unavailable: theme still applies for this session */
  }
  applyTheme(pref);
  listeners.forEach((l) => l());
  window.setTimeout(() => root.classList.remove("theme-transition"), 300);
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (getPreference() === "system") applyTheme("system");
    callback();
  };
  mq.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(callback);
    mq.removeEventListener("change", onSystemChange);
  };
}
