import type { Lang, Tentpole } from "./shared";

export const base = (lang: Lang) => (lang === "pt" ? "/" : "/en/");
export const paths = {
  home: base,
  tentpole: (lang: Lang, tp: Tentpole) => `${base(lang)}${tp.slug[lang]}/`,
  features: (lang: Lang) => `${base(lang)}${lang === "pt" ? "recursos" : "features"}/`,
  download: (lang: Lang) => `${base(lang)}${lang === "pt" ? "baixar" : "download"}/`,
  business: (lang: Lang) => `${base(lang)}${lang === "pt" ? "empresas" : "business"}/`,
  technology: (lang: Lang) => `${base(lang)}${lang === "pt" ? "tecnologia" : "technology"}/`,
  compare: (lang: Lang) => `${base(lang)}${lang === "pt" ? "comparar" : "compare"}/`,
  compareApp: (lang: Lang, app: { slug: string }) => `${base(lang)}${lang === "pt" ? "comparar" : "compare"}/${app.slug}/`,
  about: (lang: Lang) => `${base(lang)}${lang === "pt" ? "sobre" : "about"}/`,
  privacy: (lang: Lang) => (lang === "pt" ? "/privacidade" : "/en/privacy"),
  terms: (lang: Lang) => (lang === "pt" ? "/termos" : "/en/terms"),
};

