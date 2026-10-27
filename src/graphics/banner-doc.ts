// Adapted from Envisioning www's brand/banner tool: bounded documents, named
// formats and portable links. Bipe's layout, palette and artwork are its own.
import type { Lang } from "../shared";

export const FORMATS = [
  { id: "linkedin-company", width: 1512, height: 256, label: { pt: "LinkedIn · Página", en: "LinkedIn · Page" }, guide: "linkedin", source: "https://www.linkedin.com/help/linkedin/answer/a570368" },
  { id: "linkedin-profile", width: 1584, height: 396, label: { pt: "LinkedIn · Perfil", en: "LinkedIn · Profile" }, guide: "linkedin", source: "https://www.linkedin.com/help/linkedin/answer/a568217" },
  { id: "whatsapp-status", width: 1080, height: 1920, label: { pt: "WhatsApp · Status", en: "WhatsApp · Status" }, guide: "story" },
  { id: "square", width: 1080, height: 1080, label: { pt: "WhatsApp / Instagram · Quadrado", en: "WhatsApp / Instagram · Square" }, guide: "standard" },
  { id: "portrait", width: 1080, height: 1350, label: { pt: "Instagram · Retrato", en: "Instagram · Portrait" }, guide: "standard" },
  { id: "landscape", width: 1200, height: 630, label: { pt: "Post horizontal", en: "Landscape post" }, guide: "standard" },
  { id: "x-header", width: 1500, height: 500, label: { pt: "X · Capa", en: "X · Header" }, guide: "linkedin" },
  { id: "video", width: 1920, height: 1080, label: { pt: "Zoom / Meet · Fundo", en: "Zoom / Meet · Background" }, guide: "standard" },
] as const;
export const PALETTES = ["acai", "pitanga", "caju", "jabuticaba", "jenipapo"] as const;
export type Palette = (typeof PALETTES)[number];
export type BannerDoc = {
  version: 1;
  format: (typeof FORMATS)[number]["id"] | "custom";
  width: number;
  height: number;
  palette: Palette;
  texture: "mesh" | "pattern";
  variant: number;
  template: "message" | "symbol" | "background";
  headline: string;
  subtitle: string;
  align: "left" | "center" | "right";
  logo: boolean;
  site: boolean;
};
export const MAX_HEADLINE = 140;
export const MAX_SUBTITLE = 180;
export const DRAFT_KEY = "bipe.banner.v1";
export function defaultBanner(headline: string): BannerDoc {
  return { version: 1, format: "linkedin-company", width: 1512, height: 256,
    palette: "acai", texture: "mesh", variant: 0, template: "message", headline,
    subtitle: "", align: "left", logo: true, site: true };
}
const size = (v: unknown, fallback: number) => typeof v === "number" && Number.isFinite(v) ? Math.round(Math.max(240, Math.min(4096, v))) : fallback;
export function parseBanner(value: unknown, fallback: BannerDoc): BannerDoc | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Record<string, unknown>;
  if (d.version !== 1 || !(d.format === "custom" || FORMATS.some((f) => f.id === d.format))) return null;
  return {
    version: 1, format: d.format as BannerDoc["format"],
    width: size(d.width, fallback.width), height: size(d.height, fallback.height),
    palette: PALETTES.includes(d.palette as Palette) ? d.palette as Palette : fallback.palette,
    texture: d.texture === "pattern" ? "pattern" : "mesh",
    variant: typeof d.variant === "number" && Number.isFinite(d.variant) ? Math.abs(Math.trunc(d.variant)) % 3 : 0,
    template: d.template === "symbol" || d.template === "background" ? d.template : "message",
    headline: typeof d.headline === "string" ? d.headline.slice(0, MAX_HEADLINE) : fallback.headline,
    subtitle: typeof d.subtitle === "string" ? d.subtitle.slice(0, MAX_SUBTITLE) : "",
    align: d.align === "center" || d.align === "right" ? d.align : "left",
    logo: d.logo !== false, site: d.site !== false,
  };
}
export function dimensions(doc: BannerDoc) {
  const f = FORMATS.find((f) => f.id === doc.format);
  return f ? { width: f.width, height: f.height } : { width: size(doc.width, 1512), height: size(doc.height, 256) };
}
export function formatLabel(doc: BannerDoc, lang: Lang, custom: string) {
  return FORMATS.find((f) => f.id === doc.format)?.label[lang] ?? custom;
}
/** Insets are editorial guides, not a promise about a platform's changing crop. */
export function safeBox(doc: BannerDoc) {
  const { width: w, height: h } = dimensions(doc);
  const guide = FORMATS.find((f) => f.id === doc.format)?.guide;
  if (guide === "linkedin" || w / h > 3) return { x: w * .25, y: h * .16, width: w * .63, height: h * .65 };
  if (guide === "story") return { x: w * .09, y: h * .14, width: w * .82, height: h * .72 };
  return { x: w * .09, y: h * .1, width: w * .82, height: h * .8 };
}
export function bannerHash(doc: BannerDoc) {
  return `#design=${encodeURIComponent(JSON.stringify(doc))}`;
}
export function bannerFromHash(hash: string, fallback: BannerDoc) {
  if (!hash.startsWith("#design=") || hash.length > 12000) return null;
  try { return parseBanner(JSON.parse(decodeURIComponent(hash.slice(8))), fallback); }
  catch { return null; }
}
export function canDouble(doc: BannerDoc) {
  const { width, height } = dimensions(doc);
  return width * height * 4 <= 16_777_216;
}
