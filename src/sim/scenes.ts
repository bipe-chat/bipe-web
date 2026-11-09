// Phone scenes for the site: one per trust state, the chat list, the trust profile, and one or more per
// feature page (bipe#176). People come from the cast (bipe-shared/product/cast.json). Card text comes from the app
// strings through t(); labels the app has no string for yet are site copy in chrome[lang].sim.
// Scam warnings are never written here: ScenePhone runs every incoming message through the
// reference detector, the same as the app, on the pt-BR text. Messages are sample data in pt-BR; the English
// page shows a plain English translation, never the Portuguese with a gloss.
import type { Trust } from "../cast";

export type Text = string | { pt: string; en: string };

export type Line =
  | { from: string; text: Text }
  /** A text sticker from STICKERS in SceneParts.tsx. */
  | { from: string; sticker: string }
  /** A voice message with the sender's transcript (ADR 0023). The scam check reads the transcript of an incoming one. */
  | { from: string; voice: string; transcript: Text }
  /** A shared location (ADR 0131). `until`: live location, shared until that time (MSC3489). */
  | { from: string; location: Text; until?: string }
  | { card: "unverified"; age: Text }
  | { card: "external" | "securityChange" | "suspended" | "mismatch" }
  | { card: "nickname" }
  | { card: "pix"; amount: string; description?: string; pause?: boolean }
  | { card: "notice"; text: Text }
  /** Money pause (money-pause): the copy button stays locked and counts down. */
  | { card: "pause"; seconds: number }
  /** A note from the app, from the app strings. */
  | { card: "app"; key: string; args?: string[] }
  /** A charge from a CNPJ-verified institution (pix-charges). Shows "pago" from line number `paidAt` (1-based). */
  | { card: "charge"; amount: string; description: Text; paidAt?: number }
  | { card: "poll"; question: Text; options: { label: Text; votes: number }[]; mine?: number; ask?: boolean }
  /** A request to join a group that takes only verified accounts (verified-groups). The result follows the person's trust. */
  | { card: "join"; person: string }
  /** The fixed line at the top of a room with a bot: its name, its owner, and that it reads the messages (ADR 0181). */
  | { card: "bot" }
  /** The call line in the timeline (ADR 0186): a call that ended, with its length, or a missed call. */
  | { card: "call"; video?: boolean; minutes?: number; missed?: boolean }
  /** A warning from the app strings: `key` (with `args`) is the body, `title` an optional title key. */
  | { card: "alert"; level: "caution" | "danger"; key: string; args?: string[]; title?: string; titleArgs?: string[] };

export type InboxRow = { with: string; savedAs?: string; trust?: Trust; preview: Text; time: string; unread?: number };
/** A message request (requests): apart from the chats, with accept and ignore. */
export type RequestRow = { with: string; preview: Text; age: Text };

export type Scene =
  | { kind: "chat"; with: string; savedAs?: string; trust?: Trust; names?: Record<string, string>; lines: Line[]; footer?: "readOnly" | "stickers" }
  | { kind: "inbox"; rows: InboxRow[]; requests?: RequestRow[] }
  | { kind: "trustProfile"; me: string; done: number }
  /** New chat by @: each typed handle checked by the reference logic (reserved-names, lookalikes). */
  | { kind: "lookup"; typed: string[] }
  /** Scan a profile QR code, then the chat opens (profile-links). */
  | { kind: "scan"; with: string; first: Text }
  /** The Pix R$ 0,01 verification step (verified-badge). */
  | { kind: "verifyPix"; me: string }
  /** Contacts already on Bipe, found only by people who have the number saved (phone-discovery). */
  | { kind: "contacts"; found: string[] }
  /** Agenda, customer side: profile, service, person, time, confirm, then the booking card in the chat (agendaDemo). */
  | { kind: "book"; with: string }
  /** Agenda, owner side in company mode: the day view, one column per agenda (agendaDemo). */
  | { kind: "agendaDay"; with: string }
  /** Agenda: the 24-hour reminder push with its actions (ADR 0102). */
  | { kind: "agendaReminder"; with: string }
  /** Business tools (bipe/docs/business-tools.md, ADRs 0104 to 0107; planned). Sample data in toolsDemo. */
  | { kind: "catalog"; with: string }
  | { kind: "order"; with: string }
  | { kind: "quote"; with: string }
  | { kind: "queue"; with: string }
  /** Conferir no Bipe (pix-check): a Pix code shared from another app, then the check result. */
  | { kind: "pixCheck"; from: string; text: Text; code: string }
  /** Settings sections straight from bipe-shared registries/settings.json (ADR 0112). `on`: the switches shown on. */
  | { kind: "settings"; group: string; sections: string[]; on?: string[] }
  /** The app lock screen (ADR 0137): the PIN dots fill, then the app opens. */
  | { kind: "appLock" }
  /** The account switcher on the Você tab (ADR 0086, ADR 0135): the accounts on this phone, the first one active. */
  | { kind: "accounts"; ids: string[] }
  /** Quem atende (ADR 0251, ADR 0252): who answers for a work account, then what those people share. */
  | { kind: "team"; attendants: string[] }
  /** Theft protection (ADR 0044): your guardians, then the accounts you protect. */
  | { kind: "guardians"; guardians: string[]; guarding: string[] };

export const ME = "me";

