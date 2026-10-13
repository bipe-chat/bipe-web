---
name: cast
description: Manage the fictional people and phone scenes in bipe-web's marketing simulations. Add or remake a sample person's profile photo with the local ChatGPT app (Codex image_gen, no API key), add a person, group or institution to the cast, or add a phone scene that shows a trust state (verified, unverified, name mismatch, new device, external, institution, nickname, chat list, trust profile). Use when someone says "avatar", "fake user", "sample person", "elenco", "cast", "new scene", "phone mockup", "trust level on the site", "redo the photo of X".
---

# Cast and scenes (bipe-web)

Sources of truth, all in `bipe-web/`:

- `src/cast/cast.json`: every sample person, group and institution, plus the photo prompt templates (`styles`, `base`).
- `src/cast/STYLE.md`: the rules. Read it before you add a person or write a `look`.
- `src/cast/photos/<id>.jpg`: 256 px photos. A missing photo shows initials.
- `scripts/cast.mjs`: makes photos with the ChatGPT app's bundled Codex CLI.
- `src/sim/scenes.ts`: the phone scenes. `src/sim/ScenePhone.tsx` renders them.
- `/elenco/` (noindex): every person and every scene on one page.

## Add or remake a photo

1. Edit `look` (and `style` if needed) for the entry in `cast.json`. Follow the `look` rules in STYLE.md.
2. Run `node scripts/cast.mjs <id>` from `bipe-web/`. Use `--note "..."` for a one-off change and `--ref <png>` to keep the same person. Use `--missing` for every entry without a photo. Run it in the background: each photo takes about 70 seconds.
3. Open every new `src/cast/photos/<id>.jpg` with the Read tool and check it against "Check every new photo" in STYLE.md. Remake it if it fails.
4. If the script reports `moderation_blocked`, rewrite the `look` (plain, complete clothes; no bedroom or changing room for young women) and run it again. Do not retry the same prompt more than once.

The script needs `/Applications/ChatGPT.app` with a signed-in ChatGPT account. It never needs `OPENAI_API_KEY`. If Codex is missing or signed out, stop and tell MZ. Do not install anything.

## Add a person, group or institution

Add an entry to `cast.json` with every field in the STYLE.md table. Keep the photo mix in STYLE.md. Then make the photo as above. Never use a real person, company, bank, club or brand, and never MZ.

## Add a scene

1. Add the scene to `scenes` in `src/sim/scenes.ts`. Use cast ids only. Lines are messages (`{ from, text }`, `from: ME` for the viewer) or cards (`unverified`, `external`, `securityChange`, `suspended`, `mismatch`, `nickname`, `pix`, `notice`).
2. Add the scene label to `chrome.pt.scenes` and `chrome.en.scenes` in `src/copy.ts`. TypeScript fails until both exist.
3. To show it in the trust-levels picker on the trust page, add the id to `TRUST_LEVEL_SCENES`.
4. Card text comes only from `../bipe-shared/strings/` through `t()`. If a card needs a new string, add it in bipe-shared and regenerate (bipe-shared AGENTS.md), never inline it.
5. Never write a scam warning by hand. ScenePhone runs every incoming message through the reference detector. To get a warning, write a message the detector flags; to avoid one, check with:
   `node --input-type=module -e 'import * as l from "../bipe-shared/tools/lib/registries.mjs"; console.log(l.scamWarningKind(process.argv[1], l.loadRegistries("../bipe-shared")))' "<message>"`
6. Sample messages are casual pt-BR. The English variant is the pt-BR text plus a gloss in brackets. No em or en dashes.

## Done

`pnpm build` passes in `bipe-web/`. Report which photos changed and which scenes changed, and ask MZ to look at `/elenco/`.
