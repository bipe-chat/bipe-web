import { useState } from "react";
import { Avatar, who } from "../cast";
import { chrome } from "../copy";
import { Seal } from "../components/brand";
import { Icon, TrustCard } from "../components/ui";
import { Bubble, Phone } from "../components/phone";
import { normalize, reg, t, type Lang } from "../shared";
import { Stage } from "./Stage";

/** The reserved-name category of a display name after normalisation and homoglyph folding, or null. */
export function reservedCategory(name: string): string | null {
  const n = normalize(name, reg.homoglyphs.map);
  for (const [cat, names] of Object.entries(reg.reserved.categories)) if (names.includes(n)) return cat;
  return null;
}

// "Itаú" below uses a Cyrillic "а". The check folds it and finds the reserved bank name.
const IMPOSTOR = "It\u0430\u00fa";
const VERIFIED = who("joana").name!;
const hold = (beat: number) => (beat === 0 ? 900 : beat >= 3 ? 5600 : 2800);

export function IdentitySim({ lang, caption }: { lang: Lang; caption: string }) {
  const mom = lang === "pt" ? "Mãe" : "Mom";
  return (
    <Stage lang={lang} caption={caption} steps={3} holdMs={hold}>
      {(beat) => (
        <Phone
          lang={lang}
          head={<>
            <Avatar id="joana" size={32} savedAs={mom} />
            <div className="who">
              <div className="name">{mom} <Seal size={16} label={t(lang, "proseio_badge_verified")} /></div>
              <div className="sub">{t(lang, "proseio_badge_verified_name", VERIFIED)}</div>
            </div>
          </>}
        >
          {beat >= 1 && (
            <div className="msg">
              <TrustCard level="caution" title={t(lang, "proseio_warning_nickname_confirm_title")}>
                {t(lang, "proseio_warning_nickname_confirm_body", mom, VERIFIED)}
                <div className="buttons">
                  <span>{t(lang, "proseio_action_nickname_confirm_yes")}</span>
                  <span>{t(lang, "proseio_action_nickname_confirm_unsure")}</span>
                </div>
              </TrustCard>
            </div>
          )}
          {beat >= 2 && (
            <div className="msg">
              <Bubble lang={lang}><strong>{IMPOSTOR}</strong><br />{lang === "pt" ? "Sua conta foi bloqueada. Confirme seus dados." : "Sua conta foi bloqueada. (Your account was blocked.)"}</Bubble>
            </div>
          )}
          {beat >= 3 && reservedCategory(IMPOSTOR) && (
            <div className="msg">
              <TrustCard level="danger" icon="warning" title={t(lang, "proseio_warning_reserved_name")} />
            </div>
          )}
        </Phone>
      )}
    </Stage>
  );
}

const NAME_EXAMPLES = ["Nubank", IMPOSTOR, "Bradesc0", "Ana Souza", "Caixa Econômica Federal", "gov.br"];

export function NameTry({ lang }: { lang: Lang }) {
  const c = chrome[lang];
  const [name, setName] = useState("Bradesc0");
  const cat = name.trim() ? reservedCategory(name) : null;
  return (
    <div className="tryit">
      <label htmlFor="name-try">{c.tryName}</label>
      <input id="name-try" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" spellCheck={false} />
      <div className="examples" aria-label={c.examples}>
        {NAME_EXAMPLES.map((m) => <button type="button" key={m} onClick={() => setName(m)}>{m}</button>)}
      </div>
      <div className="result" aria-live="polite">
        <p className="small muted">{c.normalized}: <span className="mono">{normalize(name, reg.homoglyphs.map) || "…"}</span></p>
        {cat ? <TrustCard level="danger" icon="warning" title={t(lang, "proseio_warning_reserved_name")} /> : name.trim() && <div className="ok"><Icon name="check" size={14} /> {lang === "pt" ? "Nome livre." : "Name is free."}</div>}
      </div>
      <p className="small muted">{c.tryNameHint}</p>
    </div>
  );
}
