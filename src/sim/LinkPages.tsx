// Landing pages for links shared from the app. Caddy rewrites /@handle to /perfil/ and
// /convite/<code> to /convite/, so both read the real path in the browser. With the app installed,
// universal links (.well-known/apple-app-site-association) open the app before these pages load.
import { useEffect, useState } from "react";
import { encode } from "uqr";
import { chrome } from "../copy";
import { detectPlatform, type Platform } from "../platform";
import { DownloadButtons, Icon } from "../components/ui";
import { API_URL } from "../config";
import { distribution, extractInviteCodeRef, reg, t, type Lang } from "../shared";

/** Same rule as the apps and the API: bipe-shared/registries/invite-codes.json. */
export function extractInviteCode(text: string): string | null {
  return extractInviteCodeRef(text, reg);
}


// The Clipboard API needs a secure context and some in-app browsers block it; fall back to a selection copy.
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back */ }
  const t = document.createElement("textarea");
  t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
  document.body.appendChild(t); t.select(); t.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { /* nothing */ }
  document.body.removeChild(t);
  return ok;
}

/** The Android test build is an APK from distribution.json; no button while it is not available. */
function AndroidDownloadButton({ lang = "pt" }: { lang?: Lang }) {
  const { android } = distribution;
  return android.status === "available" && android.url ? <a className="button primary" href={android.url}><Icon name="android" />{android[lang].label}</a> : null;
}

export function InstallButton({ lang = "pt" }: { lang?: Lang }) {
  const { ios } = distribution;
  return ios.url ? <a className="button primary" href={ios.url}><Icon name="apple" />{ios[lang].label}</a> : null;
}

/** The button for the visitor's phone; both badges on a computer. Availability comes from distribution.json. */
function PlatformInstall({ platform }: { platform: Platform }) {
  if (platform === "ios") return <div className="actions"><InstallButton /></div>;
  if (platform === "android" && distribution.android.status === "available") return <div className="actions"><AndroidDownloadButton /></div>;
  return <DownloadButtons lang="pt" />;
}

/** Desktop only: the visitor points a phone camera at it and the link opens the app there.
 *  Encoded in the browser, so the link (an invite code is a secret) goes to no QR service. */
