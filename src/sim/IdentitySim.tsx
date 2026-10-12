import { TrustCard } from "../components/ui";
import { Bubble, Phone } from "../components/phone";
import { chrome } from "../copy";
import { normalize, reg, scamWarningKind, t, type Lang } from "../shared";
import { ScamWarningCard } from "../components/ui";
import { Stage } from "./Stage";

/** The reserved-name category of a display name after normalisation and homoglyph folding, or null. */
export function reservedCategory(name: string): string | null {
  const n = normalize(name, reg.homoglyphs.map);
  for (const [cat, names] of Object.entries(reg.reserved.categories)) if (names.includes(n)) return cat;
  return null;
}

// Display names an impostor might pick, played one after another. The reserved-name result is
// computed live by the reference logic. "Itаú" uses a Cyrillic "а"; "Bradesc0" ends in a zero.
// The last one is an ordinary name, so the demo also shows that normal names pass.
const NAMES: { name: string; text: string }[] = [
  { name: "Itаú", text: "Sua conta foi bloqueada. Confirme seus dados." },
  { name: "Bradesc0", text: "Seu cartão foi clonado. Responda pra cancelar a compra." },
  { name: "gov.br", text: "Você tem um valor a receber. Confirme seu CPF pra liberar." },
  { name: "Caixa Econômica Federal", text: "Seu FGTS está disponível pra saque." },
  { name: "Ana Souza", text: "Oi! Sou a Ana, da aula de yoga" },
];
const TIMELINE = NAMES.flatMap((n, i) => (reservedCategory(n.name) ? [{ i, b: 1 }, { i, b: 2 }] : [{ i, b: 1 }]));
const hold = (beat: number) => {
  const at = TIMELINE[beat - 1];
  const last = at && TIMELINE[beat]?.i !== at.i;
  return beat === 0 ? 700 : last ? 3600 : 1800;
};

export function IdentitySim({ lang, caption }: { lang: Lang; caption: string }) {
  return (
    <Stage lang={lang} caption={caption} steps={TIMELINE.length} holdMs={hold}>
      {(beat) => {
        const at = beat === 0 ? { i: 0, b: 0 } : TIMELINE[Math.min(beat, TIMELINE.length) - 1];
        const { name, text } = NAMES[at.i];
        const reserved = reservedCategory(name);
        const kind = scamWarningKind(text, reg);
        return (
          <Phone
            lang={lang}
            head={<>
              <div className="avatar d4" style={{ width: 32, height: 32, fontSize: 18 }}>{name.charAt(0).toUpperCase()}</div>
              <div className="who">
                <div className="name">{name}</div>
                <div className="sub">{chrome[lang].notInContacts}</div>
              </div>
            </>}
          >
            {at.b >= 1 && (
              <div className="msg" key={at.i}>
                <Bubble lang={lang}>{text}</Bubble>
                {kind && <ScamWarningCard lang={lang} kind={kind} />}
              </div>
            )}
            {at.b >= 2 && reserved && (
              <div className="msg card-item">
                <TrustCard level="danger" icon="warning" title={t(lang, "proseio_warning_reserved_name")} />
              </div>
            )}
          </Phone>
        );
      }}
    </Stage>
  );
}
