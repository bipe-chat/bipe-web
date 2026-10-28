// Docs pages (/docs/, /en/docs/). The text lives in src/docs/<lang>/*.md and is shown as written: the
// .md file is also the page's Markdown twin, for agents. pt is the reference text. Facts follow the
// ADRs in ../bipe/docs/adr (domains: ADR 0062) and bipe-infra/compose/Caddyfile.
// Facts that bipe-shared holds are not written in the .md: a {{name}} line is filled at build (FACTS).
import { chrome } from "../copy";
import { paths } from "../paths";
import { publicRepos, publicRoutes, type Lang } from "../shared";
import { Markdown, mdTitle } from "../components/markdown";
import { MoreLink } from "../components/ui";
import ptIndex from "../docs/pt/index.md?raw";
import ptDomains from "../docs/pt/dominios.md?raw";
import ptArchitecture from "../docs/pt/arquitetura.md?raw";
import ptLinks from "../docs/pt/links.md?raw";
import enIndex from "../docs/en/index.md?raw";
import enDomains from "../docs/en/domains.md?raw";
import enArchitecture from "../docs/en/architecture.md?raw";
import enLinks from "../docs/en/links.md?raw";

/** Generated blocks, by placeholder. A placeholder with no entry stops the build. */
const FACTS: Record<string, (lang: Lang) => string> = {
  /** Every route with security: [] in bipe-shared api/openapi.yaml. */
  "public-api": (lang) => [
    lang === "pt" ? "| Chamada | Resposta |" : "| Call | Answer |",
    "|---|---|",
    ...publicRoutes.map((r) => `| \`${r.method} ${r.path}\` | ${r[lang]} |`),
  ].join("\n"),
  /** The public repos in bipe-shared product/distribution.json. */
  repos: (lang) => publicRepos.map((r) => `- [${r.url.split("/").pop()}](${r.url}): ${r[lang]}`).join("\n"),
};

const fill = (md: string, lang: Lang): string => {
  const out = md.replace(/^\{\{([a-z-]+)\}\}$/gm, (_, name: string) => {
    if (!FACTS[name]) throw new Error(`docs: no generated block {{${name}}}`);
    return FACTS[name](lang);
  });
  if (out.includes("{{")) throw new Error("docs: a {{placeholder}} is not on a line of its own");
  return out;
};

export type Doc = { id: string; slug: Record<Lang, string>; md: Record<Lang, string> };

/** The index first; the others in reading order. */
export const docs: Doc[] = [
  { id: "index", slug: { pt: "", en: "" }, md: { pt: fill(ptIndex, "pt"), en: fill(enIndex, "en") } },
  { id: "domains", slug: { pt: "dominios", en: "domains" }, md: { pt: fill(ptDomains, "pt"), en: fill(enDomains, "en") } },
  { id: "architecture", slug: { pt: "arquitetura", en: "architecture" }, md: { pt: fill(ptArchitecture, "pt"), en: fill(enArchitecture, "en") } },
  { id: "links", slug: { pt: "links", en: "links" }, md: { pt: fill(ptLinks, "pt"), en: fill(enLinks, "en") } },
];

export const docTitle = mdTitle;
/** The paragraph under the title. */
export const docLede = (md: string): string => md.split("\n\n")[1].replace(/`/g, "");

/** A docs page. A subpage ends with the other docs pages. */
export function DocsPage({ lang, doc }: { lang: Lang; doc: Doc }) {
  const c = chrome[lang];
  const others = docs.filter((d) => d.id !== "index" && d.id !== doc.id);
  return (
    <>
      <Markdown md={doc.md[lang]} className="legal docs" />
      {doc.id !== "index" && (
        <section className="wrap narrow section">
          <h2>{c.alsoIn(c.docs)}</h2>
          <ul>{others.map((d) => <li key={d.id}><a href={paths.docs(lang, d.slug[lang])}>{docTitle(d.md[lang])}</a></li>)}</ul>
          <p><MoreLink href={paths.docs(lang)}>{c.docs}</MoreLink></p>
        </section>
      )}
    </>
  );
}
