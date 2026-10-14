// Legal pages (privacy, terms, LGPD). Privacy and terms live in src/legal/*.md and are shown as written:
// the .md file is also the page's Markdown twin. The LGPD page is Markdown built from the data register
// (bipe-shared/product/data.json). Renderer: src/components/markdown.tsx.
import { dataRegister, type Lang } from "../shared";
import { Markdown, mdTitle } from "../components/markdown";
import privacidade from "../legal/privacidade.md?raw";
import termos from "../legal/termos.md?raw";
import privacy from "../legal/privacy.md?raw";
import terms from "../legal/terms.md?raw";

export const legal: Record<"privacy" | "terms", Record<Lang, string>> = {
  privacy: { pt: privacidade, en: privacy },
  terms: { pt: termos, en: terms },
};

/** First "# " line of a legal file. */
export const legalTitle = mdTitle;

export function LegalPage({ md }: { md: string }) {
  return <Markdown md={md} className="legal" />;
}

/** The /lgpd/ page and its Markdown twin, from the data register. */
export function lgpdMarkdown(lang: Lang): string {
  const r = dataRegister;
  const c = r[lang];
  const where = (b: boolean | null) => c.brazil[b === true ? "yes" : b === false ? "no" : "unknown"];
  const place = (id: string) => r.places.find((p) => p.id === id)!;
  const basis = (id: string) => r.bases.find((b) => b.id === id)!;
  const items = r.items.map((i) => {
    const b = basis(i.basis);
    return [
      `### ${i[lang].name}`,
      `- **${c.labels.what}:** ${i[lang].what}`,
      `- **${c.labels.why}:** ${i[lang].why}`,
      `- **${c.labels.basis}:** ${b[lang]} (LGPD, ${b.article})`,
      `- **${c.labels.retention}:** ${i[lang].retention}`,
      `- **${c.labels.where}:** ${i.places.map((id) => `${place(id)[lang]} (${where(place(id).brazil)})`).join("; ")}`,
    ].join("\n");
  });
  const outside = r.places.filter((p) => p.brazil !== true).map((p) => {
    const uses = r.items.filter((i) => i.places.includes(p.id)).map((i) => i[lang].name);
    return uses.length ? `- **${p[lang]}** (${where(p.brazil)}): ${uses.join(", ")}.` : null;
  }).filter(Boolean);
  const officer = r.encarregado ? `${r.encarregado.name}: ${r.encarregado.contact}` : c.encarregadoMissing;
  return [
    `# ${c.title}\n_${c.meta}_`,
    c.lede,
    c.policy,
    `## ${c.itemsTitle}`,
    ...items,
    `## ${c.outsideTitle}`,
    c.outsideLede,
    outside.join("\n"),
    `## ${c.deviceTitle}`,
    c.deviceLede,
    r.device.map((d) => `- ${d[lang]}`).join("\n"),
    c.notPersonal,
    `## ${c.rightsTitle}`,
    c.rights.map((x) => `- ${x}`).join("\n"),
    c.rightsHow,
    `## ${c.controllerTitle}`,
    c.controller,
    officer,
  ].join("\n\n") + "\n";
}
