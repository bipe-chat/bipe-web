// The Bipe API the public pages call from the browser (CORS allows bipe.chat only).
export const API_URL = "https://api.bipe.net.br";
// MAS, the account server. The staff page signs in there (ADR 0056 in bipe/docs/adr).
export const MAS_ISSUER = "https://account.bipe.net.br/";
// The API's CORS allows only this origin, so staff pages run here and not on bipe.chat.
export const STAFF_SITE_URL = "https://bipe.chat";
