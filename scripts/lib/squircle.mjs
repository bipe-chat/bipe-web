// Rounded rectangles with continuous corners, as Apple draws device screens and SwiftUI draws
// RoundedRectangle(style: .continuous): the curve eases into the straight edge instead of meeting it
// with a circular arc. Same construction as Figma's corner smoothing (the figma-squircle method):
// each corner is a cubic Bézier, a circular arc and a second cubic Bézier.
//
// `radius` is the corner radius in px, `smoothing` 0 (circular arc) to 1; Apple's curve is about 0.6.
// The corner may take up to half the shorter side; smoothing gives way first when space runs out.

const rad = (deg) => (deg * Math.PI) / 180;

function corner(radius, smoothing, budget) {
  const r = Math.min(radius, budget);
  const s = Math.max(0, Math.min(smoothing, budget / r - 1));
  const p = Math.min((1 + s) * r, budget);
  const arcMeasure = 90 * (1 - s);
  const arc = Math.sin(rad(arcMeasure / 2)) * r * Math.SQRT2;
  const alpha = (90 - arcMeasure) / 2;
  const p3p4 = r * Math.tan(rad(alpha / 2));
  const beta = 45 * s;
  const c = p3p4 * Math.cos(rad(beta));
  const d = c * Math.tan(rad(beta));
  const b = (p - arc - c - d) / 3;
  const a = 2 * b;
  return { a, b, c, d, p, arc, r };
}

const n = (v) => +v.toFixed(3);

/** SVG path data for a width x height rectangle at (x, y) with continuous corners. */
export function squirclePath(width, height, radius, smoothing = 0.6, x = 0, y = 0) {
  if (radius <= 0) return `M${x} ${y}h${width}v${height}h${-width}Z`;
  const { a, b, c, d, p, arc, r } = corner(radius, smoothing, Math.min(width, height) / 2);
  const ab = a + b;
  const abc = a + b + c;
  const bc = b + c;
  return [
    `M${n(x + width - p)} ${n(y)}`,
    `c${n(a)} 0 ${n(ab)} 0 ${n(abc)} ${n(d)}`,
    `a${n(r)} ${n(r)} 0 0 1 ${n(arc)} ${n(arc)}`,
    `c${n(d)} ${n(c)} ${n(d)} ${n(bc)} ${n(d)} ${n(abc)}`,
    `L${n(x + width)} ${n(y + height - p)}`,
    `c0 ${n(a)} 0 ${n(ab)} ${n(-d)} ${n(abc)}`,
    `a${n(r)} ${n(r)} 0 0 1 ${n(-arc)} ${n(arc)}`,
    `c${n(-c)} ${n(d)} ${n(-bc)} ${n(d)} ${n(-abc)} ${n(d)}`,
    `L${n(x + p)} ${n(y + height)}`,
    `c${n(-a)} 0 ${n(-ab)} 0 ${n(-abc)} ${n(-d)}`,
    `a${n(r)} ${n(r)} 0 0 1 ${n(-arc)} ${n(-arc)}`,
    `c${n(-d)} ${n(-c)} ${n(-d)} ${n(-bc)} ${n(-d)} ${n(-abc)}`,
    `L${n(x)} ${n(y + p)}`,
    `c0 ${n(-a)} 0 ${n(-ab)} ${n(d)} ${n(-abc)}`,
    `a${n(r)} ${n(r)} 0 0 1 ${n(arc)} ${n(-arc)}`,
    `c${n(c)} ${n(-d)} ${n(bc)} ${n(-d)} ${n(abc)} ${n(-d)}`,
    "Z",
  ].join("");
}
