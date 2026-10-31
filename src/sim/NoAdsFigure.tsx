import { chrome } from "../copy";
import type { Lang } from "../shared";

/** A short ledger of facts in a card: no fake UI. */
export function Ledger({ rows, caption }: { rows: readonly (readonly string[])[]; caption?: string }) {
  return (
    <div className="stage">
      <div className="card" style={{ width: "100%", maxWidth: 380, background: "var(--bg)" }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "14px 4px", borderBottom: "1px solid var(--line)" }}>
            <span>{k}</span><strong className="display" style={{ fontSize: "1.375rem", color: "var(--acai)", textAlign: "right" }}>{v}</strong>
          </div>
        ))}
      </div>
      {caption && <p className="caption">{caption}</p>}
    </div>
  );
}

/** The no-ads promise as a ledger. Servers in Brazil come first. */
export function NoAdsFigure({ lang, caption }: { lang: Lang; caption?: string }) {
  return <Ledger rows={chrome[lang].noAdsRows} caption={caption} />;
}
