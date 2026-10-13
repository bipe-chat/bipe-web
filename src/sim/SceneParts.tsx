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

const VERIFIED = ["pix", "govbr", "institution"];

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

/** A charge from a CNPJ-verified institution. No link: the payer pays by Pix in the bank app. */
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
          <div className="pixreq-to">{from.name} <Seal size={13} label={t(lang, "bipe_badge_institution")} /></div>
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
  // A company's structured question (ADR 0079): options to tap, no vote counts.
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
