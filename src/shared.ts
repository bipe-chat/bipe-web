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
import compareJson from "@shared/product/compare.json";
import * as lib from "@shared/tools/lib/registries.mjs";
import type { SceneId } from "./sim/scenes";

export type ScamKind = "pixCode" | "boleto" | "pixKey" | "deliveryFee" | "lookalikeLink" | "bankAlert" | "receipt" | "newNumber" | "urgency";
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
export type TechPart = { id: string; repo?: string; upstream?: { name: string; url: string }[] } & Copy<{ name: string; body: string }>;
export type TechGroup = { id: string; parts: TechPart[] } & Copy<{ heading: string; line: string }>;

export type DemoId = "scam" | "identity" | "handle" | "groups" | "levels" | "pix";

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
  status: { ios: Status; android: Status };
  slug: Copy<string>;
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

export const product = productJson as unknown as {
  promise: Copy<{ title: string; lede: string }>;
  headlineTest: { experiment: string; active: boolean; arms: ({ id: string; angle: string } & Copy<string>)[] };
  sides: Side[];
  tentpoles: Tentpole[];
  areas: ({ id: string } & Copy<string>)[];
  features: Feature[];
  icps: Icp[];
  audiences: Audience[];
  audiencesHub: Copy<{ nav: string; title: string; lede: string }>;
  about: Copy<{ title: string; lede: string; sections: { heading: string; body: string }[] }>;
  origin: Copy<{ title: string; body: string }>;
  business: Copy<{ nav: string; title: string; lede: string; label: string; sections: { heading: string; points: string[] }[]; cta: string; ctaSubject: string; figureCaption: string }>;
  technical: Copy<{ nav: string; title: string; lede: string }> & { groups: TechGroup[] };
  redirects: Record<string, string>;
};

/** Comparison register (bipe-shared/product/compare.json): the hub and one page per app. */
export const compare = compareJson as unknown as {
  date: string;
  threats: CompareThreat[];
  apps: CompareApp[];
} & Copy<{ nav: string; title: string; lede: string; bipe: string; appsTitle: string; more: string; aheadTitle: string; limitTitle: string; limit: string; sourcesTitle: string; sourcesNote: string; tableTitle: string; threatCol: string; levels: Record<CompareLevel, string> }>;

type Channel = { status: "available" | "waitlist"; channel: string; url: string | null; minOS?: string } & Copy<{ label: string; note: string }>;
type SourceRepo = { id: string; url: string; public: boolean } & Copy<string>;
export const distribution = distributionJson as unknown as {
  ios: Channel;
  android: Channel;
  source: { org: string; repos: SourceRepo[] };
  contact: string;
  steward: { name: string; url: string };
};
/** The side a tentpole belongs to, or undefined (groups sit outside the frame). */
export const sideOf = (tp: Tentpole): Side | undefined => product.sides.find((s) => s.tentpoles.includes(tp.id));

/** Repos the site may link: only public ones (ADR 0024). Empty until the code is published. */
export const publicRepos = distribution.source.repos.filter((r) => r.public);

/** A repo by id, only when it is public. */
export const publicRepo = (id?: string) => publicRepos.find((r) => r.id === id);

/** A Bipe UI string from bipe-shared, with %1$s placeholders filled. */
export function t(lang: Lang, key: string, ...args: string[]): string {
  const table = (lang === "pt" ? stringsPt : stringsEn).strings as Record<string, string>;
  const value = table[key];
  if (value === undefined) throw new Error(`missing string ${key}`);
  return value.replace(/%(\d+)\$s/g, (_, i) => args[Number(i) - 1] ?? "");
}

export const scamStringKey: Record<string, string> = {
  pixCode: "bipe_scam_warning_pix_code",
  boleto: "bipe_scam_warning_boleto",
  pixKey: "bipe_scam_warning_pix_key",
  deliveryFee: "bipe_scam_warning_delivery_fee",
  lookalikeLink: "bipe_scam_warning_lookalike_link",
  bankAlert: "bipe_scam_warning_bank_alert",
  receipt: "bipe_scam_warning_receipt",
  newNumber: "bipe_scam_warning_new_number",
  urgency: "bipe_scam_warning_urgency",
};
