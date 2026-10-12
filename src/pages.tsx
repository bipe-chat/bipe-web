import { chrome } from "./copy";
import { AppIcon, Mark, MARK, MARKS, Seal, Wordmark, type MarkId } from "./components/brand";
import { DownloadButtons, Icon, PlatformStatus } from "./components/ui";
import { Island } from "./island-registry";
import { paths } from "./paths";
import { assignScript, HEADLINE } from "./experiment";
import { BusinessFigure } from "./sim/BusinessFigure";
import { GroupsFigure } from "./sim/GroupsFigure";
import { ScenePhone, TrustMark } from "./sim/ScenePhone";
import { scenes, type SceneId } from "./sim/scenes";
import { Avatar, cast, label } from "./cast";
import { compare, distribution, product, publicRepo, publicRepos, sideOf, type Audience, type CompareApp, type CompareThreat, type DemoId, type Feature, type Lang, type Tentpole } from "./shared";

function Demo({ lang, tp, index }: { lang: Lang; tp: Tentpole; index: number }) {
  const id = tp.demos[index];
  const caption = tp[lang].demos[index]?.caption ?? "";
  if (id === "scam") return <Island name="ScamSim" props={{ lang, caption }} />;
  if (id === "identity") return <Island name="IdentitySim" props={{ lang, caption }} />;
  if (id === "handle") return <Island name="HandleSim" props={{ lang, caption }} />;
  if (id === "groups") return <GroupsFigure lang={lang} caption={caption} />;
  if (id === "levels") return <Island name="TrustLevels" props={{ lang, caption }} />;
  return <NoAdsFigure lang={lang} />;
}

function Try({ lang, id }: { lang: Lang; id: DemoId }) {
  if (id === "scam") return <Island name="ScamTry" props={{ lang }} />;
  if (id === "identity") return <Island name="NameTry" props={{ lang }} />;
  if (id === "handle") return <Island name="HandleTry" props={{ lang }} />;
  return null;
}

