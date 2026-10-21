// Brazil as a glowing network: the outline filled with a triangulated mesh of small nodes, dense
// along the border, with large bright nodes at the state capitals. For the "dados no Brasil" store
// panel and the link-preview cards (bipe-chat/bipe#463). Plain SVG; resvg rasterises it.
//
// Brazil is proof, not a slogan (ADR 0047): no flag, no green and yellow, no text. São Paulo, where
// the servers are, is the brightest node and has a faint pulse ring.
//
// No dependency: the point sampling and the Delaunay triangulation (Bowyer-Watson) are below. A
// seeded RNG makes every run with the same seed give the same image.
//
// Colours come only from bipe-tokens (via backdrop.mjs): jabuticaba for the dark field, pitanga
// for the light. Caju is not in tokens (dropped for its clash with caution amber), so pitanga alone
// carries the coral-to-peach light.
import { RAMPS } from "./backdrop.mjs";

/** The default palette, from the expressive ramps. Pass `palette` to override any key. */
export function brazilPalette() {
  const j = RAMPS.jabuticaba;
  const p = RAMPS.pitanga;
  return {
    field: j[1400], // background
    fieldLift: j[1300], // soft lift behind the map
    haze: p[800], // corner glow and the warm light over São Paulo
    line: p[700], // mesh lines
    node: p[600], // small nodes
    edge: p[500], // border nodes
    city: p[400], // capital cores
    core: p[100], // São Paulo core
  };
}

// Brazil, simplified to 59 border points (longitude, latitude). Same outline as the first #463 text
// panel (scripts/lib/panels.mjs before 8e78c41).
const BRAZIL = [
  [-51.6, 4.4], [-50.0, 1.8], [-49.9, -0.5], [-48.0, -0.7], [-44.5, -2.5], [-41.5, -2.9], [-38.5, -3.7], [-35.2, -5.2], [-34.8, -7.1],
  [-35.3, -9.7], [-37.0, -11.0], [-38.5, -13.0], [-39.0, -17.5], [-40.3, -20.3], [-42.0, -22.9], [-43.2, -23.0], [-46.3, -24.0],
  [-48.5, -26.2], [-48.6, -28.5], [-50.2, -30.5], [-52.1, -32.2], [-53.4, -33.7], [-53.5, -32.5], [-55.5, -30.9], [-57.6, -30.2],
  [-56.0, -28.0], [-53.8, -27.2], [-54.6, -25.6], [-54.3, -24.0], [-55.4, -23.9], [-55.7, -22.3], [-57.9, -22.1], [-58.0, -19.9],
  [-57.6, -18.0], [-58.4, -16.3], [-60.2, -16.3], [-60.4, -13.5], [-61.9, -13.5], [-65.0, -11.9], [-65.4, -10.0], [-66.6, -9.9],
  [-69.5, -11.0], [-70.6, -11.0], [-72.5, -9.5], [-73.9, -7.4], [-72.9, -5.2], [-70.0, -4.2], [-69.4, -1.3], [-69.8, 0.6],
  [-67.0, 2.0], [-64.0, 2.0], [-63.4, 3.9], [-60.7, 5.2], [-59.8, 4.0], [-58.0, 1.5], [-56.0, 2.0], [-54.0, 2.2], [-52.0, 2.5],
];

// State capitals (longitude, latitude). Tier 0 is São Paulo, tier 1 the large cities in order of
// brightness, tier 2 the other capitals as medium nodes.
const CITIES = [
  [-46.63, -23.55, 0], // São Paulo
  [-43.17, -22.91, 1], // Rio de Janeiro
  [-47.88, -15.79, 1], // Brasília
  [-38.5, -12.97, 1], // Salvador
  [-38.54, -3.72, 1], // Fortaleza
  [-43.94, -19.92, 1], // Belo Horizonte
  [-60.02, -3.12, 1], // Manaus
  [-34.88, -8.05, 1], // Recife
  [-51.23, -30.03, 1], // Porto Alegre
  [-49.27, -25.43, 1], // Curitiba
  [-48.5, -1.46, 1], // Belém
  [-49.25, -16.68, 2], // Goiânia
  [-56.1, -15.6, 2], // Cuiabá
  [-54.62, -20.47, 2], // Campo Grande
  [-48.55, -27.6, 2], // Florianópolis
  [-40.31, -20.32, 2], // Vitória
  [-44.3, -2.53, 2], // São Luís
  [-42.8, -5.09, 2], // Teresina
  [-35.21, -5.79, 2], // Natal
  [-34.86, -7.12, 2], // João Pessoa
  [-35.73, -9.67, 2], // Maceió
  [-37.07, -10.91, 2], // Aracaju
  [-48.33, -10.18, 2], // Palmas
  [-63.9, -8.76, 2], // Porto Velho
  [-67.81, -9.97, 2], // Rio Branco
  [-60.67, 2.82, 2], // Boa Vista
  [-51.07, 0.03, 2], // Macapá
];

