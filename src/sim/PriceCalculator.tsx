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

/** The active-customer meter per year (ADR 0206): marginal bands from the first paid customer, up to the cap. */
export function customersYearly(people: number, p: PriceProposal): number {
  return Math.min(p.customers.capYearly, tiered(people, p.customers.tiers));
}

/** The agent meter per year: free agents, then a monthly price per agent up to chargedUpTo. */
export function agentsYearly(seats: number, p: PriceProposal): number {
  return Math.max(0, Math.min(seats, p.agents.chargedUpTo) - p.agents.free) * p.agents.monthly * 12;
}

/** Bipe's price under ADR 0206: the two meters added up, half for public bodies, NGOs, churches and associations. */
export function bipePrice(org: CalculatorOrg, seats: number, people: number, p: PriceProposal) {
  const factor = org === "half" ? p.halfFactor : 1;
  const customers = customersYearly(people, p) * factor;
  const agents = agentsYearly(seats, p) * factor;
  const year = customers + agents;
  return { customers, agents, year, month: year / 12, annual: (year * p.annualMonths) / 12 };
}

const SEAT_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 50, 100, 200, 500];
const PEOPLE_STEPS = [100, 300, 500, 800, 1000, 2000, 3000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000, 20000000, 50000000, 100000000];
const SPEND_STEPS = [0, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
const fill = (s: string, ...v: string[]) => v.reduce((out, x, i) => out.replace(`%${i + 1}$s`, x), s);
/** The slider stop for a value: the first stop at or above it, so a preset value between stops sits on the next one. */
const stopOf = (steps: number[], n: number) => {
  const i = steps.findIndex((s) => s >= n);
  return i === -1 ? steps.length - 1 : i;
};

/**
 * The estimator on /precos/ (bipe#812, ADR 0206): what Bipe costs an organisation: active customers on Bipe plus extra agents.
 * Presets (example organisations), sliders and one half-price checkbox. An optional slider takes what the organisation spends today
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
  const saving = spend - b.month;

  const slider = (label: string, value: string, steps: number[], current: number, set: (n: number) => void, hint?: string) => (
    <label>
      <span className="calc-slider-label"><span>{label}</span><strong>{value}</strong></span>
      <input type="range" min={0} max={steps.length - 1} step={1} value={stopOf(steps, current)} onChange={(e) => set(steps[Number(e.currentTarget.value)]!)} />
      {hint && <span className="small muted calc-hint">{hint}</span>}
    </label>
  );
  const tiers = p.customers.tiers;

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
          <label className="calc-check">
            <input type="checkbox" checked={org === "half"} onChange={(e) => manual(setOrg)(e.currentTarget.checked ? "half" : "company")} />
            <span>{c.orgs.half}</span>
          </label>
          {slider(c.seats, num(seats), SEAT_STEPS, seats, manual(setSeats))}
          {slider(c.people, num(people), PEOPLE_STEPS, people, manual(setPeople), c.peopleHint)}
          {slider(c.spend, spend ? brl(spend) : c.spendNone, SPEND_STEPS, spend, manual(setSpend))}
        </div>
        <div className="calc-result" aria-live="polite">
          <p className="calc-save display">{brl(b.month)} <span>{c.month}</span></p>
          <p className="muted">{fill(c.year, brl(b.year))}</p>
          {b.year > 0 && <p className="small muted">{fill(c.annual, brl(b.annual))}</p>}
          {b.year === 0
            ? <p className="small muted">{fill(c.plans.free, num(p.agents.free), num(p.customers.free))}</p>
            : <>
                {b.customers > 0 && <p className="small muted">{fill(c.plans.customers, brl(b.customers))}</p>}
                {b.agents > 0 && <p className="small muted">{fill(c.plans.agents, brl(b.agents / 12))}</p>}
                {org === "half" && <p className="small muted">{c.plans.half}</p>}
              </>}
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
            <p className="small muted">{fill(c.curveLede, brl(p.customers.capYearly))}</p>
            <div className="calc-lines">
              {[[0, 0] as [number, number], ...tiers].map(([from, rate], i, all) => {
                const to = all[i + 1]?.[0];
                return (
                  <div className="calc-line" key={from}>
                    <span>{!to ? fill(c.curveAbove, num(from)) : from === 0 ? fill(c.curveFrom, num(to)) : fill(c.curveBetween, num(from), num(to))}</span>
                    <span>{fill(c.curveRate, brl(rate, true))}</span>
                  </div>
                );
              })}
            </div>
            <h3 style={{ marginTop: 20 }}>{c.agentsHeading}</h3>
            <p className="small muted">{fill(c.agentsLine, brl(p.agents.monthly))}</p>
          </div>
          <div className="card calc-side">
            <h3>{c.tableHeading}</h3>
            <table className="calc-table">
              <thead><tr><th>{c.tablePeople}</th><th>{c.tableInstitution}</th><th>{c.tableHalf}</th></tr></thead>
              <tbody>
                {p.table.map((n) => {
                  const y = customersYearly(n, p);
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