export const scenes = {
  verificado: {
    kind: "chat", with: "rafa",
    lines: [
      { from: ME, text: { pt: "Oi Rafa, a bike ainda tá disponível?", en: "Hi Rafa, is the bike still for sale?" } },
      { from: "rafa", text: { pt: "Tá sim! Fica 850 com a revisão feita", en: "Yes! 850, and it has just been serviced" } },
      { from: ME, text: { pt: "Fechado, me manda o Pix", en: "Deal, send me the Pix request" } },
      { card: "pix", amount: "R$ 850,00", description: "Bike usada, revisada" },
    ],
  },
  "numero-novo": {
    kind: "chat", with: "golpista",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "golpista", text: { pt: "Oi filha, troquei de número. Essa é minha conta nova aqui", en: "Hi sweetie, I changed my number. This is my new account" } },
      { from: ME, text: { pt: "Mãe? O que houve com o outro?", en: "Mom? What happened to the old one?" } },
      { from: "golpista", text: { pt: "Caiu na água. Preciso pagar um boleto hoje ainda, me faz um Pix que amanhã te devolvo", en: "It fell in the water. I need to pay a bill today, send me a Pix and I will pay you back tomorrow" } },
    ],
  },
  "nome-diferente": {
    kind: "chat", with: "joao", savedAs: "Paulo Mendes",
    lines: [
      { from: "joao", text: { pt: "Oi sobrinha, tô sem acesso ao app do banco. Me empresta 850? Devolvo sexta", en: "Hi dear, I can't get into my bank app. Can you lend me 850? I will pay you back Friday" } },
      { card: "pix", amount: "R$ 850,00", pause: true },
      { card: "mismatch" },
    ],
  },
  "aparelho-novo": {
    kind: "chat", with: "fernanda", trust: "suspended",
    lines: [
      { card: "securityChange" },
      { from: "fernanda", text: { pt: "Oi! Comprei celular novo, tô configurando tudo", en: "Hi! I got a new phone, still setting it up" } },
      { from: ME, text: { pt: "Beleza. Me liga rapidinho pra eu confirmar que é você?", en: "OK. Can you give me a quick call so I know it is you?" } },
      { from: "fernanda", text: { pt: "Ligo sim, 2 min", en: "Sure, give me 2 min" } },
    ],
  },
  "de-fora": {
    kind: "chat", with: "marina",
    lines: [
      { card: "external" },
      { from: "marina", text: { pt: "Oi Gabi! Te achei pelo seu @. Uso outro servidor Matrix", en: "Hi Gabi! I found you by your @. I use another Matrix server" } },
      { from: ME, text: { pt: "Oi Marina! Chegou certinho aqui", en: "Hi Marina! It arrived fine" } },
    ],
  },
  instituicao: {
    kind: "chat", with: "clinica",
    lines: [
      { card: "notice", text: { pt: "Sua consulta é amanhã, às 14h, com a Dra. Ana. Responda 1 para confirmar ou 2 para remarcar.", en: "Your appointment with Dr Ana is tomorrow at 2 pm. Reply 1 to confirm or 2 to reschedule." } },
      { from: ME, text: "1" },
      { from: "clinica", text: { pt: "Consulta confirmada. Até amanhã.", en: "Appointment confirmed. See you tomorrow." } },
    ],
  },
  // /empresas/: a structured question instead of "reply 1 or 2" (ADR 0081).
  "empresa-pergunta": {
    kind: "chat", with: "clinica",
    lines: [
      { card: "notice", text: { pt: "Sua consulta é amanhã, às 14h, com a Dra. Ana.", en: "Your appointment with Dr Ana is tomorrow at 2 pm." } },
      { card: "poll", question: { pt: "Você confirma?", en: "Do you confirm?" }, options: [{ label: { pt: "Confirmo", en: "I confirm" }, votes: 1 }, { label: { pt: "Quero remarcar", en: "I want to reschedule" }, votes: 0 }], mine: 0, ask: true },
      { from: "clinica", text: { pt: "Consulta confirmada. Até amanhã.", en: "Appointment confirmed. See you tomorrow." } },
    ],
  },
  mae: {
    kind: "chat", with: "joana", savedAs: "Mãe",
    lines: [
      { card: "nickname" },
      { from: "joana", text: { pt: "Filha, chego sábado de manhã. Me busca na rodoviária?", en: "Sweetie, I arrive Saturday morning. Can you pick me up at the bus station?" } },
      { from: ME, text: { pt: "Busco sim, mãe", en: "Sure, mom" } },
    ],
  },
  grupo: {
    kind: "chat", with: "familia", names: { joana: "Mãe", antonio: "Vô Antônio" },
    lines: [
      { from: "antonio", text: { pt: "Bom dia, família! Domingo tem almoço aqui em casa", en: "Morning, family! Sunday lunch at my place" } },
      { from: "cida", text: { pt: "Bom dia! Levo a sobremesa", en: "Morning! I will bring dessert" } },
      { from: "joana", text: { pt: "Eu levo a farofa", en: "I will bring the farofa" } },
      { from: "kaua", text: { pt: "Eu levo o violão", en: "I will bring the guitar" } },
      { from: ME, text: { pt: "Vou sim! Levo o refri", en: "I am coming! I will bring soda" } },
    ],
  },
  "falso-suporte": {
    kind: "chat", with: "suporte",
    lines: [
      { card: "unverified", age: { pt: "5 horas", en: "5 hours" } },
      { from: "suporte", text: { pt: "Olá, aqui é da central de segurança do seu banco. Identificamos uma compra de R$ 2.399 no seu cartão. Foi você?", en: "Hello, this is your bank's security centre. We found a R$ 2,399 purchase on your card. Was it you?" } },
      { from: ME, text: { pt: "Não fui eu!", en: "It wasn't me!" } },
      { from: "suporte", text: { pt: "Pra cancelar a compra, me passa o código que chegou agora por SMS", en: "To cancel the purchase, tell me the code you just got by SMS" } },
    ],
  },
  "renda-extra": {
    kind: "chat", with: "camila",
    lines: [
      { card: "unverified", age: { pt: "3 dias", en: "3 days" } },
      { from: "camila", text: { pt: "Oi! Temos uma vaga de renda extra: você ganha R$ 50 por tarefa curtindo vídeos. Posso explicar?", en: "Hi! We have a side job: you earn R$ 50 per task liking videos. Can I explain?" } },
      { from: ME, text: { pt: "Como funciona?", en: "How does it work?" } },
      { from: "camila", text: { pt: "Pra liberar seus ganhos, faz um Pix de R$ 30 de taxa pra chave 11987654321", en: "To release your earnings, send a R$ 30 fee by Pix to key 11987654321" } },
    ],
  },
  pessoalmente: {
    kind: "chat", with: "pedro",
    lines: [
      { from: "pedro", text: { pt: "Foi ótimo te conhecer ontem! Te mandei o arquivo da apresentação", en: "Great to meet you yesterday! I sent you the slides" } },
      { from: ME, text: { pt: "Recebi! Valeu, Pedro", en: "Got it! Thanks, Pedro" } },
    ],
  },
  condominio: {
    kind: "chat", with: "condominio", names: { valdir: "Seu Valdir (síndico)" },
    lines: [
      { from: "valdir", text: { pt: "Pessoal, a água vai ser cortada amanhã das 8h às 12h", en: "Everyone, the water will be off tomorrow from 8 am to noon" } },
      { from: "ivone", text: { pt: "Marmita de frango hoje, 22 reais. Quem quiser me chama", en: "Chicken lunch boxes today, 22 reais. Message me if you want one" } },
      { from: "lucia", text: { pt: "Obrigada, Seu Valdir", en: "Thank you, Seu Valdir" } },
      { from: ME, text: { pt: "Dona Ivone, quero duas!", en: "Dona Ivone, two for me!" } },
    ],
  },
  igreja: {
    kind: "chat", with: "igreja", names: { antonio: "Vô Antônio" },
    lines: [
      { from: "debora", text: { pt: "Irmãos, culto de oração quinta às 19h30. Tragam alimentos pra cesta básica", en: "Brothers and sisters, prayer service Thursday at 7:30 pm. Bring food for the food baskets" } },
      { from: "cida", text: { pt: "Amém, pastora! Levo arroz e feijão", en: "Amen, pastor! I will bring rice and beans" } },
      { from: "antonio", text: { pt: "Eu levo óleo e macarrão", en: "I will bring oil and pasta" } },
      { from: ME, text: { pt: "Conta comigo", en: "Count me in" } },
    ],
  },
  "falso-pastor": {
    kind: "chat", with: "falsapastora",
    lines: [
      { card: "unverified", age: { pt: "1 dia", en: "1 day" } },
      { from: "falsapastora", text: { pt: "Graça e paz, irmã! Estou usando este número novo", en: "Grace and peace, sister! I am using this new number" } },
      { from: ME, text: { pt: "Pastora? Aconteceu alguma coisa?", en: "Pastor? Is something wrong?" } },
      { from: "falsapastora", text: { pt: "A igreja precisa de uma oferta urgente pra reforma do telhado. Faz um Pix pra chave 11987654321 ainda hoje", en: "The church needs an urgent offering for the roof repair. Send a Pix to key 11987654321 today" } },
    ],
  },
  escola: {
    kind: "chat", with: "escola",
    lines: [
      { from: "sandra", text: { pt: "Bom dia, famílias! Amanhã é dia do brinquedo. Mandem com o nome da criança", en: "Good morning, families! Tomorrow is toy day. Please label toys with your child's name" } },
      { from: "juliana", text: { pt: "Pode ser bicicleta?", en: "Can it be a bike?" } },
      { from: "intruso", text: { pt: "Pais, a taxa da excursão é R$ 45. Pix pra chave 11987654321 até hoje", en: "Parents, the school trip fee is R$ 45. Pix to key 11987654321 by today" } },
      { from: "sandra", text: { pt: "Atenção: a escola não cobra nada por aqui. A excursão é paga só na secretaria", en: "Note: the school never charges anything here. Pay for the trip at the school office only" } },
      { from: "marcos", text: { pt: "Valeu, Tia Sandra. Eu ia pagar agora", en: "Thanks, Ms Sandra. I was about to pay" } },
    ],
  },
  conversas: {
    kind: "inbox",
    rows: [
      { with: "joana", savedAs: "Mãe", preview: { pt: "Chego sábado de manhã. Me busca?", en: "I arrive Saturday morning. Can you pick me up?" }, time: "10:24", unread: 2 },
      { with: "familia", preview: { pt: "Vô Antônio: Domingo tem almoço aqui em casa", en: "Grandpa Antônio: Sunday lunch at my place" }, time: "09:58", unread: 5 },
      { with: "golpista", preview: { pt: "Oi filha, troquei de número. Essa é minha conta nova aqui", en: "Hi sweetie, I changed my number. This is my new account" }, time: "09:12", unread: 1 },
      { with: "rafa", preview: { pt: "Pix recebido, valeu!", en: "Pix received, thanks!" }, time: "ontem" },
      { with: "clinica", preview: { pt: "Consulta confirmada. Até amanhã.", en: "Appointment confirmed. See you tomorrow." }, time: "ontem" },
      { with: "fernanda", trust: "suspended", preview: { pt: "Ligo sim, 2 min", en: "Sure, give me 2 min" }, time: "seg" },
      { with: "marina", preview: { pt: "Chegou certinho aqui", en: "It arrived fine" }, time: "dom" },
      { with: "thiago", preview: { pt: "Amanhã cedo eu olho o carro", en: "I will look at the car first thing tomorrow" }, time: "sáb" },
    ],
  },
  perfil: { kind: "trustProfile", me: "gabi", done: 2 },
  pedidos: {
    kind: "inbox",
    requests: [{ with: "golpista", preview: { pt: "Oi filha, troquei de número. Essa é minha conta nova aqui", en: "Hi sweetie, I changed my number. This is my new account" }, age: { pt: "2 dias", en: "2 days" } }],
    rows: [
      { with: "joana", savedAs: "Mãe", preview: { pt: "Chego sábado de manhã. Me busca?", en: "I arrive Saturday morning. Can you pick me up?" }, time: "10:24", unread: 2 },
      { with: "familia", preview: { pt: "Vô Antônio: Domingo tem almoço aqui em casa", en: "Grandpa Antônio: Sunday lunch at my place" }, time: "09:58", unread: 5 },
      { with: "rafa", preview: { pt: "Pix recebido, valeu", en: "Pix received, thanks" }, time: "ontem" },
      { with: "clinica", preview: { pt: "Consulta confirmada. Até amanhã.", en: "Appointment confirmed. See you tomorrow." }, time: "ontem" },
    ],
  },
  "pausa-pix": {
    kind: "chat", with: "golpista",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "golpista", text: { pt: "Oi filha, essa é minha conta nova. Salva aí", en: "Hi sweetie, this is my new account. Save it" } },
      { from: ME, text: { pt: "Oi mãe, salvei", en: "Hi mom, saved it" } },
      { from: "golpista", text: { pt: "Preciso pagar um boleto hoje ainda. Faz um Pix pra essa chave: joana.lima.2@example.com", en: "I need to pay a bill today. Send a Pix to this key: joana.lima.2@example.com" } },
      { card: "pause", seconds: 5 },
    ],
  },
  "mae-outro-nome": {
    kind: "chat", with: "patricia", savedAs: "Mãe",
    lines: [
      { card: "nickname" },
      { from: "patricia", text: { pt: "Filha, me faz um Pix hoje ainda? Te devolvo amanhã", en: "Sweetie, can you send me a Pix today? I will pay you back tomorrow" } },
    ],
  },
  "nome-reservado": { kind: "lookup", typed: ["itau", "correios", "inss"] },
  "letra-disfarcada": { kind: "lookup", typed: ["1tau", "c0rreios", "bradesc0"] },
  "qr-conversa": { kind: "scan", with: "rafa", first: { pt: "Oi Rafa, aqui é a Gabi da feira de bikes", en: "Hi Rafa, it's Gabi from the bike fair" } },
  "verificacao-pix": { kind: "verifyPix", me: "gabi" },
  cobranca: {
    kind: "chat", with: "clinica",
    lines: [
      { card: "notice", text: { pt: "Sua consulta com a Dra. Ana foi ontem. Segue a cobrança.", en: "Your appointment with Dr Ana was yesterday. Here is the charge." } },
      { card: "charge", amount: "R$ 180,00", description: { pt: "Consulta de 14/10", en: "Appointment on 14 Oct" }, paidAt: 4 },
      { from: ME, text: { pt: "Paguei pelo app do banco", en: "Paid in my bank app" } },
      { card: "notice", text: { pt: "Pagamento recebido. Obrigada.", en: "Payment received. Thank you." } },
    ],
  },
  avisos: {
    kind: "chat", with: "avisos", names: { valdir: "Seu Valdir (síndico)" }, footer: "readOnly",
    lines: [
      { from: "valdir", text: { pt: "Assembleia na quinta, às 20h, no salão de festas. Pauta: pintura da fachada", en: "Residents' meeting Thursday at 8 pm in the party room. Agenda: painting the front" } },
      { from: "valdir", text: { pt: "Vote abaixo na cor da fachada", en: "Vote for the colour of the front below" } },
      { card: "poll", question: { pt: "Cor da fachada", en: "Colour of the front" }, options: [{ label: { pt: "Amarelo claro", en: "Pale yellow" }, votes: 21 }, { label: { pt: "Branco", en: "White" }, votes: 12 }, { label: { pt: "Cinza", en: "Grey" }, votes: 5 }], mine: 0 },
    ],
  },
  "grupo-verificados": {
    kind: "chat", with: "igreja", names: { antonio: "Vô Antônio" },
    lines: [
      { from: "debora", text: { pt: "Irmãos, agora o grupo aceita só quem tem selo verificado", en: "Brothers and sisters, the group now takes only verified accounts" } },
      { card: "join", person: "antonio" },
      { card: "join", person: "falsapastora" },
    ],
  },
  "bot-marcado": {
    kind: "chat", with: "trigobot",
    lines: [
      { card: "bot" },
      { from: ME, text: { pt: "Oi, tem pão de queijo hoje?", en: "Hi, any cheese bread today?" } },
      { from: "trigobot", text: { pt: "Tem sim! Sai fornada nova às 16h. Quer reservar uma dúzia?", en: "Yes! A fresh batch comes out at 4 pm. Want me to save you a dozen?" } },
      { from: ME, text: { pt: "Quero, vou buscar às 17h", en: "Yes please, I will pick it up at 5 pm" } },
    ],
  },
  convite: {
    kind: "chat", with: "kaua",
    lines: [
      { from: ME, text: { pt: "Kauã, baixa o Bipe. Te mandei um convite", en: "Kauã, get Bipe. I sent you an invite" } },
      { card: "app", key: "bipe_invites_joined", args: ["Kauã"] },
      { from: "kaua", text: { pt: "Entrei. Caí direto aqui na nossa conversa", en: "I'm in. It opened right on our chat" } },
    ],
  },
  contatos: { kind: "contacts", found: ["antonio", "cida", "thiago", "leo"] },
  stickers: {
    kind: "chat", with: "faculdade", footer: "stickers",
    lines: [
      { from: "bia", text: { pt: "Sexta tem churrasco lá em casa", en: "BBQ at my place on Friday" } },
      { from: "leo", sticker: "Fechou" },
      { from: ME, sticker: "Valeu" },
    ],
  },
  // One scene per golpe page (bipe#175): the golpe as it arrives on Bipe. The warning, when there is one, comes from the detector.
  "falso-chefe": {
    kind: "chat", with: "falsochefe",
    lines: [
      { card: "unverified", age: { pt: "1 dia", en: "1 day" } },
      { from: "falsochefe", text: { pt: "Oi, é o Carlos. Tô numa reunião e não consigo falar agora. Preciso que você faça um Pix urgente pra um fornecedor", en: "Hi, it's Carlos. I'm in a meeting and can't talk. I need you to send an urgent Pix to a supplier" } },
      { from: ME, text: { pt: "Carlos? Esse número é seu?", en: "Carlos? Is this your number?" } },
    ],
  },
  "codigo-engano": {
    kind: "chat", with: "lucas",
    lines: [
      { card: "unverified", age: { pt: "2 horas", en: "2 hours" } },
      { from: "lucas", text: { pt: "Oi, desculpa, mandei um código pro seu número sem querer. Me passa o código que chegou?", en: "Hi, sorry, I sent a code to your number by mistake. Can you tell me the code you got?" } },
    ],
  },
  "golpe-amor": {
    kind: "chat", with: "daniel",
    lines: [
      { from: "daniel", text: { pt: "Bom dia, meu amor. Sonhei com você de novo", en: "Good morning, my love. I dreamt of you again" } },
      { from: ME, text: { pt: "Bom dia. Quando a gente faz aquela chamada de vídeo?", en: "Good morning. When do we do that video call?" } },
      { from: "daniel", text: { pt: "Meu amor, o presente que te mandei ficou preso na alfândega. Preciso de R$ 1.800 da taxa. Faz um Pix pra chave daniel.ferraz@example.com", en: "My love, the gift I sent you is stuck in customs. I need R$ 1,800 for the fee. Send a Pix to key daniel.ferraz@example.com" } },
    ],
  },
  "falso-advogado": {
    kind: "chat", with: "advogado",
    lines: [
      { card: "unverified", age: { pt: "3 dias", en: "3 days" } },
      { from: "advogado", text: { pt: "Boa tarde, aqui é do escritório do seu advogado.", en: "Good afternoon, this is your lawyer's office." } },
      { from: "advogado", text: { pt: "Seu processo foi ganho e o valor de R$ 18.400 está liberado. Pra receber, precisa pagar as custas de R$ 1.250 hoje. Chave Pix: custas.processo@example.com", en: "You won your case and R$ 18,400 has been released. To receive it, pay R$ 1,250 in court costs today. Pix key: custas.processo@example.com" } },
    ],
  },
  "orgao-publico": {
    kind: "chat", with: "valores",
    lines: [
      { card: "unverified", age: { pt: "4 horas", en: "4 hours" } },
      { from: "valores", text: { pt: "Você tem R$ 1.240 em valores a receber. Consulte e resgate hoje em valoresareceber-bcb.site", en: "You have R$ 1,240 in unclaimed money. Check and claim it today at valoresareceber-bcb.site" } },
    ],
  },
  "taxa-correios": {
    kind: "chat", with: "rastreio",
    lines: [
      { card: "unverified", age: { pt: "1 hora", en: "1 hour" } },
      { from: "rastreio", text: { pt: "Seu pacote está retido na alfândega. Pague a taxa de R$ 9,90 para liberar: rastreio-correios.online", en: "Your parcel is held in customs. Pay the R$ 9.90 fee to release it: rastreio-correios.online" } },
    ],
  },
  "falso-suporte-bipe": {
    kind: "chat", with: "falsobipe",
    lines: [
      { card: "unverified", age: { pt: "5 horas", en: "5 hours" } },
      { from: "falsobipe", text: { pt: "Olá, aqui é do suporte do Bipe. Sua conta vai ser desativada hoje. Me passa sua senha de 8 números pra confirmar que é você", en: "Hello, this is Bipe support. Your account will be closed today. Tell me your 8-digit password to confirm it is you" } },
    ],
  },
  "venda-falsa": {
    kind: "chat", with: "andre",
    lines: [
      { from: ME, text: { pt: "Oi, o celular do anúncio ainda está à venda?", en: "Hi, is the phone in the ad still for sale?" } },
      { from: "andre", text: { pt: "Celular seminovo, R$ 1.200. Tenho mais 3 interessados, se fizer o pix agora é seu. Chave andre.usados@example.com", en: "Phone, like new, R$ 1,200. 3 other people want it, Pix now and it is yours. Key andre.usados@example.com" } },
      { from: ME, text: { pt: "Posso ver antes de pagar?", en: "Can I see it before I pay?" } },
    ],
  },
  "comprovante-falso": {
    kind: "chat", with: "bruno",
    lines: [
      { from: "bruno", text: { pt: "Fechado, fico com o sofá", en: "Deal, I will take the sofa" } },
      { from: "bruno", text: { pt: "Pronto, paguei. Segue o comprovante do Pix. Pode mandar o produto hoje?", en: "Done, I paid. Here is the Pix receipt. Can you send the item today?" } },
      { from: ME, text: { pt: "Vou conferir no app do banco antes", en: "I will check in my bank app first" } },
    ],
  },
  aluguel: {
    kind: "chat", with: "silvia",
    lines: [
      { from: ME, text: { pt: "Oi, a casa está livre no feriado?", en: "Hi, is the house free over the holiday?" } },
      { from: "silvia", text: { pt: "Casa pé na areia, R$ 250 a diária. Pra garantir o feriado preciso de 50% no pix hoje ainda. Chave silvia.temporada@example.com", en: "Beachfront house, R$ 250 a night. To hold the holiday I need 50% by Pix today. Key silvia.temporada@example.com" } },
    ],
  },
  "pix-errado": {
    kind: "chat", with: "marcelo",
    lines: [
      { card: "unverified", age: { pt: "20 minutos", en: "20 minutes" } },
      { from: "marcelo", text: { pt: "Oi, fiz um Pix errado pra você de R$ 380. Pode devolver pra essa chave? 4f1c2b9e-7a3d-4c55-9e21-0b8d6f3a2c71", en: "Hi, I sent you R$ 380 by Pix by mistake. Can you send it back to this key? 4f1c2b9e-7a3d-4c55-9e21-0b8d6f3a2c71" } },
      { from: ME, text: { pt: "Vou devolver pelo botão do banco", en: "I will return it with my bank's refund button" } },
    ],
  },
  boleto: {
    kind: "chat", with: "colegio",
    lines: [
      { card: "unverified", age: { pt: "1 dia", en: "1 day" } },
      { from: "colegio", text: { pt: "Mensalidade de outubro com novo banco. Pague por este boleto: 23793.38128 60000.000003 00000.000400 1 84340000012000", en: "October fee, new bank. Pay with this bill: 23793.38128 60000.000003 00000.000400 1 84340000012000" } },
    ],
  },
  emprestimo: {
    kind: "chat", with: "credito",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "credito", text: { pt: "Seu empréstimo de R$ 15.000 foi aprovado. Para liberar hoje ainda, faça o pix do seguro de R$ 390 para a chave creditoja@example.com", en: "Your R$ 15,000 loan is approved. To release it today, send the R$ 390 insurance by Pix to key creditoja@example.com" } },
    ],
  },
  investimento: {
    kind: "chat", with: "vip",
    lines: [
      { from: "jessica", text: { pt: "Saquei R$ 2.300 hoje, obrigada Rodrigo", en: "Withdrew R$ 2,300 today, thanks Rodrigo" } },
      { from: "rodrigo", text: { pt: "Entra agora, o robô rendeu 5% hoje de novo. Quem depositar até as 20h dobra o valor. Pix pra chave lucrocerto@example.com", en: "Get in now, the bot made 5% again today. Deposit by 8 pm and double it. Pix to key lucrocerto@example.com" } },
    ],
  },
  aposta: {
    kind: "chat", with: "sinais",
    lines: [
      { card: "unverified", age: { pt: "6 horas", en: "6 hours" } },
      { from: "sinais", text: { pt: "Seu saldo da bet fechada está retido. Para receber a devolução, pague a taxa de R$ 59 pelo pix taxa.devolucao@example.com", en: "Your balance from the closed betting site is on hold. To get it back, pay a R$ 59 fee by Pix to taxa.devolucao@example.com" } },
    ],
  },
  "link-falso": {
    kind: "chat", with: "suporte",
    lines: [
      { card: "unverified", age: { pt: "3 horas", en: "3 hours" } },
      { from: "suporte", text: { pt: "Seu cartão foi bloqueado por segurança. Desbloqueie agora em itau-desbloqueio.top", en: "Your card was blocked for security. Unblock it now at itau-desbloqueio.top" } },
    ],
  },
  "acesso-remoto": {
    kind: "chat", with: "suporte",
    lines: [
      { card: "unverified", age: { pt: "5 horas", en: "5 hours" } },
      { from: "suporte", text: { pt: "Identificamos uma compra de R$ 2.399 no seu cartão. Foi você?", en: "We found a R$ 2,399 purchase on your card. Was it you?" } },
      { from: ME, text: { pt: "Não fui eu", en: "It wasn't me" } },
      { from: "suporte", text: { pt: "Pra cancelar a compra, instala o app de proteção pelo link protecao-cartao.app e me fala o código que aparecer", en: "To cancel the purchase, install the protection app from protecao-cartao.app and tell me the code it shows" } },
    ],
  },
  // A chat, not the inbox: ScenePhone runs the reference detector on chat messages only (bipe#181).
  ameaca: {
    kind: "chat", with: "desconhecido",
    lines: [
      { card: "unverified", age: { pt: "10 minutos", en: "10 minutes" } },
      { from: "desconhecido", text: { pt: "Sei onde você mora e o nome da sua mãe. Faz um pix de 3 mil hoje ainda e fica tudo bem", en: "I know where you live and your mother's name. Send 3,000 by Pix today and nothing happens" } },
    ],
  },
  sequestro: {
    kind: "chat", with: "desconhecido",
    lines: [
      { card: "unverified", age: { pt: "5 minutos", en: "5 minutes" } },
      { from: "desconhecido", text: { pt: "Estamos com a sua filha. Não desliga e não fala com ninguém. Faz o pix agora mesmo ou ela não volta", en: "We have your daughter. Don't hang up and don't tell anyone. Send the Pix right now or she doesn't come back" } },
      { from: ME, text: { pt: "Vou ligar pra ela", en: "I am calling her" } },
    ],
  },
  sextorsao: {
    kind: "chat", with: "larissa",
    lines: [
      { card: "unverified", age: { pt: "4 dias", en: "4 days" } },
      { from: "larissa", text: { pt: "Tenho o print da nossa chamada. Se não pagar R$ 2.000 hoje ainda, mando pra todos os seus contatos", en: "I have a screenshot of our call. If you don't pay R$ 2,000 today, I send it to all your contacts" } },
    ],
  },
  vaquinha: {
    kind: "chat", with: "vaquinha",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "vaquinha", text: { pt: "Ajude a Maria, 6 anos, cirurgia urgente. Qualquer valor salva. Chave Pix: ajudeamaria@example.com", en: "Help Maria, 6, urgent surgery. Any amount saves her. Pix key: ajudeamaria@example.com" } },
    ],
  },
  "loja-falsa": {
    kind: "chat", with: "outlet",
    lines: [
      { from: ME, text: { pt: "Oi, vi o anúncio do tênis", en: "Hi, I saw your ad for the trainers" } },
      { from: "outlet", text: { pt: "Tênis de corrida de R$ 899 por R$ 199, só hoje. Pague no pix e enviamos amanhã. Chave outletpromo@example.com", en: "Running shoes, R$ 899 now R$ 199, today only. Pay by Pix and we ship tomorrow. Key outletpromo@example.com" } },
    ],
  },
  "boleto-internet": {
    kind: "chat", with: "falsacaju",
    lines: [
      { card: "unverified", age: { pt: "3 horas", en: "3 hours" } },
      { from: "falsacaju", text: { pt: "CajuNet: sua internet vai ser cortada hoje. Pague a segunda via com desconto pelo pix cajunet.2via@example.com", en: "CajuNet: your internet will be cut off today. Pay the copy of your bill at a discount by Pix to cajunet.2via@example.com" } },
    ],
  },
  // Real vs fake: the verified institution that each impersonator copies. Shown under the fake scene on the
  // golpe page (`realScene` in bipe-shared/product/scams.json). No warning fires: check new lines with the detector.
  "banco-real": {
    kind: "chat", with: "banco",
    lines: [
      { card: "notice", text: { pt: "Compra de R$ 2.399 no cartão final 4821. Se não foi você, bloqueie o cartão no app do Banco Seriema. Nunca pedimos código, senha ou Pix por mensagem.", en: "R$ 2,399 purchase on the card ending 4821. If it wasn't you, block the card in the Banco Seriema app. We never ask for a code, password or Pix by message." } },
      { from: ME, text: { pt: "Não fui eu, vou bloquear no app", en: "It wasn't me, I will block the card in the app" } },
    ],
  },
  "escola-real": {
    kind: "chat", with: "horizonte",
    lines: [
      { card: "notice", text: { pt: "Mensalidade de outubro. A cobrança vem só por aqui, no nome e CNPJ do Colégio Horizonte.", en: "October fee. Charges come only here, in the name and CNPJ of Colégio Horizonte." } },
      { card: "charge", amount: "R$ 1.200,00", description: { pt: "Mensalidade de outubro", en: "October fee" }, paidAt: 3 },
      { card: "notice", text: { pt: "Pagamento recebido. Obrigado.", en: "Payment received. Thank you." } },
    ],
  },
  "loja-real": {
    kind: "chat", with: "jatoba",
    lines: [
      { from: ME, text: { pt: "Oi, o tênis de corrida ainda tem no 39?", en: "Hi, do you still have the running shoes in size 39?" } },
      { from: "jatoba", text: { pt: "Tem sim! R$ 899 em até 10x no cartão ou no Pix pela cobrança da loja.", en: "Yes! R$ 899, up to 10 card instalments, or by Pix through the shop's charge." } },
      { card: "charge", amount: "R$ 899,00", description: { pt: "Tênis de corrida, 39", en: "Running shoes, size 39" }, paidAt: 4 },
      { card: "notice", text: { pt: "Seu pedido saiu para entrega. Chega amanhã até as 18h.", en: "Your order is out for delivery. It arrives tomorrow by 6 pm." } },
    ],
  },
  "entrega-real": {
    kind: "chat", with: "sabia",
    lines: [
      { card: "notice", text: { pt: "Seu pacote chega hoje entre 13h e 18h. A Sabiá Entregas não cobra taxa por mensagem.", en: "Your parcel arrives today between 1 pm and 6 pm. Sabiá Entregas never charges a fee by message." } },
      { from: ME, text: { pt: "Valeu!", en: "Thanks!" } },
    ],
  },
  "igreja-real": {
    kind: "chat", with: "vidanova",
    lines: [
      { card: "notice", text: { pt: "Campanha da reforma do telhado: quem puder contribuir, use só a cobrança da Comunidade Vida Nova.", en: "Roof repair campaign: if you can give, use only the Comunidade Vida Nova charge." } },
      { card: "charge", amount: "R$ 50,00", description: { pt: "Oferta: reforma do telhado", en: "Offering: roof repair" }, paidAt: 3 },
      { card: "notice", text: { pt: "Oferta recebida. Deus abençoe.", en: "Offering received. God bless." } },
    ],
  },
  "credito-real": {
    kind: "chat", with: "cooperativa",
    lines: [
      { card: "notice", text: { pt: "Sua proposta de crédito de R$ 15.000 foi aprovada. Assine o contrato no app da cooperativa. A Coop Cerrado não cobra nenhuma taxa antes de liberar o dinheiro.", en: "Your R$ 15,000 credit request is approved. Sign the contract in the co-op app. Coop Cerrado never charges a fee before it releases the money." } },
    ],
  },
  "advogado-real": {
    kind: "chat", with: "prado",
    lines: [
      { from: "prado", text: { pt: "Boa tarde. O alvará do seu processo saiu. O valor cai direto na sua conta, você não paga nada para receber. Quer marcar uma conversa?", en: "Good afternoon. The court released the payment in your case. The money goes straight to your account, you pay nothing to receive it. Shall we set up a call?" } },
      { from: ME, text: { pt: "Quero sim", en: "Yes, please" } },
    ],
  },
  "doacao-real": {
    kind: "chat", with: "ciranda",
    lines: [
      { card: "notice", text: { pt: "Campanha de Natal: 300 cestas básicas para famílias de Salvador. Toda doação vai para o CNPJ do instituto.", en: "Christmas campaign: 300 food baskets for families in Salvador. Every donation goes to the institute's CNPJ." } },
      { card: "charge", amount: "R$ 30,00", description: { pt: "Doação: Campanha de Natal", en: "Donation: Christmas campaign" }, paidAt: 3 },
      { card: "notice", text: { pt: "Doação recebida. Obrigado!", en: "Donation received. Thank you!" } },
    ],
  },
  "pousada-real": {
    kind: "chat", with: "mare",
    lines: [
      { from: ME, text: { pt: "Oi, tem quarto livre no feriado?", en: "Hi, do you have a room free over the holiday?" } },
      { from: "mare", text: { pt: "Temos sim! Diária de R$ 280 com café. Te mando a cobrança do sinal pelo app", en: "Yes! R$ 280 a night with breakfast. I will send you the deposit charge in the app" } },
      { card: "charge", amount: "R$ 140,00", description: { pt: "Sinal: feriado de 15/11", en: "Deposit: 15 Nov holiday" } },
    ],
  },
  "internet-real": {
    kind: "chat", with: "caju",
    lines: [
      { card: "notice", text: { pt: "Sua fatura de outubro chegou: R$ 99,90, vence dia 10.", en: "Your October bill is here: R$ 99.90, due on the 10th." } },
      { card: "charge", amount: "R$ 99,90", description: { pt: "Fatura de outubro", en: "October bill" } },
    ],
  },
  // Agenda (agenda, planned): a banho e tosa shop. Sample data in agendaDemo.
  "agenda-marcar": { kind: "book", with: "caramelo" },
  "agenda-dono": { kind: "agendaDay", with: "caramelo" },
  "agenda-lembrete": { kind: "agendaReminder", with: "caramelo" },
  // Business tools (catalogo, pedidos, orcamento, fila-virtual; planned). Sample data in toolsDemo.
  catalogo: { kind: "catalog", with: "padaria" },
  pedido: { kind: "order", with: "padaria" },
  orcamento: { kind: "quote", with: "oficina" },
  "fila-virtual": { kind: "queue", with: "clinica" },
  // pix-check: the seller's code with one letter of the key changed, so the CRC no longer matches.
  // The result comes from pixCheck() in bipe-shared, the same as the app.
  "conferir-pix": {
    kind: "pixCheck", from: "rafa",
    text: { pt: "Segue o Pix da bike, copia e cola", en: "Here is the Pix code for the bike, copy and paste" },
    code: "00020126440014br.gov.bcb.pix0122rafa.blkes@example.com5204000053039865406850.005802BR5915RAFAEL OLIVEIRA6014BELO HORIZONTE62070503***63044B2D",
  },
  // Calls (ADR 0186): the call line in the timeline after a video call.
  chamada: {
    kind: "chat", with: "joana", savedAs: "Mãe",
    lines: [
      { from: "joana", text: { pt: "Filha, tá podendo falar? Quero te mostrar a horta", en: "Sweetie, can you talk? I want to show you the garden" } },
      { from: ME, text: { pt: "Tô sim, mãe. Te ligo por vídeo", en: "Yes, mom. I will video call you" } },
      { card: "call", video: true, minutes: 14 },
      { from: "joana", text: { pt: "Que bom te ver! Beijo", en: "So good to see you! Love you" } },
    ],
  },
  // Voice messages with the sender's transcript (ADR 0023). Transcripts are sample data in pt-BR, like messages.
  "audio-texto": {
    kind: "chat", with: "rafa",
    lines: [
      { from: ME, text: { pt: "Rafa, a bike ainda tá disponível?", en: "Rafa, is the bike still available?" } },
      { from: "rafa", voice: "0:18", transcript: { pt: "Tá sim! Revisei ontem, troquei a corrente e os freios. Pode vir ver amanhã de manhã", en: "Yes! I serviced it yesterday, new chain and brakes. Come and see it tomorrow morning" } },
      { from: ME, text: { pt: "Combinado, passo às 10h", en: "Deal, I will come by at 10" } },
    ],
  },
  // The scam check reads the transcript of an incoming voice message, and the app keeps the audio (ADR 0164).
  "audio-golpe": {
    kind: "chat", with: "golpista",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "golpista", voice: "0:24", transcript: { pt: "Oi filha, troquei de número. Preciso pagar um boleto hoje ainda, me faz um Pix que amanhã te devolvo", en: "Hi sweetie, I changed my number. I need to pay a bill today, send me a Pix and I will pay you back tomorrow" } },
      { card: "app", key: "bipe_voice_kept_scam" },
    ],
  },
  // Live location (ADR 0131, MSC3489): maps come from Bipe's own map server.
  localizacao: {
    kind: "chat", with: "rafa",
    lines: [
      { from: ME, text: { pt: "Cheguei na praça. Você tá onde?", en: "I'm at the square. Where are you?" } },
      { from: "rafa", location: { pt: "Praça da Liberdade", en: "Praça da Liberdade" }, until: "18:30" },
      { from: "rafa", text: { pt: "Tô no banco perto da fonte, de camiseta azul", en: "On the bench by the fountain, in a blue T-shirt" } },
    ],
  },
  // Photo match (ADR 0049): a stranger uses the photo of someone in your chats.
  "foto-copiada": {
    kind: "chat", with: "golpista",
    lines: [
      { card: "alert", level: "caution", key: "bipe_warning_photo_match", args: ["Mãe"] },
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "golpista", text: { pt: "Oi filha, troquei de número. Essa é minha conta nova aqui", en: "Hi sweetie, I changed my number. This is my new account" } },
    ],
  },
  // Theft mark (ADR 0044, ADR 0051): a guardian marked the account as stolen.
  roubo: {
    kind: "chat", with: "fernanda", trust: "suspended",
    lines: [
      { card: "alert", level: "danger", title: "bipe_theft_banner_title", key: "bipe_theft_banner_body", args: ["Fernanda"] },
      { from: "fernanda", text: { pt: "Oi! Tô sem acesso ao banco, me faz um Pix de 300 que te devolvo amanhã", en: "Hi! I can't get into my bank. Send me 300 by Pix and I will pay you back tomorrow" } },
      { card: "alert", level: "caution", key: "bipe_theft_message_marker" },
    ],
  },
  guardioes: { kind: "guardians", guardians: ["joana", "rafa"], guarding: ["joana"] },
  trava: { kind: "appLock" },
  "sua-conta": { kind: "settings", group: "account", sections: ["waysBack", "pin", "devices", "leave"], on: ["appLock", "biometricUnlock"] },
  "seus-dados": { kind: "settings", group: "privacy", sections: ["data"] },
  "duas-contas": { kind: "accounts", ids: ["gabi", "gabidesign"] },
  "quem-atende": { kind: "team", attendants: ["gabi"] },
} satisfies Record<string, Scene>;

