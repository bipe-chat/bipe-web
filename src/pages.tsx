import { chrome } from "./copy";
import { CodeList } from "./components/code";
import { AppIcon, Mark, MARK, MARKS, Seal, Wordmark, type MarkId } from "./components/brand";
import brandAssets from "./components/brand-assets.json";
import { DownloadButtons, FeatureIcon, Icon, MoreLink, PlatformStatus } from "./components/ui";
import { Island } from "./island-registry";
import { paths } from "./paths";
import { assignScript, HEADLINE } from "./experiment";
import { BusinessFigure } from "./sim/BusinessFigure";
import { Figure } from "./sim/Figure";
import { NoAdsFigure } from "./sim/NoAdsFigure";
import { ScenePhone, TrustMark } from "./sim/ScenePhone";
import { scenes, SIMS, type SceneId } from "./sim/scenes";
import { Avatar, cast, label } from "./cast";
import { WhoCanReadSummary } from "./pages/PrivacyPage";
import { storeSets } from "./store";
import { codeLinks, compare, distribution, privacyRegister, product, publicRepo, publicRepos, type Audience, type CompareApp, type CompareThreat, type Feature, type Lang, type Tentpole } from "./shared";

function Demo({ lang, tp, index }: { lang: Lang; tp: Tentpole; index: number }) {
  const id = tp.demos[index];
  if (!id) return <NoAdsFigure lang={lang} />;
  return <Figure lang={lang} id={id} caption={tp[lang].demos[index]?.caption ?? ""} />;
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
        {headingLevel === 2 && <p style={{ marginTop: 24 }}><MoreLink href={paths.tentpole(lang, tp)}>{chrome[lang].more}</MoreLink></p>}
      </div>
      <Demo lang={lang} tp={tp} index={0} />
    </div>
  );
}


export function HomePage({ lang }: { lang: Lang }) {
  const c = chrome[lang];
  const lead = product.tentpoles[0];
  return (
    <>
      <section className="wrap hero">
        <div>
          <h1 id="hero-title">{product.promise[lang].title}</h1>
          {lang === "pt" && HEADLINE.active && <script dangerouslySetInnerHTML={{ __html: assignScript() }} />}
          <p className="lede">{product.promise[lang].lede}</p>
          <a className="button primary" href={paths.download(lang)}>{c.home.try}</a>
          <p className="small muted" style={{ marginTop: 14 }}>{c.home.testing}</p>
        </div>
        <Demo lang={lang} tp={lead} index={0} />
      </section>
      <section className="wrap section">
        <h2>{c.home.featuresTitle}</h2>
        <div className="grid" style={{ marginTop: 24 }}>
          {product.home.features.map((id) => <FeatureCard lang={lang} f={product.features.find((f) => f.id === id)!} key={id} />)}
        </div>
        <p className="more-links"><MoreLink href={paths.features(lang)}>{c.allFeatures}</MoreLink></p>
      </section>
      <section className="wrap section">
        <div className="origin">
          <span style={{ color: "var(--acai)" }}><Mark size={56} /></span>
          <div>
            <h2 style={{ fontSize: 28 }}>{product.origin[lang].title}</h2>
            <p className="muted" style={{ margin: "8px 0 0", maxWidth: "40em" }}>{product.origin[lang].body}</p>
            <MoreLink href={paths.about(lang)}>{c.about}</MoreLink>
          </div>
        </div>
      </section>
      <section className="wrap narrow section" id="convite">
        <h2>{c.home.joinTitle}</h2>
        <p>{c.waitlist.heroLead}</p>
        <Island name="WaitlistForm" props={{ lang, platform: "auto", source: paths.home(lang) }} />
        <p><a href={paths.download(lang)}>{c.home.hasInvite}</a></p>
        <p className="small"><a href={paths.help(lang)}>{c.home.help}</a></p>
      </section>
    </>
  );
}

