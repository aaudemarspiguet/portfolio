import { ogSize, siteCard } from "@/components/OgCard";
import { site } from "@/content/site";

export const alt = `${site.name}, ${site.role.toLowerCase()}. ${site.lede.highlight}`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return siteCard();
}