// Equirectangular, with longitude scaled by cos(15°) so the shape is not stretched at Brazil's
// middle latitude.
const KX = Math.cos((15 * Math.PI) / 180);
const project = ([lon, lat]) => [(lon + 74) * KX, 5.3 - lat];

/** mulberry32: a small seeded RNG, uniform in [0, 1). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inside([x, y], poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function segDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function borderDist(p, poly) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, segDist(p, poly[i], poly[(i + 1) % poly.length]));
  return d;
}

/** Signed area; positive means the ring runs clockwise in screen space (y down). */
const area = (poly) => poly.reduce((s, [x, y], i) => { const [u, v] = poly[(i + 1) % poly.length]; return s + (x * v - u * y); }, 0) / 2;

/** Bowyer-Watson Delaunay triangulation. Returns triangles as index triples into `pts`. */
function delaunay(pts) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const d = Math.max(maxX - minX, maxY - minY) * 20;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const all = [...pts, [cx - d, cy - d], [cx + d, cy - d], [cx, cy + d]];
  const n = pts.length;
  const circum = (a, b, c) => {
    const [ax, ay] = all[a];
    const [bx, by] = all[b];
    const [qx, qy] = all[c];
    const D = 2 * (ax * (by - qy) + bx * (qy - ay) + qx * (ay - by));
    const a2 = ax * ax + ay * ay;
    const b2 = bx * bx + by * by;
    const c2 = qx * qx + qy * qy;
    const ux = (a2 * (by - qy) + b2 * (qy - ay) + c2 * (ay - by)) / D;
    const uy = (a2 * (qx - bx) + b2 * (ax - qx) + c2 * (bx - ax)) / D;
    return { a, b, c, x: ux, y: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 };
  };
  let tris = [circum(n, n + 1, n + 2)];
  for (let i = 0; i < n; i++) {
    const [px, py] = all[i];
    const bad = [];
    const keep = [];
    for (const t of tris) ((px - t.x) ** 2 + (py - t.y) ** 2 < t.r2 ? bad : keep).push(t);
    // The hole boundary: edges of bad triangles that no other bad triangle shares.
    const count = new Map();
    for (const t of bad) for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
      const k = u < v ? `${u},${v}` : `${v},${u}`;
      count.set(k, (count.get(k) ?? 0) + 1);
    }
    for (const t of bad) for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
      if (count.get(u < v ? `${u},${v}` : `${v},${u}`) === 1) keep.push(circum(u, v, i));
    }
    tris = keep;
  }
  return tris.filter((t) => t.a < n && t.b < n && t.c < n).map((t) => [t.a, t.b, t.c]);
}

/** Where the map goes when no `box` is given: lower two thirds on a tall image, right side on a wide one. */
function defaultBox(width, height) {
  const r = height / width;
  if (r > 1.6) return { x: width * 0.04, y: height * 0.36, w: width * 0.92, h: height * 0.6 };
  if (r < 0.75) return { x: width * 0.5, y: height * 0.05, w: width * 0.48, h: height * 0.9 };
  return { x: width * 0.06, y: height * 0.08, w: width * 0.88, h: height * 0.84 };
}

const f = (v) => +v.toFixed(1);

/**
 * Brazil as a glowing node network, as an SVG string.
 * `box` ({ x, y, w, h } in px) sets the area the map fits into; the map keeps its aspect ratio
 * and is centred in it. `corner` places the soft glow: "tl", "tr", "bl" or "br".
 */
