// Renders the Markdown of the legal pages (src/legal/*.md) and the docs (src/docs/*.md). The .md file
// is also the page's Markdown twin, so the page shows it as written. The renderer knows only what
// those files use: "#", "##", "###", "_meta_" lines, "- " lists, "|" tables, ``` blocks, paragraphs,
// **bold**, `code` and [links](url).
import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/).map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const code = part.match(/^`(.+)`$/);
    if (code) return <code key={i}>{code[1]}</code>;
    const link = part.match(/^\[(.+)\]\((.+)\)$/);
    if (link) return <a key={i} href={link[2]}>{link[1]}</a>;
    return part;
  });
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function Markdown({ md, className }: { md: string; className: string }) {
  const out: ReactNode[] = [];
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const k = out.length;
    if (line.startsWith("```")) {
      const body: string[] = [];
      while (++i < lines.length && !lines[i].startsWith("```")) body.push(lines[i]);
      out.push(<pre key={k}><code>{body.join("\n")}</code></pre>);
    } else if (line.startsWith("- ")) {
      const items: ReactNode[] = [];
      for (; i < lines.length && lines[i].startsWith("- "); i++) items.push(<li key={items.length}>{inline(lines[i].slice(2))}</li>);
      i--;
      out.push(<ul key={k}>{items}</ul>);
    } else if (line.startsWith("|")) {
      const rows: string[] = [];
      for (; i < lines.length && lines[i].startsWith("|"); i++) rows.push(lines[i]);
      i--;
      const [head, , ...body] = rows;
      out.push(
        <div className="table-scroll" key={k}>
          <table>
            <thead><tr>{cells(head).map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
            <tbody>{body.map((r, n) => <tr key={n}>{cells(r).map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
    } else if (!line.trim()) continue;
    else if (line.startsWith("### ")) out.push(<h3 key={k}>{line.slice(4)}</h3>);
    else if (line.startsWith("## ")) out.push(<h2 key={k}>{line.slice(3)}</h2>);
    else if (line.startsWith("# ")) out.push(<h1 key={k}>{line.slice(2)}</h1>);
    else if (/^_.+_$/.test(line)) out.push(<p key={k} className="small muted">{line.slice(1, -1)}</p>);
    else out.push(<p key={k}>{inline(line)}</p>);
  }
  return <section className={`wrap narrow section ${className}`}>{out}</section>;
}

/** First "# " line of a Markdown file. */
export const mdTitle = (md: string): string => md.match(/^# (.+)$/m)![1];
