import { useState } from "react";
import { Icon } from "../components/ui";
import type { CalculatorCopy, CalculatorOrg, CalculatorPreset, Lang, PriceProposal } from "../shared";

/** Marginal tiers: each rate applies only to the units inside its band. */
export function tiered(count: number, tiers: [number, number][]): number {
  return tiers.reduce((sum, [from, rate], i) => {
    const to = tiers[i + 1]?.[0] ?? Infinity;
    return sum + Math.max(0, Math.min(count, to) - from) * rate;
  }, 0);
}

/** The Instituição price per year for a number of people served (ADR 0206), between the minimum and the cap. */
export function institutionYearly(people: number, p: PriceProposal): number {
  return Math.min(p.institution.capYearly, Math.max(p.minMonthly * 12, tiered(people, p.institution.tiers)));
}

export type BipePlan = "free" | "company" | "institution";

/**
 * Bipe's price under ADR 0206: free up to the free limits; above them, the lower of Empresa (up to company.maxSeats agents)
 * and Instituição; half for public bodies, NGOs, churches and associations.
 */
export function bipePrice(org: CalculatorOrg, seats: number, people: number, p: PriceProposal) {
  if (seats <= p.free.agents && people <= p.free.people) return { plan: "free" as BipePlan, month: 0, year: 0, annual: null, choice: false };
  const factor = org === "half" ? p.halfFactor : 1;
  const institution = institutionYearly(people, p);
  const choice = seats <= p.company.maxSeats;
  const companyMonth = p.company.monthly + Math.max(0, seats - 1) * p.company.extraSeat;
  if (choice && companyMonth * 12 <= institution) {
    return { plan: "company" as BipePlan, month: companyMonth * factor, year: companyMonth * 12 * factor, annual: companyMonth * p.company.annualMonths * factor, choice };
  }
  return { plan: "institution" as BipePlan, month: (institution / 12) * factor, year: institution * factor, annual: null, choice };
}

