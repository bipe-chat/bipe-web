// The /empresas/ minis: three small, clickable illustrations of the business proposal
// (bipe/docs/business-track.md, ADRs 0069, 0078, 0081). Nothing here exists yet: every mini says it is
// an illustration with sample data. Labels are chrome[lang].biz; sample people and messages come from
// the cast and scenes.ts. A customer on WhatsApp shows by name only, never by phone number (ADR 0015).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar, label, who } from "../cast";
import { Mark } from "../components/brand";
import { Bubble, Phone } from "../components/phone";
import { Icon } from "../components/ui";
import { chrome } from "../copy";
import type { Lang } from "../shared";
import { PollCard } from "./SceneParts";
import { ChatHead } from "./ScenePhone";
import { apiDemo, continueDemo, deskChats, deskQuestion, savedReplies, text, type Channel, type Line } from "./scenes";
import "./BusinessMinis.css";

const biz = (lang: Lang) => chrome[lang].biz;

/** Timers that die with the component. */
function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((id) => window.clearTimeout(id)), []);
  return {
    later(fn: () => void, ms: number) { ids.current.push(window.setTimeout(fn, ms)); },
    clear() { ids.current.forEach((id) => window.clearTimeout(id)); ids.current = []; },
  };
}

/** Channel pill. WhatsApp is a neutral grey pill with the word only: no logo, no brand colours. */
function ChannelPill({ channel }: { channel: Channel }) {
  return <span className={`chan ${channel}`}>{channel === "bipe" ? "Bipe" : "WhatsApp"}</span>;
}

/* 1. Caixa de entrada ---------------------------------------------------------------------------- */

type Item =
  | { kind: "msg"; from: "customer" | "agent"; text: string }
  | { kind: "ask"; answered: boolean }
  | { kind: "chose"; option: string };

type ChatState = { items: Item[]; mine: boolean; read: boolean; notes: string[] };

function initial(lang: Lang): ChatState[] {
  return deskChats.map((c) => ({
    items: c.lines.map((l) => ({ kind: "msg" as const, from: l.from, text: text(l.text, lang) })),
    mine: false,
    read: !c.unread,
    notes: [text(c.note, lang)],
  }));
}

function AskCard({ lang, answered }: { lang: Lang; answered: boolean }) {
  const c = biz(lang);
  return (
    <div className="desk-ask">
      <div className="desk-ask-head"><Icon name="check" size={13} /> {c.ask}</div>
      <strong>{text(deskQuestion.question, lang)}</strong>
      {deskQuestion.options.map((o, i) => (
        <div className={`desk-ask-option${answered && i === deskQuestion.pick ? " mine" : ""}`} key={i}>
          <span>{text(o, lang)}</span>{answered && i === deskQuestion.pick && <Icon name="check" size={13} />}
        </div>
      ))}
    </div>
  );
}

