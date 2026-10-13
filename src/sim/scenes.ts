// Phone scenes for the site: one per trust state, the chat list, the trust profile, and one or more per
// feature page (bipe#176). People come from the cast (src/cast/cast.json). Card text comes from the app
// strings through t(); labels the app has no string for yet are site copy in chrome[lang].sim.
// Scam warnings are never written here: ScenePhone runs every incoming message through the
// reference detector, the same as the app. Messages are sample data in pt-BR; the English page
// shows a gloss in brackets.
import type { Trust } from "../cast";

export type Text = string | { pt: string; en: string };

export type Line =
  | { from: string; text: Text }
  /** A text sticker from STICKERS in SceneParts.tsx. */
  | { from: string; sticker: string }
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
  | { card: "join"; person: string };

export type InboxRow = { with: string; savedAs?: string; trust?: Trust; preview: string; time: string; unread?: number };
/** A message request (requests): apart from the chats, with accept and ignore. */
export type RequestRow = { with: string; preview: string; age: Text };

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
  | { kind: "contacts"; found: string[] };

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
      { from: "golpista", text: "Oi filha, troquei de número. Essa é minha conta nova aqui" },
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
  // /empresas/: a structured question instead of "reply 1 or 2" (ADR 0081).
  "empresa-pergunta": {
    kind: "chat", with: "clinica",
    lines: [
      { card: "notice", text: "Sua consulta é amanhã, às 14h, com a Dra. Ana." },
      { card: "poll", question: { pt: "Você confirma?", en: "Você confirma? (Do you confirm?)" }, options: [{ label: { pt: "Confirmo", en: "Confirmo (I confirm)" }, votes: 1 }, { label: { pt: "Quero remarcar", en: "Quero remarcar (Reschedule)" }, votes: 0 }], mine: 0, ask: true },
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
      { with: "golpista", preview: "Oi filha, troquei de número. Essa é minha conta nova aqui", time: "09:12", unread: 1 },
      { with: "rafa", preview: "Pix recebido, valeu!", time: "ontem" },
      { with: "clinica", preview: "Consulta confirmada. Até amanhã.", time: "ontem" },
      { with: "fernanda", trust: "suspended", preview: "Ligo sim, 2 min", time: "seg" },
      { with: "marina", preview: "Chegou certinho aqui", time: "dom" },
      { with: "thiago", preview: "Amanhã cedo eu olho o carro", time: "sáb" },
    ],
  },
  perfil: { kind: "trustProfile", me: "gabi", done: 2 },
  pedidos: {
    kind: "inbox",
    requests: [{ with: "golpista", preview: "Oi filha, troquei de número. Essa é minha conta nova aqui", age: { pt: "2 dias", en: "2 days" } }],
    rows: [
      { with: "joana", savedAs: "Mãe", preview: "Chego sábado de manhã. Me busca?", time: "10:24", unread: 2 },
      { with: "familia", preview: "Vô Antônio: Domingo tem almoço aqui em casa", time: "09:58", unread: 5 },
      { with: "rafa", preview: "Pix recebido, valeu", time: "ontem" },
      { with: "clinica", preview: "Consulta confirmada. Até amanhã.", time: "ontem" },
    ],
  },
  "pausa-pix": {
    kind: "chat", with: "golpista",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "golpista", text: "Oi filha, essa é minha conta nova. Salva aí" },
      { from: ME, text: { pt: "Oi mãe, salvei", en: "Oi mãe, salvei (Hi mom, saved it)" } },
      { from: "golpista", text: "Preciso pagar um boleto hoje ainda. Faz um Pix pra essa chave: joana.lima.2@example.com" },
      { card: "pause", seconds: 5 },
    ],
  },
  "mae-outro-nome": {
    kind: "chat", with: "patricia", savedAs: "Mãe",
    lines: [
      { card: "nickname" },
      { from: "patricia", text: "Filha, me faz um Pix hoje ainda? Te devolvo amanhã" },
    ],
  },
  "nome-reservado": { kind: "lookup", typed: ["itau", "correios", "inss"] },
  "letra-disfarcada": { kind: "lookup", typed: ["1tau", "c0rreios", "bradesc0"] },
  "qr-conversa": { kind: "scan", with: "rafa", first: { pt: "Oi Rafa, aqui é a Gabi da feira de bikes", en: "Oi Rafa, aqui é a Gabi da feira de bikes (Hi Rafa, it is Gabi from the bike fair)" } },
  "verificacao-pix": { kind: "verifyPix", me: "gabi" },
  cobranca: {
    kind: "chat", with: "clinica",
    lines: [
      { card: "notice", text: "Sua consulta com a Dra. Ana foi ontem. Segue a cobrança." },
      { card: "charge", amount: "R$ 180,00", description: { pt: "Consulta de 14/10", en: "Consulta de 14/10 (Appointment on 14 Oct)" }, paidAt: 4 },
      { from: ME, text: { pt: "Paguei pelo app do banco", en: "Paguei pelo app do banco (Paid in my bank app)" } },
      { card: "notice", text: "Pagamento recebido. Obrigada." },
    ],
  },
  avisos: {
    kind: "chat", with: "avisos", names: { valdir: "Seu Valdir (síndico)" }, footer: "readOnly",
    lines: [
      { from: "valdir", text: { pt: "Assembleia na quinta, às 20h, no salão de festas. Pauta: pintura da fachada", en: "Assembleia na quinta, às 20h, no salão de festas. Pauta: pintura da fachada (Meeting Thursday 8 pm about painting the front)" } },
      { from: "valdir", text: { pt: "Vote abaixo na cor da fachada", en: "Vote abaixo na cor da fachada (Vote for the colour below)" } },
      { card: "poll", question: { pt: "Cor da fachada", en: "Cor da fachada (Colour of the front)" }, options: [{ label: { pt: "Amarelo claro", en: "Amarelo claro (Pale yellow)" }, votes: 21 }, { label: { pt: "Branco", en: "Branco (White)" }, votes: 12 }, { label: { pt: "Cinza", en: "Cinza (Grey)" }, votes: 5 }], mine: 0 },
    ],
  },
  "grupo-verificados": {
    kind: "chat", with: "igreja", names: { antonio: "Vô Antônio" },
    lines: [
      { from: "debora", text: { pt: "Irmãos, agora o grupo aceita só quem tem selo verificado", en: "Irmãos, agora o grupo aceita só quem tem selo verificado (The group now takes only verified accounts)" } },
      { card: "join", person: "antonio" },
      { card: "join", person: "falsapastora" },
    ],
  },
  convite: {
    kind: "chat", with: "kaua",
    lines: [
      { from: ME, text: { pt: "Kauã, baixa o Bipe. Te mandei um convite", en: "Kauã, baixa o Bipe. Te mandei um convite (Get Bipe, I sent you an invite)" } },
      { card: "app", key: "bipe_invites_joined", args: ["Kauã"] },
      { from: "kaua", text: { pt: "Entrei. Caí direto aqui na nossa conversa", en: "Entrei. Caí direto aqui na nossa conversa (I am in, landed right in our chat)" } },
    ],
  },
  contatos: { kind: "contacts", found: ["antonio", "cida", "thiago", "leo"] },
  stickers: {
    kind: "chat", with: "faculdade", footer: "stickers",
    lines: [
      { from: "bia", text: { pt: "Sexta tem churrasco lá em casa", en: "Sexta tem churrasco lá em casa (BBQ at my place on Friday)" } },
      { from: "leo", sticker: "Fechou" },
      { from: ME, sticker: "Valeu" },
    ],
  },
  // One scene per golpe page (bipe#175): the golpe as it arrives on Bipe. The warning, when there is one, comes from the detector.
  "falso-chefe": {
    kind: "chat", with: "falsochefe",
    lines: [
      { card: "unverified", age: { pt: "1 dia", en: "1 day" } },
      { from: "falsochefe", text: "Oi, é o Carlos. Tô numa reunião e não consigo falar agora. Preciso que você faça um Pix urgente pra um fornecedor" },
      { from: ME, text: { pt: "Carlos? Esse número é seu?", en: "Carlos? Esse número é seu? (Carlos? Is this your number?)" } },
    ],
  },
  "codigo-engano": {
    kind: "chat", with: "lucas",
    lines: [
      { card: "unverified", age: { pt: "2 horas", en: "2 hours" } },
      { from: "lucas", text: "Oi, desculpa, mandei um código pro seu número sem querer. Me passa o código que chegou?" },
    ],
  },
  "golpe-amor": {
    kind: "chat", with: "daniel",
    lines: [
      { from: "daniel", text: { pt: "Bom dia, meu amor. Sonhei com você de novo", en: "Bom dia, meu amor. Sonhei com você de novo (Good morning, my love. I dreamt of you again)" } },
      { from: ME, text: { pt: "Bom dia. Quando a gente faz aquela chamada de vídeo?", en: "Bom dia. Quando a gente faz aquela chamada de vídeo? (When do we do that video call?)" } },
      { from: "daniel", text: "Meu amor, o presente que te mandei ficou preso na alfândega. Preciso de R$ 1.800 da taxa. Faz um Pix pra chave daniel.ferraz@example.com" },
    ],
  },
  "falso-advogado": {
    kind: "chat", with: "advogado",
    lines: [
      { card: "unverified", age: { pt: "3 dias", en: "3 days" } },
      { from: "advogado", text: "Boa tarde, aqui é do escritório do seu advogado." },
      { from: "advogado", text: "Seu processo foi ganho e o valor de R$ 18.400 está liberado. Pra receber, precisa pagar as custas de R$ 1.250 hoje. Chave Pix: custas.processo@example.com" },
    ],
  },
  "orgao-publico": {
    kind: "chat", with: "valores",
    lines: [
      { card: "unverified", age: { pt: "4 horas", en: "4 hours" } },
      { from: "valores", text: "Você tem R$ 1.240 em valores a receber. Consulte e resgate hoje em valoresareceber-bcb.site" },
    ],
  },
  "taxa-correios": {
    kind: "chat", with: "rastreio",
    lines: [
      { card: "unverified", age: { pt: "1 hora", en: "1 hour" } },
      { from: "rastreio", text: "Seu pacote está retido na alfândega. Pague a taxa de R$ 9,90 para liberar: rastreio-correios.online" },
    ],
  },
  "falso-suporte-bipe": {
    kind: "chat", with: "falsobipe",
    lines: [
      { card: "unverified", age: { pt: "5 horas", en: "5 hours" } },
      { from: "falsobipe", text: "Olá, aqui é do suporte do Bipe. Sua conta vai ser desativada hoje. Me passa sua senha de 8 números pra confirmar que é você" },
    ],
  },
  "venda-falsa": {
    kind: "chat", with: "andre",
    lines: [
      { from: ME, text: { pt: "Oi, o celular do anúncio ainda está à venda?", en: "Oi, o celular do anúncio ainda está à venda? (Is the phone in the ad still for sale?)" } },
      { from: "andre", text: "Celular seminovo, R$ 1.200. Tenho mais 3 interessados, se fizer o pix agora é seu. Chave andre.usados@example.com" },
      { from: ME, text: { pt: "Posso ver antes de pagar?", en: "Posso ver antes de pagar? (Can I see it before I pay?)" } },
    ],
  },
  "comprovante-falso": {
    kind: "chat", with: "bruno",
    lines: [
      { from: "bruno", text: { pt: "Fechado, fico com o sofá", en: "Fechado, fico com o sofá (Deal, I will take the sofa)" } },
      { from: "bruno", text: "Pronto, paguei. Segue o comprovante do Pix. Pode mandar o produto hoje?" },
      { from: ME, text: { pt: "Vou conferir no app do banco antes", en: "Vou conferir no app do banco antes (I will check in my bank app first)" } },
    ],
  },
  aluguel: {
    kind: "chat", with: "silvia",
    lines: [
      { from: ME, text: { pt: "Oi, a casa está livre no feriado?", en: "Oi, a casa está livre no feriado? (Is the house free on the holiday?)" } },
      { from: "silvia", text: "Casa pé na areia, R$ 250 a diária. Pra garantir o feriado preciso de 50% no pix hoje ainda. Chave silvia.temporada@example.com" },
    ],
  },
  "pix-errado": {
    kind: "chat", with: "marcelo",
    lines: [
      { card: "unverified", age: { pt: "20 minutos", en: "20 minutes" } },
      { from: "marcelo", text: "Oi, fiz um Pix errado pra você de R$ 380. Pode devolver pra essa chave? 4f1c2b9e-7a3d-4c55-9e21-0b8d6f3a2c71" },
      { from: ME, text: { pt: "Vou devolver pelo botão do banco", en: "Vou devolver pelo botão do banco (I will return it with the bank's button)" } },
    ],
  },
  boleto: {
    kind: "chat", with: "colegio",
    lines: [
      { card: "unverified", age: { pt: "1 dia", en: "1 day" } },
      { from: "colegio", text: "Mensalidade de outubro com novo banco. Pague por este boleto: 23793.38128 60000.000003 00000.000400 1 84340000012000" },
    ],
  },
  emprestimo: {
    kind: "chat", with: "credito",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "credito", text: "Seu empréstimo de R$ 15.000 foi aprovado. Para liberar hoje ainda, faça o pix do seguro de R$ 390 para a chave creditoja@example.com" },
    ],
  },
  investimento: {
    kind: "chat", with: "vip",
    lines: [
      { from: "jessica", text: "Saquei R$ 2.300 hoje, obrigada Rodrigo" },
      { from: "rodrigo", text: "Entra agora, o robô rendeu 5% hoje de novo. Quem depositar até as 20h dobra o valor. Pix pra chave lucrocerto@example.com" },
    ],
  },
  aposta: {
    kind: "chat", with: "sinais",
    lines: [
      { card: "unverified", age: { pt: "6 horas", en: "6 hours" } },
      { from: "sinais", text: "Seu saldo da bet fechada está retido. Para receber a devolução, pague a taxa de R$ 59 pelo pix taxa.devolucao@example.com" },
    ],
  },
  "link-falso": {
    kind: "chat", with: "suporte",
    lines: [
      { card: "unverified", age: { pt: "3 horas", en: "3 hours" } },
      { from: "suporte", text: "Seu cartão foi bloqueado por segurança. Desbloqueie agora em itau-desbloqueio.top" },
    ],
  },
  "acesso-remoto": {
    kind: "chat", with: "suporte",
    lines: [
      { card: "unverified", age: { pt: "5 horas", en: "5 hours" } },
      { from: "suporte", text: "Identificamos uma compra de R$ 2.399 no seu cartão. Foi você?" },
      { from: ME, text: { pt: "Não fui eu", en: "Não fui eu (It was not me)" } },
      { from: "suporte", text: "Pra cancelar a compra, instala o app de proteção pelo link protecao-cartao.app e me fala o código que aparecer" },
    ],
  },
  ameaca: {
    kind: "inbox",
    requests: [{ with: "desconhecido", preview: "Sei onde você mora e o nome da sua mãe. Faz um pix de 3 mil hoje ainda e fica tudo bem", age: { pt: "10 minutos", en: "10 minutes" } }],
    rows: [
      { with: "joana", savedAs: "Mãe", preview: "Chego sábado de manhã. Me busca?", time: "10:24" },
      { with: "familia", preview: "Vô Antônio: Domingo tem almoço aqui em casa", time: "09:58" },
    ],
  },
  sequestro: {
    kind: "chat", with: "desconhecido",
    lines: [
      { card: "unverified", age: { pt: "5 minutos", en: "5 minutes" } },
      { from: "desconhecido", text: "Estamos com a sua filha. Não desliga e não fala com ninguém. Faz o pix agora mesmo ou ela não volta" },
      { from: ME, text: { pt: "Vou ligar pra ela", en: "Vou ligar pra ela (I am calling her)" } },
    ],
  },
  sextorsao: {
    kind: "chat", with: "larissa",
    lines: [
      { card: "unverified", age: { pt: "4 dias", en: "4 days" } },
      { from: "larissa", text: "Tenho o print da nossa chamada. Se não pagar R$ 2.000 hoje ainda, mando pra todos os seus contatos" },
    ],
  },
  vaquinha: {
    kind: "chat", with: "vaquinha",
    lines: [
      { card: "unverified", age: { pt: "2 dias", en: "2 days" } },
      { from: "vaquinha", text: "Ajude a Maria, 6 anos, cirurgia urgente. Qualquer valor salva. Chave Pix: ajudeamaria@example.com" },
    ],
  },
  "loja-falsa": {
    kind: "chat", with: "outlet",
    lines: [
      { from: ME, text: { pt: "Oi, vi o anúncio do tênis", en: "Oi, vi o anúncio do tênis (I saw the ad for the trainers)" } },
      { from: "outlet", text: "Tênis de corrida de R$ 899 por R$ 199, só hoje. Pague no pix e enviamos amanhã. Chave outletpromo@example.com" },
    ],
  },
} satisfies Record<string, Scene>;

export type SceneId = keyof typeof scenes;

/**
 * Figures that are not a phone scene: sims and static figures, drawn by src/sim/Figure.tsx.
 * A figure id in product.json (tentpole `demos`, feature `figures`) is a scene id above or one of these.
 * bipe-shared/tools/gen-product-doc.mjs reads this line and the scene keys to validate those ids: keep it on one line.
 */
export const SIMS = ["scam", "identity", "handle", "groups", "levels", "pix", "business", "noAds", "noSms", "handoff", "e2ee", "brazil", "openSource"] as const;
export type SimId = (typeof SIMS)[number];
export type FigureId = SceneId | SimId;
export const isFigureId = (id: string): id is FigureId => id in scenes || (SIMS as readonly string[]).includes(id);

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