export type SceneId = keyof typeof scenes;

/** Real vs fake: the homepage picker (RealVsFake). Each tab is a fake scene and the verified institution it copies. */
export const REAL_VS_FAKE: { tab: "bank" | "school" | "shop" | "delivery" | "church" | "loan" | "lawyer" | "charity" | "rental" | "internet"; fake: SceneId; real: SceneId }[] = [
  { tab: "bank", fake: "falso-suporte", real: "banco-real" }, { tab: "school", fake: "boleto", real: "escola-real" },
  { tab: "shop", fake: "loja-falsa", real: "loja-real" }, { tab: "delivery", fake: "taxa-correios", real: "entrega-real" },
  { tab: "church", fake: "falso-pastor", real: "igreja-real" }, { tab: "loan", fake: "emprestimo", real: "credito-real" },
  { tab: "lawyer", fake: "falso-advogado", real: "advogado-real" }, { tab: "charity", fake: "vaquinha", real: "doacao-real" },
  { tab: "rental", fake: "aluguel", real: "pousada-real" }, { tab: "internet", fake: "boleto-internet", real: "internet-real" },
];

/**
 * Figures that are not a phone scene: sims and static figures, drawn by src/sim/Figure.tsx.
 * A figure id in product.json (tentpole `demos`, feature `figures`) is a scene id above or one of these.
 * bipe-shared/tools/gen-product-doc.mjs reads this line and the scene keys to validate those ids: keep it on one line.
 */