function LinkQr({ url }: { url: string }) {
  const { size, data } = encode(url, { ecc: "M", border: 0 });
  let d = "";
  data.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x} ${y}h1v1h-1z`; }));
  return (
    <figure className="link-qr">
      <svg viewBox={`-4 -4 ${size + 8} ${size + 8}`} width={152} height={152} role="img" aria-label={url} shapeRendering="crispEdges">
        <rect className="link-qr-bg" x={-4} y={-4} width={size + 8} height={size + 8} />
        <path className="link-qr-fg" d={d} />
      </svg>
      <figcaption className="small muted">{chrome.pt.scanToOpen}</figcaption>
    </figure>
  );
}

type PublicProfile ={ handle: string; name: string; bio?: string; photo_url?: string };

/** Accepts only the fields the page renders, and photos only from the API host (ADR 0041). */
function readProfile(p: unknown, handle: string): PublicProfile | null {
  if (!p || typeof p !== "object") return null;
  const { handle: h, name, bio, photo_url } = p as Record<string, unknown>;
  if (h !== handle || typeof name !== "string" || !name) return null;
  return {
    handle,
    name,
    ...(typeof bio === "string" && bio ? { bio } : {}),
    ...(typeof photo_url === "string" && photo_url.startsWith(`${API_URL}/v1/profiles/`) ? { photo_url } : {}),
  };
}

export function ProfileLanding(_: Record<string, never>) {
  const c = chrome.pt.profile;
  const [handle, setHandle] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [platform, setPlatform] = useState<Platform>("ios");
  useEffect(() => {
    setPlatform(detectPlatform());
    // /@handle: a public profile link.
    const m = location.pathname.match(/^\/@([^/]+)\/?$/);
    const h = m?.[1]?.toLowerCase();
    if (!h || !new RegExp(reg.handles.pattern).test(h)) return;
    setHandle(h);
    // Published profiles only (opt-in). The API answers the same 404 for "no handle" and "profile off".
    fetch(`${API_URL}/v1/profiles/${encodeURIComponent(h)}`, { referrerPolicy: "no-referrer" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setProfile(readProfile(p, h)))
      .catch(() => {});
  }, []);
  if (profile) {
    return (
      <section className="wrap narrow section profile">
        {profile.photo_url && <img className="profile-photo" src={profile.photo_url} alt="" width={112} height={112} referrerPolicy="no-referrer" />}
        <h1 style={{ overflowWrap: "anywhere" }}>{profile.name}</h1>
        <p className="profile-handle">@{profile.handle}</p>
        <p><span className="chip policy">{t("pt", "bipe_public_profile_not_verified")}</span></p>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <p className="lede">{c.lead}</p>
        <div className="link-card">
          <div>
            <p>{c.noApp}</p>
            <PlatformInstall platform={platform} />
          </div>
          {platform === "other" && <LinkQr url={`${location.origin}/@${profile.handle}`} />}
        </div>
      </section>
    );
  }
  return (
    <section className="wrap narrow section">
      <h1 style={{ overflowWrap: "anywhere" }}>{handle ? `@${handle}` : "Bipe"}</h1>
      <p className="lede">{c.lead}</p>
      <div className="link-card">
        <div>
          <p>{c.noApp}</p>
          <PlatformInstall platform={platform} />
        </div>
        {platform === "other" && handle && <LinkQr url={`${location.origin}/@${handle}`} />}
      </div>
    </section>
  );
}

export function InviteLanding(_: Record<string, never>) {
  const c = chrome.pt.invite;
  const [code, setCode] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("ios");
  const [valid, setValid] = useState<boolean | null>(null);
  const [inviter, setInviter] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState(c.copy);

  useEffect(() => {
    setPlatform(detectPlatform());
    const found = extractInviteCode(decodeURIComponent(location.pathname));
    setCode(found);
    if (!found) return setValid(false);
    // The code is a secret the inviter shared. The page sends it only to api.bipe.net.br.
    fetch(`${API_URL}/v1/invites/${encodeURIComponent(found)}`, { referrerPolicy: "no-referrer" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p) return; // API down or rate-limited: keep the steps visible.
        setValid(p.valid === true);
        if (p.valid && typeof p.inviter_handle === "string" && new RegExp(reg.handles.pattern).test(p.inviter_handle)) setInviter(p.inviter_handle);
      })
      .catch(() => {});
  }, []);

  if (valid === false) {
    return (
      <section className="wrap narrow section">
        <h1>{c.title}</h1>
        <p className="lede">{c.invalid}</p>
        <p>{c.askNew}</p>
      </section>
    );
  }
  return (
    <section className="wrap narrow section">
      <h1>{inviter ? c.titleFrom(inviter) : c.title}</h1>
      <p className="lede">{c.lead}</p>
      {platform === "ios" && (
        <ol className="steps">
          <li>{c.iosSteps[0]}<div style={{ marginTop: 10 }}><InstallButton /></div></li>
          <li>{c.iosSteps[1]}</li>
          <li>{c.iosSteps[2]}</li>
        </ol>
      )}
      {platform === "android" && (
        <ol className="steps">
          <li>{c.androidSteps[0]}<div style={{ marginTop: 10 }}><AndroidDownloadButton /></div></li>
          <li>{c.androidSteps[1]}</li>
        </ol>
      )}
      {platform === "other" && <p>{c.other}</p>}
      {/* Below the steps: people typed this code into TestFlight's Redeem box when it came first. */}
      <div className="link-card">
        <div>
          <p>{c.yourCode}</p>
          <div className="actions">
            <output className="mono invite-code">{code ?? "····-····-····"}</output>
            <button type="button" className="button secondary" disabled={!code} onClick={async () => setCopyLabel((await copyText(code!)) ? c.copied : c.copyFailed)}>{copyLabel}</button>
          </div>
          <p className="small muted">{platform === "ios" && `${c.notTestFlight} `}{c.oneUse}</p>
        </div>
        {platform === "other" && code && <LinkQr url={`${location.origin}/convite/${code}`} />}
      </div>
    </section>
  );
}
