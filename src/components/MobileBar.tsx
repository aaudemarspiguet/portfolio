"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/content/site";
import { toggleSfx, useSfxEnabled } from "@/lib/sfx";
import { GlassMenu, type MenuItem } from "./glass/GlassMenu";
import { useGoHome } from "./HomeLink";
import { RecordSheet } from "./room/RecordSheet";
import { RECORD_TRACKS } from "./room/roomData";
import { roomCommand, useRoomBus } from "./room/roomBus";
import { useStudioView, type RoomNavKey } from "./StudioViewProvider";
import { toggleTheme, useTheme } from "./ThemeToggle";

const SECTION_LABELS: Record<RoomNavKey, string> = {
  work: "Projects",
  experience: "Experience",
  about: "About",
};

const noopSubscribe = () => () => {};

function tourSeen() {
  try {
    return localStorage.getItem("roomTour") === "1";
  } catch {
    return false;
  }
}

/**
 * The phone top bar: one full-width Liquid Glass bar over the full-screen page. On the left, the
 * page's name opens a pull-down of the sections; on the right, the room switch (a cube) and a
 * ⋯ menu with everything else.
 */
export function MobileBar({
  current,
  onHome,
  canSwitchView,
  onNav,
  onToggleView,
}: {
  current: RoomNavKey | null;
  onHome: boolean;
  canSwitchView: boolean;
  onNav: (key: RoomNavKey) => void;
  onToggleView: () => void;
}) {
  const { view } = useStudioView();
  const room = useRoomBus();
  const goHome = useGoHome();
  const theme = useTheme();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const sfxStored = useSfxEnabled();
  const sfxOn = hydrated ? sfxStored : true;

  const [menu, setMenu] = useState<"nav" | "more" | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const titleRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const closeMenu = useCallback(() => setMenu(null), []);
  const inRoom = view === "room" && room.mounted;
  const label = current ? SECTION_LABELS[current] : site.brand;

  function showToast(text: string) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.email);
      showToast("Email copied");
    } catch {
      showToast(site.email);
    }
  }

  const navItems: MenuItem[] = [
    { label: "Home", checked: onHome && current === null, onSelect: goHome },
    ...(Object.keys(SECTION_LABELS) as RoomNavKey[]).map((key) => ({
      label: SECTION_LABELS[key],
      checked: current === key,
      onSelect: () => onNav(key),
    })),
  ];

  const track = RECORD_TRACKS[room.trackIndex] ?? RECORD_TRACKS[0];
  const moreItems: MenuItem[] = [
    ...(inRoom
      ? ([
          { label: tourSeen() ? "Replay the Tour" : "Take the Tour", onSelect: roomCommand.replayTour },
          {
            label: "Record Player",
            sub: `${track.title} · ${room.playing ? "playing" : "paused"}`,
            onSelect: () => setRecordOpen(true),
          },
          { kind: "separator" },
        ] satisfies MenuItem[])
      : []),
    { label: "Sound Effects", checked: sfxOn, onSelect: toggleSfx },
    { label: "Dark Appearance", checked: theme === "dark", onSelect: toggleTheme },
    { kind: "separator" },
    { label: "Copy Email", onSelect: copyEmail },
    { label: "GitHub", href: site.links.github, external: true, icon: "↗" },
    { label: "LinkedIn", href: site.links.linkedin, external: true, icon: "↗" },
    { label: "View Source", href: site.links.source, external: true, icon: "↗" },
  ];

  return (
    <div className="ln-mbar">
      <button
        ref={titleRef}
        type="button"
        className="ln-mbar__title"
        aria-haspopup="menu"
        aria-expanded={menu === "nav"}
        onClick={() => setMenu(menu === "nav" ? null : "nav")}
      >
        <span>{label}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10l5 5 5-5" />
        </svg>
      </button>

      <div className="ln-mbar__end">
        {canSwitchView && (
          <button
            type="button"
            className="ln-gbtn"
            aria-label="Room view"
            aria-pressed={view === "room"}
            onClick={onToggleView}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
              <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
            </svg>
          </button>
        )}
        <button
          ref={moreRef}
          type="button"
          className="ln-gbtn"
          aria-label="More"
          aria-haspopup="menu"
          aria-expanded={menu === "more"}
          onClick={() => setMenu(menu === "more" ? null : "more")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-gbtn__dots">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      {menu === "nav" && <GlassMenu anchor={titleRef} items={navItems} align="start" label="Sections" onClose={closeMenu} />}
      {menu === "more" && <GlassMenu anchor={moreRef} items={moreItems} align="end" label="More" onClose={closeMenu} />}
      {recordOpen && inRoom && <RecordSheet onClose={() => setRecordOpen(false)} />}

      <div className="ln-mbar__toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
    </div>
  );
}