export const SIMS = ["scam", "identity", "handle", "groups", "levels", "pix", "business", "noAds", "noSms", "handoff", "e2ee", "brazil", "openSource", "bizInbox", "bizApi", "bizArrive"] as const;
export type SimId = (typeof SIMS)[number];
export type FigureId = SceneId | SimId;
export const isFigureId = (id: string): id is FigureId => id in scenes || (SIMS as readonly string[]).includes(id);

/** Pix request examples for the Pix demo. `bank`: what the payer's bank app shows after pasting the code. */
export type PixExample = { from: string; amount: number; description: string; bank: "match" | "other"; ask: Text; thanks?: Text };

export const pixExamples: PixExample[] = [
  { from: "rafa", amount: 850, description: "Bike usada, revisada", bank: "match",
    ask: { pt: "Fechado, me manda o Pix", en: "Deal, send me the Pix request" },
    thanks: { pt: "Recebi, valeu! Pode buscar amanhã", en: "Got it, thanks! You can pick it up tomorrow" } },
  { from: "ivone", amount: 44, description: "2 marmitas de frango", bank: "match",
    ask: { pt: "Dona Ivone, quero duas! Me manda o Pix", en: "Dona Ivone, two for me! Send me the Pix request" },
    thanks: { pt: "Recebido! Desço com elas já já", en: "Got it! I will bring them down in a minute" } },
  { from: "valdir", amount: 120, description: "Reserva do salão de festas", bank: "other",
    ask: { pt: "Seu Valdir, quero reservar o salão no sábado", en: "Seu Valdir, I want to book the party room on Saturday" } },
  { from: "leo", amount: 60, description: "Aula de surf de sábado", bank: "match",
    ask: { pt: "Léo, fechou a aula de sábado. Manda o Pix", en: "Léo, Saturday's lesson is on. Send the Pix request" },
    thanks: { pt: "Recebi! Sábado, 7h, na praia", en: "Got it! Saturday, 7 am, at the beach" } },
];

