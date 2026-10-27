import type { OrganisationFormCopy, OrganisationKind } from "./sim/OrganisationForm";
import type { IconName } from "./components/ui";
// The site's only door into bipe-shared. Registries, strings and product copy come from there;
// the scam, handle and name logic is the reference implementation every app must match.
import familyTerms from "@shared/registries/family-terms.json";
import handles from "@shared/registries/handles.json";
import homoglyphs from "@shared/registries/homoglyphs.json";
import inviteCodes from "@shared/registries/invite-codes.json";
import accountsJson from "@shared/registries/accounts.json";
import reservedNames from "@shared/registries/reserved-names.json";
import scamPatterns from "@shared/registries/scam-patterns.json";
import stringsEn from "@shared/strings/en.json";
import stringsPt from "@shared/strings/pt-BR.json";
import distributionJson from "@shared/product/distribution.json";
import productJson from "@shared/product/product.json";
import parityJson from "@shared/product/parity.json";
import compareJson from "@shared/product/compare.json";
import dataJson from "@shared/product/data.json";
import privacyJson from "@shared/product/privacy.json";
import accessibilityJson from "@shared/product/accessibility.json";
import * as lib from "@shared/tools/lib/registries.mjs";
import * as pixLib from "@shared/tools/lib/pix.mjs";
import type { FigureId, SceneId } from "./sim/scenes";

export type ScamKind = "extortion" | "pixCode" | "boleto" | "remoteApp" | "pinRequest" | "pixKey" | "deliveryFee" | "lookalikeLink" | "bankAlert" | "receipt" | "newNumber" | "urgency";
export type Registries = {
  reserved: { categories: Record<string, string[]> };
  family: { terms: string[] };
  scam: { warningKindPriority: string[] } & Record<string, unknown>;
  homoglyphs: { map: Record<string, string> };
  inviteCodes: { pattern: string; alphabet: string; maxInputLength: number };
  handles: { minLength: number; ownerMinLength: number; maxLength: number; pattern: string; skeletonStrip: string; changeCooldownDays: number; releaseHoldDays: number };
  owners: { owners: Record<string, string[]>; handles: Record<string, string> };
  strings: { strings: Record<string, string> };
  stringsEn: { strings: Record<string, string> };
};

// Typed views of the reference implementation (plain JS in bipe-shared).
export const normalize = lib.normalize as (input: string, homoglyphMap: Record<string, string>) => string;
export const scamWarningKind = lib.scamWarningKind as (text: string, reg: Registries) => ScamKind | null;
export const handleProblem = lib.handleProblem as (handle: string, reg: Registries) => "too_short" | "too_long" | "invalid_characters" | "reserved" | null;
export const handleSkeleton = lib.handleSkeleton as (handle: string, reg: Registries) => string;
export const extractInviteCodeRef = lib.extractInviteCode as (text: string, reg: Registries) => string | null;
export const normalizeCnpj = lib.normalizeCnpj as (input: string) => string | null;
export type PixCode = { status: "valid" | "badCrc" | "malformed"; dynamic: boolean; key: string | null; keyType: string | null; name: string | null; city: string | null; amount: string | null; info: string | null };
/** The Conferir no Bipe check of shared text (pix-check, test-vectors/pix-check.json). */
export const pixCheck = pixLib.pixCheck as (text: string, reg: Registries) => { code: PixCode | null; keys: { value: string; types: string[] }[]; warning: ScamKind | null };

export const reg = {
  reserved: reservedNames,
  family: familyTerms,
  scam: scamPatterns,
  homoglyphs,
  handles,
  // Public pages never name MZ (AGENTS.md), so the site leaves out the owned handles of
  // reserved-name-owners.json (ADR 0065). A short handle is then too_short, as for every new account.
  owners: { owners: {}, handles: {} },
  inviteCodes,
  strings: stringsPt,
  stringsEn,
} as unknown as Registries;

/** Device-first account rules (ADR 0057, 0059): link lives and recovery delays. */
export const accountRules = accountsJson as { recoveryLinkMinutes: number; emailVerifyLinkHours: number; recoveryDelayHours: { email: number } };