export function InboxMini({ lang, caption }: { lang: Lang; caption: string }) {
  const c = biz(lang);
  const [chats, setChats] = useState<ChatState[]>(() => initial(lang));
  const [sel, setSel] = useState(0);
  const [view, setView] = useState<"queue" | "chat">("queue");
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const timers = useTimers();
  const log = useRef<HTMLDivElement>(null);

  const meta = deskChats[sel];
  const chat = chats[sel];
  const person = who(meta.with);
  const update = (i: number, fn: (s: ChatState) => ChatState) => setChats((all) => all.map((s, j) => (j === i ? fn(s) : s)));

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [chat.items.length, sel]);

  const open = (i: number) => {
    setSel(i);
    setView("chat");
    setDraft("");
    update(i, (s) => ({ ...s, read: true }));
  };
  const slash = draft.startsWith("/") ? savedReplies.filter((r) => r.name.startsWith(draft.slice(1).toLowerCase())) : [];
  const insert = (r: (typeof savedReplies)[number]) => setDraft(text(r.text, lang));
  const send = () => {
    const body = draft.trim();
    if (!body || body.startsWith("/")) return;
    update(sel, (s) => ({ ...s, items: [...s.items, { kind: "msg", from: "agent", text: body }] }));
    setDraft("");
  };
  const ask = () => {
    const i = sel;
    update(i, (s) => ({ ...s, items: [...s.items, { kind: "ask", answered: false }] }));
    timers.later(() => update(i, (s) => ({
      ...s,
      items: [...s.items.map((it) => (it.kind === "ask" ? { ...it, answered: true } : it)), { kind: "chose", option: text(deskQuestion.options[deskQuestion.pick], lang) }],
    })), 1400);
  };
  const addNote = () => {
    const n = note.trim();
    if (!n) return;
    update(sel, (s) => ({ ...s, notes: [...s.notes, n] }));
    setNote("");
  };

  return (
    <div className="stage biz-stage">
      <div className="mini-window desk-wrap">
        <div className="mini-bar"><span /><span /><span /><strong>{c.window}</strong></div>
        <div className={`desk view-${view}`}>
          <nav className="desk-queue" aria-label={c.queue}>
            <div className="desk-pane-title">{c.queue}</div>
            {deskChats.map((d, i) => {
              const e = who(d.with);
              const s = chats[i];
              const last = [...s.items].reverse().find((it) => it.kind === "msg");
              return (
                <button type="button" key={d.with} className={`desk-row${i === sel ? " on" : ""}`} aria-current={i === sel ? "true" : undefined} onClick={() => open(i)}>
                  <Avatar id={e.id} size={36} />
                  <span className="desk-row-main">
                    <span className="desk-row-top"><strong>{label(e)}</strong><span className="desk-time">{d.time}</span></span>
                    <span className="desk-row-mid"><ChannelPill channel={d.channel} />{s.mine && <span className="desk-owner">{c.you}</span>}</span>
                    <span className="desk-preview">{last && last.kind === "msg" ? last.text : ""}</span>
                  </span>
                  {!s.read && d.unread ? <span className="desk-unread">{d.unread}</span> : null}
                </button>
              );
            })}
          </nav>

          <section className="desk-chat" aria-label={label(person)}>
            <header className="desk-chat-head">
              <button type="button" className="desk-back" onClick={() => setView("queue")} aria-label={c.back}><Icon name="back" size={18} /></button>
              <Avatar id={person.id} size={32} />
              <div className="desk-who">
                <strong>{label(person)}</strong>
                <span><ChannelPill channel={meta.channel} /> {c.owner}: {chat.mine ? c.you : c.nobody}</span>
              </div>
              <button type="button" className="desk-btn primary" disabled={chat.mine} onClick={() => update(sel, (s) => ({ ...s, mine: true }))}>
                {chat.mine ? c.taken : c.take}
              </button>
            </header>
            <div className="desk-log" ref={log} aria-live="polite">
              {chat.items.map((it, i) => {
                if (it.kind === "msg") return <div className={`desk-msg ${it.from}`} key={i}>{it.text}</div>;
                if (it.kind === "ask") return <div className="desk-msg agent card" key={i}><AskCard lang={lang} answered={it.answered} /></div>;
                return <div className="desk-event" key={i}><Icon name="check" size={13} /> {c.chose(it.option)}</div>;
              })}
            </div>
            <div className="desk-chips" role="group" aria-label={c.saved}>
              <span className="desk-chips-label">{c.saved}:</span>
              {savedReplies.map((r) => <button type="button" className="desk-chip" key={r.name} onClick={() => insert(r)}>/{r.name}</button>)}
            </div>
            <div className="desk-compose">
              {slash.length > 0 && (
                <ul className="desk-slash" role="listbox" aria-label={c.saved}>
                  {slash.map((r) => (
                    <li key={r.name}><button type="button" role="option" aria-selected="false" onClick={() => insert(r)}><span className="mono">/{r.name}</span> {text(r.text, lang)}</button></li>
                  ))}
                </ul>
              )}
              <input
                type="text" value={draft} placeholder={c.placeholder} aria-label={c.placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (slash.length) insert(slash[0]); else send();
                }}
              />
              <button type="button" className="desk-btn primary" onClick={send}>{c.send}</button>
            </div>
            <div className="desk-actions">
              <button type="button" className="desk-btn" onClick={ask}><Icon name="check" size={14} /> {c.askButton}</button>
            </div>
          </section>

          <aside className="desk-card" aria-label={c.customer}>
            <div className="desk-pane-title">{c.customer}</div>
            <div className="desk-card-who">
              <Avatar id={person.id} size={48} />
              <strong>{person.name}</strong>
              {meta.channel === "bipe" && person.handle && <span className="muted">@{person.handle}</span>}
            </div>
            <dl>
              <dt>{c.channel}</dt><dd><ChannelPill channel={meta.channel} /></dd>
              <dt>{c.owner}</dt><dd>{chat.mine ? c.you : c.nobody}</dd>
            </dl>
            <div className="desk-notes">
              <strong>{c.notes}: <span className="muted">{c.notesHidden}</span></strong>
              <ul>{chat.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              <input type="text" value={note} placeholder={c.notePlaceholder} aria-label={c.notePlaceholder}
                onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }} />
            </div>
          </aside>
        </div>
      </div>
      <p className="caption">{caption}</p>
    </div>
  );
}

/* 2. Mesma API ----------------------------------------------------------------------------------- */

