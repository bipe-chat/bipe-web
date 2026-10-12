// The Proseio API the public pages call from the browser (CORS allows proseio.com.br only).
export const API_URL = "https://api.proseio.com.br";
// MAS, the account server. The staff page signs in there (proseio ADR 0056).
export const MAS_ISSUER = "https://account.proseio.com.br/";
// The API's CORS allows only this origin, so staff pages run here and not on bipe.chat.
export const STAFF_SITE_URL = "https://proseio.com.br";
