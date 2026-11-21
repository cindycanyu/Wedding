// @ts-nocheck
// Renders the 日志 list into one tall PNG, drawn straight onto a <canvas>
// (no html-to-image dependency). Photos are fetched as blobs and turned into
// ImageBitmaps rather than drawn from <img> tags, so a cross-origin storage
// URL can't taint the canvas and make toBlob() throw.

const W = 750;
const PAD = 48;
const INNER = W - PAD * 2;
const THUMB = 200;
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
 * entries: [{ stamp, author, content, photoUrl }] in display order.
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
    body: `28px ${SANS}`,
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
  m.font = F.body;
  const bodyLines = entries.map((e) => wrapText(m, e.content, INNER));
  const HEADER = PAD + 48 + 14 + 30 + 28;
  const entryHeights = entries.map((_, i) => {
    let h = 30 + 10 + bodyLines[i].length * 42;
    if (bitmaps[i]) h += 16 + THUMB;
    return h;
  });
  const GAP = 44;
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
    ctx.font = F.meta;
    ctx.fillStyle = C.rose;
    ctx.fillText(e.stamp, PAD, y + 22);
    const stampW = ctx.measureText(e.stamp).width;
    ctx.fillStyle = C.plumSoft;
    ctx.fillText(`  · ${e.author}`, PAD + stampW, y + 22);
    y += 30 + 10;

    ctx.font = F.body;
    ctx.fillStyle = C.plum;
    for (const line of bodyLines[i]) {
      ctx.fillText(line, PAD, y + 30);
      y += 42;
    }
    if (bitmaps[i]) {
      y += 16;
      drawCover(ctx, bitmaps[i], PAD, y, THUMB, THUMB, 16);
      y += THUMB;
    }
    y = top + entryHeights[i];
    if (i < entries.length - 1) {
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(PAD, y + GAP / 2);
      ctx.lineTo(W - PAD, y + GAP / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      y += GAP;
    }
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