// Code lines never hold a blank line: scripts/build.mjs collapses repeated newlines in the HTML, and the
// client would then not match the prerendered text. The empty line after the headers holds one space.
const Hl = ({ children }: { children: ReactNode }) => <mark className="hl">{children}</mark>;
const q = (s: string) => JSON.stringify(s);

function RequestCode({ channel }: { channel: Channel }) {
  const to = channel === "bipe" ? `@${who(apiDemo.to).handle}` : "{wa_id}";
  const [a, b] = apiDemo.buttons;
  const btn = (x: { id: string; title: string }, last: boolean) =>
    `        { "type": "reply", "reply": { "id": ${q(x.id)}, "title": ${q(x.title)} } }${last ? "" : ","}\n`;
  return (
    <pre className="code">
      {"POST /v23.0/"}<Hl>{"{phone-number-id}"}</Hl>{"/messages\nAuthorization: Bearer {token}\n \n{\n"}
      {"  \"messaging_product\": "}<Hl>{q(channel)}</Hl>{",\n"}
      {"  \"to\": "}<Hl>{q(to)}</Hl>{",\n"}
      {"  \"type\": \"interactive\",\n  \"interactive\": {\n    \"type\": \"button\",\n"}
      {`    "body": { "text": ${q(apiDemo.question)} },\n`}
      {"    \"action\": {\n      \"buttons\": [\n"}
      {btn(a, false)}{btn(b, true)}
      {"      ]\n    }\n  }\n}"}
    </pre>
  );
}

function WebhookCode({ channel }: { channel: Channel }) {
  const from = channel === "bipe" ? `@${who(apiDemo.to).handle}` : "{wa_id}";
  const x = apiDemo.buttons[apiDemo.pick];
  return (
    <pre className="code">
      {"{\n  \"object\": \"whatsapp_business_account\",\n  \"entry\": [{ \"changes\": [{\n    \"field\": \"messages\",\n    \"value\": {\n"}
      {"      \"messaging_product\": "}<Hl>{q(channel)}</Hl>{",\n"}
      {"      \"messages\": [{\n        \"from\": "}<Hl>{q(from)}</Hl>{",\n"}
      {"        \"type\": \"interactive\",\n        \"interactive\": {\n          \"type\": \"button_reply\",\n"}
      {"          \"button_reply\": { \"id\": "}<Hl>{q(x.id)}</Hl>{`, "title": ${q(x.title)} }\n`}
      {"        }\n      }]\n    }\n  }] }]\n}"}
    </pre>
  );
}

function ApiPhone({ lang, channel, phase }: { lang: Lang; channel: Channel; phase: number }) {
  const company = who(apiDemo.from);
  const pick = apiDemo.buttons[apiDemo.pick];
  if (channel === "bipe") {
    const line: Extract<Line, { card: "poll" }> = {
      card: "poll", ask: true, question: apiDemo.question,
      options: apiDemo.buttons.map((b) => ({ label: b.title, votes: 0 })),
      mine: phase >= 2 ? apiDemo.pick : undefined,
    };
    return (
      <Phone lang={lang} head={<ChatHead lang={lang} id={company.id} trust={company.trust} />}>
        {phase >= 1 && <div className="msg card-item" key="ask"><PollCard lang={lang} line={line} /></div>}
      </Phone>
    );
  }
  return (
    <div className="other-app">
      <Phone lang={lang} head={<><Avatar id={company.id} size={32} /><div className="who"><div className="name">{label(company)}</div><div className="sub">WhatsApp</div></div></>}>
        {phase >= 1 && (
          <div className="msg" key="ask">
            <Bubble lang={lang}>{apiDemo.question}</Bubble>
            <div className="wa-buttons">{apiDemo.buttons.map((b) => <span key={b.id}>{b.title}</span>)}</div>
          </div>
        )}
        {phase >= 2 && <div className="msg"><Bubble lang={lang} out>{pick.title}</Bubble></div>}
      </Phone>
    </div>
  );
}

