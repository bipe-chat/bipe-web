// The sample cast for site simulations: fictional people, groups and institutions with photos.
// Data and photo prompts: cast.json. Style rules: STYLE.md. Photos: scripts/cast.mjs.
import data from "./cast.json";

/** What the app would show about this account (proseio/docs/trust-levels.md, design/trust-ui.md). */
export type Trust = "none" | "profile" | "pix" | "govbr" | "institution" | "external" | "suspended";

export type CastEntry = {
  id: string;
  kind: "person" | "group" | "institution";
  /** Verified or full name. Null for an unknown number. */
  name: string | null;
  /** The name friends use in chats. */
  short: string | null;
  handle: string | null;
  phone?: string;
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

/** The name on screen: what the viewer saved, else the short name, else the phone number. */
export const label = (e: CastEntry, savedAs?: string) => savedAs ?? e.short ?? e.name ?? e.phone ?? "?";

function initials(text: string) {
  const words = text.replace(/^(Seu|Dona|Tio|Tia)\s+/, "").split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  return words.length ? words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "?";
}

export function Avatar({ id, size = 34, savedAs }: { id: string; size?: number; savedAs?: string }) {
  const e = who(id);
  const src = photoUrl(e);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (src) return <img className="avatar" src={src} alt="" width={size} height={size} style={style} loading="lazy" decoding="async" />;
  return <div className="avatar" style={style}>{e.name || savedAs ? initials(label(e, savedAs)) : "?"}</div>;
}
