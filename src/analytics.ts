// Umami tracker tags for the page head (ADR 0098). The before-send hook runs in the browser and
// removes secrets before a visit leaves it: invite codes and handles in the path, and every query
// parameter except utm_*. Other sites' referrers keep only their origin. The tracker drops the URL fragment (email tokens live there).
import { UMAMI_WEBSITE_ID } from "./config";
import type { Route } from "./routes";

const clean = `function(u){if(!u)return u;try{var x=new URL(u,location.href);x.pathname=x.pathname.replace(/^\\/convite\\/[^/]+\\/?/,"/convite/").replace(/^\\/@[^/]+/,"/@");var q=new URLSearchParams();x.searchParams.forEach(function(v,k){if(/^utm_/.test(k))q.set(k,v)});x.search=q.toString();x.hash="";return x.origin+x.pathname+x.search}catch(e){return ""}}`;

export function analyticsTags(route: Route): string {
  if (route.noAnalytics) return "";
  const hook = `<script>window.bipeUmami=function(t,p){var c=${clean};p.url=c(p.url);if(p.referrer){if(p.referrer.charAt(0)==="/")p.referrer=c(p.referrer).slice(location.origin.length);else try{p.referrer=new URL(p.referrer).origin+"/"}catch(e){p.referrer=""}}return p};</script>`;
  const tag = `<script defer src="/u/script.js" data-website-id="${UMAMI_WEBSITE_ID}" data-before-send="bipeUmami" data-do-not-track="true" data-exclude-hash="true"></script>`;
  return `${hook}\n${tag}`;
}
