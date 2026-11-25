"use client";

import { useSyncExternalStore } from "react";

/** Matches the CSS phone breakpoint (`max-width: 640px`). False on the server. */
const PHONE_QUERY = "(max-width: 640px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useIsPhone() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}
