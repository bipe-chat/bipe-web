import { useState } from "react";
import { Avatar, label, who, type CastEntry, type Trust } from "../cast";
import { Mark, Seal } from "../components/brand";
import { chrome } from "../copy";
import { Icon, ScamWarningCard, TrustCard } from "../components/ui";
import { Bubble, Phone, runs, TabBar } from "../components/phone";
import { reg, scamWarningKind, t, type Lang } from "../shared";
import { ME, scenes, text, TRUST_LEVEL_SCENES, type InboxRow, type Line, type Scene, type SceneId } from "./scenes";
import { Stage } from "./Stage";

/** The mark next to a name. The same state looks the same everywhere (design/trust-ui.md). */
export function TrustMark({ lang, trust, size = 14 }: { lang: Lang; trust: Trust; size?: number }) {
  if (trust === "pix" || trust === "govbr") return <Seal size={size} label={t(lang, "proseio_badge_verified")} />;
  if (trust === "contact") return <span className="seal-qr"><Seal size={size} label={t(lang, "proseio_badge_verified_contact")} /></span>;
  if (trust === "institution") return <Seal size={size} label={t(lang, "proseio_badge_institution")} />;
  if (trust === "suspended") return <span className="seal off" title={t(lang, "proseio_badge_suspended")}><Mark size={size} /></span>;
  if (trust === "external") return <span className="globe"><Icon name="globe" size={size} /></span>;
  return null;
}

function subline(lang: Lang, e: CastEntry, trust: Trust) {
  const c = chrome[lang];
  if (e.kind === "group") return c.people(e.members ?? 0);
  if (trust === "pix" || trust === "govbr") return t(lang, "proseio_badge_verified_name", e.name ?? "");
  if (trust === "contact") return t(lang, "proseio_badge_verified_contact");
  if (trust === "institution") return `${t(lang, "proseio_badge_institution")} · CNPJ ${e.cnpj}`;
  if (trust === "suspended") return <span className="caution-text">{t(lang, "proseio_badge_suspended")}</span>;
  if (!e.name) return c.notInContacts;
  return e.handle ? `@${e.handle}` : "";
}

function ChatHead({ lang, id, savedAs, trust }: { lang: Lang; id: string; savedAs?: string; trust: Trust }) {
  const e = who(id);
  return (
    <>
      <Avatar id={id} size={32} savedAs={savedAs} />
      <div className="who">
        <div className="name">{label(e, savedAs)} <TrustMark lang={lang} trust={trust} size={16} /></div>
        <div className="sub">{subline(lang, e, trust)}</div>
      </div>
    </>
  );
}

function Card({ lang, line, partner, savedAs }: { lang: Lang; line: Exclude<Line, { from: string }>; partner: CastEntry; savedAs?: string }) {
  const name = partner.name ?? "";
  switch (line.card) {
    case "unverified":
      return <TrustCard level="neutral" title={t(lang, "proseio_banner_unverified_title")}>{t(lang, "proseio_banner_unverified_body", text(line.age, lang))}</TrustCard>;
    case "external":
      return <TrustCard level="neutral" icon="globe">{t(lang, "proseio_banner_external")}</TrustCard>;
    case "securityChange":
      return <TrustCard level="caution" icon="shield">{t(lang, "proseio_banner_security_change")}</TrustCard>;
    case "suspended":
      return <TrustCard level="caution" icon="shield" title={t(lang, "proseio_badge_suspended")}>{t(lang, "proseio_badge_suspended_body")}</TrustCard>;
    case "mismatch":
      return <TrustCard level="danger" icon="warning" title={t(lang, "proseio_warning_name_mismatch", name)} />;
    case "nickname":
      return (
        <TrustCard level="caution" title={t(lang, "proseio_warning_nickname_confirm_title")}>
          {t(lang, "proseio_warning_nickname_confirm_body", savedAs ?? "", name)}
          <div className="buttons">
            <span>{t(lang, "proseio_action_nickname_confirm_yes")}</span>
            <span>{t(lang, "proseio_action_nickname_confirm_unsure")}</span>
          </div>
        </TrustCard>
      );
    case "pix":
      // Outgoing: the bank-name check. Incoming: a money request, with pay held for the pause.
      return (
        <div className={`pix-card${line.out ? "" : " in"}`}>
          <div className="pix-head"><span><Icon name="pix" size={14} /> {line.out ? "Pix" : t(lang, "proseio_warning_money_request_title")}</span><strong>{line.amount}</strong></div>
          <p>{t(lang, "proseio_pix_card_bank_name", name)}</p>
          {!line.out && <div className="pix-pay">{t(lang, "proseio_pause_countdown", "5")}</div>}
        </div>
      );
    case "notice":
      return (
        <div className="notice">
          <div className="notice-band"><Seal size={12} label={t(lang, "proseio_badge_institution")} /> {chrome[lang].automated}</div>
          <p>{text(line.text, lang)}</p>
        </div>
      );
  }
}

function ChatBody({ lang, scene, beat }: { lang: Lang; scene: Extract<Scene, { kind: "chat" }>; beat: number }) {
  const partner = who(scene.with);
  const group = partner.kind === "group";
  const lines = scene.lines.slice(0, beat);
  const run = runs(lines.map((l) => ("from" in l ? l.from : null)));
  return (
    <>
      {lines.map((line, i) => {
        if (!("from" in line)) return <div className="msg card-item" key={i}><Card lang={lang} line={line} partner={partner} savedAs={scene.savedAs} /></div>;
        const body = text(line.text, lang);
        if (line.from === ME) return <div className="msg" key={i}><Bubble lang={lang} out run={run[i]}>{body}</Bubble></div>;
        // Incoming messages go through the reference detector, the same as in the app.
        const kind = scamWarningKind(typeof line.text === "string" ? line.text : line.text.pt, reg);
        const sender = who(line.from);
        return (
          <div className="msg" key={i}>
            <Bubble lang={lang} run={run[i]} sender={group ? sender.id : undefined} savedAs={scene.names?.[sender.id]} mark={<TrustMark lang={lang} trust={sender.trust} size={14} />}>{body}</Bubble>
            {kind && <ScamWarningCard lang={lang} kind={kind} />}
          </div>
        );
      })}
    </>
  );
}

