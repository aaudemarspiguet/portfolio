import type { Media } from "@/content/projects";
import { CoverVideo } from "./CoverVideo";

/** A card cover: image, GIF or video. `focus` becomes object-position. */
export function CoverMedia({ media, className }: { media: Media; className?: string }) {
  const shared = {
    className,
    style: { objectPosition: media.focus },
    draggable: false,
  };

  if (media.kind === "video") return <CoverVideo src={media.src} label={media.alt} {...shared} />;

  // Keep SVG and GIF covers in their original format.
  if (media.srcDark) {
    const themed = (src: string, theme: "light" | "dark") => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={media.alt} loading="lazy" decoding="async" {...shared} className={`${className ?? ""} ln-theme-${theme}`} />
    );
    return <>{themed(media.src, "light")}{themed(media.srcDark, "dark")}</>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media.src} alt={media.alt} loading="lazy" decoding="async" {...shared} />;
}
