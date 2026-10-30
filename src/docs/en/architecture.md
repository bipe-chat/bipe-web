# Architecture

Bipe runs on the open Matrix protocol, with native apps and servers in Brazil. This page shows each part and what it does.

## Overview

| Layer | Parts |
|---|---|
| Apps | iPhone (SwiftUI) and Android (Kotlin, Jetpack Compose), one app of Bipe's own. Rust core: matrix-rust-sdk |
| On the device | End-to-end encryption, scam warnings, name checks, voice transcripts |
| Servers | Synapse, Matrix Authentication Service, Bipe API, Sygnal, LiveKit, map server, Postgres, Caddy |
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

Nobody sees another person's number through Bipe. The app shows you your own linked number. It shows another person's number only when that number is already in your address book. Each person chooses who can find them by phone number: everyone, only their contacts, or nobody. The default is only their contacts.

## Sign-in and recovery

The Matrix Authentication Service (MAS) handles sign-in on `account.bipe.net.br`. There are no SMS codes.

The account lives on the phone. The user sets an 8-digit PIN. A new phone gets back in one of these ways:

- With the QR code that another device, where the account is already signed in, shows on its screen.
- With the recovery token and the PIN.
- With an email link and the PIN.
- With a linked Apple or Google account and the PIN. The linked account cannot reset the PIN.

A recovery by email and a recovery by Apple or Google account wait 24 hours, and the old phone can cancel them.

On a computer, the only way in is a QR code. The browser shows the code, and the signed-in phone scans and approves it. The web has no password.

## Encryption and on-device checks

Private conversations are end-to-end encrypted on the device. The server delivers messages. It cannot read them.

Voice and video calls are end-to-end encrypted too. Each device sends its media key only to the people in the call. The call server in Brazil forwards media it cannot open.

Scam warnings run on the phone, after decryption. The message does not leave the device for the check. The same is true for name checks: reserved names (banks, public bodies, Bipe) and look-alike letters (`0` for `O`, letters from other alphabets).

Voice message transcripts also run on the phone. The sender transcribes the audio on their own phone before sending. The receiver can transcribe it on their own phone. The audio does not leave the device for the transcript.

## Servers

| Part | Job |
|---|---|
| Synapse | Matrix homeserver: rooms, messages, sync |
| Matrix Authentication Service | Sign-in, sessions, tokens (OIDC) |
| Bipe API | Sign-up with invites, device check at sign-up, @handles, contact discovery, recovery, approving a computer sign-in by QR code, public profiles, CNPJ checks, badges, brand marks, guardians and stolen phones, company catalogue, agenda, queue, orders and quotes, account deletion, data download, problem reports and support chat |
| Sygnal | Push gateway: Apple push on iPhone and Google (Firebase) on Android. The Android build without Google services gets no push |
| LiveKit | Voice and video calls (MatrixRTC), the token service that lets each person into a call, and TURN on `turn.bipe.net.br` |
| Map server | Maps for shared locations on `maps.bipe.net.br`, with OpenStreetMap data (© OpenStreetMap) |
| Element Web | Web client on `chat.bipe.net.br`. Sign-in only by a QR code that the phone scans |
| Postgres | Databases for Synapse, MAS and the Bipe API |
| Caddy | TLS and routing for every host |

The Bipe API is written in TypeScript on Postgres. It checks each request's Matrix access token against MAS. Synapse calls the API on an internal path that is not public.

## Shared rules

One repository holds what the apps and the site share: reserved names, scam patterns, app text, the API contract and test vectors. A build step generates Swift, Kotlin and TypeScript from it. Both apps run the same test vectors, so a rule gives the same result on iPhone, Android and the site.

## Hosting

The servers run in Brazil, with Brazilian companies. Conversations and accounts are stored there. The call server and TURN also run in Brazil. No call goes through a service outside Brazil. Maps also come from the servers in Brazil.

## Site

`bipe.chat` is static HTML, prerendered with React and Vite. It has no third-party trackers. Every page has a Markdown twin at `index.md`, and [/llms.txt](/llms.txt) lists them.

The help and organisation forms go to the team's work system, in the European Union.

## Bipe's code

The code is open, under AGPL-3.0, at [github.com/bipe-chat](https://github.com/bipe-chat).

{{repos}}

The API contract is in [openapi.yaml](https://github.com/bipe-chat/bipe-shared/blob/main/api/openapi.yaml).

## Upstream

- [matrix-rust-sdk](https://github.com/matrix-org/matrix-rust-sdk)
- [Synapse](https://github.com/element-hq/synapse)
- [Matrix Authentication Service](https://github.com/element-hq/matrix-authentication-service)
- [Sygnal](https://github.com/matrix-org/sygnal)
- [LiveKit](https://github.com/livekit/livekit)
- [Element Web](https://github.com/element-hq/element-web)
