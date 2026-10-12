// Phone scenes for the site: one per trust state, plus the chat list and the trust profile.
// People come from the cast (src/cast/cast.json). Card text comes from the app strings through t().
// Scam warnings are never written here: ScenePhone runs every incoming message through the
// reference detector, the same as the app. Messages are sample data in pt-BR; the English page
// shows a gloss in brackets.
import type { Trust } from "../cast";

type Text = string | { pt: string; en: string };

export type Line =
  | { from: string; text: Text }
  | { card: "unverified"; age: Text }
  | { card: "external" | "securityChange" | "suspended" | "mismatch" }
  | { card: "nickname" }
  | { card: "pix"; amount: string; out?: boolean }
  | { card: "notice"; text: Text };

export type InboxRow = { with: string; savedAs?: string; trust?: Trust; preview: string; time: string; unread?: number };

export type Scene =
  | { kind: "chat"; with: string; savedAs?: string; trust?: Trust; names?: Record<string, string>; lines: Line[] }
  | { kind: "inbox"; rows: InboxRow[] }
  | { kind: "trustProfile"; me: string; done: number };

export const ME = "me";

export const scenes = {
  verificado: {
    kind: "chat", with: "rafa",
    lines: [
      { from: ME, text: { pt: "Oi Rafa, a bike ainda tá disponível?", en: "Oi Rafa, a bike ainda tá disponível? (Is the bike still for sale?)" } },
      { from: "rafa", text: { pt: "Tá sim! Fica 850 com a revisão feita", en: "Tá sim! Fica 850 com a revisão feita (Yes! 850, serviced)" } },
      { from: ME, text: { pt: "Fechado, vou te mandar o Pix", en: "Fechado, vou te mandar o Pix (Deal, sending the Pix)" } },
      { card: "pix", amount: "R$ 850,00", out: true },
    ],
  },
  "numero-novo": {
    kind: "chat", with: "golpista",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "golpista", text: "Oi filha, troquei de número. Salva esse aqui" },
      { from: ME, text: { pt: "Mãe? O que houve com o outro?", en: "Mãe? O que houve com o outro? (Mom? What happened to the old one?)" } },
      { from: "golpista", text: "Caiu na água. Preciso pagar um boleto hoje ainda, me faz um Pix que amanhã te devolvo" },
    ],
  },
  "nome-diferente": {
    kind: "chat", with: "joao", savedAs: "Paulo Mendes",
    lines: [
      { from: "joao", text: "Oi sobrinha, tô sem acesso ao app do banco. Me empresta 850? Devolvo sexta" },
      { card: "pix", amount: "R$ 850,00" },
      { card: "mismatch" },
    ],
  },
  "aparelho-novo": {
    kind: "chat", with: "fernanda", trust: "suspended",
    lines: [
      { card: "securityChange" },
      { from: "fernanda", text: { pt: "Oi! Comprei celular novo, tô configurando tudo", en: "Oi! Comprei celular novo, tô configurando tudo (Got a new phone, setting it up)" } },
      { from: ME, text: { pt: "Beleza. Me liga rapidinho pra eu confirmar que é você?", en: "Beleza. Me liga rapidinho pra eu confirmar que é você? (Call me so I know it is you?)" } },
      { from: "fernanda", text: { pt: "Ligo sim, 2 min", en: "Ligo sim, 2 min (Sure, 2 min)" } },
    ],
  },
  "de-fora": {
    kind: "chat", with: "marina",
    lines: [
      { card: "external" },
      { from: "marina", text: { pt: "Oi Gabi! Te achei pelo seu @. Uso outro servidor Matrix", en: "Oi Gabi! Te achei pelo seu @. Uso outro servidor Matrix (Found you by your @, I use another Matrix server)" } },
      { from: ME, text: { pt: "Oi Marina! Chegou certinho aqui", en: "Oi Marina! Chegou certinho aqui (Hi Marina! It arrived fine)" } },
    ],
  },
  instituicao: {
    kind: "chat", with: "clinica",
    lines: [
      { card: "notice", text: "Sua consulta é amanhã, às 14h, com a Dra. Ana. Responda 1 para confirmar ou 2 para remarcar." },
      { from: ME, text: "1" },
      { from: "clinica", text: "Consulta confirmada. Até amanhã." },
    ],
  },
  mae: {
    kind: "chat", with: "joana", savedAs: "Mãe",
    lines: [
      { card: "nickname" },
      { from: "joana", text: { pt: "Filha, chego sábado de manhã. Me busca na rodoviária?", en: "Filha, chego sábado de manhã. Me busca na rodoviária? (Arriving Saturday morning. Pick me up at the bus station?)" } },
      { from: ME, text: { pt: "Busco sim, mãe", en: "Busco sim, mãe (Sure, mom)" } },
    ],
  },
  grupo: {
    kind: "chat", with: "familia", names: { joana: "Mãe", antonio: "Vô Antônio" },
    lines: [
      { from: "antonio", text: { pt: "Bom dia, família! Domingo tem almoço aqui em casa", en: "Bom dia, família! Domingo tem almoço aqui em casa (Sunday lunch at my place)" } },
      { from: "cida", text: { pt: "Bom dia! Levo a sobremesa", en: "Bom dia! Levo a sobremesa (I will bring dessert)" } },
      { from: "joana", text: { pt: "Eu levo a farofa", en: "Eu levo a farofa (I will bring farofa)" } },
      { from: "kaua", text: { pt: "Eu levo o violão", en: "Eu levo o violão (I will bring the guitar)" } },
      { from: ME, text: { pt: "Vou sim! Levo o refri", en: "Vou sim! Levo o refri (Coming! I will bring soda)" } },
    ],
  },
  "falso-suporte": {
    kind: "chat", with: "suporte",
    lines: [
      { card: "unverified", age: { pt: "5 horas", en: "5 hours" } },
      { from: "suporte", text: "Olá, aqui é da central de segurança do seu banco. Identificamos uma compra de R$ 2.399 no seu cartão. Foi você?" },
      { from: ME, text: { pt: "Não fui eu!", en: "Não fui eu! (It wasn't me!)" } },
      { from: "suporte", text: "Pra cancelar a compra, me passa o código que chegou agora por SMS" },
    ],
  },
  "renda-extra": {
    kind: "chat", with: "camila",
    lines: [
      { card: "unverified", age: { pt: "3 dias", en: "3 days" } },
      { from: "camila", text: "Oi! Temos uma vaga de renda extra: você ganha R$ 50 por tarefa curtindo vídeos. Posso explicar?" },
      { from: ME, text: { pt: "Como funciona?", en: "Como funciona? (How does it work?)" } },
      { from: "camila", text: "Pra liberar seus ganhos, faz um Pix de R$ 30 de taxa pra chave 11987654321" },
    ],
  },
  pessoalmente: {
    kind: "chat", with: "pedro",
    lines: [
      { from: "pedro", text: { pt: "Foi ótimo te conhecer ontem! Te mandei o arquivo da apresentação", en: "Foi ótimo te conhecer ontem! Te mandei o arquivo da apresentação (Great to meet you yesterday! Sent you the slides)" } },
      { from: ME, text: { pt: "Recebi! Valeu, Pedro", en: "Recebi! Valeu, Pedro (Got it, thanks Pedro)" } },
    ],
  },
  condominio: {
    kind: "chat", with: "condominio", names: { valdir: "Seu Valdir (síndico)" },
    lines: [
      { from: "valdir", text: { pt: "Pessoal, a água vai ser cortada amanhã das 8h às 12h", en: "Pessoal, a água vai ser cortada amanhã das 8h às 12h (Water is off tomorrow from 8 to 12)" } },
      { from: "ivone", text: { pt: "Marmita de frango hoje, 22 reais. Quem quiser me chama", en: "Marmita de frango hoje, 22 reais. Quem quiser me chama (Chicken lunch boxes today, 22 reais)" } },
      { from: "lucia", text: { pt: "Obrigada, Seu Valdir", en: "Obrigada, Seu Valdir (Thank you, Seu Valdir)" } },
      { from: ME, text: { pt: "Dona Ivone, quero duas!", en: "Dona Ivone, quero duas! (Dona Ivone, two for me!)" } },
    ],
  },
  conversas: {
    kind: "inbox",
    rows: [
      { with: "joana", savedAs: "Mãe", preview: "Chego sábado de manhã. Me busca?", time: "10:24", unread: 2 },
      { with: "familia", preview: "Vô Antônio: Domingo tem almoço aqui em casa", time: "09:58", unread: 5 },
      { with: "golpista", preview: "Oi filha, troquei de número. Salva esse aqui", time: "09:12", unread: 1 },
      { with: "rafa", preview: "Pix recebido, valeu!", time: "ontem" },
      { with: "clinica", preview: "Consulta confirmada. Até amanhã.", time: "ontem" },
      { with: "fernanda", trust: "suspended", preview: "Ligo sim, 2 min", time: "seg" },
      { with: "marina", preview: "Chegou certinho aqui", time: "dom" },
      { with: "thiago", preview: "Amanhã cedo eu olho o carro", time: "sáb" },
    ],
  },
  perfil: { kind: "trustProfile", me: "gabi", done: 2 },
} satisfies Record<string, Scene>;

export type SceneId = keyof typeof scenes;

/** Scenes in the trust-levels picker, in order. Labels are chrome copy: chrome[lang].scenes. */
export const TRUST_LEVEL_SCENES: SceneId[] = ["verificado", "pessoalmente", "numero-novo", "falso-suporte", "renda-extra", "nome-diferente", "aparelho-novo", "de-fora", "instituicao", "mae", "conversas", "perfil"];

export const text = (t: Text, lang: "pt" | "en") => (typeof t === "string" ? t : t[lang]);
