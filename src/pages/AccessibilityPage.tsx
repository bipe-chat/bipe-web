// Accessibility (bipe-chat/bipe#491). The page and its Markdown twin come from
// bipe-shared/product/accessibility.json. Change the facts there, never here.
import { paths } from "../paths";
import { accessibilityRegister as r, type Lang } from "../shared";

/** One feature: its name, what works on each platform in words, and the detail. */
function ItemCard({ lang, item }: { lang: Lang; item: (typeof r.items)[number] }) {
  const c = r[lang];
  return (
    <div className="card a11y-card">
      <h3>{item[lang].name}</h3>
      <dl className="a11y-status">
        {r.platforms.map((p) => (
          <div className={`a11y-${item.status[p]}`} key={p}><dt>{c.platformLabels[p]}</dt><dd>{c.levelLabels[item.status[p]]}</dd></div>
        ))}
      </dl>
      <p>{item[lang].body}</p>
    </div>
  );
}

export function AccessibilityPage({ lang }: { lang: Lang }) {
  const c = r[lang];
  return (
    <>
      <section className="wrap narrow section">
        <h1>{c.title}</h1>
        <p className="lede">{c.lede}</p>
      </section>
      <section className="wrap narrow section">
        <h2>{c.rulesTitle}</h2>
        <ul>{c.rules.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section className="wrap section" id="hoje">
        <h2>{c.tableTitle}</h2>
        <p className="muted">{c.tableLede}</p>
        <div className="grid" style={{ marginTop: 24 }}>
          {r.items.map((it) => <ItemCard lang={lang} item={it} key={it.id} />)}
        </div>
      </section>
      <section className="wrap narrow section" id="depois">
        <h2>{c.roadmapTitle}</h2>
        <p className="muted">{c.roadmapLede}</p>
        <ol className="a11y-roadmap">
          {r.roadmap.map((s) => (
            <li key={s.id}>
              <h3>{s[lang].name}</h3>
              <p className="small muted">{c.stageLabels[s.stage]}</p>
              <p>{s[lang].body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="wrap narrow section">
        <h2>{c.limitsTitle}</h2>
        <ul>{c.limits.map((x) => <li key={x}>{x}</li>)}</ul>
        <h2 style={{ marginTop: 40 }}>{c.reportTitle}</h2>
        <p>{c.report}</p>
        <p><a className="button" href={paths.help(lang)}>{c.reportLink}</a></p>
      </section>
    </>
  );
}

/** The page's Markdown twin, from the same register. */
export function accessibilityMarkdown(lang: Lang): string {
  const c = r[lang];
  const head = `| ${c.featureLabel} | ${r.platforms.map((p) => c.platformLabels[p]).join(" | ")} |`;
  const rule = `|---|${r.platforms.map(() => "---|").join("")}`;
  return [
    `# ${c.title}`,
    c.lede,
    `## ${c.rulesTitle}`,
    c.rules.map((x) => `- ${x}`).join("\n"),
    `## ${c.tableTitle}`,
    c.tableLede,
    [head, rule, ...r.items.map((it) => `| ${it[lang].name} | ${r.platforms.map((p) => c.levelLabels[it.status[p]]).join(" | ")} |`)].join("\n"),
    ...r.items.map((it) => `### ${it[lang].name}\n\n${it[lang].body}`),
    `## ${c.roadmapTitle}`,
    c.roadmapLede,
    r.roadmap.map((s, i) => `${i + 1}. **${s[lang].name}** (${c.stageLabels[s.stage]}). ${s[lang].body}`).join("\n"),
    `## ${c.limitsTitle}`,
    c.limits.map((x) => `- ${x}`).join("\n"),
    `## ${c.reportTitle}`,
    `${c.report} [${c.reportLink}](${paths.help(lang)})`,
  ].join("\n\n") + "\n";
}
