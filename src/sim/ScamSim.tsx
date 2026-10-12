import { useState } from "react";
import vectors from "@shared/test-vectors/scam-warnings.json";
import { chrome } from "../copy";
import { Icon, Phone, ScamWarningCard } from "../components/ui";
import { scamWarningKind, reg, type Lang } from "../shared";
import { Stage } from "./Stage";

// Sample messages come from the shared test vectors, and the warning under each one is computed
// live by the reference detector. If a registry change stops a message from warning, the demo shows it.
const vector = (kind: string) => {
  const v = vectors.vectors.find((x) => x.kind === kind);
  if (!v) throw new Error(`no scam-warnings vector for ${kind}`);
  return v.message;
};

const SCRIPT: { from: "in" | "out"; text: { pt: string; en: string } }[] = [
  { from: "in", text: { pt: vector("newNumber"), en: vector("newNumber") } },
  { from: "out", text: { pt: "Quem é?", en: "Quem é? (Who is this?)" } },
  { from: "in", text: { pt: vector("pixKey"), en: vector("pixKey") } },
];
const hold = (beat: number) => (beat === 0 ? 900 : beat >= SCRIPT.length ? 5200 : 2600);

export function ScamSim({ lang, caption }: { lang: Lang; caption: string }) {
  return (
    <Stage lang={lang} caption={caption} steps={SCRIPT.length} holdMs={hold}>
      {(beat) => (
        <Phone
          lang={lang}
          head={<>
            <div className="avatar">?</div>
            <div className="who">
              <div className="name">+55 11 98765-4321</div>
              <div className="sub">{lang === "pt" ? "Não está nos seus contatos" : "Not in your contacts"}</div>
            </div>
          </>}
        >
          {SCRIPT.slice(0, beat).map((m, i) => {
            const kind = m.from === "in" ? scamWarningKind(m.text[lang], reg) : null;
            return (
              <div className="msg" key={i}>
                <div className={`bubble ${m.from}`}>{m.text[lang]}</div>
                {kind && <ScamWarningCard lang={lang} kind={kind} />}
              </div>
            );
          })}
        </Phone>
      )}
    </Stage>
  );
}

const EXAMPLES = vectors.vectors.map((v) => v.message).slice(0, 10);

export function ScamTry({ lang }: { lang: Lang }) {
  const c = chrome[lang];
  const [text, setText] = useState(vector("receipt"));
  const kind = text.trim() ? scamWarningKind(text, reg) : null;
  return (
    <div className="tryit">
      <label htmlFor="scam-try">{c.tryScam}</label>
      <textarea id="scam-try" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="examples" aria-label={c.examples}>
        {EXAMPLES.map((m) => <button type="button" key={m} onClick={() => setText(m)}>{m.length > 38 ? m.slice(0, 36) + "…" : m}</button>)}
      </div>
      <div className="result" aria-live="polite">
        {kind ? <ScamWarningCard lang={lang} kind={kind} /> : <div className="ok"><Icon name="check" size={14} /> {c.noWarning}</div>}
      </div>
      <p className="small muted">{c.tryScamHint}</p>
    </div>
  );
}
