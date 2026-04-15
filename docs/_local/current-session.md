# Current Session

## Date
2026-04-15

## Current Objective
Implement Public Redesign Step 3: campaign-grade public brand landing page redesign for
`apps/web/src/app/(public)/brands/[brandSlug]/page.tsx`.

## Current Step
Brand landing page has been redesigned as a campaign-oriented launch surface and now includes
hero campaign composition, featured spotlight, manifesto storytelling, and distinct live/upcoming/archive release rails.

## What Landed
- Reworked `apps/web/src/app/(public)/brands/[brandSlug]/page.tsx` into a campaign composition with:
  - Rich campaign hero with stronger campaign copy and CTA stack.
  - Fallback-aware featured spotlight for featured or best-available release.
  - Brand manifesto/editorial section with campaign metrics and stronger narrative framing.
  - Live, upcoming, and archive release rails with distinct tone and presentation.
  - Stable dedupe logic to prevent duplicate featured release cards across sections.
  - No changes to data contracts or route handlers.
- Added scoped `public-brand-*` CSS in `apps/web/src/app/globals.css` for campaign composition, cards, rails, release states, and responsive behavior.
- Preserved existing shell/header/footer behavior and storefront theming by continuing to use `storefront-*` theme tokens in brand page styles.

## Changed Files
- `apps/web/src/app/(public)/brands/[brandSlug]/page.tsx`
- `apps/web/src/app/globals.css`
- `docs/_local/current-session.md`

## Verification Commands
- `pnpm typecheck` (pass)
- `pnpm build` (pass)
- `pnpm lint` (fails due to known pre-existing issue in `packages/database/src/repositories/workspace-decommission-request-repository.ts`)

## Verification Results
- `pnpm typecheck`: passed.
- `pnpm build`: passed.
- `pnpm lint`: fails in existing unrelated file with `WorkspaceDecommissionRequestStatus` unused import/var in
  `packages/database/src/repositories/workspace-decommission-request-repository.ts`.

## Next Action
- Commit and push this Step 3 set, then continue to next redesign step when scope allows.
