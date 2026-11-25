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

export function createRugTexture(): THREE.CanvasTexture {
  return canvasTex(1024, 680, (g, w, h) => {
    g.fillStyle = "#1f6b34";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      const v = Math.random();
      g.fillStyle = v > 0.5 ? "rgba(76,160,90,.35)" : "rgba(10,50,22,.35)";
      g.fillRect(Math.random() * w, Math.random() * h, 2, 4);
    }
    g.fillStyle = "#f4f3ef";
    g.font = "800 92px Inter, Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("“WET GRASS”", w / 2, h * 0.62);
  });
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

export function createRecordTexture(): THREE.CanvasTexture {
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
    g.fillStyle = "#ff3b1f";
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
    g.fillStyle = getComputedStyle(heroScreenEl).backgroundColor;
    g.fillRect(0, 0, box.width, box.height);

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
