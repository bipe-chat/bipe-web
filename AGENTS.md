# bipe-web: agent notes

Static site for bipe.chat. Vite + React 19 + TypeScript, prerendered to HTML; only `data-island` elements hydrate. Plain CSS on bipe-tokens (no Tailwind). See `../bipe/docs/website.md`.

## Commands

- `pnpm build`: typecheck, then `scripts/build.mjs` writes `dist/` (pages, `.md` twins, `llms.txt`, sitemap, icons).
- `pnpm preview`: serves `dist/` on port 4321.
- `pnpm run deploy` (not `pnpm deploy`, which is a pnpm built-in): needs `scripts/deploy.env` (git-ignored, from `deploy.env.example`). Build, then `scripts/deploy.sh` copies `dist/` into `../bipe-infra/compose/site/` and rsyncs it to the dev node. No `--delete`.

## Rules

- pt-BR is the default at `/`. English is secondary under `/en/`. Never redirect by browser language.
- `/lgpd/` (`/en/lgpd/`) is Markdown built from `../bipe-shared/product/data.json` by `lgpdMarkdown` in `src/pages/LegalPage.tsx` (ADR 0090). Change the data there, never in the page. When the privacy policy changes a fact, change the register in the same commit.
- Privacy and terms text is `src/legal/*.md` (pt is the reference text). Docs text is `src/docs/<lang>/*.md`, listed in `src/pages/DocsPage.tsx`. Both render through `src/components/markdown.tsx`, which knows only `#` to `###`, `_meta_` lines, `- ` lists, `|` tables, ``` blocks, paragraphs, bold, `code` and links. The `.md` file is the page's Markdown twin as is.
- `/docs/` (`/en/docs/`) explains how Bipe works, for people and agents: domains (ADR 0062), architecture, links and the public API. `llms.txt` lists the docs first. When a host, a link format, a public API call or a stack part changes, change the docs page in the same commit. Docs state only what runs today: no roadmap, no hosting provider names, no IP addresses, no internal paths.
- Product copy, feature status and download links come only from `../bipe-shared/product/`. Do not write feature copy in a page. Chrome copy (nav, labels) is in `src/copy.ts`.
- UI strings in simulations come from `../bipe-shared/strings/` through `t()`. Scam, handle and name results come from the reference logic in `../bipe-shared/tools/lib/registries.mjs`, never from hand-written results.
- Colours only from bipe-tokens CSS variables. Nunito only for the wordmark, titles and the big hero numbers on `/golpes-no-brasil/` (`.scam-value`). Chart labels, axes and values use `--ui` with tabular figures.
- pt-BR copy follows `../bipe/docs/design/linguagem.md` (ADR 0039).
- Rendered copy: no em or en dashes; run the humanizer rubric before it ships.
- Public pages never refer to MZ: no name, handle, initials or first-person founder voice, also not in sample data.
- Source links come from `source` in `../bipe-shared/product/distribution.json`. The site links a repo only when its `public` flag is true. Set the flag when the GitHub repo goes public (ADR 0024).
- Deep links into the code: add the file to `source.code` in `distribution.json` and name its id in `code` on a feature or technical part in `product.json`; pages render them with `CodeList` (`src/components/code.tsx`). Docs Markdown may link `github.com/bipe-chat/<repo>/blob/main/<path>` directly. `scripts/check-code-links.mjs` runs at the end of `pnpm build` and fails when a linked repo is not public or a path is not on `origin/main` of the sibling clone. A rename or move in an app repo breaks the site build until the link follows it.
- A feature is "No app de testes" only when it is in a TestFlight build.
- Headline test (issue #77, ADR 0032): `src/experiment.ts` holds the inline script that sets `#hero-title` before paint and the `sendBeacon` events. Arms live in `headlineTest` in `product.json`; h0 is `promise.pt.title`. Change a headline only there. Stop the test with `headlineTest.active: false`.
- Waitlist forms post to `POST /v1/waitlist` (ADR 0025) through `src/sim/WaitlistForm.tsx`; the arm travels in `source`. `API_URL` is in `src/config.ts`.
- Sample people in simulations come only from the cast (`src/cast/cast.json`, rules in `src/cast/STYLE.md`). Phone scenes are data in `src/sim/scenes.ts`, rendered by `src/sim/ScenePhone.tsx`. Never hard-code a sample name or photo in a component. Never show a person's phone number in a simulation: Bipe hides numbers (ADR 0015); people appear by name and @handle. `/elenco/` (noindex) shows the cast and every scene. Skill: `.claude/skills/cast`.
- Cast photos are made with `node scripts/cast.mjs` (ChatGPT app's bundled Codex CLI, built-in `image_gen`, ChatGPT login, no API key). Full-size originals stay in `cast-originals/` (git-ignored).
- `/parceiros/` copy is `partners` in `product.json` (ADR 0067). It is the only public page that may use the Pix analogy (ADR 0071). Name no prospective partner, funder or institution until there is a signed agreement, and promise no seats, governance or equity. Keep the "Ideia em construção" label until the institution exists.
- `/empresas/` copy is `business` in `product.json` and follows ADRs 0035 to 0037. Keep its "proposal" label until the business API ships. Change it together with `../bipe/docs/business-messaging.md`.

## Traps

- `registries.mjs` imports `node:fs`. `vite.config.ts` aliases it to `src/node-stub.ts` for the browser; `loadRegistries` runs only at build start to validate.
- @vitejs/plugin-react 6 needs Vite 8.
- PNG icons are rendered with macOS `qlmanage` in `scripts/icon.mjs`. On other systems they are skipped.
- Link-preview cards: every route gets a 1200x630 PNG at `/og/<name>.png`, rendered at build time by `scripts/og.mjs` (Satori and resvg, same on every machine). Text is the route's title and description; set `og` on a route to give the card its own title, line and footer label (example: `/parceiros/`, from `partners.card` in `product.json`). The name comes from `ogImageName` in `src/routes.tsx`. All cards show on `/cartoes/` (noindex). A card uses only static text: never an invite code or a handle (crawlers fetch the URL with the code in it).
- OpenAI moderation blocks some cast photo outputs (`moderation_blocked`, `sexual`) on harmless prompts, for example a young woman "dressed to go out" in a changing-room mirror. Rewrite the `look` with plain, complete clothes and a home setting. Codex also sometimes answers DONE without calling `image_gen`; the script retries once.
- CSS entrance animations do not run in a hidden browser tab, so a screenshot of a hidden preview shows an empty phone.
