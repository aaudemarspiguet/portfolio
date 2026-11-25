"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

// Follows system prefers-color-scheme by default unless the visitor explicitly saved a choice.
const themeScript = `(function(){var t;try{t=localStorage.getItem("${STORAGE_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t);try{var v=localStorage.getItem("view");if(v==="plain"||v==="room")document.documentElement.dataset.view=v}catch(e){}})()`;

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

export function ThemeToggle() {
  const theme = useTheme();

  // Re-apply the saved choice or system preference after React's dev remount.
  useLayoutEffect(() => {
    const fallback: Theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", savedTheme() ?? fallback);
  }, []);

  return (
    <button
      type="button"
      className="ln-icon-btn"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
    >
      <svg className="ln-theme__moon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
      <svg className="ln-theme__sun" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  );
}
