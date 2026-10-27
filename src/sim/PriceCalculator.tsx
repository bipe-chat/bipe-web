import { useState } from "react";
import type { CalculatorCopy, CalculatorOrg, CalculatorPreset, Lang, PriceProposal, WhatsAppRates } from "../shared";

/** Marginal tiers: each rate applies only to the messages inside its band (Meta's volume tiers). */
export function tiered(count: number, tiers: [number, number][]): number {
  return tiers.reduce((sum, [from, rate], i) => {
    const to = tiers[i + 1]?.[0] ?? Infinity;
    return sum + Math.max(0, Math.min(count, to) - from) * rate;
  }, 0);
}

export type Usage = { marketing: number; utility: number; authentication: number; service: number; numbers: number; bspPercent: number; bspMonthly: number };

/** One month on the WhatsApp Business Platform in Brazil, before taxes. */
export function whatsappBill(u: Usage, r: WhatsAppRates) {
  const free = r.serviceFreePerNumber * Math.max(1, u.numbers);
  const lines = {
    marketing: u.marketing * r.marketing,
    utility: tiered(u.utility, r.utility),
    authentication: tiered(u.authentication, r.authentication),
    service: Math.max(0, u.service - free) * r.service,
  };
  const meta = lines.marketing + lines.utility + lines.authentication + lines.service;
  const bsp = (meta * u.bspPercent) / 100 + u.bspMonthly;
  return { lines, free, meta, bsp, total: meta + bsp };
}

/** One month and one year on Bipe at the proposed amounts (ADR 0083, ADR 0125). `moved`: a small business with too many agents pays as a company. */
export function bipeBill(org: CalculatorOrg, seats: number, band: number, p: PriceProposal) {
  const company = p.company.monthly + Math.max(0, seats - 1) * p.company.extraSeat;
  if (org === "small" && seats <= p.smallSeats) return { month: 0, year: 0, annual: null, moved: false };
  if (org === "small" || org === "company") return { month: company, year: company * 12, annual: company * p.company.annualMonths, moved: org === "small" };
  if (org === "nonprofit") {
    const m = company * p.nonprofitFactor;
    return { month: m, year: m * 12, annual: m * p.company.annualMonths, moved: false };
  }
  const yearly = p.institutionBands[band]!.yearly * (org === "public" ? p.publicBodyFactor : 1);
  return { month: yearly / 12, year: yearly, annual: null, moved: false };
}

const ORGS: CalculatorOrg[] = ["small", "company", "nonprofit", "institution", "public"];
/** Stops of the messages slider: all messages of the month. The slider keeps the mix of message types and scales each type. */
const MESSAGE_STEPS = [1000, 2000, 5000, 10000, 20000, 50000, 80000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000, 20000000];
const TYPES = ["marketing", "utility", "authentication", "service"] as const;
const MAX_SEATS = 30;
const fill = (s: string, ...v: string[]) => v.reduce((out, x, i) => out.replace(`%${i + 1}$s`, x), s);

/**
 * The calculator on /precos/ (bipe#812): an organisation's WhatsApp bill from Meta's rate card next to Bipe's proposed price.
 * Rates, amounts and copy come from `pricing` in bipe-shared product.json; nothing is sent anywhere.
 * Presets (example organisations) and two sliders (messages, agents) come first, with the mix of message types and the saving.
 * The full calculation opens below and edits the same state.
 */