export type Lang = "pt" | "en";
export type Status = "testing" | "built" | "planned" | "policy";
/** The four surfaces of the parity ledger (ADR 0092). web is bipe-web, server is bipe-api and infra. */
export type Surface = "ios" | "android" | "web" | "server";
export const SURFACES: Surface[] = ["ios", "android", "web", "server"];
/** n/a: the surface has no part in the feature (no web chat, device only). */
export type SurfaceStatus = Status | "n/a";
type Copy<T> = { pt: T; en: T };

export type Tentpole = {
  id: string;
  slug: Copy<string>;
  status: Status;
  demos: DemoId[];
  features: string[];
  docs: string[];
} & Copy<{ name: string; title: string; summary: string; points: string[]; demos: { title: string; caption: string }[] }>;

/** A part of the stack on the technology page. repo is an id in distribution.json source.repos. */
export type TechPart = { id: string; repo?: string; code?: string[]; upstream?: { name: string; url: string }[] } & Copy<{ name: string; body: string }>;
export type TechGroup = { id: string; parts: TechPart[] } & Copy<{ heading: string; line: string }>;

/** A tentpole demo or a feature figure: a scene id or a sim id (src/sim/scenes.ts SIMS). */
export type DemoId = FigureId;

/** Positioning (ADR 0047): tentpoles and feature areas grouped by the side they protect. */
export type Side = { id: "other" | "you"; tentpoles: string[]; areas: string[] } & Copy<{ name: string; line: string }>;

/** How an app covers a threat: on by default, the user turns it on, with a stated limit, not covered. */
export type CompareLevel = "on" | "setting" | "limited" | "none";
/** A threat in the comparison register. Bipe status comes from the listed features. */
export type CompareThreat = { id: string; features: string[] } & Copy<{ threat: string; bipe: string }>;
/** Another app in the register. A cell exists only when we have a sourced fact. */
export type CompareApp = {
  id: string; slug: string; name: string;
  cells: Record<string, { level: CompareLevel } & Copy<string>>;
  sources: { name: string; url: string }[];
} & Copy<{ title: string; lede: string; line: string; on: string; ahead: string[] }>;

/** A building block. Each one has its own page; audience pages are made of these. */
export type Feature = {
  id: string;
  area: string;
  /** From bipe-shared/product/parity.json, the item with the same id (bipe#300). product.json has no status. */
  status: { ios: Status; android: Status; web: SurfaceStatus; server: SurfaceStatus };
  slug: Copy<string>;
  /** Phone scenes and sims that show the feature in practice; the first sits beside the text (bipe#176). */
  figures?: FigureId[];
  /** One glyph per feature, unique in the grid (Icon in src/components/ui.tsx). gen-product-doc.mjs checks it. */
  icon: IconName;
  /** Deep links into the code: ids in distribution.json source.code. */
  code?: string[];
} & Copy<{ name: string; body: string; points: string[] }>;

/** A step of the ICP ladder (ADR 0060). Internal: never rendered. */
export type Icp = { id: string; step: number; current: boolean; adr: string; name: string; who: string; platforms: ("ios" | "android")[]; gate: string[] };

/** An audience page (/para/<slug>/): names an ICP (ADR 0060), built from feature pages. Sections share feature ids across languages. */
export type Audience = {
  id: string;
  icp: string;
  slug: Copy<string>;
  /** Optional phone scene (src/sim/scenes.ts) beside the section text. */
  sections: { id: string; features: string[]; scene?: SceneId }[];
} & Copy<{ name: string; title: string; headline: string; lede: string; sections: { heading: string; body: string }[]; note: string; cta: string; ctaSubject: string }>;

/** An organisation audience page (/organizacoes/<slug>/, bipe#790): built from feature pages; `kind` preselects the organisation form. */
export type OrganisationAudience = {
  id: string;
  kind: OrganisationKind;
  slug: Copy<string>;
  sections: { id: string; features: string[]; scene?: SceneId }[];
} & Copy<{ name: string; title: string; headline: string; lede: string; sections: { heading: string; body: string }[]; note: string; cta: string }>;