/** Static figure for the no-ads tentpole: the promise as a short ledger, no fake UI. */
function NoAdsFigure({ lang }: { lang: Lang }) {
  const rows = lang === "pt"
    ? [["Anúncios", "0"], ["Dados vendidos", "nenhum"], ["Preço para você", "R$ 0"], ["Servidores", "no Brasil"]]
    : [["Ads", "0"], ["Data sold", "none"], ["Price for you", "R$ 0"], ["Servers", "in Brazil"]];
  return (
    <div className="stage">
      <div className="card" style={{ width: "100%", maxWidth: 380, background: "var(--bg)" }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "14px 4px", borderBottom: "1px solid var(--line)" }}>
            <span>{k}</span><strong className="display" style={{ fontSize: 22, color: "var(--acai)" }}>{v}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function Points({ items }: { items: string[] }) {
  return <ul className="points">{items.map((p) => <li key={p}><Icon name="check" />{p}</li>)}</ul>;
}

function TentpoleSection({ lang, tp, flip, headingLevel = 2 }: { lang: Lang; tp: Tentpole; flip?: boolean; headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className={`split${flip ? " flip" : ""}`}>
      <div>
        <H>{tp[lang].title}</H>
        <p className="lede">{tp[lang].summary}</p>
        <Points items={tp[lang].points} />
        {headingLevel === 2 && <p style={{ marginTop: 24 }}><a href={paths.tentpole(lang, tp)}>{chrome[lang].more} →</a></p>}
      </div>
      <Demo lang={lang} tp={tp} index={0} />
    </div>
  );
}

const byId = (id: string): Tentpole => product.tentpoles.find((tp) => tp.id === id)!;

function TentpoleCard({ lang, tp }: { lang: Lang; tp: Tentpole }) {
  return (
    <a className="card tentpole-card" href={paths.tentpole(lang, tp)}>
      {tp.status === "planned" && <span className="small muted">{chrome[lang].status.planned}</span>}
      <span className="display">{tp[lang].title}</span>
      <p>{tp[lang].summary}</p>
      <span className="more">{chrome[lang].more} →</span>
    </a>
  );
}

export function HomePage({ lang }: { lang: Lang }) {
  const [lead, ...rest] = product.tentpoles;
  return (
    <>
      <section className="wrap hero">
        <div>
          <h1 id="hero-title">{product.promise[lang].title}</h1>
          {lang === "pt" && HEADLINE.active && <script dangerouslySetInnerHTML={{ __html: assignScript() }} />}
          <p className="lede">{product.promise[lang].lede}</p>
          <DownloadButtons lang={lang} />
          <p className="small muted" style={{ marginTop: 14 }}>{distribution.ios[lang].note}</p>
          <p style={{ marginTop: 28, marginBottom: 0 }}>{chrome[lang].waitlist.heroLead}</p>
          <Island name="WaitlistForm" props={{ lang, platform: "auto", source: paths.home(lang) }} />
        </div>
        <Demo lang={lang} tp={lead} index={0} />
      </section>

      <section className="wrap section">
        <h2 style={{ marginBottom: 24 }}>{chrome[lang].tentpolesTitle}</h2>
        {product.sides.map((side) => (
          <div className="side" id={side.id} key={side.id}>
            <h3>{side[lang].name}</h3>
            <p className="side-line muted">{side[lang].line}</p>
            <div className="grid">{side.tentpoles.map((id) => <TentpoleCard lang={lang} tp={byId(id)} key={id} />)}</div>
          </div>
        ))}
        <div className="side">
          <div className="grid">{product.tentpoles.filter((tp) => !sideOf(tp)).map((tp) => <TentpoleCard lang={lang} tp={tp} key={tp.id} />)}</div>
        </div>
      </section>

      {rest.map((tp, i) => (
        <section className="wrap section" key={tp.id}><TentpoleSection lang={lang} tp={tp} flip={i % 2 === 0} /></section>
      ))}

      <section className="wrap section">
        <div className="origin">
          <span style={{ color: "var(--acai)" }}><Mark size={56} /></span>
          <div>
            <h2 style={{ fontSize: 28 }}>{product.origin[lang].title}</h2>
            <p className="muted" style={{ margin: "8px 0 0", maxWidth: "40em" }}>{product.origin[lang].body} <a href={paths.about(lang)}>{chrome[lang].about} →</a></p>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="card" style={{ padding: 32, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <AppIcon size={72} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2>{chrome[lang].downloadTitle}</h2>
            <p className="muted" style={{ margin: "8px 0 0" }}>{chrome[lang].downloadLede}</p>
          </div>
          <DownloadButtons lang={lang} />
        </div>
      </section>
    </>
  );
}

export function TentpolePage({ lang, tp }: { lang: Lang; tp: Tentpole }) {
  const features = tp.features.map((id) => product.features.find((f) => f.id === id)!).filter(Boolean);
  return (
    <>
      <section className="wrap section"><TentpoleSection lang={lang} tp={tp} headingLevel={1} /></section>
      {tp.demos[0] && <section className="wrap narrow section" style={{ paddingTop: 48 }}><Try lang={lang} id={tp.demos[0]} /></section>}
      {tp.demos.slice(1).map((id, i) => id === "levels" ? (
        // The level picker is the left column, so the island spans the section.
        <section className="wrap section" key={id}>
          <h2>{tp[lang].demos[i + 1]?.title}</h2>
          <Demo lang={lang} tp={tp} index={i + 1} />
        </section>
      ) : (
        <section className="wrap section" key={id}>
          <div className={`split${i % 2 === 0 ? " flip" : ""}`}>
            <div>
              <h2>{tp[lang].demos[i + 1]?.title}</h2>
              <Try lang={lang} id={id} />
            </div>
            <Demo lang={lang} tp={tp} index={i + 1} />
          </div>
        </section>
      ))}
      <section className="wrap section">
        <div className="grid">
          {features.map((f) => <FeatureCard lang={lang} f={f} key={f.id} />)}
        </div>
        <p style={{ marginTop: 24 }}><a href={paths.features(lang)}>{chrome[lang].allFeatures} →</a></p>
        {tp.id === "trust" && <p><a href={paths.compare(lang)}>{compare[lang].title} →</a></p>}
      </section>
    </>
  );
}

export function FeaturesPage({ lang }: { lang: Lang }) {
  const c = chrome[lang];
  return (
    <section className="wrap section">
      <h1>{c.allFeatures}</h1>
      <p className="lede">{product.promise[lang].lede}</p>
      {product.sides.map((side) => (
        <div className="side" id={side.id} key={side.id}>
          <h2>{side[lang].name}</h2>
          <p className="side-line muted">{side[lang].line}</p>
          {product.areas.filter((a) => side.areas.includes(a.id)).map((area) => <FeatureArea lang={lang} area={area} level={3} key={area.id} />)}
        </div>
      ))}
      {product.areas.filter((a) => !product.sides.some((s) => s.areas.includes(a.id))).map((area) => <FeatureArea lang={lang} area={area} level={2} key={area.id} />)}
    </section>
  );
}

function FeatureArea({ lang, area, level }: { lang: Lang; area: (typeof product.areas)[number]; level: 2 | 3 }) {
  const c = chrome[lang];
  const items: Feature[] = product.features.filter((f) => f.area === area.id);
  if (!items.length) return null;
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className="area">
      <H>{area[lang]}</H>
      <div className="grid">
        {items.map((f) => <FeatureCard lang={lang} f={f} key={f.id} anchor />)}
      </div>
    </div>
  );
}

/** One building block as a card that opens its page. anchor keeps the old #id links on the features page working. */
function FeatureCard({ lang, f, anchor }: { lang: Lang; f: Feature; anchor?: boolean }) {
  return (
    <a className="card feature" href={paths.feature(lang, f)} id={anchor ? f.id : undefined}>
      <h3>{f[lang].name}</h3>
      <p>{f[lang].body}</p>
      <PlatformStatus lang={lang} f={f} />
    </a>
  );
}

/** One building block on its own page: what it does, how it works, its status, and where it belongs. */
export function FeaturePage({ lang, f }: { lang: Lang; f: Feature }) {
  const c = chrome[lang];
  const area = product.areas.find((a) => a.id === f.area)!;
  const tentpoles = product.tentpoles.filter((t) => t.features.includes(f.id));
  const related = product.features.filter((x) => x.area === f.area && x.id !== f.id);
  const audiences = product.audiences.filter((a) => a.sections.some((s) => s.features.includes(f.id)));
  return (
    <>
      <section className="wrap narrow section">
        <p className="small"><a href={`${paths.features(lang)}#${f.id}`}>{c.allFeatures}</a> · {area[lang]}</p>
        <h1>{f[lang].name}</h1>
        <p className="lede">{f[lang].body}</p>
        <PlatformStatus lang={lang} f={f} />
        <h2 style={{ marginTop: 40 }}>{c.howItWorks}</h2>
        <ul>{f[lang].points.map((x) => <li key={x}>{x}</li>)}</ul>
        {audiences.length > 0 && (
          <p style={{ marginTop: 24 }}>{c.usedFor} {audiences.map((a, i) => <span key={a.id}>{i > 0 && ", "}<a href={paths.audience(lang, a)}>{a[lang].name.toLowerCase()}</a></span>)}</p>
        )}
        {tentpoles.length > 0 && (
          <p style={{ marginTop: 24 }}>{c.partOf} {tentpoles.map((t, i) => <span key={t.id}>{i > 0 && ", "}<a href={paths.tentpole(lang, t)}>{t[lang].name}</a></span>)}</p>
        )}
      </section>
      {related.length > 0 && (
        <section className="wrap section">
          <h2>{c.alsoIn(area[lang])}</h2>
          <div className="grid">{related.map((x) => <FeatureCard lang={lang} f={x} key={x.id} />)}</div>
        </section>
      )}
    </>
  );
}

/** An audience page (ADR 0060): a need per section, each carried by feature cards with their true status. */
export function AudiencePage({ lang, a }: { lang: Lang; a: Audience }) {
  const copy = a[lang];
  return (
    <>
      <section className="wrap narrow section">
        <p className="small muted">{copy.title}</p>
        <h1>{copy.headline}</h1>
        <p className="lede">{copy.lede}</p>
        <p className="small muted">{copy.note}</p>
      </section>
      {a.sections.map((s, i) => (
        <section className="wrap section" id={s.id} key={s.id}>
          {s.scene ? (
            <div className="split">
              <div>
                <h2>{copy.sections[i].heading}</h2>
                <p className="muted" style={{ maxWidth: "40em" }}>{copy.sections[i].body}</p>
              </div>
              <Island name="SceneSim" props={{ lang, id: s.scene, caption: chrome[lang].sceneCaption }} />
            </div>
          ) : (
            <>
              <h2>{copy.sections[i].heading}</h2>
              <p className="muted" style={{ maxWidth: "40em" }}>{copy.sections[i].body}</p>
            </>
          )}
          <div className="grid" style={{ marginTop: 24 }}>
            {s.features.map((id) => product.features.find((f) => f.id === id)!).map((f) => <FeatureCard lang={lang} f={f} key={f.id} />)}
          </div>
        </section>
      ))}
      <section className="wrap section">
        <div className="card" style={{ padding: 32, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 26 }}>{copy.cta}</h2>
          <a className="button primary" href={`mailto:${distribution.contact}?subject=${encodeURIComponent(copy.ctaSubject)}`}><Icon name="mail" />{distribution.contact}</a>
        </div>
      </section>
      <section className="wrap section">
        <div className="card" style={{ padding: 32, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <AppIcon size={72} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2>{chrome[lang].downloadTitle}</h2>
            <p className="muted" style={{ margin: "8px 0 0" }}>{chrome[lang].downloadLede}</p>
          </div>
          <DownloadButtons lang={lang} />
        </div>
      </section>
    </>
  );
}

export function DownloadPage({ lang }: { lang: Lang }) {
  const c = chrome[lang];
  const { ios, android } = distribution;
  return (
    <section className="wrap section">
      <h1>{c.downloadTitle}</h1>
      <p className="lede">{c.downloadLede}</p>
      <div className="download-grid">
        <div className="card platform">
          <h2>{c.iosTitle}</h2>
          <p>{ios[lang].note} {c.needs} {ios.minOS}.</p>
          <ol style={{ color: "var(--muted)", fontSize: 15, paddingLeft: 20 }}>{c.testflightSteps.map((s) => <li key={s}>{s}</li>)}</ol>
          {ios.url && <a className="button primary" href={ios.url}><Icon name="apple" />{ios[lang].label}</a>}
        </div>
        <div className="card platform" id="android">
          <h2>{c.androidTitle}</h2>
          <p>{android[lang].note}</p>
          {android.status === "available" && android.url
            ? <a className="button primary" href={android.url}><Icon name="android" />{android[lang].label}</a>
            : <Island name="WaitlistForm" props={{ lang, platform: "android", source: paths.download(lang) }} />}
        </div>
      </div>
      {publicRepos.length > 0 && (
        <div id="source" style={{ marginTop: 56 }}>
          <h2>{c.sourceTitle}</h2>
          <p>{c.sourceLede}</p>
          <ul>{publicRepos.map((r) => <li key={r.id}><a href={r.url}>{r[lang]}</a></li>)}</ul>
        </div>
      )}
    </section>
  );
}

export function BusinessPage({ lang }: { lang: Lang }) {
  const b = product.business[lang];
  const [why, ...rest] = b.sections;
  return (
    <>
      <section className="wrap section">
        <div className="split">
          <div>
            <p className="eyebrow">{b.label}</p>
            <h1>{b.title}</h1>
            <p className="lede">{b.lede}</p>
            <h2 style={{ fontSize: 24, marginTop: 36 }}>{why.heading}</h2>
            <Points items={why.points} />
          </div>
          <BusinessFigure lang={lang} caption={b.figureCaption} />
        </div>
      </section>
      <section className="wrap section">
        <div className="grid">
          {rest.map((s) => (
            <div className="card" key={s.heading}>
              <h3 style={{ fontSize: 20 }}>{s.heading}</h3>
              <ul className="points" style={{ marginTop: 12 }}>{s.points.map((p) => <li key={p} style={{ color: "var(--muted)", fontSize: 15 }}><Icon name="check" size={16} />{p}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>
      <section className="wrap section">
        <div className="card" style={{ padding: 32, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 26 }}>{b.cta}</h2>
          <a className="button primary" href={`mailto:${distribution.contact}?subject=${encodeURIComponent(b.ctaSubject)}`}><Icon name="mail" />{distribution.contact}</a>
        </div>
      </section>
    </>
  );
}

/** The stack, part by part. A part links its repo only when the repo is public (ADR 0024); until then it shows no code line. */
export function TechnologyPage({ lang }: { lang: Lang }) {
  const c = chrome[lang];
  const tech = product.technical;
  return (
    <section className="wrap section">
      <h1>{tech[lang].title}</h1>
      <p className="lede">{tech[lang].lede}</p>
      {tech.groups.map((g) => (
        <div className="side" id={g.id} key={g.id}>
          <h2>{g[lang].heading}</h2>
          <p className="side-line muted">{g[lang].line}</p>
          <div className="grid">
            {g.parts.map((p) => {
              const repo = publicRepo(p.repo);
              return (
                <div className="card feature" key={p.id} id={p.id}>
                  <h3>{p[lang].name}</h3>
                  <p>{p[lang].body}</p>
                  {p.upstream && <p className="small muted">{c.tech.basedOn} {p.upstream.map((u, i) => <span key={u.url}>{i > 0 && ", "}<a href={u.url}>{u.name}</a></span>)}</p>}
                  {repo && <p className="small"><a href={repo.url}>{c.tech.code} →</a></p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {publicRepos.length > 0 && (
        <div className="side" id="source">
          <h2>{c.sourceTitle}</h2>
          <ul>{publicRepos.map((r) => <li key={r.id}><a href={r.url}>{r[lang]}</a></li>)}</ul>
        </div>
      )}
    </section>
  );
}

/** The Bipe side of one threat: the claim, then the status of each feature that carries it. */
function BipeCell({ lang, t }: { lang: Lang; t: CompareThreat }) {
  return (
    <div>
      <h3>{compare[lang].bipe}</h3>
      <p>{t[lang].bipe}</p>
      {t.features.map((id) => product.features.find((f) => f.id === id)!).map((f) => (
        <div className="compare-status" key={f.id}>
          <strong className="small"><a href={paths.feature(lang, f)}>{f[lang].name}</a></strong>
          <PlatformStatus lang={lang} f={f} />
        </div>
      ))}
    </div>
  );
}

function CompareFoot({ lang, apps }: { lang: Lang; apps: CompareApp[] }) {
  const c = compare[lang];
  const sources = [...new Map(apps.flatMap((a) => a.sources).map((s) => [s.url, s])).values()];
  return (
    <>
      <div className="side narrow">
        <h2>{c.limitTitle}</h2>
        <p>{c.limit}</p>
      </div>
      <div className="side narrow">
        <h2>{c.sourcesTitle}</h2>
        <p className="small muted">{c.sourcesNote}</p>
        <ul className="small">{sources.map((s) => <li key={s.url}><a href={s.url}>{s.name}</a></li>)}</ul>
      </div>
    </>
  );
}

/** Bipe's level for a threat: on when any of its features is live, else coming soon. */
export const bipeOn = (t: CompareThreat) => t.features.some((id) => product.features.find((f) => f.id === id)!.status.ios !== "planned");

/** Summary table: one row per threat, Bipe first, then each app's level from the register. */
function CompareTable({ lang }: { lang: Lang }) {
  const c = compare[lang];
  return (
    <div className="side">
      <h2>{c.tableTitle}</h2>
      <div className="table-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">{c.threatCol}</th>
              <th scope="col">Bipe</th>
              {compare.apps.map((a) => <th scope="col" key={a.id}><a href={paths.compareApp(lang, a)}>{a.name}</a></th>)}
            </tr>
          </thead>
          <tbody>
            {compare.threats.map((t) => {
              const on = bipeOn(t);
              return (
                <tr key={t.id}>
                  <th scope="row"><a href={`#${t.id}`}>{t[lang].threat}</a></th>
                  <td><span className={`lvl lvl-${on ? "on" : "soon"}`}>{on ? c.levels.on : chrome[lang].status.planned}</span></td>
                  {compare.apps.map((a) => {
                    const cell = a.cells[t.id];
                    return <td key={a.id}>{cell && <span className={`lvl lvl-${cell.level}`}>{c.levels[cell.level]}</span>}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Hub: every threat, Bipe first, then each app that has a sourced fact for it (proseio/docs/vs-whatsapp.md). */
export function ComparePage({ lang }: { lang: Lang }) {
  const c = compare[lang];
  return (
    <section className="wrap section">
      <h1>{c.title}</h1>
      <p className="lede">{c.lede}</p>
      <CompareTable lang={lang} />
      <div className="side">
        <h2>{c.appsTitle}</h2>
        <div className="grid">
          {compare.apps.map((a) => (
            <div className="card feature" key={a.id}>
              <h3>{a.name}</h3>
              <p>{a[lang].line}</p>
              <p className="small"><a href={paths.compareApp(lang, a)}>{c.more} →</a></p>
            </div>
          ))}
        </div>
      </div>
      <div className="compare">
        {compare.threats.map((t) => (
          <div className="card compare-row" id={t.id} key={t.id}>
            <h2>{t[lang].threat}</h2>
            <div className="compare-cols">
              <BipeCell lang={lang} t={t} />
              <div>
                {compare.apps.filter((a) => a.cells[t.id]).map((a) => (
                  <div className="compare-app" key={a.id}>
                    <h3><a href={paths.compareApp(lang, a)}>{a[lang].on}</a></h3>
                    <p>{a.cells[t.id][lang]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <CompareFoot lang={lang} apps={compare.apps} />
    </section>
  );
}

/** One app against Bipe. Only threats with a sourced fact for this app appear. */
export function CompareAppPage({ lang, app }: { lang: Lang; app: CompareApp }) {
  const c = compare[lang];
  const a = app[lang];
  return (
    <section className="wrap section">
      <p className="small"><a href={paths.compare(lang)}>← {c.title}</a></p>
      <h1>{a.title}</h1>
      <p className="lede">{a.lede}</p>
      <div className="compare">
        {compare.threats.filter((t) => app.cells[t.id]).map((t) => (
          <div className="card compare-row" id={t.id} key={t.id}>
            <h2>{t[lang].threat}</h2>
            <div className="compare-cols">
              <div>
                <h3>{a.on}</h3>
                <p>{app.cells[t.id][lang]}</p>
              </div>
              <BipeCell lang={lang} t={t} />
            </div>
          </div>
        ))}
      </div>
      {a.ahead.length > 0 && (
        <div className="side narrow">
          <h2>{c.aheadTitle.replace("{app}", app.name)}</h2>
          <ul>{a.ahead.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
      <CompareFoot lang={lang} apps={[app]} />
    </section>
  );
}

export function AboutPage({ lang }: { lang: Lang }) {
  const a = product.about[lang];
  return (
    <section className="wrap narrow section">
      <h1>{a.title}</h1>
      <p className="lede">{a.lede}</p>
      {a.sections.map((s) => (
        <div key={s.heading} style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>{s.heading}</h2>
          <p style={{ margin: 0 }}>{s.body}</p>
        </div>
      ))}
      <p style={{ marginTop: 40 }}><a href={`mailto:${distribution.contact}`}>{distribution.contact}</a></p>
    </section>
  );
}

/** Draft marks side by side, for picking one (artwork-brief.md acceptance checks). noindex. */
export function BrandPage() {
  return (
    <section className="wrap section">
      <h1>Marca: rascunhos</h1>
      <p className="lede">Três direções do símbolo "balão com selo". A escolhida hoje é a <strong>{MARK.toUpperCase()}</strong>. Para trocar, mude <span className="mono">chosen</span> em <span className="mono">proseio-web/src/components/marks.json</span>.</p>
      <div className="marks" style={{ marginTop: 32 }}>
        {(Object.keys(MARKS) as MarkId[]).map((id) => (
          <div className="card mark-board" key={id} style={id === MARK ? { outline: "2px solid var(--acai)" } : undefined}>
            <strong className="display" style={{ fontSize: 28 }}>{id.toUpperCase()}</strong>
            <div className="sizes">{[16, 24, 32, 48, 72].map((s) => <Mark id={id} size={s} key={s} />)}</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>{[29, 60, 120].map((s) => <AppIcon id={id} size={s} key={s} />)}</div>
            <Wordmark id={id} size={32} />
            <div className="dark"><Mark id={id} size={32} /><span style={{ fontFamily: "var(--brand)", fontWeight: 900, fontSize: 28 }}>bipe</span></div>
            <p style={{ margin: 0, display: "flex", gap: 6, alignItems: "center" }}>Ana Souza <Seal size={14} label="Verificado" /></p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Internal board (noindex): the sample cast and every phone scene, for review and screenshots. */
export function CastPage() {
  const lang: Lang = "pt";
  return (
    <section className="wrap section">
      <h1>Elenco e cenas</h1>
      <p className="lede">Pessoas de exemplo para as simulações do site. Todas são fictícias. Dados em <span className="mono">proseio-web/src/cast/cast.json</span>, regras de estilo em <span className="mono">STYLE.md</span>, fotos com <span className="mono">node scripts/cast.mjs</span>.</p>
      <div className="cast-grid">
        {cast.map((e) => (
          <div className="card cast-card" key={e.id}>
            <Avatar id={e.id} size={96} />
            <strong>{label(e)} <TrustMark lang={lang} trust={e.trust} /></strong>
            <span className="small muted mono">{e.id} · {e.trust}{e.photo && "style" in e.photo ? ` · ${e.photo.style}` : ""}</span>
            <span className="small">{e.name ?? e.phone}</span>
            <span className="small muted">{e.about}</span>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: 64 }}>Cenas</h2>
      <div className="scene-grid">
        {(Object.keys(scenes) as SceneId[]).map((id) => (
          <figure key={id}>
            <ScenePhone lang={lang} id={id} />
            <figcaption><strong>{chrome[lang].scenes[id]}</strong> <span className="mono small muted">{id}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
