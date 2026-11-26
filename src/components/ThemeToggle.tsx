"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

// Follows system prefers-color-scheme by default unless the visitor explicitly saved a choice.
// Also points the browser's theme colour (Safari's bars) at the site's own theme, not the phone's.
const themeScript = `(function(){var t;try{t=localStorage.getItem("${STORAGE_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t);function s(){var c=getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();if(c)document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})}s();document.addEventListener("DOMContentLoaded",s);})()`;

// Runs in <head> before first paint: saved choice, otherwise system preference.
// On client renders the script is inert (text/plain), so React doesn't warn.
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}

// The layout's theme-color tags follow the phone's light/dark setting, but the site has its own
// toggle. Point them at the page colour of the theme actually showing, so Safari's bars match it.
function syncThemeColor() {
  const color = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
  if (!color) return;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
}

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (!savedTheme()) {
      document.documentElement.setAttribute("data-theme", mq.matches ? "dark" : "light");
      syncThemeColor();
      onChange();
    }
  };
  mq?.addEventListener?.("change", onMedia);
  return () => {
    observer.disconnect();
    mq?.removeEventListener?.("change", onMedia);
  };
}

function savedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  syncThemeColor();
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

export function toggleTheme() {
  setTheme(readTheme() === "dark" ? "light" : "dark");
}

export function useTheme() {
  return useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
}

/** Re-applies the saved choice or system preference after React's dev remount. */
export function useApplySavedTheme() {
  useLayoutEffect(() => {
    const fallback: Theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", savedTheme() ?? fallback);
    syncThemeColor();
  }, []);
}