export type WhatsAppRates = {
  checked: string; effective: string; source: string;
  marketing: number; utility: [number, number][]; authentication: [number, number][]; service: number; serviceFreePerNumber: number;
};
export type PriceProposal = {
  adr: string; smallSeats: number; company: { monthly: number; extraSeat: number; annualMonths: number };
  nonprofitFactor: number; publicBodyFactor: number; institutionBands: { upTo: number | null; yearly: number }[];
};
export type CalculatorPreset = {
  id: string; messages: number; mix: Record<"marketing" | "utility" | "authentication" | "service", number>;
  org: CalculatorOrg; seats?: number; band?: number;
};
export type CalculatorOrg = "small" | "company" | "nonprofit" | "institution" | "public";
export type CalculatorCopy = {
  heading: string; lede: string; whatsapp: string; bipe: string; org: string; seats: string; people: string;
  fields: Record<"marketing" | "marketingHint" | "utility" | "utilityHint" | "authentication" | "service" | "serviceHint" | "numbers" | "bspPercent" | "bspMonthly", string>;
  orgs: Record<CalculatorOrg, string>; peopleBands: string[];
  lines: Record<"marketing" | "utility" | "authentication" | "service" | "serviceFree" | "meta" | "bsp" | "total" | "year" | "bipeMonth" | "bipeYear" | "bipeAnnual" | "bipeSame" | "smallMoved", string>;
  proposal: string; notes: string[]; sourceLink: string; link: string;
  presetsLabel: string; presets: Record<string, string>;
  simple: Record<"messages" | "seats" | "save" | "perMonth" | "perYear" | "cheaper" | "compare" | "assumption" | "detail" | "mix", string>;
};

export type PricingTierId = "small" | "company" | "institution" | "public";

// The status of each feature is its parity ledger item (bipe-shared/product/parity.json, ADR 0092).
// A ledger surface is a status string or { status, evidence, reason }. Fails the build when a feature has no item.
type LedgerSurface = SurfaceStatus | { status: SurfaceStatus };
const ledger = new Map((parityJson as unknown as { items: ({ id: string } & Record<Surface, LedgerSurface>)[] }).items.map((i) => [i.id, i]));
function featureStatus(id: string): Feature["status"] {
  const item = ledger.get(id);
  if (!item) throw new Error(`feature ${id} has no item in bipe-shared/product/parity.json`);
  const s = (x: LedgerSurface) => (typeof x === "string" ? x : x.status);
  return { ios: s(item.ios) as Status, android: s(item.android) as Status, web: s(item.web), server: s(item.server) };
}
const productData = productJson as unknown as { features: Omit<Feature, "status">[] };

