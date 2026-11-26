"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { debugFlag } from "@/lib/debugFlags";

// Temporary: on a phone, open the site with ?debug=1 (remembered on the device until ?debug=0) to
// see what Safari reports about the top of the page, and a log of the same readings just before
// and after each switch between the views. It's for finding why Safari's status bar sometimes
// turns the page colour over the room. Renders nothing without the flag.

const noop = () => () => {};

function describe(el: Element | null) {
  if (!el) return "none";
  const id = el.id ? `#${el.id}` : "";
  const cls =
    typeof el.className === "string" && el.className
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
      : "";
  return `${el.tagName.toLowerCase()}${id}${cls}`;
}

const mine = (el: Element) => !!(el as HTMLElement).closest?.("[data-viewport-debug]");

function at(x: number, y: number) {
  return document
    .elementsFromPoint(x, y)
    .filter((el) => !mine(el))
    .slice(0, 4)
    .map(describe)
    .join(" > ");
}

const n = (v: number | undefined) => (v === undefined ? "-" : Math.round(v * 10) / 10);

// Fixed or sticky elements whose box reaches the top edge of the viewport. Safari picks its status
// bar colour from these, so this is the list that matters.
function fixedAtTop() {
  const out: string[] = [];
  const before = getComputedStyle(document.body, "::before");
  if (before.display !== "none" && before.content !== "none") {
    out.push(`body::before h ${before.height} bg ${before.backgroundColor}`);
  }
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
    if (mine(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.height < 1 || r.width < window.innerWidth / 3 || r.top > 1 || r.bottom < 0) continue;
    out.push(`${describe(el)} ${cs.position} top ${n(r.top)} h ${n(r.height)} bg ${cs.backgroundColor}`);
  }
  return out.length ? out : ["none"];
}

function read(svh: HTMLDivElement | null) {
  const html = document.documentElement;
  const vv = window.visualViewport;
  const stage = document.getElementById("room");
  const header = document.querySelector<HTMLElement>(".ln-header");
  const hs = header ? getComputedStyle(header) : null;
  const hr = header?.getBoundingClientRect();
  const sr = stage?.getBoundingClientRect();
  const cx = window.innerWidth / 2;
  const metas = Array.from(document.querySelectorAll('meta[name="theme-color"]'))
    .map((m) => `${m.getAttribute("content")}${m.getAttribute("media") ? ` (${m.getAttribute("media")})` : ""}`)
    .join(", ");
  return [
    `view ${html.dataset.view ?? "-"}  theme ${html.dataset.theme ?? "-"}`,
    `scrollY ${n(window.scrollY)}  innerH ${window.innerHeight}  screenH ${window.screen.height}  svh ${n(svh?.getBoundingClientRect().height)}`,
    `vv h ${n(vv?.height)} offTop ${n(vv?.offsetTop)} pageTop ${n(vv?.pageTop)}  docH ${html.scrollHeight}`,
    `--bars ${html.style.getPropertyValue("--bars") || "unset"}`,
    `stage top ${n(sr?.top)} pageTop ${n(sr ? sr.top + window.scrollY : undefined)} h ${n(sr?.height)}`,
    `header top ${n(hr?.top)} css top ${hs?.top ?? "-"} pos ${hs?.position ?? "-"} bg ${hs?.backgroundColor ?? "-"}`,
    `bg html ${getComputedStyle(html).backgroundColor} body ${getComputedStyle(document.body).backgroundColor}`,
    `theme-color ${metas || "none"}`,
    `at y0 ${at(cx, 0)}`,
    `at y1 ${at(cx, 1)}`,
    ...fixedAtTop().map((l) => `fixed@top ${l}`),
  ];
}

type Entry = { label: string; lines: string[] };

export function ViewportDebug() {
  // Read the flag on the client only, so the server render and hydration both start with nothing.
  const on = useSyncExternalStore(noop, () => debugFlag("debug"), () => false);
  const [live, setLive] = useState<string[]>([]);
  const [log, setLog] = useState<Entry[]>([]);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const svh = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!on) return;
    let last = read(svh.current);
    let switches = 0;
    const timers: number[] = [];
    const tick = () => {
      last = read(svh.current);
      setLive(last);
    };
    tick();
    const id = window.setInterval(tick, 250);
    const push = (label: string, lines: string[]) =>
      setLog((l) => [...l, { label, lines }].slice(-12));

    // data-view on <html> changes the moment a switch starts, so the reading from the last tick is
    // the "before", and readings a frame, half a second and a second and a half later are the "after".
    let view = document.documentElement.dataset.view;
    const mo = new MutationObserver(() => {
      const next = document.documentElement.dataset.view;
      if (next === view) return;
      const k = ++switches;
      push(`#${k} ${view} → ${next}: before`, last);
      view = next;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => push(`#${k} after 2 frames`, read(svh.current))),
      );
      timers.push(window.setTimeout(() => push(`#${k} after 0.5s`, read(svh.current)), 500));
      timers.push(window.setTimeout(() => push(`#${k} after 1.5s`, read(svh.current)), 1500));
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-view"] });
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    return () => {
      window.clearInterval(id);
      timers.forEach((t) => window.clearTimeout(t));
      mo.disconnect();
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, [on]);

  if (!on) return null;

  const text = [
    "NOW",
    ...live,
    ...log.flatMap((e) => ["", e.label, ...e.lines]),
  ].join("\n");

  const copy = () => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      },
      () => {},
    );
  };

  const button = {
    pointerEvents: "auto" as const,
    font: "600 11px ui-monospace, Menlo, monospace",
    color: "#fff",
    background: "rgba(255,255,255,0.18)",
    border: 0,
    borderRadius: 8,
    padding: "6px 10px",
  };

  return (
    <div
      data-viewport-debug
      style={{
        // Kept well off the top edge, so it can't be what Safari tints its status bar from.
        position: "fixed",
        top: "26%",
        left: "4%",
        width: "84%",
        zIndex: 99999,
        pointerEvents: "none",
      }}
    >
      <div ref={svh} style={{ position: "absolute", visibility: "hidden", width: 1, height: "100svh" }} />
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button type="button" style={button} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Debug"}
        </button>
        {open && (
          <>
            <button type="button" style={button} onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
            <button type="button" style={button} onClick={() => setLog([])}>
              Clear log
            </button>
          </>
        )}
      </div>
      {open && (
        <div
          style={{
            pointerEvents: "auto",
            maxHeight: "52svh",
            overflowY: "auto",
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            font: "10px/1.4 ui-monospace, Menlo, monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
