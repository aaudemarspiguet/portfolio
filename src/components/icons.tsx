/** Line icons for the bars and menus, drawn on a 24px grid like SF Symbols. */

function Line({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-lineicon">
      {children}
    </svg>
  );
}

/** The room: a cube. */
export function CubeIcon() {
  return (
    <Line>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </Line>
  );
}

/** Plain view: a page of text. */
export function PageIcon() {
  return (
    <Line>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" />
    </Line>
  );
}

export function SpeakerIcon() {
  return (
    <Line>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </Line>
  );
}

export function MoonIcon() {
  return (
    <Line>
      <path d="M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a7.8 7.8 0 1 0 10 10z" />
    </Line>
  );
}

export function SunIcon() {
  return (
    <Line>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M5.4 18.6l1.5-1.5M17.1 6.9l1.5-1.5" />
    </Line>
  );
}

export function CopyIcon() {
  return (
    <Line>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </Line>
  );
}

export function CodeIcon() {
  return (
    <Line>
      <path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5M13.5 5l-3 14" />
    </Line>
  );
}

export function VinylIcon() {
  return (
    <Line>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 6.2a5.8 5.8 0 0 0-5.8 5.8" />
    </Line>
  );
}

/** The tour: a figure walking. */
export function WalkIcon() {
  return (
    <Line>
      <circle cx="13" cy="4.6" r="1.7" />
      <path d="m9.5 21 2.2-6.2 2.8 2.6V21M8 12.5l1.6-4.3 4-1 2.6 3.6 2.8 1M11.7 14.8l1.9-6.6" />
    </Line>
  );
}

export function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-fillicon">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-fillicon">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}
