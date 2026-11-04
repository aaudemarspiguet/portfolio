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
  if (media.srcDark) {
    // Both variants load eagerly so the carousel can size the hidden one before a theme switch.
    const themed = (src: string, theme: "light" | "dark") => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={decorative || theme === "dark" ? "" : media.alt} aria-hidden={theme === "dark" || undefined} decoding="async" {...shared} className={`${className ?? ""} ln-theme-${theme}`} />
    );
    return <>{themed(media.src, "light")}{themed(media.srcDark, "dark")}</>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media.src} alt={decorative ? "" : media.alt} loading="lazy" decoding="async" {...shared} />;
}
