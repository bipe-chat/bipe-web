import { useState } from "react";
import { Avatar, label, who, type CastEntry, type Trust } from "../cast";
import { CompanySeal, Mark, Seal } from "../components/brand";
import { chrome } from "../copy";
import { Icon, ScamWarningCard, TrustCard } from "../components/ui";
import { Bubble, Phone, PhonePalette, runs, TabBar } from "../components/phone";
import { appPalettes, reg, scamWarningKind, t, type Lang } from "../shared";
import { ME, REAL_VS_FAKE, scenes, text, TRUST_LEVEL_SCENES, type InboxRow, type Line, type Scene, type SceneId } from "./scenes";
import { PixCard } from "./PixCard";
import { AccountSwitcher, AppLockScreen, CallLine, ChargeCard, Contacts, Guardians, JoinCard, LocationBody, Lookup, PauseCard, PollCard, ReadOnlyBar, Requests, Scan, SettingsList, StickerPicker, VerifyPix, VoiceBody } from "./SceneParts";
import settingsJson from "@shared/registries/settings.json";
import { Stage } from "./Stage";
import { AgendaDay, AgendaReminder, BookFlow } from "./AgendaParts";
import { CatalogView, OrderFlow, QueueView, QuoteChat } from "./BusinessToolParts";
import { PixCheckFlow } from "./PixCheckScene";

/** The mark next to a name. The same state looks the same everywhere (design/trust-ui.md). */
export function TrustMark({ lang, trust, size = 14 }: { lang: Lang; trust: Trust; size?: number }) {
  if (trust === "pix" || trust === "govbr") return <Seal size={size} label={t(lang, "bipe_badge_verified")} />;
  if (trust === "contact") return <span className="seal-qr"><Seal size={size} label={t(lang, "bipe_badge_verified_contact")} /></span>;
  if (trust === "institution") return <Seal size={size} label={t(lang, "bipe_badge_institution")} />;
  if (trust === "company") return <CompanySeal size={size} label={t(lang, "bipe_badge_company")} />;
  if (trust === "suspended") return <span className="seal off" title={t(lang, "bipe_badge_suspended")}><Mark size={size} /></span>;
  if (trust === "external") return <span className="globe"><Icon name="globe" size={size} /></span>;
  if (trust === "bot") return <span className="bot-mark">{chrome[lang].sim.bot.mark}</span>;
  return null;
}

