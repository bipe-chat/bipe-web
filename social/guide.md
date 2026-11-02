# Social editorial guide

Rules for every Bipe post on Instagram. The posts in social/posts.md and the store posts (bipe-shared/product/appstore.md) follow them. scripts/lib/panels.mjs draws the layouts; scripts/store-images.mjs renders them.

## What a post is

A post says one thing about Bipe that a person can check in the app. One post, one claim. The claim is about a feature that ships: scripts/brand-images.mjs stops the build when a post names a feature that is not `built`, `testing` or `policy` in bipe-shared/product/parity.json.

The lead message is that the data stays in Brazil. Every run of posts opens with it, and about one post in three is about it.

## Voice

- Bipe voice writes "para". Chat bubbles are people's voice and keep "pra", "tá", "pro" (ADR 0068).
- No dashes. No emoji in the image (the renderer has no emoji font).
- Talk to one person: "você", "sua conversa". Never "usuários".
- Say what the app does, not how good it is. No "seguro", "melhor", "revolucionário", no promise that the app cannot keep alone ("nunca mais cai em golpe").
- Name Bipe in the sub, not in the headline. The footer already shows the mark.
- Human-facing copy goes through the humanizer skill before it ships.

## Layouts

Each row of a `## Screenshots` table picks a layout with the `layout` column. Without it, a row with feature `-` is `map` and the others are `phone`.

| layout | shows | use it for | copy |
|---|---|---|---|
| `phone` | headline at the top left, the app in a phone that runs off the bottom right | a feature people need to see: Pix check, agenda, the scam warning | headline up to 40 characters, sub up to 70 |
| `map` | headline and the Brazil network | data in Brazil | headline up to 40, sub up to 70 |
| `type` | the headline in large type, nothing else | one strong sentence: data in Brazil, no ads, open source | headline up to 40, sub up to 50 |
| `bubble` | one chat bubble (`bubble`, with the sender in `from`), the headline under it | a situation people know from their own phone: a scam message, a stranger, a group | bubble up to 60, headline up to 40, sub up to 60 |

The headline is a fact or a question the sub answers. The sub is one sentence with no full stop.

The phone runs off the bottom edge, so only the top half of the screen shows. Use `phone` only for a capture with its content at the top (Pix check, agenda, the scam warning, the request list). A chat capture has its messages at the bottom: tell that story with `bubble`.

`phone` needs a capture: the `capture` column names a store capture when the slug is not one. A capture exists per palette (`appstore/raw/iphone69/light/<locale>/<slug>@<palette>.png`), and the palette of a post comes from its position (src/palette-order.json). Moving a `phone` post to a position whose palette has no capture stops the build. Run scripts/scene-captures.mjs to make it, or move the post.

## Variety

- Never two posts with the same layout next to each other.
- In every nine posts (three rows of the grid): at least three layouts, and at most three `phone` posts.
- The palette changes on every post by itself. Do not change the order to get a colour.
- The footer (mark, wordmark, bipe.chat) is on every post. Do not put the logo anywhere else.

## Formats

Each post renders in three sizes. Write for the post size; the others take the same copy.

| device | size | where |
|---|---|---|
| `ig-post` | 1080 x 1350 | feed, the default |
| `ig-square` | 1080 x 1080 | feed, older grids and link previews |
| `ig-story` | 1080 x 1920 | stories; the top 250 px and the bottom 340 px stay free of text |

## Caption

The caption is not in the image. It repeats nothing from the headline, says in one or two sentences what the person does in the app, and ends with "Baixe em bipe.chat". At most three hashtags, all in Portuguese. No "link na bio".

## Before a post goes out

1. The claim is in parity.json as `built`, `testing` or `policy`.
2. The copy passed the humanizer skill, has no dash, and uses "para" outside bubbles.
3. `pnpm store:images --device ig-post --locale pt-BR --listing social/posts.md` renders with no error.
4. Look at the post at phone size. The headline reads in one second.
5. The layout is not the same as the post before it.
