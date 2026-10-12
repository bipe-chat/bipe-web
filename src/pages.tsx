import { chrome } from "./copy";
import { AppIcon, Mark, MARK, MARKS, Seal, Wordmark, type MarkId } from "./components/brand";
import { DownloadButtons, Icon, StatusChip } from "./components/ui";
import { Island } from "./island-registry";
import { paths } from "./paths";
import { assignScript, HEADLINE } from "./experiment";
import { GroupsFigure } from "./sim/GroupsFigure";
import { distribution, product, publicRepos, type DemoId, type Lang, type Tentpole } from "./shared";

function Demo({ lang, tp, index }: { lang: Lang; tp: Tentpole; index: number }) {
  const id = tp.demos[index];
  const caption = tp[lang].demos[index]?.caption ?? "";
  if (id === "scam") return <Island name="ScamSim" props={{ lang, caption }} />;
  if (id === "identity") return <Island name="IdentitySim" props={{ lang, caption }} />;
  if (id === "handle") return <Island name="HandleSim" props={{ lang, caption }} />;
  if (id === "groups") return <GroupsFigure lang={lang} caption={caption} />;
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
    ? [["Anúncios", "0"], ["Perfil de anúncio", "nenhum"], ["Preço para você", "R$ 0"], ["Servidores", "no Brasil"]]
    : [["Ads", "0"], ["Ad profile", "none"], ["Price for you", "R$ 0"], ["Servers", "in Brazil"]];
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
        <p className="eyebrow">{tp[lang].name} <StatusChip lang={lang} status={tp.status} /></p>
        <H>{tp[lang].title}</H>
        <p className="lede">{tp[lang].summary}</p>
        <Points items={tp[lang].points} />
        {headingLevel === 2 && <p style={{ marginTop: 24 }}><a href={paths.tentpole(lang, tp)}>{chrome[lang].more} →</a></p>}
      </div>
      <Demo lang={lang} tp={tp} index={0} />
    </div>
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
        <div className="grid">
          {product.tentpoles.map((tp) => (
            <a className="card tentpole-card" href={paths.tentpole(lang, tp)} key={tp.id}>
              <StatusChip lang={lang} status={tp.status} />
              <span className="display">{tp[lang].title}</span>
              <p>{tp[lang].summary}</p>
              <span className="more">{chrome[lang].more} →</span>
            </a>
          ))}
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
      {tp.demos.slice(1).map((id, i) => (
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
          {features.map((f) => (
            <div className="card feature" key={f.id}>
              <div className="row"><h3>{f[lang].name}</h3><StatusChip lang={lang} status={f.status.ios} /></div>
              <p>{f[lang].body}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 24 }}><a href={paths.features(lang)}>{chrome[lang].allFeatures} →</a></p>
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
      <p className="small muted" style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatusChip lang={lang} status="testing" /> <StatusChip lang={lang} status="planned" /> <StatusChip lang={lang} status="policy" />
      </p>
      {product.areas.map((area) => {
        const items = product.features.filter((f) => f.area === area.id);
        if (!items.length) return null;
        return (
          <div className="area" key={area.id}>
            <h2>{area[lang]}</h2>
            <div className="grid">
              {items.map((f) => (
                <div className="card feature" key={f.id} id={f.id}>
                  <div className="row"><h3>{f[lang].name}</h3><StatusChip lang={lang} status={f.status.ios} /></div>
                  <p>{f[lang].body}</p>
                  <p className="small">iPhone: {c.status[f.status.ios]} · Android: {c.status[f.status.android]}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
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
            <div className="dark"><Mark id={id} size={32} /><span style={{ fontFamily: "var(--brand)", fontWeight: 900, fontSize: 28 }}>proseio</span></div>
            <p style={{ margin: 0, display: "flex", gap: 6, alignItems: "center" }}>Ana Souza <Seal size={14} label="Verificado" /></p>
          </div>
        ))}
      </div>
    </section>
  );
}
