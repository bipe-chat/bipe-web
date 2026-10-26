// Who can read what (ADR 0109). The page, its Markdown twin and the summary on the e2ee pages all come
// from bipe-shared/product/privacy.json. Change the facts there, never here.
import { Markdown } from "../components/markdown";
import { MoreLink } from "../components/ui";
import { paths } from "../paths";
import { privacyRegister as r, type Lang } from "../shared";

/** What one party can see, as lines grouped by level: "Vê", then "Em parte", then "Não vê". */
function PartyCard({ lang, party }: { lang: Lang; party: (typeof r.parties)[number] }) {
  const c = r[lang];
  return (
    <div className="card who-card">
      <h3>{party[lang].name}</h3>
      <ul className="who-list">
        {r.levels.flatMap((level) => r.things.filter((t) => party.access[t.id] === level).map((t) => (
          <li className={`who-${level}`} key={t.id}><strong>{c.levelLabels[level]}</strong> {t[lang]}</li>
        )))}
      </ul>
      <p>{party[lang].note}</p>
    </div>
  );
}

export function WhoCanReadPage({ lang }: { lang: Lang }) {
  const c = r[lang];
  return (
    <>
      <section className="wrap narrow section">
        <h1>{c.title}</h1>
        <p className="lede">{c.lede}</p>
      </section>
      <section className="wrap section">
        <h2>{c.explainTitle}</h2>
        <ol className="grid who-steps">
          {c.explain.map((s) => <li className="card" key={s.heading}><h3>{s.heading}</h3><p>{s.body}</p></li>)}
        </ol>
        <p className="muted" style={{ marginTop: 20 }}>{c.rule}</p>
      </section>
      <section className="wrap section" id="quem">
        <h2>{c.tableTitle}</h2>
        <p className="muted">{c.tableLede}</p>
        <div className="grid" style={{ marginTop: 24 }}>
          {r.parties.map((p) => <PartyCard lang={lang} party={p} key={p.id} />)}
        </div>
      </section>
      <section className="wrap narrow section">
        <h2>{c.limitsTitle}</h2>
        <ul>{c.limits.map((x) => <li key={x}>{x}</li>)}</ul>
        <h2 style={{ marginTop: 40 }}>{c.faqTitle}</h2>
        {c.faq.map((f) => <div key={f.q}><h3>{f.q}</h3><p>{f.a}</p></div>)}
      </section>
      <Markdown md={c.more} className="who-more" />
    </>
  );
}

/** Short block on the e2ee feature page and the privacy tentpole: three of the parties, and a link to the page. */
export function WhoCanReadSummary({ lang }: { lang: Lang }) {
  const c = r[lang];
  return (
    <section className="wrap section">
      <h2>{c.summaryTitle}</h2>
      <div className="grid" style={{ marginTop: 16 }}>
        {r.parties.filter((p) => p.id === "chat" || p.id === "bipe" || p.id === "court").map((p) => <PartyCard lang={lang} party={p} key={p.id} />)}
      </div>
      <p className="more-links"><MoreLink href={paths.whoCanRead(lang)}>{c.summaryLink}</MoreLink></p>
    </section>
  );
}

/** The page's Markdown twin, from the same register. */
export function whoCanReadMarkdown(lang: Lang): string {
  const c = r[lang];
  const party = (p: (typeof r.parties)[number]) => [
    `### ${p[lang].name}`,
    ...r.levels.flatMap((level) => r.things.filter((t) => p.access[t.id] === level).map((t) => `- **${c.levelLabels[level]}:** ${t[lang]}`)),
    "",
    p[lang].note,
  ].join("\n");
  return [
    `# ${c.title}`,
    c.lede,
    `## ${c.explainTitle}`,
    c.explain.map((s, i) => `${i + 1}. **${s.heading}.** ${s.body}`).join("\n"),
    c.rule,
    `## ${c.tableTitle}`,
    c.tableLede,
    ...r.parties.map(party),
    `## ${c.limitsTitle}`,
    c.limits.map((x) => `- ${x}`).join("\n"),
    `## ${c.faqTitle}`,
    ...c.faq.map((f) => `### ${f.q}\n\n${f.a}`),
    c.more,
  ].join("\n\n") + "\n";
}
