"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/content/site";
import { toggleSfx, useSfxEnabled } from "@/lib/sfx";
import { GlassMenu, type MenuItem } from "./glass/GlassMenu";
import { RecordSheet } from "./room/RecordSheet";
import { RECORD_TRACKS } from "./room/roomData";
import { roomCommand, useRoomBus } from "./room/roomBus";
import { useStudioView } from "./StudioViewProvider";
import { toggleTheme, useTheme } from "./ThemeToggle";

const noopSubscribe = () => () => {};

function tourSeen() {
  try {
    return localStorage.getItem("roomTour") === "1";
  } catch {
    return false;
  }
}

/**
 * The ⋯ button and its menu, the same on phones and desktop: in the room, the tour and the record
 * player; everywhere, sound, appearance and the email. Phones also list the outside links, which
 * desktop keeps visible in the nav.
 */
export function MoreMenu({ buttonClassName, withLinks }: { buttonClassName: string; withLinks: boolean }) {
  const { view } = useStudioView();
  const room = useRoomBus();
  const theme = useTheme();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const sfxStored = useSfxEnabled();
  const sfxOn = hydrated ? sfxStored : true;

  const [open, setOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const close = useCallback(() => setOpen(false), []);
  const inRoom = view === "room" && room.mounted;

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

  const track = RECORD_TRACKS[room.trackIndex] ?? RECORD_TRACKS[0];
  const items: MenuItem[] = [
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
    ...(withLinks
      ? ([
          { label: "GitHub", href: site.links.github, external: true, icon: "↗" },
          { label: "LinkedIn", href: site.links.linkedin, external: true, icon: "↗" },
        ] satisfies MenuItem[])
      : []),
    { label: "View Source", href: site.links.source, external: true, icon: "↗" },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClassName}
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-dots">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && <GlassMenu anchor={buttonRef} items={items} align="end" label="More" onClose={close} />}
      {recordOpen && inRoom && <RecordSheet onClose={() => setRecordOpen(false)} />}
      <div className="ln-toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
    </>
  );
}