function subline(lang: Lang, e: CastEntry, trust: Trust) {
  const c = chrome[lang];
  if (e.kind === "group") return c.people(e.members ?? 0);
  if (trust === "pix" || trust === "govbr") return t(lang, "bipe_badge_verified_name", e.name ?? "");
  if (trust === "contact") return t(lang, "bipe_badge_verified_contact");
  if (trust === "institution") return `${t(lang, "bipe_badge_institution")} · CNPJ ${e.cnpj}`;
  if (trust === "company") return `${t(lang, "bipe_badge_company")} · CNPJ ${e.cnpj}`;
  if (trust === "suspended") return <span className="caution-text">{t(lang, "bipe_badge_suspended")}</span>;
  if (trust === "bot" && e.owner) return c.sim.bot.of(label(who(e.owner)));
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

function Card({ lang, line, partner, savedAs, beat }: { lang: Lang; line: Exclude<Line, { from: string }>; partner: CastEntry; savedAs?: string; beat: number }) {
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
    case "pause":
      return <PauseCard lang={lang} seconds={line.seconds} />;
    case "app":
      return <TrustCard level="neutral" icon="check">{t(lang, line.key, ...(line.args ?? []))}</TrustCard>;
    case "charge":
      return <ChargeCard lang={lang} from={partner} amount={line.amount} description={text(line.description, lang)} paid={line.paidAt !== undefined && beat >= line.paidAt} />;
    case "poll":
      return <PollCard lang={lang} line={line} />;
    case "join":
      return <JoinCard lang={lang} id={line.person} />;
    case "bot":
      return <TrustCard level="neutral" icon="bot">{chrome[lang].sim.bot.reads(label(partner), label(who(partner.owner ?? partner.id)))}</TrustCard>;
    case "call":
      return <CallLine lang={lang} line={line} />;
    case "alert":
      return <TrustCard level={line.level} icon={line.level === "danger" ? "warning" : "shield"} title={line.title && t(lang, line.title, ...(line.titleArgs ?? []))}>{t(lang, line.key, ...(line.args ?? []))}</TrustCard>;
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
        if (!("from" in line)) return <div className="msg card-item" key={i}><Card lang={lang} line={line} partner={partner} savedAs={scene.savedAs} beat={beat} /></div>;
        if ("sticker" in line) return <div className="msg" key={i}><div className={`bubble-row ${line.from === ME ? "out" : "in"} single`}><span className="sticker-art big s1">{line.sticker}</span></div></div>;
        const body = "voice" in line ? <VoiceBody lang={lang} length={line.voice} transcript={text(line.transcript, lang)} />
          : "location" in line ? <LocationBody lang={lang} place={text(line.location, lang)} until={line.until} />
          : text(line.text, lang);
        if (line.from === ME) return <div className="msg" key={i}><Bubble lang={lang} out run={run[i]}>{body}</Bubble></div>;
        // Incoming messages, and the transcript of incoming voice messages, go through the reference detector, the same as in the app.
        const checked = "voice" in line ? line.transcript : "text" in line ? line.text : null;
        const kind = checked && scamWarningKind(typeof checked === "string" ? checked : checked.pt, reg);
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

export function sceneSteps(s: Scene): number {
  switch (s.kind) {
    case "chat": return s.lines.length;
    case "inbox": return s.rows.length + (s.requests ? 1 : 0);
    case "lookup": return s.typed.length;
    case "scan": case "verifyPix": return 3;
    case "contacts": return s.found.length + 1;
    case "trustProfile": return 1;
    case "book": return 6;
    case "agendaDay": case "agendaReminder": case "queue": return 3;
    case "catalog": case "pixCheck": return 2;
    case "order": case "quote": return 4;
    case "settings": return s.sections.length;
    case "appLock": return 1;
    case "accounts": return s.ids.length + 1;
    case "guardians": return 2;
  }
}

/**
 * The app palette of a scene (ADR 0213): fixed per scene id, so a page shows the same colours on every build,
 * and spread over all the palettes, as the store panels are. Default chosen; a scene can get its own later.
 */
export function scenePalette(id: SceneId): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return appPalettes[h % appPalettes.length];
}

/** One scene on the phone, up to `beat`. Pass a large beat for the finished, static state. */
export function ScenePhone(props: { lang: Lang; id: SceneId; beat?: number }) {
  return (
    <PhonePalette.Provider value={scenePalette(props.id)}>
      <SceneBody {...props} />
    </PhonePalette.Provider>
  );
}

function SceneBody({ lang, id, beat = Infinity }: { lang: Lang; id: SceneId; beat?: number }) {
  const scene: Scene = scenes[id];
  const sim = chrome[lang].sim;
  switch (scene.kind) {
    case "inbox": {
      const offset = scene.requests ? 1 : 0;
      return (
        <Phone lang={lang} layout="list" head={t(lang, "bipe_tab_chats")} footer={<TabBar lang={lang} active="chats" />}>
          {scene.requests && beat >= 1 && <Requests lang={lang} rows={scene.requests} />}
          {scene.rows.slice(0, Math.max(0, beat - offset)).map((row) => <InboxItem lang={lang} row={row} key={row.with} />)}
        </Phone>
      );
    }
    case "trustProfile":
      return (
        <Phone lang={lang} layout="list" head={t(lang, "bipe_trust_title")} footer={<TabBar lang={lang} active="you" />}>
          <TrustProfile lang={lang} me={scene.me} done={scene.done} beat={beat} />
        </Phone>
      );
    case "lookup":
      return <Phone lang={lang} layout="form" head={sim.newChat}><Lookup lang={lang} typed={scene.typed} beat={beat} /></Phone>;
    case "scan":
      if (beat >= 3) {
        const e = who(scene.with);
        return (
          <Phone lang={lang} head={<ChatHead lang={lang} id={scene.with} trust={e.trust} />}>
            <div className="msg"><Bubble lang={lang} out>{text(scene.first, lang)}</Bubble></div>
          </Phone>
        );
      }
      return <Phone lang={lang} layout="form" head={sim.scanTitle}><Scan lang={lang} id={scene.with} beat={beat} /></Phone>;
    case "verifyPix":
      return <Phone lang={lang} layout="form" head={t(lang, "bipe_trust_title")}><VerifyPix lang={lang} me={scene.me} beat={beat} /></Phone>;
    case "contacts":
      return <Phone lang={lang} layout="form" head={t(lang, "bipe_contacts_title")}><Contacts lang={lang} found={scene.found} beat={beat} /></Phone>;
    case "book":
      return <BookFlow lang={lang} id={scene.with} beat={beat} />;
    case "agendaDay":
      return <AgendaDay lang={lang} beat={beat} />;
    case "agendaReminder":
      return <AgendaReminder lang={lang} id={scene.with} beat={beat} />;
    case "pixCheck":
      return <PixCheckFlow lang={lang} from={scene.from} message={scene.text} code={scene.code} beat={beat} />;
    case "catalog":
      return <CatalogView lang={lang} id={scene.with} beat={beat} />;
    case "order":
      return <OrderFlow lang={lang} id={scene.with} beat={beat} />;
    case "quote":
      return <QuoteChat lang={lang} id={scene.with} beat={beat} />;
    case "queue":
      return <QueueView lang={lang} id={scene.with} beat={beat} />;
    case "settings": {
      const g = (settingsJson as unknown as { groups: { key: string; title: string }[] }).groups.find((x) => x.key === scene.group);
      return (
        <Phone lang={lang} layout="form" head={g ? t(lang, g.title) : ""}>
          <SettingsList lang={lang} groups={(settingsJson as unknown as { groups: Parameters<typeof SettingsList>[0]["groups"] }).groups} group={scene.group} sections={scene.sections} on={scene.on} beat={beat} />
        </Phone>
      );
    }
    case "appLock":
      return <Phone lang={lang} layout="list" head="" footer={<div />}><AppLockScreen lang={lang} beat={beat} /></Phone>;
    case "accounts":
      return <Phone lang={lang} layout="form" head={t(lang, "bipe_app_account_switcher_title")} footer={<TabBar lang={lang} active="you" />}><AccountSwitcher lang={lang} ids={scene.ids} beat={beat} /></Phone>;
    case "guardians":
      return <Phone lang={lang} layout="form" head={t(lang, "bipe_theft_title")}><Guardians lang={lang} guardians={scene.guardians} guarding={scene.guarding} beat={beat} /></Phone>;
    case "chat": {
      const trust = scene.trust ?? who(scene.with).trust;
      const footer = scene.footer === "readOnly" ? <ReadOnlyBar lang={lang} /> : scene.footer === "stickers" ? <StickerPicker lang={lang} /> : undefined;
      return (
        <Phone lang={lang} head={<ChatHead lang={lang} id={scene.with} savedAs={scene.savedAs} trust={trust} />} footer={footer}>
          <ChatBody lang={lang} scene={scene} beat={beat} />
        </Phone>
      );
    }
  }
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

/** Real vs fake: pick an institution, the fake and the real chat play side by side. */
export function RealVsFake({ lang }: { lang: Lang }) {
  const [i, setI] = useState(0);
  const c = chrome[lang].realFake;
  const pair = REAL_VS_FAKE[i];
  return (
    <div className="real-fake">
      <div className="level-picker real-fake-picker" role="group" aria-label={c.label}>
        {REAL_VS_FAKE.map((p, n) => (
          <button type="button" key={p.tab} aria-pressed={n === i} onClick={() => setI(n)}>{c.tabs[p.tab]}</button>
        ))}
      </div>
      <div className="real-fake-phones">
        <div className="real-fake-col fake"><p className="real-fake-tag">{c.fake}</p><SceneSim key={pair.fake} lang={lang} id={pair.fake} caption={c.fakeCaption} /></div>
        <div className="real-fake-col real"><p className="real-fake-tag">{c.real}</p><SceneSim key={pair.real} lang={lang} id={pair.real} caption={c.realCaption} /></div>
      </div>
    </div>
  );
}
