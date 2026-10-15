// Agenda scenes (bipe/docs/scheduling.md, ADRs 0099 to 0103; planned). Labels come from the app strings
// (bipe_agenda_*) through t(); sample data is agendaDemo in scenes.ts; sample values are chrome[lang].sim.agenda.
import type { ReactNode } from "react";
import { Avatar, label, who } from "../cast";
import { Mark } from "../components/brand";
import { useClock } from "../components/clock";
import { Bubble, Phone, TabBar } from "../components/phone";
import { Icon } from "../components/ui";
import { chrome } from "../copy";
import { t, type Lang } from "../shared";
import { ChatHead, TrustMark } from "./ScenePhone";
import { agendaDemo as demo, text } from "./scenes";
import "./Agenda.css";

const picked = {
  service: demo.services[demo.pick.service],
  agenda: demo.agendas[demo.pick.agenda],
  time: demo.times[demo.pick.time],
};

/** The booking card, drawn by the app from the API and pinned above the chat with the business (ADR 0102). */
export function BookingCard({ lang }: { lang: Lang }) {
  const a = chrome[lang].sim.agenda;
  return (
    <div className="booking">
      <div className="booking-head">
        <span><Icon name="calendar" size={14} /> {t(lang, "bipe_agenda_card_title")}</span>
        <span className="booking-chip">{t(lang, "bipe_agenda_status_confirmed")}</span>
      </div>
      <strong>{text(picked.service.name, lang)}</strong>
      <div className="booking-line">{t(lang, "bipe_agenda_with", picked.agenda)} · {text(demo.date, lang)}, {a.hour(picked.time)}</div>
      <div className="booking-line muted">{demo.address}</div>
      <div className="booking-actions">
        <span>{t(lang, "bipe_agenda_add_to_calendar")}</span>
        <span>{t(lang, "bipe_agenda_reschedule")}</span>
        <span>{t(lang, "bipe_agenda_cancel")}</span>
      </div>
    </div>
  );
}

function Rows({ items, on }: { items: { title: string; sub?: string; lead?: ReactNode }[]; on: number }) {
  return (
    <div className="agenda-rows">
      {items.map((x, i) => (
        <div className={`agenda-row msg${i === on ? " on" : ""}`} key={x.title}>
          {x.lead}
          <div className="agenda-row-main"><strong>{x.title}</strong>{x.sub && <span className="sub">{x.sub}</span>}</div>
          {i === on && <Icon name="check" size={18} />}
        </div>
      ))}
    </div>
  );
}

/** Customer flow: profile, service, person, time, review, then the chat with the card. Beat 1 to 6. */
export function BookFlow({ lang, id, beat }: { lang: Lang; id: string; beat: number }) {
  const biz = who(id);
  const a = chrome[lang].sim.agenda;
  const step = Math.min(Math.max(beat, 1), 6);
  const head = <span className="agenda-nav">{label(biz)}</span>;
  if (step === 1) {
    return (
      <Phone lang={lang} layout="form" head={head}>
        <div className="msg link-page agenda-profile">
          <Avatar id={biz.id} size={72} />
          <strong>{label(biz)} <TrustMark lang={lang} trust={biz.trust} size={20} /></strong>
          <p className="sub">@{biz.handle}</p>
          <p className="sub">{t(lang, "bipe_badge_institution")} · CNPJ {biz.cnpj}</p>
          <span className="pill wide"><Icon name="calendar" size={16} /> {t(lang, "bipe_agenda_book")}</span>
        </div>
      </Phone>
    );
  }
  if (step === 2) {
    return (
      <Phone lang={lang} layout="form" head={head}>
        <h3 className="agenda-title">{t(lang, "bipe_agenda_pick_service")}</h3>
        <Rows on={demo.pick.service} items={demo.services.map((s) => ({ title: text(s.name, lang), sub: `${t(lang, "bipe_agenda_duration", String(s.minutes))} · ${s.price}` }))} />
      </Phone>
    );
  }
  if (step === 3) {
    const people = [...demo.agendas.map((n) => ({ title: n, lead: <span className="agenda-initial">{n.charAt(0)}</span> })), { title: t(lang, "bipe_agenda_anyone"), lead: <span className="agenda-initial"><Icon name="group" size={16} /></span> }];
    return (
      <Phone lang={lang} layout="form" head={head}>
        <h3 className="agenda-title">{t(lang, "bipe_agenda_pick_person")}</h3>
        <Rows on={demo.pick.agenda} items={people} />
      </Phone>
    );
  }
  if (step === 4) {
    return (
      <Phone lang={lang} layout="form" head={head}>
        <h3 className="agenda-title">{t(lang, "bipe_agenda_pick_time")}</h3>
        <div className="agenda-week">
          {demo.week.map((d, i) => (
            <span key={d.n} className={`${i === demo.pick.day ? "on" : ""}${"full" in d ? " full" : ""}`}><small>{text(d.day, lang)}</small>{d.n}</span>
          ))}
        </div>
        <div className="agenda-times msg">
          {demo.times.map((x, i) => <span key={x} className={i === demo.pick.time ? "on" : ""}>{x}</span>)}
        </div>
      </Phone>
    );
  }
  if (step === 5) {
    return (
      <Phone lang={lang} layout="form" head={head}>
        <h3 className="agenda-title">{t(lang, "bipe_agenda_review_title")}</h3>
        <div className="agenda-review msg">
          <strong>{text(picked.service.name, lang)}</strong>
          <span>{t(lang, "bipe_agenda_with", picked.agenda)}</span>
          <span><Icon name="calendar" size={14} /> {text(demo.date, lang)}, {a.hour(picked.time)}</span>
          <span><Icon name="clock" size={14} /> {t(lang, "bipe_agenda_duration", String(picked.service.minutes))} · {picked.service.price}</span>
          <span className="sub">{demo.address}</span>
        </div>
        <p className="sub">{t(lang, "bipe_agenda_cancel_policy", a.hours(demo.cancelHours))}</p>
        <span className="pill wide agenda-confirm">{t(lang, "bipe_agenda_confirm")}</span>
        <p className="sub">{t(lang, "bipe_agenda_hold", a.minutes(demo.holdMinutes))}</p>
      </Phone>
    );
  }
  return (
    <Phone lang={lang} head={<ChatHead lang={lang} id={biz.id} trust={biz.trust} />}>
      <div className="booking-pin msg"><BookingCard lang={lang} /></div>
      <div className="msg"><Bubble lang={lang} out>{text(demo.note, lang)}</Bubble></div>
      <div className="msg"><Bubble lang={lang}>{text(demo.reply, lang)}</Bubble></div>
    </Phone>
  );
}

