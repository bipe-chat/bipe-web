// Landing pages for links shared from the app. Caddy rewrites /@handle to /perfil/,
// /convite/<code> to /convite/ and /s/<room ID> to /s/, so each reads the real path in the browser. With the app installed,
// universal links (.well-known/apple-app-site-association) open the app before these pages load.
import { useEffect, useState, type MouseEvent } from "react";
import { encode } from "uqr";
import { chrome } from "../copy";
import { detectPlatform, type Platform } from "../platform";
import { DownloadButtons, Icon } from "../components/ui";
import { API_URL } from "../config";
import { CompanySeal } from "../components/brand";
import { formatCnpj, verifyCompanyBadge, type CompanyBadge } from "../badge";
import { distribution, extractInviteCodeRef, reg, stickerPackLinkBase, t, type Lang } from "../shared";

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

/** Invite page (bipe#197): the store link keeps the invite through the install. Google Play hands `referrer` to the app
 *  (Play Install Referrer); the APK and TestFlight cannot, so the button also copies the invite link for the app's "Colar". */
function storeUrl(url: string, inviteCode?: string): string {
  if (!inviteCode || new URL(url).hostname !== "play.google.com") return url;
  const u = new URL(url);
  u.searchParams.set("referrer", `convite/${inviteCode}`);
  return u.toString();
}

function copyInviteThenOpen(inviteCode: string | undefined) {
  if (!inviteCode) return undefined;
  return async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    await copyText(`${location.origin}/convite/${inviteCode}`);
    location.href = href;
  };
}

/** The Android test build is an APK from distribution.json; no button while it is not available. */
function AndroidDownloadButton({ lang = "pt", inviteCode }: { lang?: Lang; inviteCode?: string }) {
  const { android } = distribution;
  return android.status === "available" && android.url ? <a className="button primary" href={storeUrl(android.url, inviteCode)} onClick={copyInviteThenOpen(inviteCode)}><Icon name="android" />{android[lang].label}</a> : null;
}

export function InstallButton({ lang = "pt", inviteCode }: { lang?: Lang; inviteCode?: string }) {
  const { ios } = distribution;
  return ios.url ? <a className="button primary" href={ios.url} onClick={copyInviteThenOpen(inviteCode)}><Icon name="apple" />{ios[lang].label}</a> : null;
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

type PublicProfile = { handle: string; name: string; bio?: string; photo_url?: string; company?: CompanyBadge };

/** Accepts only the fields the page renders, and photos only from the API host (ADR 0041).
 *  The seal shows only for a badge that verifies as lvl "cnpj" (src/badge.ts); a person's page shows none. */
async function readProfile(p: unknown, handle: string): Promise<PublicProfile | null> {
  if (!p || typeof p !== "object") return null;
  const { handle: h, name, bio, photo_url, badge } = p as Record<string, unknown>;
  if (h !== handle || typeof name !== "string" || !name) return null;
  const company = badge === undefined ? null : await verifyCompanyBadge(badge);
  return {
    handle,
    name,
    ...(typeof bio === "string" && bio ? { bio } : {}),
    ...(typeof photo_url === "string" && photo_url.startsWith(`${API_URL}/v1/profiles/`) ? { photo_url } : {}),
    ...(company ? { company } : {}),
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
      .then((p) => readProfile(p, h))
      .then(setProfile)
      .catch(() => {});
  }, []);
  if (profile) {
    return (
      <section className="wrap narrow section profile">
        {profile.photo_url && <img className="profile-photo" src={profile.photo_url} alt="" width={112} height={112} referrerPolicy="no-referrer" />}
        <h1 style={{ overflowWrap: "anywhere" }}>{profile.name}{profile.company && <> <CompanySeal size={28} label={t("pt", "bipe_badge_company")} /></>}</h1>
        <p className="profile-handle">@{profile.handle}</p>
        {profile.company ? (
          <div className="company-facts">
            <p><strong>{t("pt", "bipe_badge_company")}</strong></p>
            <dl>
              <dt>{t("pt", "bipe_badge_company_legal_name")}</dt>
              <dd>{profile.company.legalName}</dd>
              <dt>{t("pt", "bipe_badge_company_cnpj")}</dt>
              <dd className="mono">{formatCnpj(profile.company.cnpj)}</dd>
            </dl>
            <p className="small muted">{t("pt", "bipe_badge_company_body")}</p>
          </div>
        ) : (
          <p><span className="chip policy">{t("pt", "bipe_public_profile_not_verified")}</span></p>
        )}
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
          <li>{c.iosSteps[0]}<div style={{ marginTop: 10 }}><InstallButton inviteCode={code ?? undefined} /></div>{code && <p className="small muted">{c.copiesLink}</p>}</li>
          <li>{c.iosSteps[1]}</li>
          <li>{c.iosSteps[2]}</li>
        </ol>
      )}
      {platform === "android" && (
        <ol className="steps">
          <li>{c.androidSteps[0]}<div style={{ marginTop: 10 }}><AndroidDownloadButton inviteCode={code ?? undefined} /></div>{code && <p className="small muted">{c.copiesLink}</p>}</li>
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

/** A Matrix room ID from a pack link path /s/<room ID> (URL-encoded). The page only builds the QR from it. */
export function stickerPackRoomId(pathname: string): string | null {
  const m = pathname.match(/^\/s\/([^/]+)\/?$/);
  if (!m) return null;
  let id: string;
  try { id = decodeURIComponent(m[1]); } catch { return null; }
  return id.startsWith("!") && id.length > 1 && id.length <= 255 && !/[\s/]/.test(id) ? id : null;
}

/** Pack link page (bipe ADR 0205). With the app installed, the app link opens sticker-pack before this page loads.
 *  The page reads no pack data: the pack room is readable only through the Matrix API with an account. */
export function StickerPackLanding(_: Record<string, never>) {
  const c = chrome.pt.stickerPack;
  const [roomId, setRoomId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("ios");
  useEffect(() => {
    setPlatform(detectPlatform());
    setRoomId(stickerPackRoomId(location.pathname));
  }, []);
  return (
    <section className="wrap narrow section">
      <h1>{c.title}</h1>
      <p className="lede">{c.lead(t("pt", "bipe_sticker_pack_add"))}</p>
      <div className="link-card">
        <div>
          <p>{c.noApp}</p>
          <PlatformInstall platform={platform} />
        </div>
        {platform === "other" && roomId && <LinkQr url={`${stickerPackLinkBase}${encodeURIComponent(roomId)}`} />}
      </div>
    </section>
  );
}
