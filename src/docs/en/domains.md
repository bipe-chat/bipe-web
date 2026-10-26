# Domains

The data stays in Brazil, and so does the address of the service. Bipe uses two domains with two jobs: `bipe.net.br` runs the service, `bipe.chat` carries the links that people share.

_Updated 13 October 2026._

## The two domains

| Domain | Registry | Job |
|---|---|---|
| `bipe.net.br` | NIC.br, in Brazil | Matrix server name and every service host |
| `bipe.chat` | `.chat` registry, outside Brazil | Public site and shared links |

## Why the server name is under .br

The Matrix server name is part of every user ID and every room ID. Example: `@a1b2c3d4e5f6:bipe.net.br`. It cannot change without new accounts for everyone. So it must sit where no foreign party can switch it off.

NIC.br runs `.br` in Brazil. A `.chat` domain depends on a registry and a registrar outside Brazil. Bipe puts the part that cannot change under `.br`, and the part that can move under `bipe.chat`.

If `bipe.chat` stops working, chat keeps working. Only the site and new link previews stop.

## Hosts on bipe.net.br

| Host | Service | Who uses it |
|---|---|---|
| `bipe.net.br` | Matrix discovery: `/.well-known/matrix/client` only. Everything else is 404 | Apps, at sign-in |
| `matrix.bipe.net.br` | Matrix homeserver (Synapse) | Apps |
| `account.bipe.net.br` | Sign-in and accounts (Matrix Authentication Service) | Apps |
| `api.bipe.net.br` | Bipe API: sign-up, invites, @handles, recovery, verification | Apps and the site |
| `push.bipe.net.br` | Push gateway (Sygnal). Only `/_matrix/push/*` | The homeserver |
| `rtc.bipe.net.br` | Voice and video calls (LiveKit) | Apps and browsers |
| `turn.bipe.net.br` | Call relay (LiveKit TURN) for networks that block direct traffic | Apps and browsers |
| `chat.bipe.net.br` | Web client (Element Web) | Browsers |
| `admin.bipe.net.br` | Staff console | Bipe staff only |

## What lives on bipe.chat

- The site, in Portuguese at `/` and in English at `/en/`.
- Profile links: `bipe.chat/@handle`.
- Invite links: `bipe.chat/convite/<code>`.
- Email links for recovery and email confirmation.
- Terms and privacy.
- The files that let the apps open these links: `/.well-known/apple-app-site-association` (iPhone) and `/.well-known/assetlinks.json` (Android).
- The OAuth client URI of the apps. The sign-in service checks that the app's redirect scheme is the reverse of this host, so the app ID is `chat.bipe.app`.

## Check it yourself

Matrix discovery on the server name:

```
curl https://bipe.net.br/.well-known/matrix/client
```

The answer names the homeserver, the sign-in service and the call service:

```
{
  "m.homeserver": { "base_url": "https://matrix.bipe.net.br" },
  "org.matrix.msc2965.authentication": {
    "issuer": "https://account.bipe.net.br/",
    "account": "https://account.bipe.net.br/account"
  },
  "org.matrix.msc4143.rtc_foci": [
    { "type": "livekit", "livekit_service_url": "https://rtc.bipe.net.br" }
  ]
}
```

There is no `/.well-known/matrix/server`. Federation is closed, so other Matrix servers do not look for Bipe.

## Rules for links and IDs

- People see and share only `bipe.chat` addresses.
- Apps and code talk only to `bipe.net.br` hosts.
- The server name is `bipe.net.br`. It never changes.
- Certificates come from Let's Encrypt.