/** Scam scenes for the scam-warning demo, played back to back. Every warning comes from the detector. */
export const SCAM_REEL: SceneId[] = ["numero-novo", "falso-suporte", "renda-extra", "falso-pastor", "escola"];

/** Scenes in the trust-levels picker, in order. Labels are chrome copy: chrome[lang].scenes. */
export const TRUST_LEVEL_SCENES: SceneId[] = ["verificado", "pessoalmente", "numero-novo", "falso-suporte", "renda-extra", "nome-diferente", "aparelho-novo", "de-fora", "instituicao", "mae", "conversas", "perfil"];

/**
 * /empresas/ minis (src/sim/BusinessMinis.tsx): sample data for the company inbox, the API request and how a
 * customer finds the company on Bipe. The company is "clinica"; customers are cast ids. The inbox never
 * shows a phone number (ADR 0015).
 */
export type DeskChat = { with: string; time: string; unread?: number; lines: { from: "customer" | "agent"; text: Text }[]; note: Text };

export const deskChats: DeskChat[] = [
  { with: "caio", time: "09:41", unread: 2, note: { pt: "Prefere horário depois das 17h.", en: "Prefers times after 5pm." },
    lines: [
      { from: "customer", text: { pt: "Oi, bom dia!", en: "Hi, good morning!" } },
      { from: "customer", text: { pt: "Dá pra remarcar minha consulta de quinta?", en: "Can I move my Thursday appointment?" } },
    ] },
  { with: "lucia", time: "09:32", unread: 1, note: { pt: "Vem às consultas com a filha.", en: "Comes to appointments with her daughter." },
    lines: [
      { from: "customer", text: { pt: "Bom dia, minha filha. O exame de sangue precisa de jejum?", en: "Good morning, dear. Do I need to fast for the blood test?" } },
    ] },
  { with: "duda", time: "09:15", note: { pt: "Primeira consulta.", en: "First appointment." },
    lines: [
      { from: "customer", text: { pt: "Vocês atendem sábado?", en: "Are you open on Saturday?" } },
      { from: "agent", text: { pt: "Atendemos sim, das 8h às 12h.", en: "Yes, from 8 am to noon." } },
      { from: "customer", text: { pt: "Perfeito, obrigada!", en: "Perfect, thanks!" } },
    ] },
  { with: "thiago", time: "08:58", note: { pt: "Pediu recibo para o plano de saúde.", en: "Asked for a receipt for his health plan." },
    lines: [
      { from: "customer", text: { pt: "Vou chegar uns 10 min atrasado, tudo bem?", en: "I will be about 10 min late, is that OK?" } },
    ] },
];

