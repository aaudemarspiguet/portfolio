"use client";

import { useEffect, useRef, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"video">, "ref" | "children" | "muted" | "loop" | "autoPlay"> & {
  /** Accessible name for the cover. */
  label: string;
};

/**
 * Muted looping cover video. It plays only while on screen, so the copy in the hidden plain view
 * doesn't download and decode behind the room. Holds on its first frame under reduced motion.
 */
export function CoverVideo({ label, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = typeof IntersectionObserver === "undefined";
    const sync = () => {
      if (onScreen && !query.matches) video.play().catch(() => {});
      else video.pause();
    };
    const io = onScreen
      ? null
      : new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        });
    io?.observe(video);
    sync();
    query.addEventListener("change", sync);
    return () => {
      io?.disconnect();
      query.removeEventListener("change", sync);
    };
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
