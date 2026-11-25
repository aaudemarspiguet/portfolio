import * as THREE from "three";

export function canvasTex(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: readonly [number, number],
  colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (ctx) draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = colorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

export function createBrickTexture(): THREE.CanvasTexture {
  return canvasTex(
    512,
    256,
    (g, w, h) => {
      g.fillStyle = "#cfcac1";
      g.fillRect(0, 0, w, h);
      const bw = 64;
      const bh = 28;
      for (let row = 0; row * bh < h; row++) {
        for (let x = -bw; x < w + bw; x += bw) {
          const ox = row % 2 ? bw / 2 : 0;
          const v = 232 + Math.floor(Math.random() * 14);
          g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
          g.fillRect(x + ox + 2, row * bh + 2, bw - 4, bh - 4);
        }
      }
    },
    [5, 4],
  );
}

export function createOakFloorTexture(): THREE.CanvasTexture {
  return canvasTex(
    1024,
    1024,
    (g, w, h) => {
      const tones = [
        [150, 98, 56],
        [138, 88, 49],
        [162, 108, 63],
        [128, 81, 45],
        [145, 94, 52],
        [156, 103, 60],
      ];
      const ph = 64;
      for (let i = 0; i * ph < h; i++) {
        const y = i * ph;
        const joints: number[] = [];
        const x0 = -((i * 397) % 380);
        for (let x = x0; x < w; x += 300 + ((i * 131 + x) % 160)) joints.push(x);
        joints.push(w + 400);
        for (let j = 0; j < joints.length - 1; j++) {
          const a = joints[j];
          const b = joints[j + 1];
          const t = tones[(i * 3 + j * 5) % tones.length];
          const k = 0.92 + Math.random() * 0.16;
          g.fillStyle = `rgb(${Math.round(t[0] * k)},${Math.round(t[1] * k)},${Math.round(t[2] * k)})`;
          g.fillRect(a, y, b - a, ph);
          for (let s = 0; s < 14; s++) {
            const gy = y + 3 + Math.random() * (ph - 6);
            g.strokeStyle = Math.random() > 0.5 ? "rgba(70,40,18,.22)" : "rgba(210,160,110,.16)";
            g.lineWidth = 0.6 + Math.random() * 1.4;
            g.beginPath();
            g.moveTo(a, gy);
            for (let gx = a; gx < b; gx += 40) {
              g.lineTo(gx, gy + Math.sin(gx / (60 + s * 7) + s) * 1.6);
            }
            g.stroke();
          }
          g.fillStyle = "rgba(40,22,10,.55)";
          g.fillRect(a, y, 2, ph);
        }
        g.fillStyle = "rgba(40,22,10,.6)";
        g.fillRect(0, y + ph - 2, w, 2);
      }
    },
    [3, 3],
  );
}

export function createHaloTexture(): THREE.CanvasTexture {
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.shadowColor = "rgba(255,255,255,1)";
    g.shadowBlur = 38;
    g.fillStyle = "rgba(255,255,255,1)";
    g.fillRect(52, 52, w - 104, h - 104);
    g.fillRect(52, 52, w - 104, h - 104);
  });
}

export function createKeyTexture(): THREE.CanvasTexture {
  return canvasTex(512, 64, (g, w, h) => {
    g.fillStyle = "#f4f3ef";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#3a3a3e";
    for (let i = 0; i < w; i += 14) g.fillRect(i, 0, 1, h);
    for (let j = 0; j < w; j += 98) {
      [9, 23, 51, 65, 79].forEach((o) => {
        g.fillRect(j + o, 0, 8, h * 0.6);
      });
    }
  });
}

export function createSynthBandTexture(): THREE.CanvasTexture {
  return canvasTex(256, 16, (g, w, h) => {
    g.fillStyle = "#2a2a2d";
    g.fillRect(0, 0, w, h);
    ["#e35a3a", "#f0a33a", "#e8d14a", "#e35a3a", "#f0a33a"].forEach((c, i) => {
      g.fillStyle = c;
      g.fillRect(8 + i * 20, 4, 14, 8);
    });
  });
}

