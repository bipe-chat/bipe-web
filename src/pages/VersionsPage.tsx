// Version history: what changed in the app by day and then by build, newest first, the same order as the app's native
// screen (bipe-shared product/screens/version-history.json). The data is bipe-app changelog/ (scripts/changelog.mjs
// writes it at build time).
import changelogJson from "@changelog";
import { chrome } from "../copy";
import type { Lang } from "../shared";

type Kind = "new" | "improved" | "fixed" | "removed";
type Build = {
  build: number;
  version: string | null;
  date: string;
  updates: { id: string; kind: Kind; platforms: ("ios" | "android" | "macos")[]; headline: string; detail: string }[];
};
type Update = Build["updates"][number];
const builds = changelogJson as Build[];

/** Days newest first, each with its builds: most days carry several. */
const days: { date: string; builds: Build[] }[] = [];
for (const b of builds) {
  const day = days.find((d) => d.date === b.date);
  if (day) day.builds.push(b);
  else days.push({ date: b.date, builds: [b] });
}

const formatDate = (lang: Lang, date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "Versão 1.0.1 (446)", the same text as the app. */
const buildTitle = (lang: Lang, b: Build) => (b.version ? `${chrome[lang].versions.version} ${b.version} (${b.build})` : `Build ${b.build}`);

const tags = (lang: Lang, u: Update) =>
  `${chrome[lang].versions.kinds[u.kind]} · ${u.platforms.map((p) => chrome[lang].surfaces[p]).join(", ")}`;

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
          {d.builds.map((b) => (
            <section className="versions-build" key={b.build} id={`build-${b.build}`}>
              <h3>{buildTitle(lang, b)}</h3>
              <ul>
                {b.updates.map((u) => (
                  <li key={u.id}>
                    <strong>{u.headline}</strong>{u.detail && ` ${u.detail}`}
                    <br /><span className="small muted">{tags(lang, u)}</span>
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
    ...days.map((d) =>
      [
        `## ${formatDate(lang, d.date)}`,
        ...d.builds.map((b) =>
          [
            `### ${buildTitle(lang, b)}`,
            b.updates.map((u) => `- **${u.headline}**${u.detail ? ` ${u.detail}` : ""} (${tags(lang, u)})`).join("\n"),
          ].join("\n\n"),
        ),
      ].join("\n\n"),
    ),
  ].join("\n\n") + "\n";
}