const SEAT_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 50, 100, 200, 500];
const PEOPLE_STEPS = [100, 300, 500, 800, 1000, 2000, 3000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000, 20000000, 50000000, 100000000];
const SPEND_STEPS = [0, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
const ORGS: CalculatorOrg[] = ["company", "half"];
const fill = (s: string, ...v: string[]) => v.reduce((out, x, i) => out.replace(`%${i + 1}$s`, x), s);
/** The slider stop for a value: the first stop at or above it, so a preset value between stops sits on the next one. */
const stopOf = (steps: number[], n: number) => {
  const i = steps.findIndex((s) => s >= n);
  return i === -1 ? steps.length - 1 : i;
};

/**
 * The estimator on /precos/ (bipe#812, ADR 0206): what Bipe costs an organisation, by agents and active customers on Bipe.
 * Presets (example organisations), sliders and chips only. An optional slider takes what the organisation spends today
 * and shows the difference, without naming any platform. The detail shows the curve and the yearly amounts.
 * Rules, amounts and copy come from `pricing` in bipe-shared product.json; nothing is sent anywhere.
 */
export function PriceCalculator({ lang, copy: c, proposal: p, presets }: { lang: Lang; copy: CalculatorCopy; proposal: PriceProposal; presets: CalculatorPreset[] }) {
  const first = presets[0]!;
  const [preset, setPreset] = useState<string | null>(first.id);
  const [org, setOrg] = useState<CalculatorOrg>(first.org);
  const [seats, setSeats] = useState(first.seats);
  const [people, setPeople] = useState(first.people);
  const [spend, setSpend] = useState(first.spend);
  const pick = (x: CalculatorPreset) => {
    setPreset(x.id);
    setOrg(x.org);
    setSeats(x.seats);
    setPeople(x.people);
    setSpend(x.spend);
  };
  const manual = <T,>(set: (v: T) => void) => (v: T) => { setPreset(null); set(v); };

  const locale = lang === "pt" ? "pt-BR" : "en-US";
  const brl = (n: number, cents = false) => n.toLocaleString(locale, { style: "currency", currency: "BRL", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 3 : 0 });
  const num = (n: number) => n.toLocaleString(locale);
  const b = bipePrice(org, seats, people, p);
  const plan = b.plan === "free" ? fill(c.plans.free, num(p.free.agents), num(p.free.people))
    : b.plan === "company" ? fill(c.plans.company, brl(p.company.monthly), brl(p.company.extraSeat))
    : c.plans.institution;
  const saving = spend - b.month;

  const slider = (label: string, value: string, steps: number[], current: number, set: (n: number) => void, hint?: string) => (
    <label>
      <span className="calc-slider-label"><span>{label}</span><strong>{value}</strong></span>
      <input type="range" min={0} max={steps.length - 1} step={1} value={stopOf(steps, current)} onChange={(e) => set(steps[Number(e.currentTarget.value)]!)} />
      {hint && <span className="small muted calc-hint">{hint}</span>}
    </label>
  );
  const tiers = p.institution.tiers;

  return (
    <div className="calc-wrap">
      <div className="card calc-simple">
        <div className="calc-presets" role="group" aria-label={c.presetsLabel}>
          <span className="small muted">{c.presetsLabel}</span>
          {presets.map((x) => (
            <button type="button" key={x.id} className={`calc-chip${preset === x.id ? " on" : ""}`} aria-pressed={preset === x.id} onClick={() => pick(x)}><Icon name={x.icon} size={16} />{c.presets[x.id]}</button>
          ))}
        </div>
        <div className="calc-sliders">
          <div className="calc-orgs" role="group" aria-label={c.org}>
            {ORGS.map((o) => (
              <button type="button" key={o} className={`calc-chip${org === o ? " on" : ""}`} aria-pressed={org === o} onClick={() => manual(setOrg)(o)}>{c.orgs[o]}</button>
            ))}
          </div>
          {slider(c.seats, num(seats), SEAT_STEPS, seats, manual(setSeats))}
          {slider(c.people, num(people), PEOPLE_STEPS, people, manual(setPeople), c.peopleHint)}
          {slider(c.spend, spend ? brl(spend) : c.spendNone, SPEND_STEPS, spend, manual(setSpend))}
        </div>
        <div className="calc-result" aria-live="polite">
          <p className="calc-save display">{brl(b.month)} <span>{c.month}</span></p>
          <p className="muted">{fill(c.year, brl(b.year))}</p>
          {b.annual !== null && <p className="small muted">{fill(c.annual, brl(b.annual))}</p>}
          <p className="small muted">{plan}</p>
          {org === "half" && b.plan !== "free" && <p className="small muted">{c.plans.half}</p>}
          {b.choice && b.plan !== "free" && <p className="small muted">{c.plans.lower}</p>}
          {spend > 0 && (saving > 0
            ? <p className="calc-save-label">{fill(c.save, brl(saving))}</p>
            : <p className="small muted">{fill(c.compare, brl(spend), brl(b.month))}</p>)}
          <p className="small calc-proposal">{c.proposal}</p>
        </div>
        <p className="small muted calc-assumption">{preset ? c.presetNotes[preset] : c.lede}</p>
      </div>
      <details className="calc-detail">
        <summary>{c.detail}</summary>
        <div className="calc">
          <div className="card calc-side">
            <h3>{c.curveHeading}</h3>
            <p className="small muted">{fill(c.curveLede, brl(p.minMonthly), brl(p.institution.capYearly))}</p>
            <div className="calc-lines">
              {tiers.map(([from, rate], i) => {
                const to = tiers[i + 1]?.[0];
                return (
                  <div className="calc-line" key={from}>
                    <span>{!to ? fill(c.curveAbove, num(from)) : from === 0 ? fill(c.curveFrom, num(to)) : fill(c.curveBetween, num(from), num(to))}</span>
                    <span>{fill(c.curveRate, brl(rate, true))}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card calc-side">
            <h3>{c.tableHeading}</h3>
            <table className="calc-table">
              <thead><tr><th>{c.tablePeople}</th><th>{c.tableInstitution}</th><th>{c.tableHalf}</th></tr></thead>
              <tbody>
                {p.table.map((n) => {
                  const y = institutionYearly(n, p);
                  return <tr key={n}><td>{num(n)}</td><td>{brl(y)}</td><td>{brl(y * p.halfFactor)}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}
