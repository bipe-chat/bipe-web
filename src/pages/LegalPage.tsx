// Legal pages (privacy, terms). The text lives in src/legal/*.md and is shown as written: the .md
// file is also the page's Markdown twin. The renderer knows only what those files use: "#", "##",
// "_meta_" lines, "- " lists, paragraphs, **bold** and [links](url).
import type { ReactNode } from "react";
import type { Lang } from "../shared";
import privacidade from "../legal/privacidade.md?raw";
import termos from "../legal/termos.md?raw";
import privacy from "../legal/privacy.md?raw";
import terms from "../legal/terms.md?raw";

export const legal: Record<"privacy" | "terms", Record<Lang, string>> = {
  privacy: { pt: privacidade, en: privacy },
  terms: { pt: termos, en: terms },
};

/** First "# " line of a legal file. */
export const legalTitle = (md: string): string => md.match(/^# (.+)$/m)![1];

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/).map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const link = part.match(/^\[(.+)\]\((.+)\)$/);
    if (link) return <a key={i} href={link[2]}>{link[1]}</a>;
    return part;
  });
}

export function LegalPage({ md }: { md: string }) {
  const out: ReactNode[] = [];
  let items: ReactNode[] = [];
  const flush = () => { if (items.length) out.push(<ul key={out.length}>{items}</ul>); items = []; };
  for (const line of md.split("\n")) {
    if (line.startsWith("- ")) { items.push(<li key={items.length}>{inline(line.slice(2))}</li>); continue; }
    flush();
    if (!line.trim()) continue;
    const k = out.length;
    if (line.startsWith("## ")) out.push(<h2 key={k}>{line.slice(3)}</h2>);
    else if (line.startsWith("# ")) out.push(<h1 key={k}>{line.slice(2)}</h1>);
    else if (/^_.+_$/.test(line)) out.push(<p key={k} className="small muted">{line.slice(1, -1)}</p>);
    else out.push(<p key={k}>{inline(line)}</p>);
  }
  flush();
  return <section className="wrap narrow section legal">{out}</section>;
}