/** Saved replies in the inbox: the agent types "/" or taps a chip. */
export const savedReplies: { name: string; text: Text }[] = [
  { name: "bom-dia", text: { pt: "Bom dia! Já vou te ajudar.", en: "Good morning! I will help you now." } },
  { name: "remarcar", text: { pt: "Claro! Me diz o melhor dia e horário pra você.", en: "Sure! Tell me the best day and time for you." } },
  { name: "jejum", text: { pt: "Pro exame de sangue, são 8 horas de jejum. Água pode.", en: "For the blood test, fast for 8 hours. Water is fine." } },
];

/** The question an agent sends from the inbox (ADR 0081). The customer taps option `pick`. */
export const deskQuestion = {
  question: { pt: "Qual horário fica melhor?", en: "Which time works best?" },
  options: [{ pt: "Quinta, 17h", en: "Thursday, 5 pm" }, { pt: "Sexta, 18h", en: "Friday, 6 pm" }],
  pick: 1,
} satisfies { question: Text; options: Text[]; pick: number };

/** The API mini: one question with options (ADR 0081) through Bipe's API, to customer `to`. */
export const apiDemo = {
  from: "clinica", to: "caio", conversation: "c_8f2k1", message: "m_3xq7a", event: "e_91bd4",
  question: "Confirma a consulta de amanhã às 14h?",
  options: [{ id: "confirmar", label: "Confirmo" }, { id: "remarcar", label: "Quero remarcar" }],
  pick: 0,
};

