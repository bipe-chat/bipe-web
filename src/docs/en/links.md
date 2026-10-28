# Links and public API

The links people share open the Bipe app when it is installed. Without the app, a page on bipe.chat explains the next step. This page gives each link's format and the API calls that need no sign-in.

## Profile link

```
https://bipe.chat/@handle
```

The handle has 2 to 30 characters: `a-z`, `0-9`, `.` and `_`.

- With the app installed, the link opens the conversation in the app (universal link on iPhone, app link on Android).
- Without the app, the page shows the handle and the install button. When the person published a public profile, the page also shows the name, photo and bio, with a "not verified" label.
- The phone number never appears.

## Invite link

```
https://bipe.chat/convite/<code>
```

The code has 12 to 20 characters: `A-Z`, `a-z`, `0-9` and `-`. The code is a secret that the inviter shares.

- The page checks the code at `api.bipe.net.br` and shows the steps for each platform.
- The page sends no referrer.
- The install button copies the invite link. In the app, the "Paste" button on the start screen uses that link. A Google Play link carries `referrer=convite/<code>`, which the app reads when it first opens.
- A link preview never shows the code.

## Email links

The Bipe API sends two kinds of email link. The token is after `#`, so the browser never sends it to the server.

| Link | Job |
|---|---|
| `https://bipe.chat/confirmar-email/#<token>` | Confirms a recovery email |
| `https://bipe.chat/recuperar/#<token>` | Opens a recovery in the app. Recovery never runs in the browser |

## App link files

| File | Platform |
|---|---|
| `https://bipe.chat/.well-known/apple-app-site-association` | iPhone. App ID `chat.bipe.app`. Paths `/@*`, `/convite/*`, `/recuperar/*` |
| `https://bipe.chat/.well-known/assetlinks.json` | Android. Package `chat.bipe.app` |

## Public API

Base URL: `https://api.bipe.net.br`. These calls need no sign-in. Every other call needs a Matrix access token from a signed-in Bipe account.

{{public-api}}

Browsers can call the API only from `https://bipe.chat`.

The full API contract is in [openapi.yaml](https://github.com/bipe-chat/bipe-shared/blob/main/api/openapi.yaml). The server code is in [bipe-api](https://github.com/bipe-chat/bipe-api).

## What the API does not do

- No handle search and no user directory.
- A phone number lookup finds a person only when that person's setting allows it.
- No call returns a phone number.
