// @ts-nocheck
// Renders the 日志 list into one tall PNG, drawn straight onto a <canvas>
// (no html-to-image dependency). Photos are fetched as blobs and turned into
// ImageBitmaps rather than drawn from <img> tags, so a cross-origin storage
// URL can't taint the canvas and make toBlob() throw.

const W = 900;
const PAD = 48;
const THUMB = 160;
const STAMP_GAP = 24;
const LINE_H = 40;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const C = {
  bg: "#FFFCFA",
  band: "#FBF0F3",
  rose: "#B76E79",
  plum: "#4A2B33",
  plumSoft: "#7E5C63",
  line: "#EADCDF",
};
// iOS Safari refuses canvases much larger than ~16.7M pixels.
const MAX_PIXELS = 16_000_000;

function fontVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

function tokenize(para) {
  return para.match(/[A-Za-z0-9'’._@#&%+\-]+|\s+|./gsu) || [];
}

// Chinese wraps per character; Latin words stay whole unless a single word
// is wider than the line by itself.
export function wrapText(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text || "").split("\n")) {
    let line = "";
    const push = () => {
      out.push(line.trimEnd());
      line = "";
    };
    for (const tok of tokenize(para)) {
      if (ctx.measureText(line + tok).width <= maxWidth) {
        line += tok;
        continue;
      }
      if (line.trim()) push();
      else line = "";
      if (/^\s+$/.test(tok)) continue;
      if (ctx.measureText(tok).width <= maxWidth) {
        line = tok;
        continue;
      }
      for (const ch of Array.from(tok)) {
        if (line && ctx.measureText(line + ch).width > maxWidth) push();
        line += ch;
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

async function loadBitmap(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    return await createImageBitmap(await res.blob());
  } catch {
    return null;
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h, r) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
  ctx.restore();
}

/**
 * entries: [{ stamp, content, photoUrl }] in display order.
 * Laid out like a terminal log: timestamp column on the left, content on
 * the same line to its right, and long content wrapping within its own
 * column (hanging indent) rather than back under the timestamp.
 * Returns { blob, missingPhotos } — missingPhotos counts photos that
 * couldn't be fetched and were left out rather than failing the export.
 */
export async function renderLogImage(entries, { withPhotos, title, subtitle, footer }) {
  if (typeof document !== "undefined" && document.fonts?.ready) await document.fonts.ready;
  const SERIF = fontVar("--font-playfair", "Georgia, serif");
  const SANS = fontVar("--font-inter", "system-ui, sans-serif");
  const F = {
    title: `700 40px ${SERIF}`,
    sub: `22px ${SANS}`,
    meta: `20px ${MONO}`,
    body: `26px ${SANS}`,
    foot: `18px ${SANS}`,
  };

  let missingPhotos = 0;
  const bitmaps = await Promise.all(
    entries.map(async (e) => {
      if (!withPhotos || !e.photoUrl) return null;
      const bmp = await loadBitmap(e.photoUrl);
      if (!bmp) missingPhotos++;
      return bmp;
    })
  );

  // Pass 1: measure.
  const m = document.createElement("canvas").getContext("2d");
  m.font = F.meta;
  const stampW = Math.ceil(Math.max(0, ...entries.map((e) => m.measureText(e.stamp).width)));
  const contentX = PAD + stampW + STAMP_GAP;
  const contentW = W - PAD - contentX;
  m.font = F.body;
  const bodyLines = entries.map((e) => wrapText(m, e.content, contentW));
  const HEADER = PAD + 48 + 14 + 30 + 28;
  const entryHeights = entries.map((_, i) => {
    let h = bodyLines[i].length * LINE_H;
    if (bitmaps[i]) h += 12 + THUMB;
    return h;
  });
  const GAP = 18;
  const body = entryHeights.reduce((s, h) => s + h, 0) + GAP * Math.max(entries.length - 1, 0);
  const H = HEADER + body + 36 + 30 + PAD;

  const scale = Math.max(0.5, Math.min(2, Math.sqrt(MAX_PIXELS / (W * H))));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  // Pass 2: draw.
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.band;
  ctx.fillRect(0, 0, W, HEADER - 14);

  let y = PAD + 40;
  ctx.fillStyle = C.plum;
  ctx.font = F.title;
  ctx.fillText(title, PAD, y);
  y += 14 + 26;
  ctx.fillStyle = C.plumSoft;
  ctx.font = F.sub;
  ctx.fillText(subtitle, PAD, y);
  y = HEADER;

  entries.forEach((e, i) => {
    const top = y;
    const baseline = y + 28;
    ctx.font = F.meta;
    ctx.fillStyle = C.rose;
    ctx.fillText(e.stamp, PAD, baseline);

    ctx.font = F.body;
    ctx.fillStyle = C.plum;
    bodyLines[i].forEach((line, li) => ctx.fillText(line, contentX, baseline + li * LINE_H));
    if (bitmaps[i]) {
      drawCover(ctx, bitmaps[i], contentX, top + bodyLines[i].length * LINE_H + 12, THUMB, THUMB, 14);
    }
    y = top + entryHeights[i];
    if (i < entries.length - 1) y += GAP;
  });

  y += 36;
  ctx.font = F.foot;
  ctx.fillStyle = C.plumSoft;
  ctx.textAlign = "center";
  ctx.fillText(footer, W / 2, y + 20);

  bitmaps.forEach((b) => b?.close?.());
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { blob, missingPhotos };
}