/** The arrive mini: the customer finds the company's QR code, opens the verified profile and writes first. */
export const arriveDemo = {
  company: "clinica", customer: "caio",
  ask: { pt: "Oi! Preciso remarcar a consulta de quinta", en: "Hi! I need to move Thursday's appointment" },
  reply: { pt: "Oi, Caio! Claro. Quinta às 17h fica bom pra você?", en: "Hi, Caio! Sure. Does Thursday at 5 pm work for you?" },
};

/**
 * Agenda scenes (bipe/docs/scheduling.md, ADRs 0099 to 0103). The shop is a cast institution. Ana and Bruno
 * are agendas, not accounts: a person with an agenda needs no Bipe account (ADR 0099), so they are names here.
 * The booking card is drawn by the app from the API and pinned above the chat, not posted in the room (ADR 0102).
 * Free text about the pet goes in the encrypted chat, never in the booking.
 */
export type AgendaBooking = { agenda: number; start: number; minutes: number; service: number; who: string; fresh?: boolean };

export const agendaDemo = {
  services: [
    { name: { pt: "Banho", en: "Bath" }, minutes: 60, price: "R$ 60" },
    { name: { pt: "Banho e tosa", en: "Bath and grooming" }, minutes: 90, price: "R$ 95" },
    { name: { pt: "Tosa higiênica", en: "Hygienic trim" }, minutes: 30, price: "R$ 40" },
  ],
  agendas: ["Ana", "Bruno"],
  /** The week strip: Sunday is closed, Saturday is full. */
  week: [
    { day: { pt: "seg", en: "Mon" }, n: 20 }, { day: { pt: "ter", en: "Tue" }, n: 21 }, { day: { pt: "qua", en: "Wed" }, n: 22 },
    { day: { pt: "qui", en: "Thu" }, n: 23 }, { day: { pt: "sex", en: "Fri" }, n: 24 }, { day: { pt: "sáb", en: "Sat" }, n: 25, full: true },
    { day: { pt: "dom", en: "Sun" }, n: 26, full: true },
  ],
  times: ["09:00", "10:30", "14:00", "15:30", "17:00"],
  pick: { service: 1, agenda: 0, day: 2, time: 2 },
  date: { pt: "qua, 22 de outubro", en: "Wed, 22 October" },
  address: "Rua das Paineiras, 120",
  cancelHours: 2,
  holdMinutes: 5,
  /** After the booking, in the encrypted chat. */
  note: { pt: "O Paçoca tem alergia a shampoo de coco", en: "Paçoca is allergic to coconut shampoo" },
  reply: { pt: "Anotado! A Ana usa o shampoo neutro nele", en: "Noted! Ana will use the plain shampoo on him" },
  /** The owner's day, 9h to 18h. `start` is the hour. The fresh booking is the customer's from the booking scene. */
  hours: [9, 18],
  now: 11.5,
  bookings: [
    { agenda: 0, start: 9, minutes: 60, service: 0, who: "bia" },
    { agenda: 1, start: 9.5, minutes: 90, service: 1, who: "caio" },
    { agenda: 0, start: 10.5, minutes: 30, service: 2, who: "thiago" },
    { agenda: 1, start: 15, minutes: 60, service: 0, who: "duda" },
    { agenda: 0, start: 14, minutes: 90, service: 1, who: "gabi", fresh: true },
  ] satisfies AgendaBooking[],
  /** A block the owner adds with a long press (an override on one agenda). */
  block: { agenda: 1, start: 12, minutes: 60, label: { pt: "Almoço", en: "Lunch" } },
};

