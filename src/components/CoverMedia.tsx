import type { Media } from "@/content/projects";
import { CoverVideo } from "./CoverVideo";

/**
 * A card cover: image, GIF or video. `focus` becomes object-position.
 * `decorative` drops the alt text (for the carousel's repeated copies).
 * `parallax` tags it for the carousel script, which sizes and moves it.
 */
export function CoverMedia({ media, decorative = false, parallax = false, className }: { media: Media; decorative?: boolean; parallax?: boolean; className?: string }) {
  const shared = {
    className,
    style: { objectPosition: media.focus },
    draggable: false,
    ...(parallax ? { "data-parallax-media": "", "data-focus": media.focus } : {}),
  };

  if (media.kind === "video") return <CoverVideo src={media.src} label={decorative ? undefined : media.alt} {...shared} />;

  // Plain <img>: the carousel transforms covers every frame, and SVG/GIF gain nothing from next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media.src} alt={decorative ? "" : media.alt} loading="lazy" decoding="async" {...shared} />;
}
