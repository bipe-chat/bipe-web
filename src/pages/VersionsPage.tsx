// Version history: every app version, its builds and what changed in them. The data is bipe-app changelog/
// (scripts/changelog.mjs writes it at build time); the app links here from Configurações › Ajuda › Histórico de versões.
// A version is released when bipe-app tags it (ADR 0227); the builds after the last release show under the next
// version as in testing.
import changelogJson from "@changelog";
import { chrome } from "../copy";
import type { Lang } from "../shared";

type Kind = "new" | "improved" | "fixed" | "removed";
type Build = {
  build: number;
  version: string | null;
  released?: boolean;
  releaseDate?: string | null;
  date: string;
  updates: { id: string; kind: Kind; platforms: ("ios" | "android")[]; headline: string; detail: string }[];
};
const builds = changelogJson as Build[];

/** Versions newest first, each with one line per change and its build, grouped by day: most days carry several builds. */
type Line = Build["updates"][number] & { build: number };
type Day = { date: string; lines: Line[] };
const versions: { version: string | null; released: boolean; releaseDate: string | null; days: Day[] }[] = [];
for (const b of builds) {
  let v = versions.at(-1);
  if (!v || v.version !== b.version) {
    v = { version: b.version, released: b.released ?? false, releaseDate: b.releaseDate ?? null, days: [] };
    versions.push(v);
  }
  if (v.days.at(-1)?.date !== b.date) v.days.push({ date: b.date, lines: [] });
  v.days.at(-1)!.lines.push(...b.updates.map((u) => ({ ...u, build: b.build })));
}

const formatDate = (lang: Lang, date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const versionTitle = (lang: Lang, v: (typeof versions)[number]) => (v.version ? `${chrome[lang].versions.version} ${v.version}` : "Build");

const versionStatus = (lang: Lang, v: (typeof versions)[number]) =>
  v.released && v.releaseDate ? chrome[lang].versions.released(formatDate(lang, v.releaseDate)) : chrome[lang].versions.testing;

const tags = (lang: Lang, l: Line) =>
  `Build ${l.build} · ${chrome[lang].versions.kinds[l.kind]} · ${l.platforms.map((p) => chrome[lang].surfaces[p]).join(", ")}`;

export function VersionsPage({ lang }: { lang: Lang }) {
  const c = chrome[lang].versions;
  return (
    <section className="wrap narrow section">
      <h1>{c.title}</h1>
      <p className="lede">{c.lede}</p>
      {c.note && <p className="muted">{c.note}</p>}
      {versions.map((v) => (
        <section className="versions-version" key={v.version ?? "build"} id={v.version ? `v${v.version}` : undefined}>
          <h2>{versionTitle(lang, v)}</h2>
          <p className="small muted">{versionStatus(lang, v)}</p>
          {v.days.map((d) => (
            <section className="versions-day" key={d.date}>
              <h3><time dateTime={d.date}>{formatDate(lang, d.date)}</time></h3>
              <ul>
                {d.lines.map((l) => (
                  <li key={l.id} id={`build-${l.build}`}>
                    <strong>{l.headline}</strong>{l.detail && ` ${l.detail}`}
                    <br /><span className="small muted">{tags(lang, l)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
      ))}
    </section>
  );
}

/** The page's Markdown twin, from the same data. */
export function versionsMarkdown(lang: Lang): string {
  const c = chrome[lang].versions;
  return [
    `# ${c.title}`,
    c.lede,
    ...(c.note ? [c.note] : []),
    ...versions.map((v) =>
      [
        `## ${versionTitle(lang, v)}`,
        versionStatus(lang, v),
        ...v.days.map((d) =>
          [
            `### ${formatDate(lang, d.date)}`,
            d.lines.map((l) => `- **${l.headline}**${l.detail ? ` ${l.detail}` : ""} (${tags(lang, l)})`).join("\n"),
          ].join("\n\n"),
        ),
      ].join("\n\n"),
    ),
  ].join("\n\n") + "\n";
}
