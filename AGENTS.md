# bipe-web: agent notes

Static site for bipe.chat. Vite + React 19 + TypeScript, prerendered to HTML; only `data-island` elements hydrate. Plain CSS on bipe-tokens (no Tailwind). See `../bipe/docs/website.md`.

## Commands

- `pnpm build`: typecheck, then `scripts/build.mjs` writes `dist/` (pages, `.md` twins, `llms.txt`, sitemap, icons).
- `pnpm preview`: serves `dist/` on port 4321.
- `pnpm run deploy` (not `pnpm deploy`, which is a pnpm built-in): needs `scripts/deploy.env` (git-ignored, from `deploy.env.example`). Build, then `scripts/deploy.sh` copies `dist/` into `../bipe-infra/compose/site/` and rsyncs it to the dev node. No `--delete`.

## Rules

- pt-BR is the default at `/`. English is secondary under `/en/`. Never redirect by browser language.
- Privacy and terms text is `src/legal/*.md` (pt is the reference text). `src/pages/LegalPage.tsx` renders only the Markdown those files use: headings, `_meta_` lines, `- ` lists, paragraphs, bold and links.
- Product copy, feature status and download links come only from `../bipe-shared/product/`. Do not write feature copy in a page. Chrome copy (nav, labels) is in `src/copy.ts`.
- UI strings in simulations come from `../bipe-shared/strings/` through `t()`. Scam, handle and name results come from the reference logic in `../bipe-shared/tools/lib/registries.mjs`, never from hand-written results.
- Colours only from bipe-tokens CSS variables. Nunito only for the wordmark and titles.
- pt-BR copy follows `../bipe/docs/design/language.md` (ADR 0039).
- Rendered copy: no em or en dashes; run the humanizer rubric before it ships.
- Public pages never refer to MZ: no name, handle, initials or first-person founder voice, also not in sample data.
- Source links come from `source` in `../bipe-shared/product/distribution.json`. The site links a repo only when its `public` flag is true. Set the flag when the GitHub repo goes public (ADR 0024).
- A feature is "No app de testes" only when it is in a TestFlight build.
- Headline test (issue #77, ADR 0032): `src/experiment.ts` holds the inline script that sets `#hero-title` before paint and the `sendBeacon` events. Arms live in `headlineTest` in `product.json`; h0 is `promise.pt.title`. Change a headline only there. Stop the test with `headlineTest.active: false`.
- Waitlist forms post to `POST /v1/waitlist` (ADR 0025) through `src/sim/WaitlistForm.tsx`; the arm travels in `source`. `API_URL` is in `src/config.ts`.
- Sample people in simulations come only from the cast (`src/cast/cast.json`, rules in `src/cast/STYLE.md`). Phone scenes are data in `src/sim/scenes.ts`, rendered by `src/sim/ScenePhone.tsx`. Never hard-code a sample name or photo in a component. Never show a person's phone number in a simulation: Bipe hides numbers (ADR 0015); people appear by name and @handle. `/elenco/` (noindex) shows the cast and every scene. Skill: `.claude/skills/cast`.
- Cast photos are made with `node scripts/cast.mjs` (ChatGPT app's bundled Codex CLI, built-in `image_gen`, ChatGPT login, no API key). Full-size originals stay in `cast-originals/` (git-ignored).
- `/empresas/` copy is `business` in `product.json` and follows ADRs 0035 to 0037. Keep its "proposal" label until the business API ships. Change it together with `../bipe/docs/business-messaging.md`.

## Traps

- `registries.mjs` imports `node:fs`. `vite.config.ts` aliases it to `src/node-stub.ts` for the browser; `loadRegistries` runs only at build start to validate.
- @vitejs/plugin-react 6 needs Vite 8.
- PNG icons are rendered with macOS `qlmanage` in `scripts/icon.mjs`. On other systems they are skipped.
- Link-preview cards (`ogCard` on a route, `scripts/og.mjs`) render the same way. Quick Look draws an SVG on a 768-point square canvas, so the SVG is square, the card is centred, and `sips` crops it to 1200x630. The card uses only the route's static title and description: never an invite code or a handle (crawlers fetch the URL with the code in it). Off macOS the route falls back to the app icon.
- OpenAI moderation blocks some cast photo outputs (`moderation_blocked`, `sexual`) on harmless prompts, for example a young woman "dressed to go out" in a changing-room mirror. Rewrite the `look` with plain, complete clothes and a home setting. Codex also sometimes answers DONE without calling `image_gen`; the script retries once.
- CSS entrance animations do not run in a hidden browser tab, so a screenshot of a hidden preview shows an empty phone.