const HOUR = 56;

/** Owner side in company mode: the day, one column per agenda. Beat 1 the day, 2 a new booking, 3 a block. */
export function AgendaDay({ lang, beat }: { lang: Lang; beat: number }) {
  const [from, to] = demo.hours;
  const top = (h: number) => (h - from) * HOUR;
  const shown = demo.bookings.filter((b) => !b.fresh || beat >= 2);
  const hours = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <Phone lang={lang} layout="list" head={t(lang, "bipe_tab_agenda")} footer={<TabBar lang={lang} active="agenda" company />}>
      <div className="agenda-day-head">
        <span>{t(lang, "bipe_agenda_today")} · {text(demo.week[demo.pick.day].day, lang)} {demo.week[demo.pick.day].n}</span>
      </div>
      <div className="agenda-cols">
        <span />
        {demo.agendas.map((n) => <strong key={n}>{n}</strong>)}
      </div>
      <div className="agenda-grid" style={{ height: (to - from) * HOUR }}>
        {hours.map((h) => <div className="agenda-hour" key={h} style={{ top: top(h) }}><span>{chrome[lang].sim.agenda.hour(`${String(h).padStart(2, "0")}:00`)}</span></div>)}
        <div className="agenda-now" style={{ top: top(demo.now) }} />
        {shown.map((b) => {
          const s = demo.services[b.service];
          return (
            <div key={`${b.agenda}${b.start}`} className={`agenda-slot col${b.agenda}${b.minutes <= 30 ? " short" : ""}${b.fresh ? " fresh msg" : ""}`} style={{ top: top(b.start), height: (b.minutes / 60) * HOUR - 3 }}>
              <strong>{label(who(b.who))}</strong>
              <span>{text(s.name, lang)}</span>
              {b.fresh && <em>{t(lang, "bipe_agenda_new")}</em>}
            </div>
          );
        })}
        {beat >= 3 && (
          <div className={`agenda-slot block col${demo.block.agenda} msg`} style={{ top: top(demo.block.start), height: (demo.block.minutes / 60) * HOUR - 3 }}>
            <strong>{text(demo.block.label, lang)}</strong>
          </div>
        )}
      </div>
    </Phone>
  );
}

/** A Bipe push: the business name and a text from the app strings, never free text from the business (ADR 0102). */
export function Push({ lang, id, body }: { lang: Lang; id: string; body: string }) {
  return (
    <div className="push msg">
      <div className="push-head"><span className="push-icon"><Mark size={14} /></span> Bipe <span className="sub">{chrome[lang].sim.agenda.now}</span></div>
      <strong>{label(who(id))}</strong>
      <p>{body}</p>
    </div>
  );
}

/** The 24-hour reminder: a push from bipe-api with the business name, the service and the time only (ADR 0102). */
export function AgendaReminder({ lang, id, beat }: { lang: Lang; id: string; beat: number }) {
  const a = chrome[lang].sim.agenda;
  const service = text(picked.service.name, lang);
  const body = t(lang, "bipe_agenda_reminder_body", a.hour(picked.time), lang === "pt" ? service.toLowerCase() : service, picked.agenda);
  const actions = ["bipe_agenda_reminder_confirm", "bipe_agenda_reminder_reschedule", "bipe_agenda_cancel"];
  return (
    <Phone lang={lang} layout="list" head="">
      <div className="lock">
        <span className="lock-day">{a.lockDay}</span>
        <time className="lock-time" data-clock={lang}>{useClock(lang)}</time>
      </div>
      {beat >= 1 && <Push lang={lang} id={id} body={body} />}
      {beat >= 2 && (
        <div className="push-actions msg">
          {actions.map((k, i) => <span key={k} className={beat >= 3 && i === 0 ? "on" : ""}>{t(lang, k)}{beat >= 3 && i === 0 && <Icon name="check" size={16} />}</span>)}
        </div>
      )}
    </Phone>
  );
}
