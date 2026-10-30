// Parts of the phone scenes added for the feature pages (bipe#176). Text comes from the app strings
// through t(); a label the app has no string for yet is site copy in chrome[lang].sim.
import { useEffect, useState } from "react";
import { Avatar, label, who, type CastEntry } from "../cast";
import { Seal } from "../components/brand";
import { Icon, TrustCard } from "../components/ui";
import { chrome } from "../copy";
import { handleProblem, reg, t, type Lang } from "../shared";
import { FakeQr } from "./PixCard";
import { text, type Line, type RequestRow } from "./scenes";
import { TrustMark } from "./ScenePhone";
import "./PixCard.css";

const VERIFIED = ["pix", "govbr", "institution", "company"];

/** Money pause: the money-request card, then the copy button counts down before it unlocks. */
export function PauseCard({ lang, seconds }: { lang: Lang; seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return (
    <TrustCard level="caution" icon="warning" title={t(lang, "bipe_warning_money_request_title")}>
      {t(lang, "bipe_warning_money_request_body")}
      <div className="buttons"><span className={left > 0 ? "locked" : ""}>{left > 0 ? t(lang, "bipe_pause_countdown", String(left)) : chrome[lang].sim.copyKey}</span></div>
    </TrustCard>
  );
}

/** A charge from a CNPJ-verified institution or company. No link: the payer pays by Pix in the bank app. */
export function ChargeCard({ lang, from, amount, description, paid }: { lang: Lang; from: CastEntry; amount: string; description: string; paid: boolean }) {
  return (
    <div className={`pixreq ${paid ? "received" : "issued"}`}>
      <div className="pixreq-head">
        <span><Icon name="pix" size={14} /> {chrome[lang].sim.charge}</span>
        <span className={`pixreq-chip${paid ? " paid" : ""}`}>{t(lang, paid ? "bipe_charge_status_paid" : "bipe_charge_status_pending")}</span>
      </div>
      <div className="pixreq-main">
        <div>
          <strong className="pixreq-amount">{amount}</strong>
          <div className="pixreq-desc">{description}</div>
          <div className="pixreq-to">{from.name} <TrustMark lang={lang} trust={from.trust} size={13} /></div>
        </div>
        {!paid && <FakeQr seed={`${from.id}${amount}`} />}
      </div>
      <p className="pixreq-bank">CNPJ {from.cnpj}</p>
      {!paid && <div className="pixreq-action">{t(lang, "bipe_pix_card_copy")}</div>}
    </div>
  );
}

export function PollCard({ lang, line }: { lang: Lang; line: Extract<Line, { card: "poll" }> }) {
  const c = chrome[lang].sim;
  const total = line.options.reduce((n, o) => n + o.votes, 0);
  // A company's structured question (ADR 0081): options to tap, no vote counts.
  if (line.ask) {
    return (
      <div className="poll">
        <div className="poll-head"><Icon name="check" size={14} /> {c.ask}</div>
        <strong>{text(line.question, lang)}</strong>
        {line.options.map((o, i) => (
          <div className={`poll-option${i === line.mine ? " mine" : ""}`} key={i}>
            <div className="poll-row"><span>{text(o.label, lang)}</span>{i === line.mine && <Icon name="check" size={14} />}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="poll">
      <div className="poll-head"><Icon name="check" size={14} /> {c.poll}</div>
      <strong>{text(line.question, lang)}</strong>
      {line.options.map((o, i) => (
        <div className={`poll-option${i === line.mine ? " mine" : ""}`} key={i}>
          <div className="poll-row"><span>{text(o.label, lang)}</span><span>{o.votes}</span></div>
          <div className="bar"><div style={{ width: `${(o.votes / total) * 100}%` }} /></div>
        </div>
      ))}
      <div className="sub">{c.votes(total)}</div>
    </div>
  );
}

/** A request to join a verified-only group. A verified person can be approved; without a seal the request does not go in. */
export function JoinCard({ lang, id }: { lang: Lang; id: string }) {
  const c = chrome[lang].sim;
  const e = who(id);
  const verified = VERIFIED.includes(e.trust);
  return (
    <div className="join">
      <div className="join-who">
        <Avatar id={id} size={32} />
        <div>
          <div className="name">{label(e)} <TrustMark lang={lang} trust={e.trust} size={14} /></div>
          <div className="sub">{c.joinTitle}</div>
        </div>
      </div>
      {verified ? (
        <TrustCard level="verified" icon="check" title={t(lang, "bipe_badge_verified_name", e.name ?? "")}>
          <div className="buttons"><span>{c.approve}</span><span>{c.decline}</span></div>
        </TrustCard>
      ) : (
        <TrustCard level="caution" icon="warning" title={c.joinNoSealTitle}>{c.joinNoSeal}</TrustCard>
      )}
    </div>
  );
}

/** Message requests above the chats: who asks, how new the account is, accept or ignore. */
export function Requests({ lang, rows }: { lang: Lang; rows: RequestRow[] }) {
  const c = chrome[lang].sim;
  return (
    <div className="requests msg">
      <div className="requests-head">
        <strong>{t(lang, "bipe_requests_title")}</strong>
        <span className="unread">{rows.length}</span>
      </div>
      <p className="sub">{t(lang, "bipe_requests_row_body")}</p>
      {rows.map((r) => {
        const e = who(r.with);
        return (
          <div className="request" key={r.with}>
            <div className="join-who">
              <Avatar id={e.id} size={40} />
              <div>
                <div className="name">{label(e)} <TrustMark lang={lang} trust={e.trust} size={14} /></div>
                <div className="sub">{t(lang, "bipe_banner_unverified_body", text(r.age, lang))}</div>
              </div>
            </div>
            <p className="preview">{r.preview}</p>
            <p className="sub">{t(lang, "bipe_request_unverified_body")}</p>
            <div className="request-buttons"><span>{c.ignore}</span><span className="primary">{c.accept}</span></div>
          </div>
        );
      })}
    </div>
  );
}

/** New chat by @: every typed handle runs through the reference handle rules. */
export function Lookup({ lang, typed, beat }: { lang: Lang; typed: string[]; beat: number }) {
  return (
    <>
      {typed.slice(0, beat).map((h) => {
        const problem = handleProblem(h, reg);
        return (
          <div className="msg lookup" key={h}>
            <div className="handle-field mono">@{h}</div>
            {problem === "reserved"
              ? <TrustCard level="danger" icon="warning" title={t(lang, "bipe_handle_reserved")}>{t(lang, "bipe_warning_reserved_name")}</TrustCard>
              : <TrustCard level="neutral" icon="search">{t(lang, "bipe_start_chat_handle_not_found", h)}</TrustCard>}
          </div>
        );
      })}
    </>
  );
}

/** Scan a profile QR code: the viewfinder, then the profile, then the chat opens (beat 3 is drawn by ScenePhone). */
export function Scan({ lang, id, beat }: { lang: Lang; id: string; beat: number }) {
  const e = who(id);
  return (
    <>
      <div className="viewfinder msg"><FakeQr seed={`@${e.handle}`} size={150} /></div>
      <p className="sub scan-hint">{chrome[lang].sim.scanHint}</p>
      {beat >= 2 && (
        <div className="card msg scan-profile">
          <Avatar id={id} size={56} />
          <div>
            <strong>{e.name} <TrustMark lang={lang} trust={e.trust} size={14} /></strong>
            <div className="mono sub">bipe.chat/@{e.handle}</div>
          </div>
          <span className="pill">{t(lang, "bipe_invites_chat")}</span>
        </div>
      )}
    </>
  );
}

/** Verification by Pix: the step, the R$ 0,01 Pix from the person's own bank, then the seal with the bank's name. */
export function VerifyPix({ lang, me, beat }: { lang: Lang; me: string; beat: number }) {
  const e = who(me);
  const name = e.name ?? "";
  return (
    <>
      <div className="ladder-me msg"><Avatar id={me} size={56} /><div><strong>{beat >= 3 ? name : e.short}</strong> {beat >= 3 && <Seal size={14} label={t(lang, "bipe_badge_verified")} />}<div className="sub">@{e.handle}</div></div></div>
      {beat >= 1 && <div className="msg"><TrustCard level="neutral" icon="pix" title={t(lang, "bipe_trust_step_pix")}>{t(lang, "bipe_trust_step_pix_body")}</TrustCard></div>}
      {beat >= 2 && (
        <div className="msg bank-sheet">
          <div className="sub">{chrome[lang].pix.bankApp}</div>
          <strong>R$ 0,01</strong>
          <div>{chrome[lang].sim.bankFrom(name)}</div>
        </div>
      )}
      {beat >= 3 && <div className="msg"><TrustCard level="verified" icon="check" title={t(lang, "bipe_badge_verified")}>{t(lang, "bipe_badge_verified_name", name)}</TrustCard></div>}
    </>
  );
}

/** Contacts already on Bipe: name and @ only, never the number. Then the switch to be found by number. */
export function Contacts({ lang, found, beat }: { lang: Lang; found: string[]; beat: number }) {
  return (
    <>
      <p className="sub msg">{t(lang, "bipe_contacts_intro")}</p>
      {found.slice(0, beat).map((id) => {
        const e = who(id);
        return (
          <div className="contact-row msg" key={id}>
            <Avatar id={id} size={40} />
            <div className="contact-main">
              <span className="name">{label(e)} <TrustMark lang={lang} trust={e.trust} size={14} /></span>
              {e.handle && <span className="sub">@{e.handle}</span>}
            </div>
            <span className="pill">{t(lang, "bipe_invites_chat")}</span>
          </div>
        );
      })}
      {beat > found.length && (
        <>
          <div className="contact-row msg"><span className="link">{t(lang, "bipe_contacts_invite")}</span></div>
          <div className="toggle-row msg"><span>{t(lang, "bipe_discovery_toggle")}</span><span className="switch on" /></div>
          <p className="sub msg">{t(lang, "bipe_discovery_footer")}</p>
        </>
      )}
    </>
  );
}

// Text stickers, the kind people trade in Brazil. No emoji: they look different on every phone (linguagem.md).
export const STICKERS = ["Bom dia", "Valeu", "Kkkkk", "Amém", "Saudade", "Bora", "Fechou", "Boa noite"];

/** The sticker picker in place of the composer: your packs and the room's packs. */
export function StickerPicker({ lang }: { lang: Lang }) {
  return (
    <div className="stickers-panel">
      <div className="stickers-tabs"><span className="on">{t(lang, "bipe_stickers_pack_personal")}</span><span>{t(lang, "bipe_stickers_pack_room")}</span></div>
      <div className="stickers-grid">{STICKERS.map((s, i) => <span className={`sticker-art s${i % 4}`} key={s}>{s}</span>)}</div>
    </div>
  );
}

/** In an announcements room only admins post: a note in place of the composer. */
export function ReadOnlyBar({ lang }: { lang: Lang }) {
  return <div className="composer readonly">{chrome[lang].sim.readOnly}</div>;
}

/** The call line in the timeline (ADR 0186): kind of call and its length, or a missed call. */
export function CallLine({ lang, line }: { lang: Lang; line: Extract<Line, { card: "call" }> }) {
  const kind = t(lang, line.video ? "bipe_call_video" : "bipe_call_voice");
  return (
    <div className={`call-line${line.missed ? " missed" : ""}`}>
      <Icon name={line.video ? "video" : "call"} size={16} />
      <span>{line.missed ? t(lang, "bipe_call_missed") : `${kind} · ${t(lang, "bipe_call_duration", String(line.minutes ?? 1))}`}</span>
    </div>
  );
}

/** A voice message: play button, waveform, length, and the sender's transcript under it (ADR 0023). */
export function VoiceBody({ lang, length, transcript }: { lang: Lang; length: string; transcript: string }) {
  const bars = [6, 10, 14, 9, 16, 12, 7, 13, 18, 11, 8, 15, 10, 6, 12, 9, 14, 7];
  return (
    <span className="voice">
      <span className="voice-player">
        <span className="voice-play" title={t(lang, "bipe_app_voice_play")}>▶</span>
        <span className="voice-wave">{bars.map((h, i) => <i key={i} style={{ height: h }} />)}</span>
        <span className="voice-length">{length}</span>
      </span>
      <span className="voice-transcript"><strong>{t(lang, "bipe_voice_transcript_title")}</strong> {transcript}</span>
    </span>
  );
}

/** A shared location: a map from Bipe's own map server (ADR 0131), drawn here as a sketch, with its label. */
export function LocationBody({ lang, place, until }: { lang: Lang; place: string; until?: string }) {
  return (
    <span className="location">
      <svg className="location-map" viewBox="0 0 220 120" role="img" aria-label={place}>
        <rect width="220" height="120" className="map-land" />
        <circle cx="120" cy="58" r="30" className="map-park" />
        <path d="M0 40h220M0 92h220M60 0v120M170 0v120M0 120 220 0" className="map-road" />
        <path d="M120 64c-7-9-11-15-11-20a11 11 0 0 1 22 0c0 5-4 11-11 20Z" className="map-pin" />
        <circle cx="120" cy="44" r="4" className="map-pin-dot" />
        <text x="214" y="114" textAnchor="end" className="map-credit">© OpenStreetMap</text>
      </svg>
      <span className="location-label">
        <strong>{until ? t(lang, "bipe_app_location_live_title") : t(lang, "bipe_app_location_pinned")}</strong>
        <span className="sub">{until ? `${place} · ${t(lang, "bipe_app_location_live_until", until)}` : place}</span>
      </span>
    </span>
  );
}

type SettingsRow = { key: string; title: string; footer?: string; kind: string; planned?: unknown; flag?: unknown };
type SettingsGroup = { key: string; title: string; sections: { key: string; title?: string; footer?: string; rows: SettingsRow[] }[] };

/** Settings sections as the app draws them, from the one settings registry (bipe-shared registries/settings.json). */
export function SettingsList({ lang, groups, group, sections, on = [], beat }: { lang: Lang; groups: SettingsGroup[]; group: string; sections: string[]; on?: string[]; beat: number }) {
  const g = groups.find((x) => x.key === group);
  if (!g) throw new Error(`settings group ${group} is not in bipe-shared registries/settings.json`);
  return (
    <>
      {sections.slice(0, Math.max(1, beat)).map((key) => {
        const s = g.sections.find((x) => x.key === key);
        if (!s) throw new Error(`settings section ${group}.${key} is not in bipe-shared registries/settings.json`);
        const rows = s.rows.filter((r) => !r.planned && !r.flag);
        return (
          <div className="settings-section msg" key={key}>
            {s.title && <div className="settings-head">{t(lang, s.title)}</div>}
            <div className="settings-rows">
              {/* A row title with a placeholder names the phone's biometric: the sample phone is an iPhone with Face ID. */}
              {rows.map((r) => (
                <div className={`settings-row kind-${r.kind}`} key={r.key}>
                  <span>{t(lang, r.title, "Face ID")}</span>
                  {r.kind === "switch" && <span className={`switch${on.includes(r.key) ? " on" : ""}`} />}
                  {(r.kind === "link" || r.kind === "url") && <span className="chevron">›</span>}
                </div>
              ))}
            </div>
            {(s.footer || rows.find((r) => r.footer)) && <p className="sub settings-foot">{t(lang, s.footer ?? rows.find((r) => r.footer)!.footer!)}</p>}
          </div>
        );
      })}
    </>
  );
}

/** The app lock (ADR 0137): the 8 PIN dots fill in. */
export function AppLockScreen({ lang, beat }: { lang: Lang; beat: number }) {
  const filled = beat >= 1 ? 8 : 0;
  return (
    <div className="app-lock">
      <Icon name="lock" size={40} />
      <strong>{t(lang, "bipe_app_lock_title")}</strong>
      <span className="pin-dots">{Array.from({ length: 8 }, (_, i) => <i key={i} className={i < filled ? "on" : ""} />)}</span>
      <span className="sub">{t(lang, "bipe_app_lock_biometric", "Face ID")}</span>
    </div>
  );
}

/** The account switcher (ADR 0086, ADR 0135): each account on this phone, the first one active, then add one. */
export function AccountSwitcher({ lang, ids, beat }: { lang: Lang; ids: string[]; beat: number }) {
  return (
    <>
      {ids.slice(0, Math.max(1, beat)).map((id, i) => {
        const e = who(id);
        return (
          <div className="contact-row msg" key={id}>
            <Avatar id={id} size={40} />
            <div className="contact-main">
              <span className="name">{label(e)} <TrustMark lang={lang} trust={e.trust} size={14} /></span>
              {e.handle && <span className="sub">@{e.handle}</span>}
            </div>
            {i === 0 && <Icon name="check" size={18} />}
          </div>
        );
      })}
      {beat > ids.length && <div className="contact-row msg"><span className="link">{t(lang, "bipe_account_add")}</span></div>}
    </>
  );
}

/** Theft protection (ADR 0044): the guardians you chose, and the people who chose you, with the mark action. */
export function Guardians({ lang, guardians, guarding, beat }: { lang: Lang; guardians: string[]; guarding: string[]; beat: number }) {
  const row = (id: string, action?: string) => {
    const e = who(id);
    return (
      <div className="contact-row msg" key={id}>
        <Avatar id={id} size={40} />
        <div className="contact-main"><span className="name">{label(e)} <TrustMark lang={lang} trust={e.trust} size={14} /></span></div>
        {action && <span className="danger-text">{action}</span>}
      </div>
    );
  };
  return (
    <>
      <p className="sub msg">{t(lang, "bipe_theft_intro")}</p>
      <div className="settings-head msg">{t(lang, "bipe_theft_guardians_section")}</div>
      {guardians.map((id) => row(id))}
      <div className="contact-row msg"><span className="link">{t(lang, "bipe_theft_add_guardian")}</span></div>
      <p className="sub msg">{t(lang, "bipe_theft_guardians_footer")}</p>
      {beat >= 2 && (
        <>
          <div className="settings-head msg">{t(lang, "bipe_theft_guarding_section")}</div>
          {guarding.map((id) => row(id, t(lang, "bipe_theft_mark_action")))}
        </>
      )}
    </>
  );
}