export function TentpolePage({ lang, tp }: { lang: Lang; tp: Tentpole }) {
  const features = tp.features.map((id) => product.features.find((f) => f.id === id)!).filter(Boolean);
  return (
    <>
      <section className="wrap section"><TentpoleSection lang={lang} tp={tp} headingLevel={1} /></section>
      {tp.id === privacyRegister.tentpole && <WhoCanReadSummary lang={lang} />}
      {tp.demos.slice(1).map((id, i) => (
        <section className="wrap section" key={id}>
          <h2>{tp[lang].demos[i + 1]?.title}</h2>
          <Demo lang={lang} tp={tp} index={i + 1} />
        </section>
      ))}
      <section className="wrap section">
        <div className="grid">
          {features.map((f) => <FeatureCard lang={lang} f={f} key={f.id} />)}
        </div>
        <p className="more-links">
          <MoreLink href={paths.features(lang)}>{chrome[lang].allFeatures}</MoreLink>
          {tp.id === "trust" && <MoreLink href={paths.compare(lang)}>{compare[lang].title}</MoreLink>}
        </p>
      </section>
    </>
  );
}

export function FeaturesPage({ lang }: { lang: Lang }) {
  const c = chrome[lang];
  return (
    <section className="wrap section">
      <h1>{c.allFeatures}</h1>
      <p className="lede">{product.featuresHub[lang].lede}</p>
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
      <div className="grid even">
        {items.map((f) => <FeatureCard lang={lang} f={f} key={f.id} anchor />)}
      </div>
    </div>
  );
}

/** One building block as a card that opens its page. No status on the card: the feature page shows it (identity.md, Icons). anchor keeps the old #id links on the features page working. */
function FeatureCard({ lang, f, anchor }: { lang: Lang; f: Feature; anchor?: boolean }) {
  return (
    <a className="card feature" href={paths.feature(lang, f)} id={anchor ? f.id : undefined}>
      <FeatureIcon f={f} />
      <h3>{f[lang].name}</h3>
      <p>{f[lang].body}</p>
    </a>
  );
}

/** Caption under a feature figure: the status per platform first, so a planned feature never looks shipped. */
function figureCaption(lang: Lang, f: Feature): string {
  const c = chrome[lang];
  if (f.status.ios === "policy" && f.status.android === "policy") return c.sceneCaption;
  return `${c.figureStatus(c.status[f.status.ios], c.status[f.status.android])} ${c.sceneCaption}`;
}

/** One building block on its own page: what it does, how it works in practice, its status, and where it belongs. */
export function FeaturePage({ lang, f }: { lang: Lang; f: Feature }) {
  const c = chrome[lang];
  const area = product.areas.find((a) => a.id === f.area)!;
  const tentpoles = product.tentpoles.filter((t) => t.features.includes(f.id));
  const related = product.features.filter((x) => x.area === f.area && x.id !== f.id);
  const audiences = product.audiences.filter((a) => a.sections.some((s) => s.features.includes(f.id)));
  const [lead, ...more] = f.figures ?? [];
  const caption = figureCaption(lang, f);
  const text = (
    <div>
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
      <CodeList lang={lang} ids={f.code} />
    </div>
  );
  return (
    <>
      {lead ? (
        <section className="wrap section"><div className="split">{text}<Figure lang={lang} id={lead} caption={caption} /></div></section>
      ) : (
        <section className="wrap narrow section">{text}</section>
      )}
      {f.id === privacyRegister.feature && <WhoCanReadSummary lang={lang} />}
      {more.length > 0 && (
        <section className="wrap section">
          <h2>{c.figuresTitle}</h2>
          <div className="figure-grid">{more.map((id) => <Figure lang={lang} id={id} caption={caption} key={id} />)}</div>
        </section>
      )}
      {related.length > 0 && (
        <section className="wrap section">
          <h2>{c.alsoIn(area[lang])}</h2>
          <div className="grid">{related.map((x) => <FeatureCard lang={lang} f={x} key={x.id} />)}</div>
        </section>
      )}
    </>
  );
}

