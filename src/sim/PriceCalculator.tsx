import { useState } from "react";
import type { CalculatorCopy, CalculatorOrg, Lang, PriceProposal, WhatsAppRates } from "../shared";

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
const fill = (s: string, ...v: string[]) => v.reduce((out, x, i) => out.replace(`%${i + 1}$s`, x), s);

/**
 * The calculator on /precos/ (bipe#812): an organisation's WhatsApp bill from Meta's rate card next to Bipe's proposed price.
 * Rates, amounts and copy come from `pricing` in bipe-shared product.json; nothing is sent anywhere.
 */
export function PriceCalculator({ lang, copy: c, rates, proposal }: { lang: Lang; copy: CalculatorCopy; rates: WhatsAppRates; proposal: PriceProposal }) {
  const [u, setU] = useState<Usage>({ marketing: 2000, utility: 10000, authentication: 0, service: 3000, numbers: 1, bspPercent: 0, bspMonthly: 0 });
  const [org, setOrg] = useState<CalculatorOrg>("company");
  const [seats, setSeats] = useState(3);
  const [band, setBand] = useState(0);
  const locale = lang === "pt" ? "pt-BR" : "en-US";
  const brl = (n: number) => n.toLocaleString(locale, { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const w = whatsappBill(u, rates);
  const b = bipeBill(org, seats, band, proposal);
  const byBand = org === "institution" || org === "public";
  const num = (key: keyof Usage, label: string, hint?: string, max?: number) => (
    <label>{label}
      <input type="number" inputMode="numeric" min={0} max={max} step={1} value={u[key]}
        onChange={(e) => setU({ ...u, [key]: Math.max(0, Number(e.currentTarget.value) || 0) })} />
      {hint && <span className="small muted" style={{ fontWeight: 400 }}>{hint}</span>}
    </label>
  );
  const line = (label: string, value: number, strong = false) => (
    <div className={`calc-line${strong ? " strong" : ""}`}><span>{label}</span><span>{brl(value)}</span></div>
  );

  return (
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
          <select value={org} onChange={(e) => setOrg(e.currentTarget.value as CalculatorOrg)}>
            {ORGS.map((o) => <option key={o} value={o}>{c.orgs[o]}</option>)}
          </select>
        </label>
        {byBand ? (
          <label>{c.people}
            <select value={band} onChange={(e) => setBand(Number(e.currentTarget.value))}>
              {c.peopleBands.map((label, i) => <option key={label} value={i}>{label}</option>)}
            </select>
          </label>
        ) : (
          <label>{c.seats}
            <input type="number" inputMode="numeric" min={1} step={1} value={seats} onChange={(e) => setSeats(Math.max(1, Number(e.currentTarget.value) || 1))} />
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
  );
}
