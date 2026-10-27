import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bannerFromHash, bannerHash, canDouble, defaultBanner, dimensions, FORMATS, PALETTES, parseBanner, safeBox } from "../src/graphics/banner-doc.ts";
import { checkTone, toneForRamps } from "../src/graphics/backdrop.mjs";

const fallback = defaultBanner("Converse com tranquilidade.");

test("a design link preserves Unicode, line breaks and all artwork choices", () => {
  const doc = { ...fallback, format: "custom", width: 900, height: 1600, palette: "caju", texture: "pattern", variant: 2, headline: "Olá, você.\nConverse & compartilhe #Bipe", subtitle: "Açaí / 日本語", align: "right", logo: false, site: false };
  assert.deepEqual(bannerFromHash(bannerHash(doc), fallback), doc);
});

test("malformed and unsupported shared designs are rejected", () => {
  for (const hash of ["", "#design=%", "#design=null", "#design=%7B", `#design=${"x".repeat(12001)}`]) assert.equal(bannerFromHash(hash, fallback), null);
  for (const value of [null, [], { version: 2, format: "custom" }, { version: 1, format: "unknown" }]) assert.equal(parseBanner(value, fallback), null);
});

test("untrusted design data cannot introduce colours, unbounded canvases or text", () => {
  const doc = parseBanner({ ...fallback, format: "custom", width: Infinity, height: -100, palette: "red", texture: "noise", variant: -1001, headline: "x".repeat(20000), subtitle: "x".repeat(20000), align: "unsafe" }, fallback);
  assert.deepEqual(dimensions(doc), { width: 1512, height: 240 });
  assert.equal(doc.palette, "acai"); assert.equal(doc.texture, "mesh");
  assert.equal(doc.variant, 2); assert.equal(doc.align, "left");
  assert.equal(doc.headline.length, 140); assert.equal(doc.subtitle.length, 180);
  assert.deepEqual(dimensions({ ...doc, width: 99999, height: 99999 }), { width: 4096, height: 4096 });
  assert.equal(canDouble({ ...doc, width: 4096, height: 4096 }), false);
});

test("every preset has a safe box inside the canvas and ignores custom dimensions", () => {
  for (const f of FORMATS) {
    const doc = { ...fallback, format: f.id, width: 99999, height: -5 };
    assert.deepEqual(dimensions(doc), { width: f.width, height: f.height });
    const b = safeBox(doc);
    assert.ok(b.x > 0 && b.y > 0 && b.width > 0 && b.height > 0);
    assert.ok(b.x + b.width < f.width && b.y + b.height < f.height);
    if (f.guide === "linkedin") assert.ok(b.x >= f.width * .25);
  }
});

test("all exported brand palettes retain their contrast on both textures", () => {
  const tokens = JSON.parse(readFileSync(new URL("../../bipe-shared/design/tokens.json", import.meta.url), "utf8"));
  const ramps = Object.fromEntries(PALETTES.map((p) => [p, tokens.ramps[p].light]));
  for (const palette of PALETTES) {
    const tone = toneForRamps(ramps, palette, palette === "acai" ? "pitanga" : "acai");
    for (const texture of ["mesh", "pattern"]) assert.ok(checkTone(tone, texture, true).ink >= 4.5);
  }
});