/** The hub for audience pages: one card per audience, in ICP order (ADR 0060). */
export function AudiencesPage({ lang }: { lang: Lang }) {
  const hub = product.audiencesHub[lang];
  return (
    <section className="wrap section">
      <h1>{hub.title}</h1>
      <p className="lede">{hub.lede}</p>
      <div className="grid" style={{ marginTop: 40 }}>
        {product.audiences.map((a) => (
          <a className="card feature" href={paths.audience(lang, a)} key={a.id}>
            <h3>{a[lang].name}</h3>
            <p>{a[lang].headline}</p>
          </a>
        ))}
        <a className="card feature" href={paths.business(lang)}>
          <h3>{product.business[lang].nav}</h3>
          <p>{product.business[lang].title}</p>
        </a>
      </div>
    </section>
  );
}

/** An audience page (ADR 0060): a need per section, each carried by feature cards with their true status. */
export function AudiencePage({ lang, a }: { lang: Lang; a: Audience }) {
  const copy = a[lang];
  return (
    <>
      <section className="wrap narrow section">
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
          <a className="button primary" href={paths.help(lang)}><Icon name="mail" />{chrome[lang].contact}</a>
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
      <div id="convite" style={{ marginBottom: 40 }}>
        <h2>{c.onboarding.title}</h2>
        <p>{c.onboarding.lead}</p>
        <ol>{c.onboarding.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <p className="small muted">{c.onboarding.codeNote}</p>
        <Island name="WaitlistForm" props={{ lang, platform: "auto", source: paths.download(lang) }} />
      </div>
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
      <p style={{ marginTop: 24 }}><a href={paths.help(lang)}>{c.home.help}</a></p>
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

// The business tools on /empresas/, one scene each (bipe/docs/business-tools.md).
const TOOL_SCENES = ["catalogo", "pedido", "orcamento", "fila-virtual"] as const;

export function BusinessPage({ lang }: { lang: Lang }) {
  const b = product.business[lang];
  const c = chrome[lang].biz;
  // Sections 2 and 3 (the team inbox, and the API and how customers arrive) each get their mini (src/sim/BusinessMinis.tsx).
  // Section 4 (the agenda and the business tools) gets the owner's day view and one scene per tool.
  const [why, inbox, connect, agenda, ...rest] = b.sections;
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
        <h2 style={{ fontSize: 28 }}>{inbox.heading}</h2>
        <ul className="points biz-points">{inbox.points.map((p) => <li key={p}><Icon name="check" size={16} />{p}</li>)}</ul>
        <div className="figure-row"><Figure lang={lang} id="bizInbox" caption={c.caption} /></div>
      </section>
      <section className="wrap section">
        <div className="split">
          <div>
            <h2 style={{ fontSize: 28 }}>{connect.heading}</h2>
            <ul className="points biz-points">{connect.points.map((p) => <li key={p}><Icon name="check" size={16} />{p}</li>)}</ul>
          </div>
          <Figure lang={lang} id="bizArrive" caption={c.arriveCaption} />
        </div>
        <div className="figure-row"><Figure lang={lang} id="bizApi" caption={c.apiCaption} /></div>
      </section>
      <section className="wrap section">
        <div className="split">
          <div>
            <h2 style={{ fontSize: 28 }}>{agenda.heading}</h2>
            <ul className="points biz-points">{agenda.points.map((p) => <li key={p}><Icon name="check" size={16} />{p}</li>)}</ul>
          </div>
          <Figure lang={lang} id="agenda-dono" caption={c.agendaCaption} />
        </div>
        <div className="figure-grid">
          {TOOL_SCENES.map((id) => <Figure lang={lang} id={id} caption={c.toolsCaption} key={id} />)}
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
        <p style={{ marginTop: 24 }}><MoreLink href={paths.pricing(lang)}>{product.pricing[lang].link}</MoreLink></p>
      </section>
      <section className="wrap section"><CodeList lang={lang} ids={["business-bridge", "business-inbox"]} /></section>
      <MailCta lang={lang} cta={b.cta} />
    </>
  );
}

/** The price of a tier: its amount once set after the pilot (ADR 0075), else the pilot line. */
export function tierPrice(lang: Lang, tier: (typeof product.pricing.tiers)[number]): string {
  const p = product.pricing[lang];
  if (tier.amount === undefined) return p.pilotPrice;
  if (tier.amount === 0) return p.freePrice;
  return `R$ ${tier.amount.toLocaleString("pt-BR")}`;
}

/** How Bipe charges companies, with no amounts until the pilot ends. Copy and tiers: `pricing` in product.json. */
export function PricingPage({ lang }: { lang: Lang }) {
  const p = product.pricing[lang];
  const tools = product.pricing.tools.map((id) => product.features.find((f) => f.id === id)!);
  return (
    <>
      <section className="wrap section">
        <div className="split">
          <div>
            <h1>{p.title}</h1>
            <p className="lede">{p.lede}</p>
          </div>
          <div className="card">
            <h2 style={{ fontSize: 24 }}>{p.principles.heading}</h2>
            <Points items={p.principles.points} />
          </div>
        </div>
      </section>
      <section className="wrap narrow section">
        <h2 style={{ fontSize: 28 }}>{p.why.heading}</h2>
        <Points items={p.why.points} />
      </section>
      <section className="wrap section">
        <h2 style={{ fontSize: 28, marginBottom: 24 }}>{p.tiersHeading}</h2>
        <div className="tier-grid">
          {product.pricing.tiers.map((tier) => {
            const t = p.tiers[tier.id];
            return (
              <div className="card tier" key={tier.id}>
                <h3 style={{ fontSize: 22 }}>{t.name}</h3>
                <p>{t.who}</p>
                <p className="tier-price display">{tierPrice(lang, tier)}</p>
                <p>{t.billing}</p>
                <ul className="points" style={{ marginTop: 16 }}>{t.points.map((x) => <li key={x} style={{ fontSize: 15 }}><Icon name="check" size={16} />{x}</li>)}</ul>
                {tier.cta === "app"
                  ? <a className="button secondary compact tier-cta" href={paths.download(lang)}>{p.ctaApp}</a>
                  : <a className="button primary compact tier-cta" href={`${paths.organisations(lang)}#form`}><Icon name="mail" />{p.ctaForm}</a>}
              </div>
            );
          })}
        </div>
        <p className="muted" style={{ marginTop: 20 }}>{p.nonprofit}</p>
      </section>
      <section className="wrap section">
        <div className="grid">
          <div className="card">
            <h3 style={{ fontSize: 20 }}>{p.tools.heading}</h3>
            <p style={{ marginTop: 12 }}>{p.tools.body}</p>
            <div className="more-links">
              {tools.map((f) => <MoreLink key={f.id} href={paths.feature(lang, f)}>{f[lang].name}{f.status.ios === "planned" && f.status.android === "planned" ? ` (${chrome[lang].status.planned})` : ""}</MoreLink>)}
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 20 }}>{p.pilot.heading}</h3>
            <ul className="points" style={{ marginTop: 12 }}>{p.pilot.points.map((x) => <li key={x} style={{ color: "var(--muted)", fontSize: 15 }}><Icon name="check" size={16} />{x}</li>)}</ul>
          </div>
        </div>
      </section>
      <MailCta lang={lang} cta={product.business[lang].cta} label={p.ctaForm} />
    </>
  );
}


