# Architecture

Bipe runs on the open Matrix protocol, with native apps and servers in Brazil. This page shows each part and what it does.

_Updated 13 October 2026._

## Overview

| Layer | Parts |
|---|---|
| Apps | iPhone (SwiftUI) and Android (Kotlin, Jetpack Compose), forks of Element X. Rust core: matrix-rust-sdk |
| On the device | End-to-end encryption, scam warnings, name checks |
| Servers | Synapse, Matrix Authentication Service, Bipe API, Sygnal, LiveKit, Postgres, Caddy |
| Site | Static pages on `bipe.chat`, with a Markdown twin per page |

## Matrix, with closed federation

Matrix is an open protocol for chat. Bipe runs its own homeserver, Synapse, with the server name `bipe.net.br`.

Federation is closed. The Bipe server does not exchange messages with other Matrix servers, and other servers cannot reach Bipe users. This keeps the people who talk to Bipe users on Bipe, where the identity rules apply.

## Accounts and IDs

Bipe has three name layers:

- **Matrix ID.** Permanent and random, for example `@a1b2c3d4e5f6:bipe.net.br`. It does not come from the name or the phone number.
- **@handle.** Optional and changeable, stored in the Bipe API. 2 to 30 characters: lowercase letters, digits, dot and underscore. After a change, the next change is possible after 30 days, and nobody else can take the old handle for 90 days.
- **Display name.** Free text. A verified name, when there is one, comes from the verification, not from the user.

There is no handle search and no directory. A handle lookup is exact, and needs a signed-in account.

Phone numbers stay hidden. Each person chooses who can find them by phone number: everyone, only their contacts, or nobody. The default is only their contacts.

## Sign-in and recovery

The Matrix Authentication Service (MAS) handles sign-in on `account.bipe.net.br`. There are no SMS codes.

The account lives on the phone. The user sets an 8-digit PIN. A new phone gets back in with a recovery token and the PIN, or with an email link and the PIN. A recovery by email waits for a delay, and the old phone can cancel it.

## Encryption and on-device checks

Private conversations are end-to-end encrypted on the device. The server delivers messages. It cannot read them.

Scam warnings run on the phone, after decryption. The message does not leave the device for the check. The same is true for name checks: reserved names (banks, public bodies, Bipe) and look-alike letters (`0` for `O`, letters from other alphabets).

## Servers

| Part | Job |
|---|---|
| Synapse | Matrix homeserver: rooms, messages, sync |
| Matrix Authentication Service | Sign-in, sessions, tokens (OIDC) |
| Bipe API | Sign-up with invites, @handles, contact discovery, recovery, public profiles, CNPJ checks, badges |
| Sygnal | Push gateway to Apple and Google push services |
| LiveKit | Voice and video calls (MatrixRTC) |
| Element Web | Web client on `chat.bipe.net.br` |
| Postgres | Databases for Synapse, MAS and the Bipe API |
| Caddy | TLS and routing for every host |

The Bipe API is written in TypeScript on Postgres. It checks each request's Matrix access token against MAS. Synapse calls the API on an internal path that is not public.

## Shared rules

One repository holds what the apps and the site share: reserved names, scam patterns, app text, the API contract and test vectors. A build step generates Swift, Kotlin and TypeScript from it. Both apps run the same test vectors, so a rule gives the same result on iPhone, Android and the site.

## Hosting

The servers run in Brazil, with Brazilian companies. Conversations and accounts are stored there.

## Site

`bipe.chat` is static HTML, prerendered with React and Vite. It has no third-party trackers. Every page has a Markdown twin at `index.md`, and [/llms.txt](/llms.txt) lists them.

## Bipe's code

The code is open, under AGPL-3.0, at [github.com/bipe-chat](https://github.com/bipe-chat).

- [bipe-ios](https://github.com/bipe-chat/bipe-ios) and [bipe-android](https://github.com/bipe-chat/bipe-android): the apps
- [bipe-shared](https://github.com/bipe-chat/bipe-shared): rules, app text, the [API contract](https://github.com/bipe-chat/bipe-shared/blob/main/api/openapi.yaml) and test cases
- [bipe-api](https://github.com/bipe-chat/bipe-api): the Bipe API
- [bipe-web](https://github.com/bipe-chat/bipe-web): this site
- [bipe-ml](https://github.com/bipe-chat/bipe-ml): the scam model that runs on the phone
- [bipe-business](https://github.com/bipe-chat/bipe-business): bridge and inbox for companies
- [compound-design-tokens](https://github.com/bipe-chat/compound-design-tokens): colours and styles

## Upstream

- [Element X iOS](https://github.com/element-hq/element-x-ios) and [Element X Android](https://github.com/element-hq/element-x-android)
- [matrix-rust-sdk](https://github.com/matrix-org/matrix-rust-sdk)
- [Synapse](https://github.com/element-hq/synapse)
- [Matrix Authentication Service](https://github.com/element-hq/matrix-authentication-service)
- [Sygnal](https://github.com/matrix-org/sygnal)
- [LiveKit](https://github.com/livekit/livekit)
- [Compound design tokens](https://github.com/element-hq/compound-design-tokens)