export function ApiMini({ lang, caption }: { lang: Lang; caption: string }) {
  const c = biz(lang);
  const [channel, setChannel] = useState<Channel>("bipe");
  const [phase, setPhase] = useState(0);
  const timers = useTimers();
  const pick = (ch: Channel) => { timers.clear(); setChannel(ch); setPhase(0); };
  const send = () => {
    timers.clear();
    setPhase(1);
    timers.later(() => setPhase(2), 1600);
  };
  return (
    <div className="stage biz-stage">
      <div className="api-mini">
        <div className="api-head">
          <div className="seg" role="group" aria-label={c.apiChannel}>
            {(["whatsapp", "bipe"] as const).map((ch) => (
              <button type="button" key={ch} aria-pressed={channel === ch} onClick={() => pick(ch)}>{ch === "bipe" ? "Bipe" : "WhatsApp"}</button>
            ))}
          </div>
          <p className="small muted api-legend"><span className="mono">{"{phone-number-id}"}</span>: {c.apiIdIs[channel]}</p>
        </div>
        <div className="api-req">
          <div className="api-label">{c.apiRequest}</div>
          <RequestCode channel={channel} />
        </div>
        <button type="button" className="desk-btn primary api-send" onClick={send}><Icon name="send" size={14} /> {phase ? c.apiAgain : c.apiSend}</button>
        <div className="biz-phone api-phone">
          <ApiPhone lang={lang} channel={channel} phase={phase} />
          {phase >= 2 && <p className="small muted api-tapped">{c.apiTapped}</p>}
        </div>
        <div className="api-hook">
          <div className="api-label">{c.apiWebhook}</div>
          <div aria-live="polite">
            {phase >= 2 ? <WebhookCode channel={channel} /> : <p className="small muted api-wait">{phase === 1 ? "…" : c.apiWaiting}</p>}
          </div>
        </div>
      </div>
      <p className="caption">{caption}</p>
    </div>
  );
}

/* 3. Do WhatsApp para o Bipe --------------------------------------------------------------------- */

const STEPS = 3;

function ContinueStep({ lang, step }: { lang: Lang; step: number }) {
  const company = who(continueDemo.company);
  const handle = company.handle ?? "";
  const path = `@${handle}/continuar/${continueDemo.code}`;
  const message = `continuar ${continueDemo.code}`;
  const c = chrome[lang];
  const page = "link" in c.biz ? c.biz.link : chrome.pt.profile;
  if (step === 0) {
    return (
      <div className="other-app">
        <Phone lang={lang} head={<><Avatar id={company.id} size={32} /><div className="who"><div className="name">{label(company)}</div><div className="sub">WhatsApp</div></div></>}>
          <div className="msg"><Bubble lang={lang} out>{text(continueDemo.ask, lang)}</Bubble></div>
          <div className="msg"><Bubble lang={lang}>{text(continueDemo.offer(`bipe.chat/${path}`), lang)}</Bubble></div>
        </Phone>
      </div>
    );
  }
  if (step === 1) {
    return (
      <Phone lang={lang} layout="form" head={<span className="mono url">bipe.chat/{path}</span>}>
        <div className="msg link-page">
          <Mark size={36} />
          <strong>{page.continueTitle(handle)}</strong>
          <p className="sub">{page.continueLead}</p>
          <p className="sub">{page.continueMessage}</p>
          <div className="handle-field mono">{message}</div>
          <span className="pill wide">{c.biz.openInBipe}</span>
          <p className="sub">{page.continueOneUse}</p>
        </div>
      </Phone>
    );
  }
  return (
    <Phone lang={lang} head={<ChatHead lang={lang} id={company.id} trust={company.trust} />}>
      <div className="msg"><Bubble lang={lang} out>{message}</Bubble></div>
      <div className="msg"><Bubble lang={lang}>{text(continueDemo.reply, lang)}</Bubble></div>
    </Phone>
  );
}

export function ContinueMini({ lang, caption }: { lang: Lang; caption: string }) {
  const c = biz(lang);
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);
  const [auto, setAuto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-advance only with motion allowed, while on screen, and not while the pointer or focus is on it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setAuto(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !visible || held) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % STEPS), step === STEPS - 1 ? 6000 : 4200);
    return () => window.clearTimeout(id);
  }, [auto, visible, held, step]);

  const go = (s: number) => { setStep(s); setAuto(false); };
  return (
    <div
      className="stage biz-stage" ref={ref}
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}
    >
      <ol className="steps-dots">
        {c.steps.map((s, i) => (
          <li key={s} className={i === step ? "on" : ""}>
            <button type="button" onClick={() => go(i)} aria-current={i === step ? "step" : undefined}>
              <span className="dot">{i + 1}</span><span className="steps-label">{s}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="biz-phone" aria-live="polite">
        <p className="small muted step-now">{c.step(step + 1, STEPS)}: {c.steps[step]}</p>
        <div className="step-tag">{step === 0 ? <span className="chan whatsapp">WhatsApp</span> : <span className="chan bipe">Bipe</span>}</div>
        <ContinueStep key={step} lang={lang} step={step} />
      </div>
      <div className="controls">
        <button type="button" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>{c.prev}</button>
        <button type="button" onClick={() => go((step + 1) % STEPS)}>{c.next}</button>
      </div>
      <p className="caption">{caption}</p>
    </div>
  );
}