export const product = { ...productData, features: productData.features.map((f) => ({ ...f, status: featureStatus(f.id) })) } as unknown as {
  promise: Copy<{ title: string; lede: string }>;
  home: { proof: string[]; features: string[] };
  realFake: Copy<{ title: string; lede: string; caption: string }>;
  headlineTest: { experiment: string; active: boolean; arms: ({ id: string; angle: string } & Copy<string>)[] };
  sides: Side[];
  tentpoles: Tentpole[];
  areas: ({ id: string } & Copy<string>)[];
  features: Feature[];
  icps: Icp[];
  audiences: Audience[];
  featuresHub: Copy<{ lede: string }>;
  audiencesHub: Copy<{ nav: string; title: string; lede: string }>;
  about: Copy<{ title: string; lede: string; sections: { heading: string; body: string }[] }>;
  origin: Copy<{ title: string; body: string }>;
  business: Copy<{ nav: string; title: string; lede: string; label: string; sections: { heading: string; points: string[] }[]; cta: string; ctaSubject: string; figureCaption: string }>;
  pricing: {
    /** Feature ids of the tools that are free on every plan. */
    tools: string[];
    /** `amount` in BRL is set only after the pilot (ADR 0075). No amount: the page shows `pilotPrice`. */
    tiers: { id: PricingTierId; amount?: number; cta: "app" | "form" }[];
    /** Meta's Brazil rate card for the calculator (bipe#812). Tiers: [first message count of the band, BRL rate]. */
    whatsapp: WhatsAppRates;
    /** Proposed amounts (ADR 0083, ADR 0125), not approved prices. */
    proposal: PriceProposal;
    /** Example organisations above the sliders (bipe#812). */
    calculatorPresets: CalculatorPreset[];
  } & Copy<{
    nav: string; link: string; title: string; lede: string;
    principles: { heading: string; points: string[] }; why: { heading: string; points: string[] };
    tiersHeading: string; freePrice: string; pilotPrice: string; ctaApp: string; ctaForm: string;
    tiers: Record<PricingTierId, { name: string; who: string; billing: string; points: string[] }>;
    nonprofit: string; tools: { heading: string; body: string }; pilot: { heading: string; points: string[] };
    calculator: CalculatorCopy;
  }>;
  organisations: Copy<{
    nav: string; label: string; title: string; lede: string; why: { heading: string; points: string[] }; figureCaption: string;
    ask: { heading: string; body: string }; steward: { heading: string; body: string }; small: { heading: string; body: string; button: string };
    cta: string; aboutLink: string; card: { title: string; line: string }; form: OrganisationFormCopy; audiencesHeading: string;
  }>;
  organisationAudiences: OrganisationAudience[];
  technical: Copy<{ nav: string; title: string; lede: string }> & { groups: TechGroup[] };
  redirects: Record<string, string>;
};

/** Comparison register (bipe-shared/product/compare.json): the hub and one page per app. */
export const compare = compareJson as unknown as {
  date: string;
  threats: CompareThreat[];
  apps: CompareApp[];
} & Copy<{ nav: string; title: string; description: string; bipe: string; appsTitle: string; more: string; aheadTitle: string; limitTitle: string; limit: string; sourcesTitle: string; sourcesNote: string; tableTitle: string; threatCol: string; levels: Record<CompareLevel, string> }>;

type DataText = { name: string; what: string; why: string; retention: string };
/** Data register (bipe-shared/product/data.json): the LGPD record of processing and the /lgpd/ page. */
export const dataRegister = dataJson as unknown as {
  date: string;
  encarregado: { name: string; contact: string } | null;
  bases: ({ id: string; article: string } & Copy<string>)[];
  places: ({ id: string; brazil: boolean | null } & Copy<string>)[];
  items: ({ id: string; basis: string; places: string[] } & Copy<DataText>)[];
  device: ({ id: string } & Copy<string>)[];
} & Copy<{
  nav: string; title: string; meta: string; lede: string; policy: string; itemsTitle: string;
  labels: { what: string; why: string; basis: string; retention: string; where: string };
  brazil: { yes: string; no: string; unknown: string };
  outsideTitle: string; outsideLede: string; deviceTitle: string; deviceLede: string; notPersonal: string;
  rightsTitle: string; rights: string[]; rightsHow: string; controllerTitle: string; controller: string; encarregadoMissing: string;
}>;

export type PrivacyLevel = "yes" | "partial" | "no";
/** Who can read what (bipe-shared/product/privacy.json, ADR 0109): /quem-pode-ler/ and its summary on the e2ee pages. */
export const privacyRegister = privacyJson as unknown as {
  date: string;
  feature: string;
  tentpole: string;
  slug: Copy<string>;
  levels: PrivacyLevel[];
  things: ({ id: string; register: string[] } & Copy<string>)[];
  parties: ({ id: string; access: Record<string, PrivacyLevel> } & Copy<{ name: string; note: string }>)[];
} & Copy<{
  nav: string; title: string; lede: string; explainTitle: string; explain: { heading: string; body: string }[]; rule: string;
  tableTitle: string; tableLede: string; levelLabels: Record<PrivacyLevel, string>; limitsTitle: string; limits: string[];
  faqTitle: string; faq: { q: string; a: string }[]; more: string; summaryTitle: string; summaryLink: string;
}>;