export function PriceCalculator({ lang, copy: c, rates, proposal, presets }: { lang: Lang; copy: CalculatorCopy; rates: WhatsAppRates; proposal: PriceProposal; presets: CalculatorPreset[] }) {
  const usage = (x: CalculatorPreset, base: Usage): Usage => ({ ...base, ...Object.fromEntries(TYPES.map((k) => [k, Math.round(x.messages * x.mix[k])])) });
  const first = presets[0]!;
  const [preset, setPreset] = useState<string | null>(first.id);
  const [u, setU] = useState<Usage>(usage(first, { marketing: 0, utility: 0, authentication: 0, service: 0, numbers: 1, bspPercent: 0, bspMonthly: 0 }));
  const [org, setOrg] = useState<CalculatorOrg>(first.org);
  const [seats, setSeats] = useState(first.seats ?? 1);
  const [band, setBand] = useState(first.band ?? 0);
  const pick = (x: CalculatorPreset) => {
    setPreset(x.id);
    setU(usage(x, u));
    setOrg(x.org);
    if (x.seats) setSeats(x.seats);
    if (x.band !== undefined) setBand(x.band);
  };
  const total = TYPES.reduce((t, k) => t + u[k], 0);
  // A new total keeps the share of each type. With no messages yet, they count as utility.
  const setTotal = (n: number) => {
    setPreset(null);
    setU(total ? { ...u, ...Object.fromEntries(TYPES.map((k) => [k, Math.round((u[k] * n) / total)])) } : { ...u, utility: n });
  };
  const locale = lang === "pt" ? "pt-BR" : "en-US";
  const brl = (n: number) => n.toLocaleString(locale, { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const w = whatsappBill(u, rates);
  const b = bipeBill(org, seats, band, proposal);
  const byBand = org === "institution" || org === "public";
  const num = (key: keyof Usage, label: string, hint?: string, max?: number) => (
    <label>{label}
      <input type="number" inputMode="numeric" min={0} max={max} step={1} value={u[key]}
        onChange={(e) => { setPreset(null); setU({ ...u, [key]: Math.max(0, Number(e.currentTarget.value) || 0) }); }} />
      {hint && <span className="small muted" style={{ fontWeight: 400 }}>{hint}</span>}
    </label>
  );
  const line = (label: string, value: number, strong = false) => (
    <div className={`calc-line${strong ? " strong" : ""}`}><span>{label}</span><span>{brl(value)}</span></div>
  );

  const s = c.simple;
  const found = MESSAGE_STEPS.findIndex((n) => n >= total);
  const step = found === -1 ? MESSAGE_STEPS.length - 1 : found;
  const shares = TYPES.filter((k) => u[k] > 0).map((k) => ({ k, share: total ? u[k] / total : 0 }));
  const saving = w.total - b.month;

  return (
    <div className="calc-wrap">
      <div className="card calc-simple">
        <div className="calc-presets" role="group" aria-label={c.presetsLabel}>
          <span className="small muted">{c.presetsLabel}</span>
          {presets.map((x) => (
            <button type="button" key={x.id} className={`calc-chip${preset === x.id ? " on" : ""}`} aria-pressed={preset === x.id} onClick={() => pick(x)}>{c.presets[x.id]}</button>
          ))}
        </div>
        <div className="calc-sliders">
          <label>
            <span className="calc-slider-label"><span>{s.messages}</span><strong>{total.toLocaleString(locale)}</strong></span>
            <input type="range" min={0} max={MESSAGE_STEPS.length - 1} step={1} value={step}
              onChange={(e) => setTotal(MESSAGE_STEPS[Number(e.currentTarget.value)]!)} />
          </label>
          <div className="calc-mix">
            <span className="small muted">{s.mix}</span>
            <div className="calc-mix-bar" aria-hidden="true">
              {shares.map(({ k, share }) => <span key={k} className={`mix-${k}`} style={{ width: `${share * 100}%` }} />)}
            </div>
            <p className="small muted calc-mix-legend">
              {shares.map(({ k, share }, i) => <span key={k}>{i > 0 && " · "}<i className={`dot mix-${k}`} />{c.lines[k]} {Math.round(share * 100)}%</span>)}
            </p>
          </div>
          {byBand ? (
            <label>
              <span className="calc-slider-label"><span>{c.people}</span></span>
              <select className="calc-select" value={band} onChange={(e) => { setPreset(null); setBand(Number(e.currentTarget.value)); }}>
                {c.peopleBands.map((label, i) => <option key={label} value={i}>{label}</option>)}
              </select>
            </label>
          ) : (
            <label>
              <span className="calc-slider-label"><span>{s.seats}</span><strong>{seats}</strong></span>
              <input type="range" min={1} max={MAX_SEATS} step={1} value={Math.min(seats, MAX_SEATS)}
                onChange={(e) => { setPreset(null); setSeats(Number(e.currentTarget.value)); }} />
            </label>
          )}
        </div>
        <div className="calc-result" aria-live="polite">
          {saving > 0 ? (
            <>
              <p className="calc-save-label">{s.save}</p>
              <p className="calc-save display">{brl(saving)} <span>{s.perMonth}</span></p>
              <p className="muted">{fill(s.perYear, brl(saving * 12))}</p>
            </>
          ) : <p className="calc-save-label">{s.cheaper}</p>}
          <p className="small muted">{fill(s.compare, brl(w.total), brl(b.month))}</p>
          <p className="small calc-proposal">{c.proposal}</p>
        </div>
        <p className="small muted calc-assumption">{s.assumption}</p>
      </div>
      <details className="calc-detail">
        <summary>{s.detail}</summary>
    <div className="calc">
      <div className="card org-form calc-side">
        <h3>{c.whatsapp}</h3>
        {num("marketing", c.fields.marketing, c.fields.marketingHint)}
        {num("utility", c.fields.utility, c.fields.utilityHint)}
        {num("authentication", c.fields.authentication)}
        {num("service", c.fields.service, c.fields.serviceHint)}
        {num("numbers", c.fields.numbers)}
        {num("bspPercent", c.fields.bspPercent, undefined, 1000)}
        {num("bspMonthly", c.fields.bspMonthly)}
        <div className="calc-lines" aria-live="polite">
          {line(c.lines.marketing, w.lines.marketing)}
          {line(c.lines.utility, w.lines.utility)}
          {line(c.lines.authentication, w.lines.authentication)}
          {line(c.lines.service, w.lines.service)}
          <p className="small muted">{fill(c.lines.serviceFree, w.free.toLocaleString(locale))}</p>
          {line(c.lines.meta, w.meta)}
          {line(c.lines.bsp, w.bsp)}
          {line(c.lines.total, w.total, true)}
          {line(c.lines.year, w.total * 12)}
        </div>
      </div>
      <div className="card org-form calc-side">
        <h3>{c.bipe}</h3>
        <label>{c.org}
          <select value={org} onChange={(e) => { setPreset(null); setOrg(e.currentTarget.value as CalculatorOrg); }}>
            {ORGS.map((o) => <option key={o} value={o}>{c.orgs[o]}</option>)}
          </select>
        </label>
        {byBand ? (
          <label>{c.people}
            <select value={band} onChange={(e) => { setPreset(null); setBand(Number(e.currentTarget.value)); }}>
              {c.peopleBands.map((label, i) => <option key={label} value={i}>{label}</option>)}
            </select>
          </label>
        ) : (
          <label>{c.seats}
            <input type="number" inputMode="numeric" min={1} step={1} value={seats} onChange={(e) => { setPreset(null); setSeats(Math.max(1, Number(e.currentTarget.value) || 1)); }} />
          </label>
        )}
        <div className="calc-lines" aria-live="polite">
          {line(c.lines.bipeMonth, b.month, true)}
          {line(c.lines.bipeYear, b.year)}
          {b.annual !== null && <p className="small muted">{fill(c.lines.bipeAnnual, brl(b.annual))}</p>}
          {b.moved && <p className="small muted">{c.lines.smallMoved}</p>}
          <p className="small muted">{c.lines.bipeSame}</p>
        </div>
        <p className="small calc-proposal">{c.proposal}</p>
      </div>
      <div className="calc-notes small muted">
        <p>{fill(c.notes[0]!, date(rates.effective), date(rates.checked))} <a href={rates.source}>{c.sourceLink}</a></p>
        {c.notes.slice(1).map((n) => <p key={n}>{n}</p>)}
      </div>
    </div>
      </details>
    </div>
  );
}
