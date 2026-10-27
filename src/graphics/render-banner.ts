import { MARK, MARKS } from "../components/brand";
import { brandRamps } from "../shared";
import { backdropSvg, toneForRamps } from "./backdrop.mjs";
import { dimensions, safeBox, type BannerDoc } from "./banner-doc";

const DISPLAY = '"Nunito Variable"';
const BODY = '"Inter Variable"';
let fontsPromise: Promise<unknown> | undefined;
function loadFonts() {
  return fontsPromise ??= Promise.all([
    document.fonts.load(`900 32px ${DISPLAY}`, "bipe"),
    document.fonts.load(`850 32px ${DISPLAY}`, "Converse com tranquilidade. áãçé"),
    document.fonts.load(`500 20px ${BODY}`, "bipe.chat áãçé"),
  ]).then((faces) => {
    if (faces.some((f) => f.length === 0)) throw new Error("Banner fonts unavailable");
  }).catch((error) => { fontsPromise = undefined; throw error; });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && ctx.measureText(`${line} ${word}`).width > width) { lines.push(line); line = ""; }
      // A long URL or unbroken word must fit too.
      for (const char of word) {
        if (ctx.measureText(line + char).width > width) { lines.push(line); line = ""; }
        line += char;
      }
      line += " ";
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
function fit(ctx: CanvasRenderingContext2D, text: string, width: number, height: number, max: number, family: string, weight: number) {
  let fontSize = max;
  let rows: string[] = [];
  for (; fontSize > 2; fontSize -= 1) {
    ctx.font = `${weight} ${fontSize}px ${family}`;
    rows = wrap(ctx, text, width);
    if (rows.length * fontSize * 1.16 <= height) break;
  }
  return { rows, fontSize, height: rows.length * fontSize * 1.16 };
}
function text(ctx: CanvasRenderingContext2D, rows: string[], x: number, y: number, fontSize: number) {
  // Middle baseline leaves room for accents and descenders within each line box.
  ctx.textBaseline = "middle";
  rows.forEach((row, i) => ctx.fillText(row, x, y + (i + .5) * fontSize * 1.16));
}
function mark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 64, size / 64);
  ctx.fill(new Path2D(MARKS[MARK])); ctx.restore();
}
export function backgroundSvg(doc: BannerDoc) {
  const { width, height } = dimensions(doc);
  const tone = toneForRamps(brandRamps, doc.palette, doc.palette === "acai" ? "pitanga" : "acai");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${backdropSvg({ width, height, tone, texture: doc.texture, variant: doc.variant, mark: true, markPath: MARKS[MARK] })}</svg>`;
}

/** Preview and downloads use this exact canvas renderer and font metrics. */
export async function renderBanner(doc: BannerDoc, scale = 1): Promise<HTMLCanvasElement> {
  await loadFonts();
  const { width: w, height: h } = dimensions(doc);
  const canvas = document.createElement("canvas");
  canvas.width = w * scale; canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.scale(scale, scale);
  const url = URL.createObjectURL(new Blob([backgroundSvg(doc)], { type: "image/svg+xml" }));
  try {
    const image = new Image(); image.src = url;
    await image.decode(); ctx.drawImage(image, 0, 0, w, h);
  } finally { URL.revokeObjectURL(url); }
  const tone = toneForRamps(brandRamps, doc.palette);
  ctx.fillStyle = tone.ink;
  const box = safeBox(doc);
  const short = Math.min(w, h);
  const wide = w / h > 3;
  const x = doc.align === "center" ? box.x + box.width / 2 : doc.align === "right" ? box.x + box.width : box.x;
  ctx.textAlign = doc.align;

  if (doc.template === "symbol") {
    const s = Math.min(box.height * .6, box.width * .5);
    mark(ctx, box.x + (box.width - s) / 2, box.y + (box.height - s) / 2, s);
  } else if (doc.template === "message") {
    const titleHeight = box.height * (wide ? .7 : .5);
    const headline = fit(ctx, doc.headline, box.width, titleHeight, short * (wide ? .22 : .105), DISPLAY, 850);
    const sub = fit(ctx, doc.subtitle, box.width, box.height * .22, short * (wide ? .08 : .033), BODY, 500);
    const gap = doc.headline && doc.subtitle ? short * .035 : 0;
    const total = (doc.headline ? headline.height : 0) + (doc.subtitle ? sub.height : 0) + gap;
    let y = box.y + (box.height - total) / 2;
    if (doc.headline) {
      ctx.font = `850 ${headline.fontSize}px ${DISPLAY}`;
      text(ctx, headline.rows, x, y, headline.fontSize); y += headline.height + gap;
    }
    if (doc.subtitle) {
      ctx.font = `500 ${sub.fontSize}px ${BODY}`;
      text(ctx, sub.rows, x, y, sub.fontSize);
    }
  }
  // In a shallow cover, the wordmark occupies a separate left column above
  // the photo overlap. All message copy stays in the central safe box.
  if (doc.logo) {
    const fontSize = short * (wide ? .15 : .055);
    const logoX = wide ? w * .07 : box.x;
    const logoY = wide ? h * .22 : box.y;
    const s = fontSize * 1.15;
    mark(ctx, logoX, logoY, s);
    ctx.font = `900 ${fontSize}px ${DISPLAY}`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText("bipe", logoX + s * 1.12, logoY + s * .5);
  }
  if (doc.site) {
    ctx.font = `500 ${short * (wide ? .065 : .027)}px ${BODY}`;
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText("bipe.chat", box.x + box.width, wide ? h * .9 : box.y + box.height);
  }
  return canvas;
}

/** Encoding pattern brought over from www's brand/_lib/png.ts. */
export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg") {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob); else reject(new Error("Image encoding failed"));
  }, type, .92));
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
