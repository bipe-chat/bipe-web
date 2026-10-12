import type { Lang, Tentpole } from "./shared";

export const base = (lang: Lang) => (lang === "pt" ? "/" : "/en/");
export const paths = {
  home: base,
  tentpole: (lang: Lang, tp: Tentpole) => `${base(lang)}${tp.slug[lang]}/`,
  features: (lang: Lang) => `${base(lang)}${lang === "pt" ? "recursos" : "features"}/`,
  download: (lang: Lang) => `${base(lang)}${lang === "pt" ? "baixar" : "download"}/`,
  about: (lang: Lang) => `${base(lang)}${lang === "pt" ? "sobre" : "about"}/`,
  privacy: (lang: Lang) => (lang === "pt" ? "/privacidade" : "/en/privacy"),
  terms: (lang: Lang) => (lang === "pt" ? "/termos" : "/en/terms"),
};