export type A11yPlatform = "ios" | "android" | "web";
export type A11yLevel = "yes" | "partial" | "no" | "na";
export type A11yStage = "next" | "studying";
/** Accessibility register (bipe-shared/product/accessibility.json, bipe#491): /acessibilidade/. Roadmap issues are internal and never render. */
export const accessibilityRegister = accessibilityJson as unknown as {
  date: string;
  slug: Copy<string>;
  platforms: A11yPlatform[];
  levels: A11yLevel[];
  items: ({ id: string; status: Record<A11yPlatform, A11yLevel>; next: string[] } & Copy<{ name: string; body: string }>)[];
  roadmap: ({ id: string; stage: A11yStage; issues: number[] } & Copy<{ name: string; body: string }>)[];
} & Copy<{
  nav: string; title: string; description: string; lede: string; rulesTitle: string; rules: string[];
  tableTitle: string; tableLede: string; featureLabel: string; platformLabels: Record<A11yPlatform, string>; levelLabels: Record<A11yLevel, string>;
  roadmapTitle: string; roadmapLede: string; stageLabels: Record<A11yStage, string>;
  limitsTitle: string; limits: string[]; reportTitle: string; report: string; reportLink: string;
}>;

type Channel = { status: "available" | "waitlist"; channel: string; url: string | null; minOS?: string } & Copy<{ label: string; note: string }>;
type SourceRepo = { id: string; url: string; public: boolean } & Copy<string>;
/** A file or folder in a repo. A path ending in / is a folder; an empty path is the repo itself. */
type CodeLink = { id: string; repo: string; path: string } & Copy<string>;
export const distribution = distributionJson as unknown as {
  ios: Channel;
  android: Channel;
  source: { org: string; repos: SourceRepo[]; code?: CodeLink[] };
  contact: string;
  steward: { name: string; url: string };
  social: { accounts: { id: string; name: string; handle: string; url: string }[] };
};
/** The side a tentpole belongs to, or undefined (groups sit outside the frame). */
export const sideOf = (tp: Tentpole): Side | undefined => product.sides.find((s) => s.tentpoles.includes(tp.id));

/** Repos the site may link: only public ones (ADR 0024). Empty until the code is published. */
export const publicRepos = distribution.source.repos.filter((r) => r.public);

/** A repo by id, only when it is public. */
export const publicRepo = (id?: string) => publicRepos.find((r) => r.id === id);

/** Deep links by id, with their GitHub URL, only for public repos. scripts/check-code-links.mjs checks every path at build. */
export function codeLinks(ids: string[] = []) {
  return ids.flatMap((id) => {
    const c = distribution.source.code?.find((x) => x.id === id);
    const repo = c && publicRepo(c.repo);
    if (!repo) return [];
    const url = c.path ? `${repo.url}/${c.path.endsWith("/") ? "tree" : "blob"}/main/${c.path.replace(/\/$/, "")}` : repo.url;
    return [{ ...c, url }];
  });
}

/** A Bipe UI string from bipe-shared, with %1$s placeholders filled. */
export function t(lang: Lang, key: string, ...args: string[]): string {
  const table = (lang === "pt" ? stringsPt : stringsEn).strings as Record<string, string>;
  const value = table[key];
  if (value === undefined) throw new Error(`missing string ${key}`);
  return value.replace(/%(\d+)\$s/g, (_, i) => args[Number(i) - 1] ?? "");
}

export const scamStringKey: Record<ScamKind, string> = {
  extortion: "bipe_scam_warning_extortion",
  pixCode: "bipe_scam_warning_pix_code",
  boleto: "bipe_scam_warning_boleto",
  remoteApp: "bipe_scam_warning_remote_app",
  pinRequest: "bipe_scam_warning_pin_request",
  pixKey: "bipe_scam_warning_pix_key",
  deliveryFee: "bipe_scam_warning_delivery_fee",
  lookalikeLink: "bipe_scam_warning_lookalike_link",
  bankAlert: "bipe_scam_warning_bank_alert",
  receipt: "bipe_scam_warning_receipt",
  newNumber: "bipe_scam_warning_new_number",
  urgency: "bipe_scam_warning_urgency",
};
