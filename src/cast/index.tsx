// The sample cast for site simulations: fictional people, groups and institutions with photos.
// Data and photo prompts: bipe-shared/product/cast.json (the iOS store screenshots use it too, bipe#454).
// Style rules: STYLE.md. Photos: scripts/cast.mjs.
import data from "@shared/product/cast.json";

/** What the app would show about this account (bipe/docs/trust-levels.md, design/trust-ui.md). */
/** `contact`: confirmed by QR in person (the seal with a QR corner). */
export type Trust = "none" | "profile" | "pix" | "govbr" | "contact" | "institution" | "company" | "external" | "suspended";

export type CastEntry = {
  id: string;
  kind: "person" | "group" | "institution";
  /** Verified or full name; for an unverified account, the name it chose. */
  name: string | null;
  /** The name friends use in chats. */
  short: string | null;
  handle: string | null;
  cnpj?: string;
  members?: number;
  about: string;
  trust: Trust;
  photo: { style: string; look: string } | { copyOf: string } | null;
};

export const cast: CastEntry[] = data.cast as CastEntry[];
const byId = new Map(cast.map((e) => [e.id, e]));

// Hashed URLs for every photo on disk. A missing photo falls back to initials.
const files = import.meta.glob<string>("./photos/*.jpg", { eager: true, query: "?url", import: "default" });

export function who(id: string): CastEntry {
  const e = byId.get(id);
  if (!e) throw new Error(`no cast entry ${id}`);
  return e;
}

export function photoUrl(e: CastEntry): string | undefined {
  const id = e.photo && "copyOf" in e.photo ? e.photo.copyOf : e.id;
  return files[`./photos/${id}.jpg`];
}

/** The name on screen: what the viewer saved, else the short name. Bipe never shows a phone number. */
export const label = (e: CastEntry, savedAs?: string) => savedAs ?? e.short ?? e.name ?? "?";

/** The Matrix user ID the app would use as the avatar's content ID. */
export function matrixId(e: CastEntry) {
  const local = e.handle ?? e.id;
  return local.includes(":") ? `@${local}` : `@${local}:bipe.net.br`;
}

/** Compound decorative colour 1 to 6, the same hash as the apps: sum of character codes mod 6. */
export const decor = (e: CastEntry) => 1 + ([...matrixId(e)].reduce((sum, ch) => sum + (ch.codePointAt(0) ?? 0), 0) % 6);

/** Mirrors PlaceholderAvatarImage (bipe-ios): photo, else the first letter on the decorative colour. */
export function Avatar({ id, size = 34, savedAs }: { id: string; size?: number; savedAs?: string }) {
  const e = who(id);
  const src = photoUrl(e);
  const style = { width: size, height: size, fontSize: size * 0.5625 };
  // ADR 0120: the shape follows the verified state. Only a CNPJ-verified institution or company is a rounded square.
  const shape = e.trust === "institution" || e.trust === "company" ? " org" : "";
  if (src) return <img className={`avatar${shape}`} src={src} alt="" width={size} height={size} style={style} loading="lazy" decoding="async" />;
  const base = e.name || savedAs ? label(e, savedAs) : matrixId(e).replace(/^\W+/, "");
  return <div className={`avatar${shape} d${decor(e)}`} style={style}>{base.charAt(0).toUpperCase()}</div>;
}
