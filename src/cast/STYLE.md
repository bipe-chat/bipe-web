# Cast style guide

The cast is the set of fictional people, groups and institutions in the site's phone simulations. This file gives the rules for adding a person, writing a photo prompt, and remaking a photo. The data is in `cast.json`. The photo prompt templates are in `cast.json` under `styles`, so the script and this guide use the same text.

## What the cast must do

- Look like a real Brazilian chat list: different ages, regions, skin tones, jobs and photo habits. Nobody looks like a model, except the scammer who copies a stock photo.
- Show every trust state from `../../../proseio/docs/design/trust-ui.md`. Each entry has one default `trust` value. A scene can override it (for example `fernanda` is `pix`, and the "aparelho-novo" scene shows her as `suspended`).
- Stay fictional. Never a real person, a celebrity, a team member or MZ (no name, handle or initials, AGENTS.md rule). Never a real company, bank, club or brand. Institutions use invented names and an all-zero CNPJ.

## Fields

| Field | Rule |
|---|---|
| `id` | Short lowercase slug. The photo file is `photos/<id>.jpg`. Never rename an id that a scene uses. |
| `kind` | `person`, `group` or `institution`. |
| `name` | The verified or full legal-style name. `null` for an unknown number. |
| `short` | What friends call the person in chats ("Bia", "Seu Antônio"). The chat list shows this unless a scene sets `savedAs`. |
| `handle` | Without the `@`. An external account uses `user:server`. `null` when the person has no handle. |
| `trust` | `none`, `profile`, `pix`, `govbr`, `institution`, `external`, `suspended`. |
| `about` | One line for the team: age, job, city, and the role in scenes. Shown only on `/elenco/`. |
| `photo` | `{ style, look }`, or `{ copyOf: "<id>" }` to reuse another photo (scammers copy photos), or `null` for initials. |

## Photo mix

A real list is not all selfies. Keep roughly this mix when you add people:

| Style | Share | What it is |
|---|---|---|
| `selfie` | about 25% | Front camera, arm's length, ordinary light. |
| `mirror` | about 10% | Mirror selfie at home. |
| `candid` | about 15% | Taken by a friend: beach, bar, party, backlight. |
| `family` | about 10% | With a grandchild, partner or parent. |
| `pet`, `object` | about 20% | Dog, cat, roses, sunset, a car, a plate of food. Older people often pick flowers. |
| `stylized` | about 10% | Illustrated or 3D avatar. Younger people. |
| no photo | about 10% | Initials. Set `photo: null`. |
| `stock` | only scammers | Polished image-bank headshot. |
| `group`, `logo` | groups and institutions | |

## Writing `look`

- Write one sentence: who, age, skin tone, hair, clothes, place, light. The style template adds the camera and realism words.
- Name the Brazilian setting ("tiled porch", "plastic chairs", "rodoviária", "churrasco"), not a generic one.
- Describe clothes plainly and fully ("denim jacket over a white t-shirt"). Do not write "dressed to go out", "changing room", "bedroom" with a young woman, or "shirtless" with a teenager. OpenAI moderation blocks these outputs (`moderation_blocked`, category `sexual`). The script then fails that entry.
- No club colours: no black-and-white vertical stripes, no red-and-black hoops, no green-and-white. No Brazil national shirt.
- No readable text anywhere in the picture.

## Make or remake a photo

The script runs the ChatGPT app's bundled Codex CLI. Codex calls its built-in `image_gen` tool with the ChatGPT login. No API key. About 70 seconds per photo.

```bash
node scripts/cast.mjs
```

lists every entry and whether it has a photo.

```bash
node scripts/cast.mjs --missing
```

makes every missing photo, three at a time.

```bash
node scripts/cast.mjs caio --note "plain mustard-yellow t-shirt, no stripes"
```

remakes one photo with an extra instruction for this run only. If the change must stay, edit `look` in `cast.json` instead.

```bash
node scripts/cast.mjs gabi --ref cast-originals/gabi/<file>.png --note "same woman, now outdoors"
```

uses an earlier image as the reference, so the person stays the same.

The script keeps every full-size PNG in `cast-originals/<id>/` (git-ignored) and writes a 256 px JPEG to `photos/<id>.jpg`. A new photo replaces the old JPEG. Git has the old one.

## Check every new photo

Open each new JPEG before you commit it, and remake it when any of these is true:

- It shows text, a logo, a club crest or a flag.
- It looks like a known person.
- The face is not readable in a 34 px circle (the chat header size).
- It looks like an advert, except for `stock`.
- Hands, teeth or eyes are visibly wrong.

Then check `/elenco/` after `pnpm build && pnpm preview`. It shows every entry and every scene.

## Scenes

Scenes are in `../sim/scenes.ts`. A scene names cast ids; it never copies a name or a photo. Card text comes from the app strings through `t()`. Scam warnings are computed by the reference detector, so never put a warning in a scene by hand. If a sample message must warn, write the message so the detector fires.
