import { accessibilityRegister, privacyRegister, type Lang, type Tentpole } from "./shared";

export const base = (lang: Lang) => (lang === "pt" ? "/" : "/en/");
export const paths = {
  home: base,
  tentpole: (lang: Lang, tp: Tentpole) => `${base(lang)}${tp.slug[lang]}/`,
  features: (lang: Lang) => `${base(lang)}${lang === "pt" ? "recursos" : "features"}/`,
  feature: (lang: Lang, f: { slug: { pt: string; en: string } }) => `${base(lang)}${lang === "pt" ? "recursos" : "features"}/${f.slug[lang]}/`,
  audiences: (lang: Lang) => `${base(lang)}${lang === "pt" ? "para" : "for"}/`,
  audience: (lang: Lang, a: { slug: { pt: string; en: string } }) => `${base(lang)}${lang === "pt" ? "para" : "for"}/${a.slug[lang]}/`,
  download: (lang: Lang) => `${base(lang)}${lang === "pt" ? "baixar" : "download"}/`,
  business: (lang: Lang) => `${base(lang)}${lang === "pt" ? "empresas" : "business"}/`,
  pricing: (lang: Lang) => `${base(lang)}${lang === "pt" ? "precos" : "pricing"}/`,
  technology: (lang: Lang) => `${base(lang)}${lang === "pt" ? "tecnologia" : "technology"}/`,
  compare: (lang: Lang) => `${base(lang)}compare/`,
  compareApp: (lang: Lang, app: { slug: string }) => `${base(lang)}compare/${app.slug}/`,
  scams: (lang: Lang) => (lang === "pt" ? "/golpes-no-brasil/" : "/en/scams-in-brazil/"),
  scamType: (lang: Lang, t: { slug: { pt: string; en: string } }) => `${lang === "pt" ? "/golpes-no-brasil/" : "/en/scams-in-brazil/"}${t.slug[lang]}/`,
  organisations: (lang: Lang) => `${base(lang)}${lang === "pt" ? "organizacoes" : "organisations"}/`,
  organisationAudience: (lang: Lang, a: { slug: { pt: string; en: string } }) => `${base(lang)}${lang === "pt" ? "organizacoes" : "organisations"}/${a.slug[lang]}/`,
  /** The organisation form with its kind preselected (`?tipo=`) and the page that links it (`?de=`), read by OrganisationForm (bipe#792). */
  organisationForm: (lang: Lang, kind?: string, from?: string) => {
    const q = new URLSearchParams({ ...(kind ? { tipo: kind } : {}), ...(from ? { de: from } : {}) }).toString();
    return `${base(lang)}${lang === "pt" ? "organizacoes" : "organisations"}/${q ? `?${q}` : ""}#form`;
  },
  about: (lang: Lang) => `${base(lang)}${lang === "pt" ? "sobre" : "about"}/`,
  help: (lang: Lang) => `${base(lang)}${lang === "pt" ? "ajuda" : "help"}/`,
  brand: (lang: Lang) => `${base(lang)}${lang === "pt" ? "sobre/marca" : "about/brand"}/`,
  privacy: (lang: Lang) => (lang === "pt" ? "/privacidade/" : "/en/privacy/"),
  lgpd: (lang: Lang) => `${base(lang)}lgpd/`,
  whoCanRead: (lang: Lang) => `${base(lang)}${privacyRegister.slug[lang]}/`,
  accessibility: (lang: Lang) => `${base(lang)}${accessibilityRegister.slug[lang]}/`,
  terms: (lang: Lang) => (lang === "pt" ? "/termos/" : "/en/terms/"),
  docs: (lang: Lang, slug = "") => `${base(lang)}docs/${slug ? `${slug}/` : ""}`,
};

