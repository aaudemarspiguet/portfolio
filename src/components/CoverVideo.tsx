"use client";

import { useEffect, useRef, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"video">, "ref" | "children" | "muted" | "loop" | "autoPlay"> & {
  /** Accessible name for the cover. */
  label: string;
};

/** Muted looping cover video. Holds on its first frame under reduced motion. */
export function CoverVideo({ label, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (query.matches) video.pause();
      else video.play().catch(() => {});
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <video
      ref={ref}
      aria-label={label}
      muted
      loop
      playsInline
      preload="metadata"
      {...rest}
    />
  );
}