export function brazilNetworkSvg({ width, height, seed = 1, palette = {}, box = defaultBox(width, height), corner = "tr" }) {
  const P = { ...brazilPalette(), ...palette };
  const rand = rng(seed);

  // Fit the projected outline into the box.
  const raw = BRAZIL.map(project);
  const rw = Math.max(...raw.map((p) => p[0])) - Math.min(...raw.map((p) => p[0]));
  const rh = Math.max(...raw.map((p) => p[1])) - Math.min(...raw.map((p) => p[1]));
  const rx0 = Math.min(...raw.map((p) => p[0]));
  const ry0 = Math.min(...raw.map((p) => p[1]));
  const k = Math.min(box.w / rw, box.h / rh);
  const ox = box.x + (box.w - rw * k) / 2;
  const oy = box.y + (box.h - rh * k) / 2;
  const toPx = (ll) => { const [x, y] = project(ll); return [ox + (x - rx0) * k, oy + (y - ry0) * k]; };
  const poly = BRAZIL.map(toPx);
  const S = Math.max(rw, rh) * k; // map size in px; every length below scales with it
  const cw = area(poly) > 0; // ring direction, for the inward normal

  const pts = []; // [x, y]
  const kind = []; // "border" | "band" | "inner" | city tier (0, 1, 2)
  const far = (p, r) => pts.every((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 >= r * r);

  // 1. Cities, nudged inside the outline when the simplified coast cuts them off.
  const cx0 = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy0 = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const cities = [];
  for (const [lon, lat, tier] of CITIES) {
    let p = toPx([lon, lat]);
    for (let i = 0; i < 40 && (!inside(p, poly) || borderDist(p, poly) < S * 0.012); i++) p = [p[0] + (cx0 - p[0]) * 0.01, p[1] + (cy0 - p[1]) * 0.01];
    if (!far(p, S * 0.012)) continue; // João Pessoa sits on Recife at this scale
    cities.push(pts.length);
    pts.push(p);
    kind.push(tier);
  }

  // 2. The border: points every ~1% of the map size along the outline, set a little inward.
  const step = S * 0.0105;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = ((cw ? -1 : 1) * (b[1] - a[1])) / len;
    const ny = ((cw ? 1 : -1) * (b[0] - a[0])) / len;
    for (let t = 0; t < len; t += step * (0.75 + rand() * 0.5)) {
      const j = rand() * S * 0.003;
      const p = [a[0] + ((b[0] - a[0]) * t) / len + nx * j, a[1] + ((b[1] - a[1]) * t) / len + ny * j];
      if (far(p, step * 0.55)) { pts.push(p); kind.push("border"); }
    }
  }

  // 3. A dense band just inside the border, then the interior: dart throwing with a local radius
  // that grows away from the border and shrinks near the large cities.
  const bigCities = cities.filter((i) => kind[i] !== 2).map((i) => pts[i]);
  const radius = (p, db) => {
    const dc = Math.min(...bigCities.map((c) => Math.hypot(c[0] - p[0], c[1] - p[1])));
    const byBorder = S * (0.014 + 0.03 * Math.min(1, db / (S * 0.09)));
    const byCity = S * (0.016 + 0.03 * Math.min(1, dc / (S * 0.12)));
    return Math.min(byBorder, byCity);
  };
  const [bx0, by0, bx1, by1] = [Math.min(...poly.map((p) => p[0])), Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[1]))];
  for (let n = 0, miss = 0; n < 60000 && miss < 4000; n++) {
    const p = [bx0 + rand() * (bx1 - bx0), by0 + rand() * (by1 - by0)];
    if (!inside(p, poly)) continue;
    const db = borderDist(p, poly);
    if (db < S * 0.006) continue;
    if (far(p, radius(p, db))) { pts.push(p); kind.push(db < S * 0.035 ? "band" : "inner"); miss = 0; } else miss++;
  }

  // 4. Triangulate and keep the edges of triangles inside Brazil that are not too long.
  const maxLen = S * 0.085;
  const edges = new Map();
  for (const [a, b, c] of delaunay(pts)) {
    const g = [(pts[a][0] + pts[b][0] + pts[c][0]) / 3, (pts[a][1] + pts[b][1] + pts[c][1]) / 3];
    if (!inside(g, poly)) continue;
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const L = Math.hypot(pts[u][0] - pts[v][0], pts[u][1] - pts[v][1]);
      const m = [(pts[u][0] + pts[v][0]) / 2, (pts[u][1] + pts[v][1]) / 2];
      if (L > maxLen || !inside(m, poly)) continue;
      edges.set(u < v ? `${u},${v}` : `${v},${u}`, [u, v, L]);
    }
  }

  // Line brightness: short edges and edges on the border or at a city are brighter.
  const isBorder = (i) => kind[i] === "border";
  const isCity = (i) => typeof kind[i] === "number";
  const lineOpacity = ([u, v, L]) => {
    let o = 0.16 + 0.22 * (1 - L / maxLen);
    if (isBorder(u) && isBorder(v)) o += 0.35;
    else if (isBorder(u) || isBorder(v)) o += 0.08;
    if (isCity(u) || isCity(v)) o += 0.12;
    return Math.min(0.85, o);
  };
  const lw = S * 0.0011;
  const lines = [...edges.values()].map((e) => {
    const [u, v] = e;
    return `<line x1="${f(pts[u][0])}" y1="${f(pts[u][1])}" x2="${f(pts[v][0])}" y2="${f(pts[v][1])}" stroke-opacity="${lineOpacity(e).toFixed(2)}"/>`;
  }).join("");

  // Small nodes; cities are drawn on their own layer.
  const small = pts.map((p, i) => {
    if (isCity(i)) return "";
    const border = isBorder(i);
    const r = S * (border ? 0.0026 : kind[i] === "band" ? 0.0024 : 0.0021) * (0.8 + rand() * 0.5);
    const o = border ? 0.95 : 0.55 + rand() * 0.35;
    return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="${border ? P.edge : P.node}" fill-opacity="${o.toFixed(2)}"/>`;
  }).join("");

  // Cities: a soft halo, then a bright core. Tier 0 (São Paulo) is the largest and whitest.
  const CITY = [
    { core: 0.0095, halo: 0.09, haloO: 0.85, fill: P.core },
    { core: 0.006, halo: 0.05, haloO: 0.6, fill: P.city },
    { core: 0.0038, halo: 0.026, haloO: 0.4, fill: P.edge },
  ];
  const halos = cities.map((i) => { const c = CITY[kind[i]]; return `<circle cx="${f(pts[i][0])}" cy="${f(pts[i][1])}" r="${f(S * c.halo)}" fill="url(#bn-halo)" opacity="${c.haloO}"/>`; }).join("");
  const cores = cities.map((i) => { const c = CITY[kind[i]]; return `<circle cx="${f(pts[i][0])}" cy="${f(pts[i][1])}" r="${f(S * c.core)}" fill="${c.fill}"/>`; }).join("");
  const sp = pts[cities.find((i) => kind[i] === 0)];
  const rings = [0.035, 0.06, 0.09].map((r, n) => `<circle cx="${f(sp[0])}" cy="${f(sp[1])}" r="${f(S * r)}" fill="none" stroke="${P.edge}" stroke-width="${f(S * 0.0016)}" stroke-opacity="${(0.5 / (n + 1)).toFixed(2)}"/>`).join("");

  const [gx, gy] = { tl: [0, 0], tr: [width, 0], bl: [0, height], br: [width, height] }[corner];
  const G = Math.min(width, height) * 1.15;
  const mapC = [ox + (rw * k) / 2, oy + (rh * k) / 2];
  const outline = `M${poly.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}Z`;
  const full = `filterUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<radialGradient id="bn-corner" gradientUnits="userSpaceOnUse" cx="${gx}" cy="${gy}" r="${f(G)}"><stop offset="0" stop-color="${P.haze}" stop-opacity="0.4"/><stop offset="0.4" stop-color="${P.haze}" stop-opacity="0.12"/><stop offset="1" stop-color="${P.haze}" stop-opacity="0"/></radialGradient>
<radialGradient id="bn-lift" gradientUnits="userSpaceOnUse" cx="${f(mapC[0])}" cy="${f(mapC[1])}" r="${f(S * 0.7)}"><stop offset="0" stop-color="${P.fieldLift}" stop-opacity="0.9"/><stop offset="1" stop-color="${P.fieldLift}" stop-opacity="0"/></radialGradient>
<radialGradient id="bn-sp" gradientUnits="userSpaceOnUse" cx="${f(sp[0])}" cy="${f(sp[1])}" r="${f(S * 0.32)}"><stop offset="0" stop-color="${P.haze}" stop-opacity="0.3"/><stop offset="1" stop-color="${P.haze}" stop-opacity="0"/></radialGradient>
<radialGradient id="bn-halo"><stop offset="0" stop-color="${P.city}" stop-opacity="1"/><stop offset="0.12" stop-color="${P.edge}" stop-opacity="0.7"/><stop offset="0.35" stop-color="${P.line}" stop-opacity="0.25"/><stop offset="1" stop-color="${P.line}" stop-opacity="0"/></radialGradient>
<filter id="bn-glow" ${full}><feGaussianBlur stdDeviation="${f(S * 0.004)}"/></filter>
<filter id="bn-grain" ${full}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed % 1000}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"/></filter>
<filter id="bn-wide" ${full}><feGaussianBlur stdDeviation="${f(S * 0.012)}"/></filter>
</defs>
<rect width="${width}" height="${height}" fill="${P.field}"/>
<rect width="${width}" height="${height}" fill="url(#bn-corner)"/>
<rect width="${width}" height="${height}" fill="url(#bn-lift)"/>
<path d="${outline}" fill="url(#bn-sp)"/>
<rect width="${width}" height="${height}" filter="url(#bn-grain)" opacity="0.05"/>
<g filter="url(#bn-wide)" opacity="0.5"><g stroke="${P.line}" stroke-width="${f(lw * 3)}">${lines}</g></g>
<g filter="url(#bn-glow)" opacity="0.9"><g stroke="${P.line}" stroke-width="${f(lw * 1.6)}">${lines}</g>${small}</g>
${halos}
<g stroke="${P.line}" stroke-width="${f(lw)}" stroke-linecap="round">${lines}</g>
${small}
${rings}
${cores}
</svg>`;
}
