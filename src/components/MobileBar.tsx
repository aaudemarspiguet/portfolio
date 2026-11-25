"use client";

import { useCallback, useRef, useState } from "react";
import { site } from "@/content/site";
import { GlassMenu, type MenuItem } from "./glass/GlassMenu";
import { useGoHome } from "./HomeLink";
import { MoreMenu } from "./MoreMenu";
import { type RoomNavKey } from "./StudioViewProvider";
import { ViewSwitch } from "./ViewSwitch";

const SECTION_LABELS: Record<RoomNavKey, string> = {
  work: "Projects",
  experience: "Experience",
  about: "About",
};

/**
 * The phone top bar: one full-width Liquid Glass bar over the full-screen page. On the left, the
 * page's name opens a pull-down of the sections; on the right, the room/plain switch and a
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
  const goHome = useGoHome();
  const [navOpen, setNavOpen] = useState(false);
  const titleRef = useRef<HTMLButtonElement>(null);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const label = current ? SECTION_LABELS[current] : site.brand;

  const navItems: MenuItem[] = [
    { label: "Home", checked: onHome && current === null, onSelect: goHome },
    ...(Object.keys(SECTION_LABELS) as RoomNavKey[]).map((key) => ({
      label: SECTION_LABELS[key],
      checked: current === key,
      onSelect: () => onNav(key),
    })),
  ];

  return (
    <div className="ln-mbar">
      <button
        ref={titleRef}
        type="button"
        className="ln-mbar__title"
        aria-haspopup="menu"
        aria-expanded={navOpen}
        onClick={() => setNavOpen((o) => !o)}
      >
        <span>{label}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10l5 5 5-5" />
        </svg>
      </button>

      <div className="ln-mbar__end">
        {canSwitchView && <ViewSwitch className="ln-gbtn" onToggle={onToggleView} />}
        <MoreMenu buttonClassName="ln-gbtn" withLinks />
      </div>

      {navOpen && <GlassMenu anchor={titleRef} items={navItems} align="start" label="Sections" onClose={closeNav} />}
    </div>
  );
}
