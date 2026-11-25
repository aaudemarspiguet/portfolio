"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { debugFlag } from "@/lib/debugFlags";

// Temporary: on a phone, add ?debug=1 or #debug to the address (remembered until ?debug=0) to see what Safari reports for the viewport,
// the safe areas, the scroll and the room's canvas. Screenshot it to see why the room does or
// doesn't run under the status bar and the toolbar. Renders nothing without the flag.

const noop = () => () => {};

function describe(el: Element | null) {
  if (!el) return "none";
  const id = el.id ? `#${el.id}` : "";
  const cls = typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}` : "";
  return `${el.tagName.toLowerCase()}${id}${cls}`;
}

function stack(x: number, y: number) {
  return document
    .elementsFromPoint(x, y)
    .filter((el) => !(el as HTMLElement).closest?.("[data-viewport-debug]"))
    .slice(0, 3)
    .map(describe)
    .join(" > ");
}

function rect(el: Element | null) {
  if (!el) return "none";
  const r = el.getBoundingClientRect();
  return `top ${r.top.toFixed(1)} bottom ${r.bottom.toFixed(1)} h ${r.height.toFixed(1)}`;
}

export function ViewportDebug() {
  // Read the flag on the client only, so the server render and hydration both start with nothing.
  const on = useSyncExternalStore(
    noop,
    () => debugFlag("debug"),
    () => false,
  );
  const [lines, setLines] = useState<string[]>([]);
  const probe = useRef<HTMLDivElement>(null);
  const svh = useRef<HTMLDivElement>(null);
  const lvh = useRef<HTMLDivElement>(null);
  const dvh = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!on) return;
    const read = () => {
      const p = probe.current ? getComputedStyle(probe.current) : null;
      const html = document.documentElement;
      const vv = window.visualViewport;
      const stage = document.getElementById("room");
      const canvas = stage?.querySelector("canvas") ?? null;
      const cx = window.innerWidth / 2;
      setLines([
        `inner ${window.innerWidth} x ${window.innerHeight}  dpr ${window.devicePixelRatio}`,
        `screen ${window.screen.width} x ${window.screen.height}`,
        `visualViewport h ${vv?.height.toFixed(1)} offsetTop ${vv?.offsetTop.toFixed(1)} pageTop ${vv?.pageTop.toFixed(1)}`,
        `svh ${svh.current?.getBoundingClientRect().height.toFixed(1)} lvh ${lvh.current?.getBoundingClientRect().height.toFixed(1)} dvh ${dvh.current?.getBoundingClientRect().height.toFixed(1)}`,
        `safe top ${p?.paddingTop} bottom ${p?.paddingBottom} left ${p?.paddingLeft} right ${p?.paddingRight}`,
        `scrollY ${window.scrollY.toFixed(1)}  doc h ${html.scrollHeight}  client h ${html.clientHeight}`,
        `stage ${rect(stage)}`,
        `canvas ${rect(canvas)}`,
        `canvas buffer ${canvas?.width ?? "-"} x ${canvas?.height ?? "-"}`,
        `--under-bar ${html.style.getPropertyValue("--under-bar") || "unset"}  runway ${html.dataset.runway ?? "off"}`,
        `overflow html ${getComputedStyle(html).overflow} body ${getComputedStyle(document.body).overflow}`,
        `bg html ${getComputedStyle(html).backgroundColor}`,
        `bg body ${getComputedStyle(document.body).backgroundColor}`,
        `theme-color ${Array.from(document.querySelectorAll('meta[name="theme-color"]')).map((m) => m.getAttribute("content")).join(", ") || "none"}`,
        `at top ${stack(cx, 1)}`,
        `at bottom ${stack(cx, window.innerHeight - 2)}`,
      ]);
    };
    read();
    const id = window.setInterval(read, 500);
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div
      data-viewport-debug
      style={{
        position: "fixed",
        top: "28%",
        left: "4%",
        width: "80%",
        zIndex: 99999,
        pointerEvents: "none",
        padding: "8px 10px",
        borderRadius: 10,
        background: "rgba(0, 0, 0, 0.78)",
        color: "#fff",
        font: "10.5px/1.45 ui-monospace, Menlo, monospace",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      <div
        ref={probe}
        style={{
          position: "absolute",
          visibility: "hidden",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      />
      <div ref={svh} style={{ position: "absolute", visibility: "hidden", width: 1, height: "100svh" }} />
      <div ref={lvh} style={{ position: "absolute", visibility: "hidden", width: 1, height: "100lvh" }} />
      <div ref={dvh} style={{ position: "absolute", visibility: "hidden", width: 1, height: "100dvh" }} />
      {lines.join("\n")}
    </div>
  );
}
