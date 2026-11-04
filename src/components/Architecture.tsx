import type { Architecture as Arch, Side } from "@/content/projects";

// Grid geometry in SVG units. At the desktop column width one unit is about one pixel,
// so 14-unit labels render near 14px. Narrow screens scroll the figure sideways instead
// of shrinking the text (see .ln-arch__scroll).
const CELL_W = 210;
const CELL_H = 110;
const NODE_W = 164;
const NODE_H = 62;
const PAD_X = 16;
const PAD_TOP = 36; // room for a group label above row 0
const PAD_BOTTOM = 16;
const ARROW = 7;
const BADGE_R = 10;

type Pt = [number, number];
type Box = { x: number; y: number; cx: number; cy: number };

function boxAt([c, r]: [number, number]): Box {
  const cx = PAD_X + c * CELL_W + CELL_W / 2;
  const cy = PAD_TOP + r * CELL_H + CELL_H / 2;
  return { x: cx - NODE_W / 2, y: cy - NODE_H / 2, cx, cy };
}

function port(b: Box, s: Side): Pt {
  if (s === "l") return [b.x, b.cy];
  if (s === "r") return [b.x + NODE_W, b.cy];
  if (s === "t") return [b.cx, b.y];
  return [b.cx, b.y + NODE_H];
}

/** Default sides: straight across when aligned, otherwise leave and enter horizontally. */
function sides(a: Box, b: Box): [Side, Side] {
  if (a.cy === b.cy || a.cx !== b.cx) return a.cx < b.cx ? ["r", "l"] : ["l", "r"];
  return a.cy < b.cy ? ["b", "t"] : ["t", "b"];
}

/** Right-angle route between two ports, chosen by which way each port faces. */
function route(p: Pt, exit: Side, q: Pt, enter: Side): Pt[] {
  const hOut = exit === "l" || exit === "r";
  const hIn = enter === "l" || enter === "r";
  if (p[0] === q[0] || p[1] === q[1]) return [p, q];
  if (hOut && hIn) { const mx = (p[0] + q[0]) / 2; return [p, [mx, p[1]], [mx, q[1]], q]; }
  if (!hOut && !hIn) { const my = (p[1] + q[1]) / 2; return [p, [p[0], my], [q[0], my], q]; }
  if (hOut) return [p, [q[0], p[1]], q];
  return [p, [p[0], q[1]], q];
}

/** Badge sits on the middle of the longest segment, where there is room for it. */
function badgePoint(pts: Pt[]): Pt {
  let best = 0, at: Pt = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    if (len > best) { best = len; at = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  }
  return at;
}

function arrowHead(q: Pt, enter: Side) {
  const [x, y] = q, a = ARROW, w = ARROW * 0.6;
  if (enter === "l") return `${x},${y} ${x - a},${y - w} ${x - a},${y + w}`;
  if (enter === "r") return `${x},${y} ${x + a},${y - w} ${x + a},${y + w}`;
  if (enter === "t") return `${x},${y} ${x - w},${y - a} ${x + w},${y - a}`;
  return `${x},${y} ${x - w},${y + a} ${x + w},${y + a}`;
}

/** Shorten the last segment so the line stops at the arrowhead's base. */
function trim(pts: Pt[], enter: Side): Pt[] {
  const out = pts.map((p) => [...p] as Pt);
  const q = out[out.length - 1];
  if (enter === "l") q[0] -= ARROW; else if (enter === "r") q[0] += ARROW;
  else if (enter === "t") q[1] -= ARROW; else q[1] += ARROW;
  return out;
}

export function Architecture({ arch, labelId }: { arch: Arch; labelId: string }) {
  const width = PAD_X * 2 + arch.cols * CELL_W;
  const height = PAD_TOP + arch.rows * CELL_H + PAD_BOTTOM;
  const boxes = new Map(arch.nodes.map((n) => [n.id, boxAt(n.at)]));

  return (
    <svg className="ln-arch" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={labelId}>
      {arch.groups?.map((g) => {
        const bs = g.nodes.map((id) => boxes.get(id)!);
        const x = Math.min(...bs.map((b) => b.x)) - 14;
        const y = Math.min(...bs.map((b) => b.y)) - 30;
        const r = Math.max(...bs.map((b) => b.x + NODE_W)) + 14;
        const btm = Math.max(...bs.map((b) => b.y + NODE_H)) + 14;
        return (
          <g key={g.label} className="ln-arch__group">
            <rect x={x} y={y} width={r - x} height={btm - y} rx={16} />
            <text x={x + 14} y={y + 19}>{g.label}</text>
          </g>
        );
      })}

      {arch.edges.map((e) => {
        const a = boxes.get(e.from)!, b = boxes.get(e.to)!;
        const [dx, dy] = sides(a, b);
        const exit = e.exit ?? dx, enter = e.enter ?? dy;
        const pts = route(port(a, exit), exit, port(b, enter), enter);
        const line = trim(pts, enter);
        return (
          <g key={`${e.from}-${e.to}`} className={e.stop ? "ln-arch__edge ln-arch__edge--stop" : "ln-arch__edge"}>
            <polyline points={line.map((p) => p.join(",")).join(" ")} />
            <polygon points={arrowHead(pts[pts.length - 1], enter)} />
          </g>
        );
      })}

      {arch.nodes.map((n) => {
        const b = boxes.get(n.id)!;
        return (
          <g key={n.id} className={`ln-arch__node${n.kind ? ` ln-arch__node--${n.kind}` : ""}`}>
            <rect x={b.x} y={b.y} width={NODE_W} height={NODE_H} rx={10} />
            {n.kind === "store" && <path d={`M${b.x} ${b.y + 11} Q${b.cx} ${b.y + 21} ${b.x + NODE_W} ${b.y + 11}`} />}
            <text x={b.cx} y={n.sub ? b.cy - 2 : b.cy + 5} className="ln-arch__label">{n.label}</text>
            {n.sub && <text x={b.cx} y={b.cy + 16} className="ln-arch__sub">{n.sub}</text>}
          </g>
        );
      })}

      {/* Badges last, so they sit above lines and boxes. */}
      {arch.edges.filter((e) => e.step).map((e) => {
        const a = boxes.get(e.from)!, b = boxes.get(e.to)!;
        const [dx, dy] = sides(a, b);
        const exit = e.exit ?? dx, enter = e.enter ?? dy;
        const [x, y] = badgePoint(route(port(a, exit), exit, port(b, enter), enter));
        return (
          <g key={`badge-${e.from}-${e.to}`} className={e.stop ? "ln-arch__badge ln-arch__badge--stop" : "ln-arch__badge"}>
            <circle cx={x} cy={y} r={BADGE_R} />
            <text x={x} y={y + 4}>{e.step}</text>
          </g>
        );
      })}
    </svg>
  );
}
