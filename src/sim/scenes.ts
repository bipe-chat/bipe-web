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
  | { card: "pix"; amount: string; description?: string; pause?: boolean }
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
      { from: ME, text: { pt: "Fechado, me manda o Pix", en: "Fechado, me manda o Pix (Deal, send me the Pix request)" } },
      { card: "pix", amount: "R$ 850,00", description: "Bike usada, revisada" },
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
      { card: "pix", amount: "R$ 850,00", pause: true },
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
  igreja: {
    kind: "chat", with: "igreja", names: { antonio: "Vô Antônio" },
    lines: [
      { from: "debora", text: { pt: "Irmãos, culto de oração quinta às 19h30. Tragam alimentos pra cesta básica", en: "Irmãos, culto de oração quinta às 19h30. Tragam alimentos pra cesta básica (Prayer service Thursday 7:30 pm, bring food for the food bank)" } },
      { from: "cida", text: { pt: "Amém, pastora! Levo arroz e feijão", en: "Amém, pastora! Levo arroz e feijão (Amen! I will bring rice and beans)" } },
      { from: "antonio", text: { pt: "Eu levo óleo e macarrão", en: "Eu levo óleo e macarrão (I will bring oil and pasta)" } },
      { from: ME, text: { pt: "Conta comigo", en: "Conta comigo (Count me in)" } },
    ],
  },
  "falso-pastor": {
    kind: "chat", with: "falsapastora",
    lines: [
      { card: "unverified", age: { pt: "1 dia", en: "1 day" } },
      { from: "falsapastora", text: "Graça e paz, irmã! Estou usando este número novo" },
      { from: ME, text: { pt: "Pastora? Aconteceu alguma coisa?", en: "Pastora? Aconteceu alguma coisa? (Pastor? Is something wrong?)" } },
      { from: "falsapastora", text: "A igreja precisa de uma oferta urgente pra reforma do telhado. Faz um Pix pra chave 11987654321 ainda hoje" },
    ],
  },
  escola: {
    kind: "chat", with: "escola",
    lines: [
      { from: "sandra", text: { pt: "Bom dia, famílias! Amanhã é dia do brinquedo. Mandem com o nome da criança", en: "Bom dia, famílias! Amanhã é dia do brinquedo. Mandem com o nome da criança (Tomorrow is toy day, label the toys)" } },
      { from: "juliana", text: { pt: "Pode ser bicicleta?", en: "Pode ser bicicleta? (Can it be a bike?)" } },
      { from: "intruso", text: "Pais, a taxa da excursão é R$ 45. Pix pra chave 11987654321 até hoje" },
      { from: "sandra", text: { pt: "Atenção: a escola não cobra nada por aqui. A excursão é paga só na secretaria", en: "Atenção: a escola não cobra nada por aqui. A excursão é paga só na secretaria (The school never charges here, pay at the office)" } },
      { from: "marcos", text: { pt: "Valeu, Tia Sandra. Eu ia pagar agora", en: "Valeu, Tia Sandra. Eu ia pagar agora (Thanks, I was about to pay)" } },
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

/** Pix request examples for the Pix demo. `bank`: what the payer's bank app shows after pasting the code. */
export type PixExample = { from: string; amount: number; description: string; bank: "match" | "other"; ask: Text; thanks?: Text };

export const pixExamples: PixExample[] = [
  { from: "rafa", amount: 850, description: "Bike usada, revisada", bank: "match",
    ask: { pt: "Fechado, me manda o Pix", en: "Fechado, me manda o Pix (Deal, send me the request)" },
    thanks: { pt: "Recebi, valeu! Pode buscar amanhã", en: "Recebi, valeu! Pode buscar amanhã (Got it, pick it up tomorrow)" } },
  { from: "ivone", amount: 44, description: "2 marmitas de frango", bank: "match",
    ask: { pt: "Dona Ivone, quero duas! Me manda o Pix", en: "Dona Ivone, quero duas! Me manda o Pix (Two for me, send the request)" },
    thanks: { pt: "Recebido! Desço com elas já já", en: "Recebido! Desço com elas já já (Got it, bringing them down)" } },
  { from: "valdir", amount: 120, description: "Reserva do salão de festas", bank: "other",
    ask: { pt: "Seu Valdir, quero reservar o salão no sábado", en: "Seu Valdir, quero reservar o salão no sábado (I want to book the party room)" } },
  { from: "leo", amount: 60, description: "Aula de surf de sábado", bank: "match",
    ask: { pt: "Léo, fechou a aula de sábado. Manda o Pix", en: "Léo, fechou a aula de sábado. Manda o Pix (Saturday's lesson is on, send the request)" },
    thanks: { pt: "Recebi! Sábado, 7h, na praia", en: "Recebi! Sábado, 7h, na praia (Got it, Saturday 7am at the beach)" } },
];

/** Scam scenes for the scam-warning demo, played back to back. Every warning comes from the detector. */
export const SCAM_REEL: SceneId[] = ["numero-novo", "falso-suporte", "renda-extra", "falso-pastor", "escola"];

/** Scenes in the trust-levels picker, in order. Labels are chrome copy: chrome[lang].scenes. */
export const TRUST_LEVEL_SCENES: SceneId[] = ["verificado", "pessoalmente", "numero-novo", "falso-suporte", "renda-extra", "nome-diferente", "aparelho-novo", "de-fora", "instituicao", "mae", "conversas", "perfil"];

export const text = (t: Text, lang: "pt" | "en") => (typeof t === "string" ? t : t[lang]);