/**
 * Business tool scenes (bipe/docs/business-tools.md, ADRs 0104 to 0107). Same pattern as the Agenda: the app draws
 * each card from the API, pinned above the chat; free text (address, photos, notes) stays in the encrypted chat.
 */
export type CatalogItem = { name: Text; price: string; from?: boolean; onRequest?: boolean; soldOut?: boolean };

export const toolsDemo = {
  catalog: [
    { category: { pt: "Pães", en: "Bread" }, items: [
      { name: { pt: "Pão francês (kg)", en: "French rolls (kg)" }, price: "R$ 18,90" },
      { name: { pt: "Pão de queijo (dúzia)", en: "Cheese bread (dozen)" }, price: "R$ 15,00" },
      { name: { pt: "Pão de fermentação natural", en: "Sourdough bread" }, price: "R$ 22,00", soldOut: true },
    ] as CatalogItem[] },
    { category: { pt: "Bolos", en: "Cakes" }, items: [
      { name: { pt: "Bolo de fubá", en: "Cornmeal cake" }, price: "R$ 25,00" },
      { name: { pt: "Bolo de aniversário", en: "Birthday cake" }, price: "R$ 90,00", from: true },
      { name: { pt: "Encomenda para festa", en: "Party order" }, price: "", onRequest: true },
    ] as CatalogItem[] },
  ],
  /** The order: catalog items by [category, item] and quantity. */
  order: {
    lines: [{ item: [0, 1], qty: 2, total: "R$ 30,00" }, { item: [1, 0], qty: 1, total: "R$ 25,00" }],
    total: "R$ 55,00",
    note: { pt: "Passo aí às 17h pra buscar", en: "I will come by at 5 pm to pick it up" },
  },
  quote: {
    ask: { pt: "Oi! O carro tá fazendo um barulho na roda da frente quando eu freio", en: "Hi! The car makes a noise at the front wheel when I brake" },
    reply: { pt: "Pela descrição, é a pastilha de freio. Segue o orçamento", en: "From what you describe, it is the brake pads. Here is the quote" },
    lines: [{ name: "Pastilha de freio dianteira", price: "R$ 180,00" }, { name: "Mão de obra", price: "R$ 120,00" }],
    total: "R$ 300,00",
    valid: "30/10",
    version: 1,
  },
  queue: { positions: ["4º", "3º"], wait: { pt: "15 a 25 min", en: "15 to 25 min" }, service: { pt: "Vacina da gripe", en: "Flu shot" } },
};

export const text = (t: Text, lang: "pt" | "en") => (typeof t === "string" ? t : t[lang]);
