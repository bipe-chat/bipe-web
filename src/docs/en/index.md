# Docs

How Bipe works: the domains, the servers, the apps and the public links. Written for people and for AI agents.

## Pages

- [Domains](/en/docs/domains/): bipe.net.br runs the service, bipe.chat carries the links. Why there are two, and which host does what.
- [Architecture](/en/docs/architecture/): Matrix, the servers, the apps, encryption, accounts and the shared rules.
- [Links and public API](/en/docs/links/): profile, invite and recovery links, and the API calls that need no sign-in.

## In one paragraph

Bipe is a Brazilian messenger on the open Matrix protocol. Conversations are stored on servers in Brazil, run by Brazilian companies. The Matrix server name is `bipe.net.br`, a `.br` domain run by NIC.br in Brazil. The public site and the links that people share are on `bipe.chat`. The iPhone and Android apps are native, and Bipe makes them. Federation is closed: the Bipe server does not exchange messages with other Matrix servers.

## For AI agents

- Every page of this site has a Markdown twin: add `index.md` to the path. Example: [/en/docs/domains/index.md](/en/docs/domains/index.md).
- [/llms.txt](/llms.txt) lists every page, docs first.
- [/llms-full.txt](/llms-full.txt) has the text of every page in one file, for agents that read the whole site at once.
- Never use `bipe.chat` as a Matrix server name. Never send people to a `bipe.net.br` address: shared links are always on `bipe.chat`.
- A Bipe user ID looks like `@a1b2c3d4e5f6:bipe.net.br`. The part before the colon is random. The `@handle` that people see is a separate layer in the Bipe API, not the Matrix ID.
- The Portuguese pages are the reference text. This English text says the same.