/** Closing call to action on /empresas/ and /precos/: a link to the organisation form. */
function MailCta({ lang, cta, label }: { lang: Lang; cta: string; label?: string }) {
  return (
    <section className="wrap section">
      <div className="card" style={{ padding: 32, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 26 }}>{cta}</h2>
        <a className="button primary" href={`${paths.organisations(lang)}#form`}><Icon name="mail" />{label ?? chrome[lang].contact}</a>
      </div>
    </section>
  );
}

/** Organisations that want to talk to their customers on Bipe, and partners (ADR 0126, ADR 0067). Copy: `organisations` in product.json. */
export function OrganisationsPage({ lang }: { lang: Lang }) {
  const p = product.organisations[lang];
  return (
    <>
      <section className="wrap section">
        <div className="split">
          <div>
            <p className="eyebrow">{p.label}</p>
            <h1>{p.title}</h1>
            <p className="lede">{p.lede}</p>
            <h2 style={{ fontSize: 24, marginTop: 36 }}>{p.why.heading}</h2>
            <Points items={p.why.points} />
          </div>
          <Figure lang={lang} id="instituicao" caption={p.figureCaption} />
        </div>
      </section>
      <section className="wrap section">
        <div className="grid">
          {[p.ask, p.steward].map((s) => (
            <div className="card" key={s.heading}>
              <h3 style={{ fontSize: 20 }}>{s.heading}</h3>
              <p style={{ color: "var(--muted)", fontSize: 15, marginTop: 12, marginBottom: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="wrap narrow section">
        <div className="card" style={{ padding: 32, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 280px" }}>
            <h2 style={{ fontSize: 22 }}>{p.small.heading}</h2>
            <p style={{ color: "var(--muted)", fontSize: 15, marginTop: 8, marginBottom: 0 }}>{p.small.body}</p>
          </div>
          <a className="button secondary" href={paths.download(lang)}>{p.small.button}</a>
        </div>
      </section>
      <section className="wrap narrow section" id="form">
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 26, marginBottom: 16 }}>{p.cta}</h2>
          <Island name="OrganisationForm" props={{ lang, copy: p.form, privacy: paths.privacy(lang), privacyLabel: chrome[lang].privacy }} />
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
              const code = codeLinks(p.code);
              return (
                <div className="card feature" key={p.id} id={p.id}>
                  <h3>{p[lang].name}</h3>
                  <p>{p[lang].body}</p>
                  {p.upstream && <p className="small muted">{c.tech.basedOn} {p.upstream.map((u, i) => <span key={u.url}>{i > 0 && ", "}<a href={u.url}>{u.name}</a></span>)}</p>}
                  {code.length > 0
                    ? <p className="small">{code.map((l, i) => <span key={l.id}>{i > 0 && " · "}<a href={l.url}>{l[lang]}</a></span>)}</p>
                    : repo && <p><MoreLink href={repo.url}>{c.tech.code}</MoreLink></p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p style={{ marginTop: 32 }}><MoreLink href={paths.docs(lang)}>{c.docs}</MoreLink></p>
      {publicRepos.length > 0 && (
        <div className="side" id="source">
          <h2>{c.sourceTitle}</h2>
          <ul>{publicRepos.map((r) => <li key={r.id}><a href={r.url}>{r[lang]}</a></li>)}</ul>
        </div>
      )}
    </section>
  );
}

/** The Bipe side of one threat: the claim, its features, and which of them are still planned. */
function BipeCell({ lang, t }: { lang: Lang; t: CompareThreat }) {
  const features = t.features.map((id) => product.features.find((f) => f.id === id)!);
  const live = features.filter((f) => f.status.ios !== "planned");
  const soon = features.filter((f) => f.status.ios === "planned");
  const links = (fs: typeof features) => fs.map((f, i) => <span key={f.id}>{i > 0 && ", "}<a href={paths.feature(lang, f)}>{f[lang].name}</a></span>);
  return (
    <div>
      <h3>{compare[lang].bipe}</h3>
      <p>{t[lang].bipe}</p>
      {live.length > 0 && <p className="small compare-status">{links(live)}</p>}
      {soon.length > 0 && <p className="small muted compare-status">{chrome[lang].status.planned}: {links(soon)}</p>}
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

/** Hub: every threat, Bipe first, then each app that has a sourced fact for it (bipe/docs/vs-whatsapp.md). */
export function ComparePage({ lang }: { lang: Lang }) {
  const c = compare[lang];
  return (
    <section className="wrap section">
      <h1>{c.title}</h1>
      <CompareTable lang={lang} />
      <div className="side">
        <h2>{c.appsTitle}</h2>
        <div className="grid">
          {compare.apps.map((a) => (
            <div className="card feature" key={a.id}>
              <h3>{a.name}</h3>
              <p>{a[lang].line}</p>
              <p><MoreLink href={paths.compareApp(lang, a)}>{c.more}</MoreLink></p>
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
      <div className="side narrow">
        <h2>{c.appsTitle}</h2>
        <ul>{compare.apps.filter((o) => o.id !== app.id).map((o) => <li key={o.id}><a href={paths.compareApp(lang, o)}>{o[lang].title}</a></li>)}</ul>
        <p><MoreLink href={paths.compare(lang)}>{c.title}</MoreLink></p>
      </div>
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
      <p className="more-links" style={{ marginTop: 40 }}>
        <MoreLink href={paths.organisations(lang)}>{product.organisations[lang].aboutLink}</MoreLink>
        <MoreLink href={paths.brand(lang)}>{chrome[lang].brand.link}</MoreLink>
      </p>
      <p style={{ marginTop: 16 }}><a href={paths.help(lang)}>{chrome[lang].help.title}</a></p>
    </section>
  );
}

export function HelpPage({ lang }: { lang: Lang }) {
  const c = chrome[lang].help;
  const account = product.features.find((f) => f.id === "new-phone")!;
  return (
    <section className="wrap narrow section">
      <h1>{c.title}</h1>
      <p className="lede">{c.lede}</p>
      <p>{c.message}</p>
      <p className="small muted">{c.safety}</p>
      <Island name="HelpForm" props={{ lang, copy: c.form, privacy: paths.privacy(lang), privacyLabel: chrome[lang].privacy }} />
      <h2 style={{ marginTop: 40 }}>{c.linksTitle}</h2>
      <ul>
        <li><a href={paths.download(lang)}>{c.download}</a></li>
        <li><a href={paths.feature(lang, account)}>{c.account}</a></li>
        <li><a href={paths.lgpd(lang)}>{c.data}</a></li>
        <li><a href={paths.organisations(lang)}>{c.organisations}</a></li>
      </ul>
    </section>
  );
}

/** Logo downloads (/sobre/marca/). The files are rendered at build time by scripts/brand.mjs from brand-assets.json. */
export function BrandKitPage({ lang }: { lang: Lang }) {
  const b = chrome[lang].brand;
  return (
    <section className="wrap section">
      <h1>{b.title}</h1>
      <p className="lede">{b.lede}</p>
      <div className="brand-kit">
        {brandAssets.assets.map((a) => (
          <figure className="card brand-asset" key={a.file}>
            <div className={a.fg === "#FFFFFF" && !("bg" in a) ? "brand-preview on-plum" : "brand-preview"}>
              <img src={`/brand/${a.file}.svg`} alt={b.assets[a.file]} loading="lazy" />
            </div>
            <figcaption>
              <strong>{b.assets[a.file]}</strong>
              {a.kind === "avatar" && <span className="small muted">{b.avatarNote}</span>}
              <span className="small"><a href={`/brand/${a.file}.png`} download>PNG</a> · <a href={`/brand/${a.file}.svg`} download>SVG</a></span>
            </figcaption>
          </figure>
        ))}
      </div>
      <h2 style={{ marginTop: 56 }}>{b.colours}</h2>
      <div className="brand-colours">
        {([[b.plum, "#80307B"], [b.plumDark, "#D993D2"]] as const).map(([name, hex]) => (
          <div className="card" key={hex}>
            <span className="swatch" style={{ background: hex }} />
            <strong>{name}</strong>
            <span className="small mono">{hex}</span>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: 56 }}>{b.useTitle}</h2>
      <ul>{b.use.map((u) => <li key={u}>{u}</li>)}</ul>
    </section>
  );
}

/** Draft marks side by side, for picking one (artwork-brief.md acceptance checks). noindex. */
export function BrandPage() {
  return (
    <section className="wrap section">
      <h1>Marca: rascunhos</h1>
      <p className="lede">Três direções do símbolo "balão com selo". A escolhida hoje é a <strong>{MARK.toUpperCase()}</strong>. Para trocar, mude <span className="mono">chosen</span> em <span className="mono">bipe-web/src/components/marks.json</span>.</p>
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
/** Every route's link-preview card, for review (noindex). Cards are rendered by scripts/og.mjs at build time. */
export function OgCardsPage({ cards }: { cards: { path: string; title: string; image: string }[] }) {
  return (
    <section className="wrap section">
      <h1>Cartões de link</h1>
      <p className="lede">A imagem que aparece no WhatsApp, iMessage e redes quando alguém compartilha uma página. {cards.length} cartões, gerados no build por <span className="mono">scripts/og.mjs</span>. O texto vem do título e da descrição da rota, ou de <span className="mono">og</span> na rota.</p>
      <div className="grid" style={{ marginTop: 32 }}>
        {cards.map((c) => (
          <figure className="card" key={c.path} style={{ margin: 0, padding: 12 }}>
            <a href={c.image}><img src={c.image} alt={c.title} width={1200} height={630} loading="lazy" style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }} /></a>
            <figcaption className="small" style={{ marginTop: 8 }}><a href={c.path} className="mono">{c.path}</a></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function CastPage() {
  const lang: Lang = "pt";
  return (
    <section className="wrap section">
      <h1>Elenco e cenas</h1>
      <p className="lede">Pessoas de exemplo para as simulações do site. Todas são fictícias. Dados em <span className="mono">bipe-shared/product/cast.json</span>, regras de estilo em <span className="mono">STYLE.md</span>, fotos com <span className="mono">node scripts/cast.mjs</span>.</p>
      <div className="cast-grid">
        {cast.map((e) => (
          <div className="card cast-card" key={e.id}>
            <Avatar id={e.id} size={96} />
            <strong>{label(e)} <TrustMark lang={lang} trust={e.trust} /></strong>
            <span className="small muted mono">{e.id} · {e.trust}{e.photo && "style" in e.photo ? ` · ${e.photo.style}` : ""}</span>
            <span className="small">{e.name}</span>
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
      <h2 style={{ marginTop: 64 }}>Figuras</h2>
      <p className="muted">Simulações e figuras sem cena de celular. Ids em <span className="mono">SIMS</span>, em <span className="mono">src/sim/scenes.ts</span>.</p>
      <div className="figure-grid">
        {SIMS.map((id) => <Figure lang={lang} id={id} caption={id} key={id} />)}
      </div>
    </section>
  );
}

export function StorePanelsPage() {
  // One row per set, in store order. The App Store search result shows the first three panels, so
  // they get an outline: judge them as a row.
  return (
    <section className="wrap section">
      <h1>Imagens da loja</h1>
      {storeSets.length === 0 && <p className="muted">Nenhum painel.</p>}
      {storeSets.map((s) => (
        <div key={s.href} style={{ marginTop: 48 }}>
          <h2>{s.label} · {s.locale} <span className="mono small muted">{s.width}x{s.height}</span></h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
            {s.exports.map((e) => (
              <figure key={e.file} style={{ margin: 0, flex: `0 0 ${s.width > s.height ? 420 : 200}px` }}>
                <a href={s.href + e.file}><img src={s.href + e.file} alt={e.title} width={s.width} height={s.height} loading="lazy" style={{ width: "100%", height: "auto", borderRadius: 8, display: "block", outline: e.order <= 3 ? "3px solid var(--acai)" : "none", outlineOffset: 3 }} /></a>
                <figcaption className="small mono muted" style={{ marginTop: 8 }}>{e.file}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
