import { useEffect, useRef, useState, type CSSProperties } from "react";
import { chrome } from "../copy";
import { paths } from "../paths";
import { product, type Lang } from "../shared";
import { Mark } from "../components/brand";
import { bannerFromHash, bannerHash, canDouble, defaultBanner, dimensions, DRAFT_KEY, FORMATS, formatLabel, MAX_HEADLINE, MAX_SUBTITLE, PALETTES, parseBanner, safeBox, type BannerDoc } from "./banner-doc";
import "./banner.css";

function SizeInput({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (value: number) => void }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => setRaw(String(value)), [value]);
  return <label htmlFor={id}>{label}<input id={id} type="number" min={240} max={4096} step={1} value={raw}
    onChange={(e) => {
      setRaw(e.target.value);
      const n = e.target.valueAsNumber;
      if (Number.isInteger(n) && n >= 240 && n <= 4096) onChange(n);
    }}
    onBlur={() => {
      const n = Math.round(Math.max(240, Math.min(4096, Number(raw) || 240)));
      setRaw(String(n)); onChange(n);
    }} /></label>;
}

export function BannerMaker({ lang }: { lang: Lang }) {
  const c = chrome[lang].brand.maker;
  const initial = defaultBanner(product.promise[lang].title);
  const [doc, setDoc] = useState(initial);
  const [restored, setRestored] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [guides, setGuides] = useState(false);
  const [preview, setPreview] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [file, setFile] = useState<"png" | "jpeg">("png");
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [shareLink, setShareLink] = useState("");
  const exporting = useRef(false);
  const { width, height } = dimensions(doc);
  const box = safeBox(doc);
  const selected = FORMATS.find((f) => f.id === doc.format);
  const label = formatLabel(doc, lang, c.custom);
  const outputScale = canDouble(doc) ? scale : 1;

  function patch(next: Partial<BannerDoc>) {
    setDoc((current) => ({ ...current, ...next }));
    setSaved(false); setFeedback(""); setShareLink("");
    // Once edited, reload the saved draft instead of the original shared link.
    if (window.location.hash.startsWith("#design=")) history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  useEffect(() => {
    const fallback = defaultBanner(product.promise[lang].title);
    const restore = () => {
      if (window.location.hash.startsWith("#design=")) {
        const linked = bannerFromHash(window.location.hash, fallback);
        setDoc(linked ?? fallback); setNotice(linked ? "" : c.invalid);
      } else {
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (raw) setDoc(parseBanner(JSON.parse(raw), fallback) ?? fallback);
        } catch { /* A malformed or inaccessible draft does not prevent editing. */ }
      }
      setRestored(true);
    };
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, [lang, c.invalid]);

  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(doc)); setSaved(true); }
      catch { setNotice(c.storage); }
    }, 350);
    return () => clearTimeout(timer);
  }, [doc, restored, c.storage]);

  useEffect(() => {
    let cancelled = false;
    let url = "";
    setPreview("");
    setPreviewError(false);
    const timer = setTimeout(async () => {
      try {
        // Drawing code loads only on a page that actually has this editor.
        const { renderBanner, canvasToBlob } = await import("./render-banner");
        const canvas = await renderBanner(doc, Math.min(1, 1400 / width, 1000 / height));
        const blob = await canvasToBlob(canvas, "image/png");
        if (cancelled) return;
        url = URL.createObjectURL(blob); setPreview(url);
      } catch { if (!cancelled) setPreviewError(true); }
    }, 100);
    return () => { cancelled = true; clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [doc, width, height, attempt]);

  async function download() {
    if (exporting.current) return;
    exporting.current = true; setBusy(true); setFeedback("");
    try {
      const { renderBanner, canvasToBlob, downloadBlob } = await import("./render-banner");
      const canvas = await renderBanner(doc, outputScale);
      const blob = await canvasToBlob(canvas, file === "png" ? "image/png" : "image/jpeg");
      downloadBlob(blob, `bipe-${doc.format}-${doc.palette}-${canvas.width}x${canvas.height}.${file === "jpeg" ? "jpg" : "png"}`);
      setFeedback(c.ready);
    } catch { setFeedback(c.error); }
    finally { exporting.current = false; setBusy(false); }
  }
  async function share() {
    const url = new URL(window.location.href); url.search = ""; url.hash = bannerHash(doc);
    try { await navigator.clipboard.writeText(url.href); setFeedback(c.copied); }
    catch { setShareLink(url.href); }
  }
  function reset() {
    patch(initial); setNotice("");
    // A reload after starting over should not restore the old shared design.
    if (window.location.hash.startsWith("#design=")) history.replaceState(null, "", window.location.pathname);
  }
  return (
    <section className="wrap section banner-page">
      <h1>{c.title}</h1>
      <p className="lede">{c.lede}</p>
      <div className="banner-workspace">
        <div className="banner-controls">
          <fieldset>
            <legend>{c.format}</legend>
            <label className="visually-hidden" htmlFor="banner-format">{c.format}</label>
            <select id="banner-format" value={doc.format} onChange={(e) => patch({ format: e.target.value as BannerDoc["format"], width, height })}>
              {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label[lang]} · {f.width} × {f.height}</option>)}
              <option value="custom">{c.custom}</option>
            </select>
            {doc.format === "custom" ? <>
              <div className="banner-size">
                {(["width", "height"] as const).map((key) => <SizeInput key={key} id={`banner-${key}`} label={c[key]} value={doc[key]} onChange={(value) => patch({ [key]: value })} />)}
              </div>
              <p className="small muted">{c.sizes}</p>
            </> : null}
            <p className="small muted">{selected?.guide === "linkedin" ? c.cropNote : selected?.guide === "story" ? c.storyNote : `${width} × ${height} px`}</p>
            {selected && "source" in selected ? <a className="small" href={selected.source} target="_blank" rel="noreferrer">{c.source} ↗</a> : null}
          </fieldset>
          <fieldset>
            <legend>{c.template}</legend>
            <div className="banner-segments">
              {(["message", "symbol", "background"] as const).map((id) => <button type="button" key={id} aria-pressed={doc.template === id} onClick={() => patch({ template: id })}>{c.templates[id]}</button>)}
            </div>
          </fieldset>
          {doc.template === "message" ? <fieldset>
            <legend>{c.text}</legend>
            <label htmlFor="banner-headline">{c.headline}<span className="muted">{doc.headline.length}/{MAX_HEADLINE}</span></label>
            <textarea id="banner-headline" rows={3} maxLength={MAX_HEADLINE} value={doc.headline} onChange={(e) => patch({ headline: e.target.value })} />
            <button type="button" className="banner-text-button" onClick={() => patch({ headline: initial.headline })}>{c.useHeadline}</button>
            <label htmlFor="banner-subtitle">{c.subtitle}<span className="muted">{c.optional}</span></label>
            <textarea id="banner-subtitle" rows={2} maxLength={MAX_SUBTITLE} value={doc.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
            <div className="banner-segments" role="group" aria-label={c.align}>
              {(["left", "center", "right"] as const).map((id) => <button type="button" key={id} aria-pressed={doc.align === id} onClick={() => patch({ align: id })}>{c.aligns[id]}</button>)}
            </div>
          </fieldset> : null}
          <fieldset>
            <legend>{c.palette}</legend>
            <div className="banner-palettes">
              {PALETTES.map((palette) => <button type="button" key={palette} className="banner-swatch" aria-pressed={doc.palette === palette} onClick={() => patch({ palette })}>
                <span className="banner-swatch-art" style={{ background: `var(--bipe-${palette}-1100)` }}><Mark size={22} /></span>
                <span>{c.palettes[palette]}</span>
              </button>)}
            </div>
            <div className="banner-segments" role="group" aria-label={c.texture}>
              {(["mesh", "pattern"] as const).map((texture) => <button type="button" key={texture} aria-pressed={doc.texture === texture} onClick={() => patch({ texture })}>{c.textures[texture]}</button>)}
            </div>
            <button type="button" className="banner-text-button" onClick={() => patch({ variant: (doc.variant + 1) % 3 })}>{c.variation} ↻</button>
            <label className="banner-check"><input type="checkbox" checked={doc.logo} onChange={(e) => patch({ logo: e.target.checked })} />{c.logo}</label>
            <label className="banner-check"><input type="checkbox" checked={doc.site} onChange={(e) => patch({ site: e.target.checked })} />{c.site}</label>
          </fieldset>
        </div>
        <div className="banner-output">
          <div className="banner-preview-head">
            <h2 className="sub">{c.preview}</h2>
            <span className="small mono muted">{width} × {height} px</span>
          </div>
          <div className={`banner-stage ${height > width ? "is-portrait" : ""}`} aria-busy={!preview && !previewError}>
            <div className="banner-art" style={{ aspectRatio: `${width} / ${height}`, "--art-ratio": width / height } as CSSProperties}>
              {preview ? <img src={preview} alt={`${label}: ${doc.template === "message" ? doc.headline : c.templates[doc.template]}`} width={width} height={height} /> : <span className="small muted">{c.loading}</span>}
              {guides ? <div className="banner-guide" aria-hidden="true" style={{ left: `${box.x / width * 100}%`, top: `${box.y / height * 100}%`, width: `${box.width / width * 100}%`, height: `${box.height / height * 100}%` }} /> : null}
            </div>
          </div>
          {previewError ? <p role="alert">{c.error} <button type="button" className="banner-text-button" onClick={() => setAttempt((v) => v + 1)}>{c.retry}</button></p> : null}
          <label className="banner-check"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />{c.guides}</label>
          <p className="small muted banner-guide-note">{c.guideNote}</p>
          <div className="banner-export card">
            <h2 className="sub">{c.export}</h2>
            <div className="banner-export-options">
              <label htmlFor="banner-file">{c.file}<select id="banner-file" value={file} onChange={(e) => setFile(e.target.value as "png" | "jpeg")}><option value="png">PNG</option><option value="jpeg">JPEG</option></select></label>
              <label htmlFor="banner-scale">{c.resolution}<select id="banner-scale" value={outputScale} onChange={(e) => setScale(Number(e.target.value))}><option value={1}>{c.normal}</option><option value={2} disabled={!canDouble(doc)}>{c.double}</option></select></label>
            </div>
            <button type="button" className="button primary" onClick={download} disabled={busy}>{busy ? c.downloading : `${c.download} ${file === "png" ? "PNG" : "JPEG"}`}</button>
            <span className="small mono muted">{width * outputScale} × {height * outputScale} px</span>
          </div>
          <div className="banner-actions">
            <button type="button" className="button secondary compact" onClick={share}>{c.share}</button>
            <button type="button" className="banner-text-button" onClick={reset}>{c.reset}</button>
          </div>
          {shareLink ? <label className="small" htmlFor="banner-share-link">{c.linkFallback}<input id="banner-share-link" readOnly value={shareLink} onFocus={(e) => e.target.select()} /></label> : null}
          <p className="small banner-feedback" role="status">{feedback || notice || (saved ? c.saved : "")}</p>
          <p className="small muted">{c.local}</p>
        </div>
      </div>
    </section>
  );
}
