# Banner maker

Public routes: `/sobre/marca/banner/` and `/en/about/brand/banner/`, linked from
the brand library. The page is prerendered and hydrated as a React island.

- `banner-doc.ts` owns named formats, dimensions, safe boxes, bounded versioned
  documents and share links. Add formats here; both language labels belong on
  the preset. LinkedIn sizes link to their source, checked 27 October 2026.
  WhatsApp Status is a 1080 × 1920 design canvas, not a claimed upload requirement.
  Guides are conservative editorial margins; platform crops vary by device.
- `backdrop.mjs` is the existing pure SVG backdrop renderer, extracted from
  `scripts/lib/backdrop.mjs`. Build-time cards and store panels still use it
  through that wrapper. All ramps come from bipe-shared, through `shared.ts`
  in the browser. No duplicate palette or background drawing code.
- `render-banner.ts` draws the preview and exports with the same font metrics.
  Nunito is loaded explicitly for the logo and headline, Inter for supporting
  text. Artwork uses the light token ramps regardless of the editor theme.
  Drawing code is imported only when an editor mounts or an export starts.
- `BannerMaker.tsx` owns controls, PNG/JPEG downloads and local drafts. All
  interface copy lives in `copy.ts`. The default headline reads `product.promise`.
  One versioned draft is shared between the two language routes, keeping the
  user's actual copy when they switch languages. Sharing is explicit; the
  design travels in the URL fragment, never to the static server or analytics.
  A shared link takes precedence over a local draft. Reset removes that link.

Document validation, format selection and PNG encoding patterns were adapted
from `Envisioning/www/app/about/brand/banner/` and `brand/_lib/png.ts`.
Envisioning's Octa font, lime themes and noise renderer are not used by Bipe.

Run `pnpm build` for the full gate, including the document and contrast tests.
Custom exports are bounded to 4096 pixels per side; 2× export is disabled above
16 megapixels. Crop guides are a DOM overlay and never enter the exported image.
