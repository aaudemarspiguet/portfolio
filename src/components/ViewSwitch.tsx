"use client";

import { CubeIcon, PageIcon } from "./icons";
import { useStudioView } from "./StudioViewProvider";

/**
 * The room/plain switch: shows the view you're in, a lit cube for the room or a page for plain
 * view, and a tap switches to the other.
 */
export function ViewSwitch({ className, onToggle }: { className: string; onToggle: () => void }) {
  const { view } = useStudioView();
  const inRoom = view === "room";
  const label = inRoom ? "Switch to plain view" : "Switch to room view";
  return (
    <button
      type="button"
      className={`${className} ln-viewswitch`}
      data-view={view}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      {inRoom ? <CubeIcon /> : <PageIcon />}
    </button>
  );
}