export function createRugTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  pileShells: THREE.CanvasTexture[];
} {
  const label = "“WET GRASS”";

  const drawCenteredLabel = (g: CanvasRenderingContext2D, w: number, h: number) => {
    const px = Math.round(92 * (w / 1024));
    g.font = `800 ${px}px Inter, Arial, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const m = g.measureText(label);
    const dx =
      typeof m.actualBoundingBoxLeft === "number" && typeof m.actualBoundingBoxRight === "number"
        ? (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2
        : 0;
    const dy =
      typeof m.actualBoundingBoxAscent === "number" && typeof m.actualBoundingBoxDescent === "number"
        ? (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
        : 0;
    g.fillText(label, w / 2 + dx, h / 2 + dy);
  };

  const map = canvasTex(1024, 680, (g, w, h) => {
    g.fillStyle = "#19582a";
    g.fillRect(0, 0, w, h);

    // Dense multi-tone tufted wool blades for plush pile richness.
    const yarnTones = [
      "rgba(12, 46, 20, 0.45)",
      "rgba(24, 84, 40, 0.45)",
      "rgba(44, 128, 62, 0.38)",
      "rgba(66, 160, 82, 0.28)",
    ];
    for (let i = 0; i < 68000; i++) {
      g.fillStyle = yarnTones[i & 3];
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = 3 + Math.random() * 5;
      const tilt = (Math.random() - 0.5) * 2.2;
      g.save();
      g.translate(x, y);
      g.rotate(tilt);
      g.fillRect(-1, -len / 2, 2 + Math.random() * 1.4, len);
      g.restore();
    }

    // Center "WET GRASS" optically on both axes.
    g.fillStyle = "#f2f1ec";
    drawCenteredLabel(g, w, h);

    // Weave light green & highlight tuft wisps subtly through the lettering so it reads like dyed carpet pile.
    for (let i = 0; i < 4200; i++) {
      g.fillStyle = i % 3 === 0 ? "rgba(245, 245, 240, 0.28)" : "rgba(31, 107, 52, 0.22)";
      g.fillRect(Math.random() * w, Math.random() * h, 1.5 + Math.random() * 1.5, 3 + Math.random() * 3);
    }
  });

  const bumpMap = canvasTex(
    1024,
    680,
    (g, w, h) => {
      g.fillStyle = "#525252";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 72000; i++) {
        const shade = 40 + Math.floor(Math.random() * 200);
        g.fillStyle = `rgba(${shade},${shade},${shade},0.48)`;
        const x = Math.random() * w;
        const y = Math.random() * h;
        g.fillRect(x, y, 2 + Math.random() * 2, 3 + Math.random() * 5);
      }
    },
    undefined,
    THREE.NoColorSpace,
  );

  // Two stacked pile-tip shell layers so light catches upper tuft tips and edges overhang softly.
  const pileShells = [
    { count: 44000, alpha: 0.62, tipBright: 0.45 },
    { count: 24000, alpha: 0.44, tipBright: 0.65 },
  ].map(({ count, alpha, tipBright }) =>
    canvasTex(512, 340, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const edgeBoost = x < 8 || x > w - 8 || y < 8 || y > h - 8 ? 1.25 : 1;
        const r = Math.round(32 + Math.random() * 44 * tipBright);
        const gr = Math.round(108 + Math.random() * 72 * tipBright);
        const b = Math.round(46 + Math.random() * 34 * tipBright);
        g.fillStyle = `rgba(${r},${gr},${b},${Math.min(0.85, alpha * edgeBoost)})`;
        g.fillRect(x, y, 1.4 + Math.random() * 1.4, 2 + Math.random() * 2.8);
      }
      // Subtle translucent white wool tips over the centered lettering zone on the inner shell.
      if (alpha > 0.5) {
        g.globalCompositeOperation = "source-atop";
        g.fillStyle = "rgba(244, 243, 238, 0.85)";
        drawCenteredLabel(g, w, h);
        g.globalCompositeOperation = "source-over";
      }
    }),
  );

  return { map, bumpMap, pileShells };
}

export function createFuzzTexture(): THREE.CanvasTexture {
  return canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const c = Math.random() > 0.5 ? 200 : 40;
        g.fillStyle = `rgba(${c},${c},${c},.35)`;
        g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
    },
    [6, 6],
    THREE.NoColorSpace,
  );
}

export function createFabricTexture(base: string, light: string, dark: string, seams: boolean): THREE.CanvasTexture {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60000; i++) {
      g.fillStyle = Math.random() > 0.5 ? light : dark;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 1 + Math.random() * 2);
    }
    if (seams) {
      g.fillStyle = "rgba(6,14,60,.55)";
      for (let s = 0; s < 6; s++) g.fillRect((s * w) / 6, 0, 3, h);
      g.fillRect(0, h * 0.8, w, 3);
    }
  });
}

export function createThrowTexture(): THREE.CanvasTexture {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#e9dec8";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(150,120,85,.12)";
    for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
    const stripes: [number, number, string][] = [
      [22, 16, "#b5562b"],
      [44, 6, "#d9a441"],
      [206, 6, "#d9a441"],
      [218, 16, "#b5562b"],
    ];
    stripes.forEach(([y, sh, color]) => {
      g.fillStyle = color;
      g.fillRect(0, y, w, sh);
    });
  });
}

export function createRecordTexture(accent = "#ff3b1f"): THREE.CanvasTexture {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = "#0d0d0f";
    g.beginPath();
    g.arc(128, 128, 128, 0, Math.PI * 2);
    g.fill();
    for (let rr = 44; rr < 126; rr += 3) {
      g.strokeStyle = rr % 9 ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.12)";
      g.lineWidth = 1;
      g.beginPath();
      g.arc(128, 128, rr, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = accent;
    g.beginPath();
    g.arc(128, 128, 40, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f4f3ef";
    g.beginPath();
    g.moveTo(128, 128);
    g.arc(128, 128, 40, -0.5, 0.9);
    g.closePath();
    g.fill();
    g.fillStyle = "#111";
    g.beginPath();
    g.arc(128, 128, 3, 0, Math.PI * 2);
    g.fill();
  });
}

export function createNeonTexture(fontFamily?: string): THREE.CanvasTexture {
  const family = fontFamily ? `${fontFamily}, Neonderthaw, 'Brush Script MT', cursive` : "Neonderthaw, 'Brush Script MT', cursive";
  return canvasTex(1024, 312, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#ffffff";
    g.font = `170px ${family}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("amogh's space", w / 2, h / 2 + 8);
  });
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}

