import { useState } from "react";
import { Avatar, label, who, type CastEntry, type Trust } from "../cast";
import { Mark, Seal } from "../components/brand";
import { chrome } from "../copy";
import { Icon, ScamWarningCard, TrustCard } from "../components/ui";
import { Bubble, Phone, runs, TabBar } from "../components/phone";
import { reg, scamWarningKind, t, type Lang } from "../shared";
import { ME, scenes, text, TRUST_LEVEL_SCENES, type InboxRow, type Line, type Scene, type SceneId } from "./scenes";
import { PixCard } from "./PixCard";
import { Stage } from "./Stage";

/** The mark next to a name. The same state looks the same everywhere (design/trust-ui.md). */
export function TrustMark({ lang, trust, size = 14 }: { lang: Lang; trust: Trust; size?: number }) {
  if (trust === "pix" || trust === "govbr") return <Seal size={size} label={t(lang, "bipe_badge_verified")} />;
  if (trust === "contact") return <span className="seal-qr"><Seal size={size} label={t(lang, "bipe_badge_verified_contact")} /></span>;
  if (trust === "institution") return <Seal size={size} label={t(lang, "bipe_badge_institution")} />;
  if (trust === "suspended") return <span className="seal off" title={t(lang, "bipe_badge_suspended")}><Mark size={size} /></span>;
  if (trust === "external") return <span className="globe"><Icon name="globe" size={size} /></span>;
  return null;
}

function subline(lang: Lang, e: CastEntry, trust: Trust) {
  const c = chrome[lang];
  if (e.kind === "group") return c.people(e.members ?? 0);
  if (trust === "pix" || trust === "govbr") return t(lang, "bipe_badge_verified_name", e.name ?? "");
  if (trust === "contact") return t(lang, "bipe_badge_verified_contact");
  if (trust === "institution") return `${t(lang, "bipe_badge_institution")} · CNPJ ${e.cnpj}`;
  if (trust === "suspended") return <span className="caution-text">{t(lang, "bipe_badge_suspended")}</span>;
  return e.handle ? `@${e.handle}` : "";
}

export function ChatHead({ lang, id, savedAs, trust }: { lang: Lang; id: string; savedAs?: string; trust: Trust }) {
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
      return <TrustCard level="neutral" title={t(lang, "bipe_banner_unverified_title")}>{t(lang, "bipe_banner_unverified_body", text(line.age, lang))}</TrustCard>;
    case "external":
      return <TrustCard level="neutral" icon="globe">{t(lang, "bipe_banner_external")}</TrustCard>;
    case "securityChange":
      return <TrustCard level="caution" icon="shield">{t(lang, "bipe_banner_security_change")}</TrustCard>;
    case "suspended":
      return <TrustCard level="caution" icon="shield" title={t(lang, "bipe_badge_suspended")}>{t(lang, "bipe_badge_suspended_body")}</TrustCard>;
    case "mismatch":
      return <TrustCard level="danger" icon="warning" title={t(lang, "bipe_warning_name_mismatch", name)} />;
    case "nickname":
      return (
        <TrustCard level="caution" title={t(lang, "bipe_warning_nickname_confirm_title")}>
          {t(lang, "bipe_warning_nickname_confirm_body", savedAs ?? "", name)}
          <div className="buttons">
            <span>{t(lang, "bipe_action_nickname_confirm_yes")}</span>
            <span>{t(lang, "bipe_action_nickname_confirm_unsure")}</span>
          </div>
        </TrustCard>
      );
    case "pix":
      return <PixCard lang={lang} from={partner.id} amount={line.amount} description={line.description} pause={line.pause} />;
    case "notice":
      return (
        <div className="notice">
          <div className="notice-band"><Seal size={12} label={t(lang, "bipe_badge_institution")} /> {chrome[lang].automated}</div>
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
  ["bipe_trust_step_account", "bipe_trust_step_account_body"],
  ["bipe_trust_step_profile", "bipe_trust_step_profile_body"],
  ["bipe_trust_step_email", "bipe_trust_step_email_body"],
  ["bipe_trust_step_pix", "bipe_trust_step_pix_body"],
  ["bipe_trust_step_govbr", "bipe_trust_step_govbr_body"],
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
        <span>{t(lang, "bipe_trust_progress", String(shown), String(LADDER.length))}</span>
        <div className="bar"><div style={{ width: `${(shown / LADDER.length) * 100}%` }} /></div>
      </div>
      {LADDER.map(([title, body], i) => (
        <div className={`ladder-step${i < shown ? " done" : ""}`} key={title}>
          <Icon name={i < shown ? "check" : "circle"} size={18} />
          <div>
            <strong>{t(lang, title)}</strong>
            <div className="sub">{t(lang, body)}</div>
          </div>
          {i >= done && <span className="soon">{t(lang, "bipe_trust_coming_soon")}</span>}
        </div>
      ))}
      <p className="sub">{t(lang, "bipe_trust_footer")}</p>
    </div>
  );
}

export const sceneSteps = (s: Scene) => (s.kind === "chat" ? s.lines.length : s.kind === "inbox" ? s.rows.length : 1);

/** One scene on the phone, up to `beat`. Pass a large beat for the finished, static state. */
export function ScenePhone({ lang, id, beat = Infinity }: { lang: Lang; id: SceneId; beat?: number }) {
  const scene: Scene = scenes[id];
  if (scene.kind === "inbox") {
    return (
      <Phone lang={lang} layout="list" head={t(lang, "bipe_tab_chats")} footer={<TabBar lang={lang} active="chats" />}>
        {scene.rows.slice(0, beat).map((row) => <InboxItem lang={lang} row={row} key={row.with} />)}
      </Phone>
    );
  }
  if (scene.kind === "trustProfile") {
    return (
      <Phone lang={lang} layout="list" head={t(lang, "bipe_trust_title")} footer={<TabBar lang={lang} active="you" />}>
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

/** Several scenes played back to back, each to its end. */
export function SceneReel({ lang, ids, caption }: { lang: Lang; ids: SceneId[]; caption: string }) {
  const timeline = ids.flatMap((id, i) => Array.from({ length: sceneSteps(scenes[id]) }, (_, b) => ({ i, b: b + 1 })));
  const holdMs = (beat: number) => {
    const at = timeline[beat - 1];
    return beat === 0 ? 700 : at && timeline[beat]?.i !== at.i ? 4200 : 2200;
  };
  return (
    <Stage lang={lang} caption={caption} steps={timeline.length} holdMs={holdMs}>
      {(beat) => {
        const at = beat === 0 ? { i: 0, b: 0 } : timeline[Math.min(beat, timeline.length) - 1];
        return <ScenePhone lang={lang} id={ids[at.i]} beat={at.b} />;
      }}
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
