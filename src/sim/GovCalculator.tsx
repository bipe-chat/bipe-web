import { useState } from "react";
import { Icon } from "../components/ui";
import type { GovCalculatorCopy, GovCalculatorPreset, Lang, PriceProposal } from "../shared";
import { agentsYearly, tiered } from "./PriceCalculator";

/**
 * What a public body pays for notices (bipe ADR 0301 on top of ADR 0206): people who only get notices at one yearly rate,
 * people who talk with the body on the active-customer bands, both under one cap, extra agents, then half price.
 */
export function govPrice(notices: number, people: number, seats: number, p: PriceProposal) {
  const n = p.notices!;
  const noticesFull = Math.max(0, notices - n.free) * n.yearlyPerPerson;
  const peopleFull = tiered(people, p.customers.tiers);
  const metered = Math.min(p.customers.capYearly, noticesFull + peopleFull);
  const agents = agentsYearly(seats, p);
  const full = metered + agents;
  const year = full * p.halfFactor;
  return { noticesFull, peopleFull, capped: noticesFull + peopleFull > metered, metered, agents, full, year };
}

const NOTICE_STEPS = [1000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000, 15000000, 20000000, 50000000, 100000000];
const PEOPLE_STEPS = [0, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
const SEAT_STEPS = [1, 2, 3, 4, 5, 8, 10, 15, 20, 30, 50, 100];
const fill = (s: string, ...v: string[]) => v.reduce((out, x, i) => out.replace(`%${i + 1}$s`, x), s);
const stopOf = (steps: number[], n: number) => {
  const i = steps.findIndex((s) => s >= n);
  return i === -1 ? steps.length - 1 : i;
};

/**
 * The government calculator on /precos/ (#avisos): example bodies, three sliders and a yearly result that adds up row by row,
 * with a line on the dispensa por valor limit. It never compares with another platform (ADR 0206 point 5).
 * Rules, amounts and copy come from `pricing` in bipe-shared product.json; nothing is sent anywhere.
 */
export function GovCalculator({ lang, copy: c, proposal: p, presets }: { lang: Lang; copy: GovCalculatorCopy; proposal: PriceProposal; presets: GovCalculatorPreset[] }) {
  const first = presets[0]!;
  const [preset, setPreset] = useState<string | null>(first.id);
  const [notices, setNotices] = useState(first.notices);
  const [people, setPeople] = useState(first.people);
  const [seats, setSeats] = useState(first.seats);
  const pick = (x: GovCalculatorPreset) => {
    setPreset(x.id);
    setNotices(x.notices);
    setPeople(x.people);
    setSeats(x.seats);
  };
  const manual = (set: (v: number) => void) => (v: number) => { setPreset(null); set(v); };

  const locale = lang === "pt" ? "pt-BR" : "en-US";
  const brl = (n: number, cents = false) => n.toLocaleString(locale, { style: "currency", currency: "BRL", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  const num = (n: number) => n.toLocaleString(locale);
  const n = p.notices!;
  const g = govPrice(notices, people, seats, p);
  const extraSeats = Math.max(0, Math.min(seats, p.agents.chargedUpTo) - p.agents.free);

  const slider = (label: string, value: string, steps: number[], current: number, set: (v: number) => void, hint: string) => (
    <label>
      <span className="calc-slider-label"><span>{label}</span><strong>{value}</strong></span>
      <input type="range" min={0} max={steps.length - 1} step={1} value={stopOf(steps, current)} onChange={(e) => set(steps[Number(e.currentTarget.value)]!)} />
      <span className="small muted calc-hint">{hint}</span>
    </label>
  );
  const row = (label: string, detail: string, amount: string, cls = "") => (
    <div className={`calc-row${cls}`}><span>{label}{detail && <span className="small muted">{detail}</span>}</span><strong>{amount}</strong></div>
  );

  return (
    <div className="calc-wrap">
      <div className="card calc-simple">
        <div className="calc-presets">
          <p className="calc-eyebrow">{c.presetsLabel}</p>
          <div className="calc-chips" role="group" aria-label={c.presetsLabel}>
            {presets.map((x) => (
              <button type="button" key={x.id} className={`calc-chip${preset === x.id ? " on" : ""}`} aria-pressed={preset === x.id} onClick={() => pick(x)}><Icon name={x.icon} size={16} />{c.presets[x.id]}</button>
            ))}
          </div>
          {preset && <p className="small muted calc-assumption">{c.presetNotes[preset]}</p>}
        </div>
        <div className="calc-sliders">
          {slider(c.notices, num(notices), NOTICE_STEPS, notices, manual(setNotices), fill(c.noticesHint, num(n.free)))}
          {slider(c.people, num(people), PEOPLE_STEPS, people, manual(setPeople), fill(c.peopleHint, num(p.customers.free)))}
          {slider(c.seats, num(seats), SEAT_STEPS, seats, manual(setSeats), fill(c.seatsHint, num(p.agents.free)))}
        </div>
        <div className="calc-result" aria-live="polite">
          <p className="calc-eyebrow">{c.resultLabel}</p>
          <p className="calc-price display">{brl(g.year)} <span>{c.year}</span></p>
          <p className="small muted calc-year">{fill(c.monthLine, brl(g.year / 12))}</p>
          <div className="calc-rows">
            {g.full === 0
              ? row(fill(c.rows.free, num(n.free), num(p.agents.free)), "", brl(0))
              : <>
                  {row(c.rows.notices, fill(c.rows.above, num(Math.max(0, notices - n.free)), num(n.free)), brl(g.noticesFull))}
                  {row(c.rows.people, fill(c.rows.above, num(Math.max(0, people - p.customers.free)), num(p.customers.free)), brl(g.peopleFull))}
                  {g.capped && row(fill(c.rows.cap, brl(p.customers.capYearly)), "", `− ${brl(g.noticesFull + g.peopleFull - g.metered)}`)}
                  {row(c.rows.agents, fill(c.rows.above, num(extraSeats), num(p.agents.free)), brl(g.agents))}
                  {row(c.rows.half, "", `− ${brl(g.full - g.year)}`)}
                  {row(c.rows.total, "", brl(g.year), " total")}
                </>}
          </div>
          <p className="small calc-dispensa">
            <Icon name={g.year <= n.dispensaLimit ? "check" : "warning"} size={16} />
            {fill(g.year <= n.dispensaLimit ? c.dispensaBelow : c.dispensaAbove, brl(n.dispensaLimit, true), String(n.dispensaYear))}
          </p>
          <p className="small muted">{c.dispensaNote}</p>
          <p className="small muted calc-proposal">{c.proposal}</p>
        </div>
      </div>
    </div>
  );
}
