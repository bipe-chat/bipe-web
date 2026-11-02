// Version history: every app build and what changed in it. The data is bipe-app changelog/ (scripts/changelog.mjs
// writes it at build time); the app links here from Configurações › Ajuda › Histórico de versões.
import changelogJson from "@changelog";
import { chrome } from "../copy";
import type { Lang } from "../shared";

type Kind = "new" | "improved" | "fixed" | "removed";
type Build = {
  build: number;
  version: string | null;
  date: string;
  updates: { id: string; kind: Kind; platforms: ("ios" | "android")[]; headline: string; detail: string }[];
};
const builds = changelogJson as Build[];

/** One line per change with its build, grouped by day, newest first: most days carry several one-change builds. */
type Line = Build["updates"][number] & { build: number; version: string | null };
const days: { date: string; lines: Line[] }[] = [];
for (const b of builds) {
  if (days.at(-1)?.date !== b.date) days.push({ date: b.date, lines: [] });
  days.at(-1)!.lines.push(...b.updates.map((u) => ({ ...u, build: b.build, version: b.version })));
}

const buildLabel = (lang: Lang, l: Line) =>
  l.version ? `${chrome[lang].versions.version} ${l.version} (${l.build})` : `Build ${l.build}`;

const formatDate = (lang: Lang, date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const tags = (lang: Lang, l: Line) =>
  `${buildLabel(lang, l)} · ${chrome[lang].versions.kinds[l.kind]} · ${l.platforms.map((p) => chrome[lang].surfaces[p]).join(", ")}`;

export function VersionsPage({ lang }: { lang: Lang }) {
  const c = chrome[lang].versions;
  return (
    <section className="wrap narrow section">
      <h1>{c.title}</h1>
      <p className="lede">{c.lede}</p>
      {c.note && <p className="muted">{c.note}</p>}
      {days.map((d) => (
        <section className="versions-day" key={d.date}>
          <h2><time dateTime={d.date}>{formatDate(lang, d.date)}</time></h2>
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
  );
}

/** The page's Markdown twin, from the same data. */
export function versionsMarkdown(lang: Lang): string {
  const c = chrome[lang].versions;
  return [
    `# ${c.title}`,
    c.lede,
    ...(c.note ? [c.note] : []),
    ...days.map((d) =>
      [
        `## ${formatDate(lang, d.date)}`,
        d.lines.map((l) => `- **${l.headline}**${l.detail ? ` ${l.detail}` : ""} (${tags(lang, l)})`).join("\n"),
      ].join("\n\n"),
    ),
  ].join("\n\n") + "\n";
}