function isPaint(c: string) {
  return Boolean(c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c));
}

export function drawHeroToCanvas(heroScreenEl: HTMLElement): THREE.CanvasTexture | null {
  const box = heroScreenEl.getBoundingClientRect();
  if (!box.width || !box.height) return null;
  const S = Math.min(2, 2048 / box.width);
  return canvasTex(Math.round(box.width * S), Math.round(box.height * S), (g) => {
    g.scale(S, S);
    const screenStyle = getComputedStyle(heroScreenEl);
    g.fillStyle = screenStyle.backgroundColor;
    g.fillRect(0, 0, box.width, box.height);

    // ASCII dither matching the HTML hero background.
    const tile = document.createElement("canvas");
    tile.width = 72;
    tile.height = 72;
    const tg = tile.getContext("2d");
    if (tg) {
      const asciiRows = [
        [".", "+", ":", "#", "-", "*"],
        ["*", "-", "#", ":", "+", "."],
        [":", "#", ".", "*", "-", "+"],
        ["+", ".", "*", "-", "#", ":"],
        ["-", "*", "+", ".", ":", "#"],
        ["#", ":", "-", "+", "*", "."],
      ];
      const glyphAlpha: Record<string, number> = {
        ".": 0.45,
        ":": 0.52,
        "-": 0.58,
        "+": 0.72,
        "*": 0.82,
        "#": 0.9,
      };
      tg.fillStyle = screenStyle.color;
      tg.font = '500 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      tg.textAlign = "center";
      tg.textBaseline = "middle";
      asciiRows.forEach((row, r) => {
        row.forEach((ch, c) => {
          tg.globalAlpha = (glyphAlpha[ch] ?? 0.6) * 0.22;
          tg.fillText(ch, c * 12 + 6, r * 12 + 6);
        });
      });
      const pat = g.createPattern(tile, "repeat");
      if (pat) {
        g.fillStyle = pat;
        g.fillRect(0, 0, box.width, box.height);
      }
    }

    heroScreenEl.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.closest(".ln-say__tip")) return;
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = r.left - box.left;
      const y = r.top - box.top;
      g.globalAlpha = parseFloat(st.opacity) || 1;
      if (isPaint(st.backgroundColor)) {
        roundRect(g, x, y, r.width, r.height, parseFloat(st.borderTopLeftRadius) || 0);
        g.fillStyle = st.backgroundColor;
        g.fill();
      }
      const bt = parseFloat(st.borderTopWidth);
      const br = parseFloat(st.borderRightWidth);
      const bb = parseFloat(st.borderBottomWidth);
      const bl = parseFloat(st.borderLeftWidth);
      if (bt) {
        g.fillStyle = st.borderTopColor;
        g.fillRect(x, y, r.width, bt);
      }
      if (bb) {
        g.fillStyle = st.borderBottomColor;
        g.fillRect(x, y + r.height - bb, r.width, bb);
      }
      if (bl) {
        g.fillStyle = st.borderLeftColor;
        g.fillRect(x, y, bl, r.height);
      }
      if (br) {
        g.fillStyle = st.borderRightColor;
        g.fillRect(x + r.width - br, y, br, r.height);
      }
      if (st.boxShadow && st.boxShadow !== "none" && el.classList.contains("ln-btn--ghost")) {
        roundRect(g, x, y, r.width, r.height, parseFloat(st.borderTopLeftRadius) || 0);
        g.strokeStyle = "rgba(0,0,0,.12)";
        g.lineWidth = 1;
        g.stroke();
      }
      g.globalAlpha = 1;
    });

    const walker = document.createTreeWalker(heroScreenEl, NodeFilter.SHOW_TEXT);
    g.textBaseline = "middle";
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent ?? "";
      const parentEl = node.parentElement;
      if (!text.trim() || !parentEl || parentEl.closest(".ln-say__tip")) continue;
      const st = getComputedStyle(parentEl);
      g.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
      if ("letterSpacing" in g) {
        (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          st.letterSpacing === "normal" ? "0px" : st.letterSpacing;
      }
      g.fillStyle = st.color;
      const re = /\S+/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const range = document.createRange();
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rr = range.getClientRects()[0];
        if (!rr) continue;
        g.fillText(m[0], rr.left - box.left, rr.top - box.top + rr.height / 2);
      }
    }
  });
}
