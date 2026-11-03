"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 30_000);
  return () => clearInterval(id);
}

// Client-only clock: the server renders nothing, so there is no hydration mismatch.
export function LocalTime({ timeZone }: { timeZone?: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone }).toLowerCase(),
    () => "",
  );
  return <time suppressHydrationWarning>{time}</time>;
}
