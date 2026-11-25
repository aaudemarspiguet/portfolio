// Lock-screen style labels for the desk props, in the viewer's own time zone.

/** "4:07", 12-hour with no AM/PM, the way a phone or Mac lock screen shows it. */
export function clockLabel(d = new Date()): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[AP]M$/i, "");
}

/** "Wednesday, November 25". */
export function dateLabel(d = new Date()): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** Milliseconds until the next minute starts, so a clock can tick right on the minute. */
export function msToNextMinute(d = new Date()): number {
  return 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50;
}
