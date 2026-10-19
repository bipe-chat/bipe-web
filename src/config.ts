// The Bipe API the public pages call from the browser (CORS allows bipe.chat only).
export const API_URL = "https://api.bipe.net.br";
// The Bipe workspace on Starlings. The organisation form posts there, and each request becomes a lead (bipe#273).
export const ORGANISATION_FORM_URL = "https://bipe.starlings.work/api/forms/organisations";
// MAS, the account server. The staff page signs in there (ADR 0056 in bipe/docs/adr).
export const MAS_ISSUER = "https://account.bipe.net.br/";
// The API's CORS allows only this origin, so staff pages run here and not on bipe.chat.
export const STAFF_SITE_URL = "https://bipe.chat";
// Umami site analytics (ADR 0098). bipe-edge proxies /u/ to Umami, so the tracker is first-party.
// Same ID as UMAMI_WEBSITE_ID in bipe-infra/scripts/setup-umami.sh. It is public by design.
export const UMAMI_WEBSITE_ID = "4f1c2a6e-8b3d-4e57-9a0c-2d6b7e9f1a35";
