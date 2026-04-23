# Light Editorial Launch Gallery Plan

## Goal

Refactor AI NFT Forge from the current dark "Cinematic Launch OS" into a light-only, premium, image-first collectible launch and curation product while preserving existing routes, workflows, APIs, wallet flows, and data contracts.

## Implementation Order

1. Update global visual tokens and shell variables for a light-only system.
2. Rebuild shared UI primitives in `packages/ui` around light surfaces, softer elevation, and collectible/editorial patterns.
3. Rework reusable collectible visuals to use premium light placeholder art, framed media, and lighter decorative motifs.
4. Restyle root shell, header, footer, and route fallback surfaces.
5. Restyle marketing and storefront routes.
6. Restyle collection, reserve, checkout, and sign-in flows.
7. Restyle studio routes with stronger thumbnail/preview-led composition.
8. Restyle commerce and settings for calmer premium product tooling.
9. Restyle ops and adjacent surfaces with restrained premium light tooling language.
10. Remove obsolete dark-only styling assumptions and run consistency verification.

## Constraints

- Tailwind-first and primitive-first implementation.
- No scattered route-local style systems or CSS-module expansion.
- No route or business-logic changes unless a tiny safe visual detail requires one.
- Reuse in-code vectors/placeholders over introducing a large static asset program.
- Keep typography on Inter + Manrope.

## Acceptance Markers

- App is light-only with no dark fallback path.
- Public routes are visibly more image-led and premium.
- Studio reads as polished creative tooling.
- Ops remains pragmatic but belongs to the same light family.
- Shared primitives remain the primary styling boundary.
