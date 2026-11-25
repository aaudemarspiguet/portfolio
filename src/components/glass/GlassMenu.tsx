"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

export type MenuItem =
  | {
      kind?: "item";
      label: string;
      /** Shown under the label in mono, for data like the current track. */
      sub?: string;
      /** A glyph on the leading edge, as iOS 26 menus draw them. */
      icon?: ReactNode;
      /** A small mark on the trailing edge, like ↗ for a link that leaves the site. */
      trail?: string;
      /** A checkmark: true shows the mark, false keeps the space. */
      checked?: boolean;
      href?: string;
      external?: boolean;
      onSelect?: () => void;
    }
  | { kind: "separator" };

/**
 * A Liquid Glass pull-down menu that grows out of the button that opened it, as menus do on iOS.
 * Closes on a choice, a tap outside, Escape, or a scroll.
 */
export function GlassMenu({
  anchor,
  items,
  align,
  label,
  onClose,
}: {
  anchor: RefObject<HTMLElement | null>;
  items: MenuItem[];
  /** Which edge of the anchor the menu lines up with. */
  align: "start" | "end";
  label: string;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const hasChecks = items.some((i) => i.kind !== "separator" && i.checked !== undefined);
  // With glyphs, the glyph owns the leading column and checkmarks move to the trailing edge.
  const hasIcons = items.some((i) => i.kind !== "separator" && i.icon);

  useLayoutEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = r.bottom + 8;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- placed from the anchor's box before paint.
    setPos(align === "start" ? { top, left: Math.max(8, r.left) } : { top, right: Math.max(8, window.innerWidth - r.right) });
  }, [anchor, align]);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLElement>("[role^='menuitem']")?.focus({ preventScroll: true });
  }, [pos]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        anchor.current?.focus({ preventScroll: true });
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const all = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role^='menuitem']") ?? []);
      if (!all.length) return;
      e.preventDefault();
      const at = all.indexOf(document.activeElement as HTMLElement);
      const next = e.key === "ArrowDown" ? (at + 1) % all.length : (at - 1 + all.length) % all.length;
      all[next].focus();
    };
    const onScroll = () => onClose();
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [anchor, onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      className={`ln-gmenu ln-gmenu--${align}`}
      style={pos ?? { visibility: "hidden" }}
    >
      {items.map((item, i) => {
        if (item.kind === "separator") return <div key={`sep-${i}`} className="ln-gmenu__sep" role="separator" />;
        const inner = (
          <>
            {hasChecks && !hasIcons && (
              <span className="ln-gmenu__check" aria-hidden="true">
                {item.checked ? "✓" : ""}
              </span>
            )}
            {hasIcons && (
              <span className="ln-gmenu__icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span className="ln-gmenu__text">
              <span className="ln-gmenu__label">{item.label}</span>
              {item.sub && <span className="ln-gmenu__sub">{item.sub}</span>}
            </span>
            {hasIcons && item.checked && (
              <span className="ln-gmenu__check ln-gmenu__check--end" aria-hidden="true">
                ✓
              </span>
            )}
            {item.trail && (
              <span className="ln-gmenu__trail" aria-hidden="true">
                {item.trail}
              </span>
            )}
          </>
        );
        const role = item.checked !== undefined ? "menuitemcheckbox" : "menuitem";
        if (item.href) {
          return (
            <a
              key={item.label}
              role={role}
              className="ln-gmenu__item"
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              onClick={() => {
                item.onSelect?.();
                onClose();
              }}
            >
              {inner}
            </a>
          );
        }
        return (
          <button
            key={item.label}
            type="button"
            role={role}
            aria-checked={item.checked === undefined ? undefined : item.checked}
            className="ln-gmenu__item"
            onClick={() => {
              onClose();
              item.onSelect?.();
            }}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