function InboxItem({ lang, row }: { lang: Lang; row: InboxRow }) {
  const e = who(row.with);
  return (
    <div className="inbox-row msg">
      <Avatar id={e.id} size={52} savedAs={row.savedAs} />
      <div className="inbox-main">
        <div className="inbox-top">
          <span className="name">{label(e, row.savedAs)} <TrustMark lang={lang} trust={row.trust ?? e.trust} size={16} /></span>
          <span className={`time${row.unread ? " on" : ""}`}>{row.time}</span>
        </div>
        <div className="inbox-bottom">
          <span className="preview">{row.preview}</span>
          {row.unread ? <span className="unread">{row.unread}</span> : null}
        </div>
      </div>
    </div>
  );
}

const LADDER = [
  ["proseio_trust_step_account", "proseio_trust_step_account_body"],
  ["proseio_trust_step_profile", "proseio_trust_step_profile_body"],
  ["proseio_trust_step_email", "proseio_trust_step_email_body"],
  ["proseio_trust_step_pix", "proseio_trust_step_pix_body"],
  ["proseio_trust_step_govbr", "proseio_trust_step_govbr_body"],
] as const;

function TrustProfile({ lang, me, done, beat }: { lang: Lang; me: string; done: number; beat: number }) {
  const e = who(me);
  const shown = beat > 0 ? done : 0;
  return (
    <div className="ladder">
      <div className="ladder-me">
        <Avatar id={me} size={56} />
        <div><strong>{e.name}</strong><div className="sub">@{e.handle}</div></div>
      </div>
      <div className="ladder-progress">
        <span>{t(lang, "proseio_trust_progress", String(shown), String(LADDER.length))}</span>
        <div className="bar"><div style={{ width: `${(shown / LADDER.length) * 100}%` }} /></div>
      </div>
      {LADDER.map(([title, body], i) => (
        <div className={`ladder-step${i < shown ? " done" : ""}`} key={title}>
          <Icon name={i < shown ? "check" : "circle"} size={18} />
          <div>
            <strong>{t(lang, title)}</strong>
            <div className="sub">{t(lang, body)}</div>
          </div>
          {i >= done && <span className="soon">{t(lang, "proseio_trust_coming_soon")}</span>}
        </div>
      ))}
      <p className="sub">{t(lang, "proseio_trust_footer")}</p>
    </div>
  );
}

export const sceneSteps = (s: Scene) => (s.kind === "chat" ? s.lines.length : s.kind === "inbox" ? s.rows.length : 1);

/** One scene on the phone, up to `beat`. Pass a large beat for the finished, static state. */
export function ScenePhone({ lang, id, beat = Infinity }: { lang: Lang; id: SceneId; beat?: number }) {
  const scene: Scene = scenes[id];
  if (scene.kind === "inbox") {
    return (
      <Phone lang={lang} layout="list" head={t(lang, "proseio_tab_chats")} footer={<TabBar lang={lang} active="chats" />}>
        {scene.rows.slice(0, beat).map((row) => <InboxItem lang={lang} row={row} key={row.with} />)}
      </Phone>
    );
  }
  if (scene.kind === "trustProfile") {
    return (
      <Phone lang={lang} layout="list" head={t(lang, "proseio_trust_title")} footer={<TabBar lang={lang} active="you" />}>
        <TrustProfile lang={lang} me={scene.me} done={scene.done} beat={beat} />
      </Phone>
    );
  }
  const trust = scene.trust ?? who(scene.with).trust;
  return (
    <Phone lang={lang} head={<ChatHead lang={lang} id={scene.with} savedAs={scene.savedAs} trust={trust} />}>
      <ChatBody lang={lang} scene={scene} beat={beat} />
    </Phone>
  );
}

const hold = (steps: number) => (beat: number) => (beat === 0 ? 700 : beat >= steps ? 5200 : 2200);

/** A scripted scene: plays beat by beat when it scrolls into view. */
export function SceneSim({ lang, id, caption }: { lang: Lang; id: SceneId; caption: string }) {
  const steps = sceneSteps(scenes[id]);
  return (
    <Stage lang={lang} caption={caption} steps={steps} holdMs={hold(steps)}>
      {(beat) => <ScenePhone lang={lang} id={id} beat={beat} />}
    </Stage>
  );
}

/** Trust levels: pick a state, the phone plays that scene. */
export function TrustLevels({ lang, caption }: { lang: Lang; caption: string }) {
  const [id, setId] = useState<SceneId>(TRUST_LEVEL_SCENES[0]);
  const c = chrome[lang];
  return (
    <div className="levels">
      <div className="level-picker" role="group" aria-label={c.levelsLabel}>
        {TRUST_LEVEL_SCENES.map((s) => (
          <button type="button" key={s} aria-pressed={s === id} onClick={() => setId(s)}>{c.scenes[s]}</button>
        ))}
      </div>
      <SceneSim key={id} lang={lang} id={id} caption={caption} />
    </div>
  );
}
