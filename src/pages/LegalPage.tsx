// Legal pages (privacy, terms). The text lives in src/legal/*.md and is shown as written: the .md
// file is also the page's Markdown twin. Renderer: src/components/markdown.tsx.
import type { Lang } from "../shared";
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
