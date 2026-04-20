# UI Design System

## Objective

AI NFT Forge uses a Tailwind-first "Cinematic Launch OS" design system. The UI is meant to communicate two things at the same time:

- premium public launch presentation for branded collectible releases
- high-trust operator tooling for studio, commerce, and ops workflows

The design system is intentionally not a generic NFT marketplace skin and not a generic SaaS dashboard theme.

## Styling Rules

- Tailwind CSS is the styling system for `apps/web` and `packages/ui`.
- `apps/web/src/app/globals.css` is intentionally minimal and contains only Tailwind directives.
- Shared visual tokens live in [apps/web/tailwind.config.ts](/Users/mc/development/blockchain/ethereum/ai-nft-forge/apps/web/tailwind.config.ts).
- Shared reusable primitives live in [packages/ui/src/index.tsx](/Users/mc/development/blockchain/ethereum/ai-nft-forge/packages/ui/src/index.tsx).
- Route code should compose shared primitives and Tailwind utilities instead of introducing route-specific stylesheet contracts.
- New CSS files, CSS modules, styled-components, Emotion, SCSS, and styled JSX should not be added for product UI work.

## Theme Model

The redesign uses one flagship dark theme across the product family.

- Public routes use a cinematic shell with stronger violet/cyan presentation accents.
- Private Studio and Ops routes use a tighter operator-grade shell with a cooler cyan-leaning accent balance.
- Both shells are driven from the same variable contract in [site-shell.tsx](/Users/mc/development/blockchain/ethereum/ai-nft-forge/apps/web/src/components/site-shell.tsx).
- The route shell sets `--color-*` variables through Tailwind arbitrary-property classes instead of CSS files or runtime style maps.

This replaces the older internal sidebar theme-switcher path. There is no longer a multi-theme operator chrome mode to maintain.

## Token Layers

The shared Tailwind extension currently defines the main reusable visual tokens:

- `forge.*` colors for the graphite/midnight foundation, ink, muted text, and premium accents
- `fontFamily.ui` and `fontFamily.display` for body and display typography
- `maxWidth.cinematic` for wide launch/storefront shells
- `borderRadius.cinematic` and `borderRadius.launch` for premium panel geometry
- `boxShadow.glass`, `boxShadow.panel`, `boxShadow.launch`, and `boxShadow.chrome` for layered depth
- `blur.halo` and shared transition durations for restrained motion polish

These tokens are the default vocabulary for new UI work.

## Shared Primitive Layers

[packages/ui/src/index.tsx](/Users/mc/development/blockchain/ethereum/ai-nft-forge/packages/ui/src/index.tsx) is the canonical shared primitive boundary. The main groups are:

- shell and surface primitives: `PageShell`, `SurfaceGrid`, `SurfaceCard`, `SurfacePanel`, `FormPanel`, `RailCard`
- public/storefront primitives: `StorefrontPanel`, `StorefrontTile`, `StorefrontPill`
- operator primitives: `OpsPanelCard`, `OpsSummaryCard`, `OpsCommandSection`, `OpsCommandModule`, `OpsStatusNotice`, `OpsGrid`, `OpsActionRow`
- heading and information primitives: `SectionHeading`, `PanelHeading`, `MetricTile`, `SignalCard`, `InsetMetric`
- record/list primitives: `RecordList`, `RecordCard`, `RecordCopy`, `RecordActions`, `EmptyState`, `OpsEmptyState`
- input and action primitives: `FieldStack`, `FieldLabel`, `InputField`, `SelectField`, `TextAreaField`, `ActionButton`, `ActionLink`

When a route needs a new visual pattern, prefer extending this shared boundary instead of baking a one-off route shell.

## Storefront Theme Bridge

Public brand/storefront routes still support persisted brand presets and arbitrary accent colors.

- Preset-dependent storefront backgrounds and panel surfaces resolve via Tailwind class composition in [storefront-theme.ts](/Users/mc/development/blockchain/ethereum/ai-nft-forge/apps/web/src/lib/ui/storefront-theme.ts).
- Arbitrary saved accent colors use one small inline style bridge for `--storefront-accent`.

That inline style is intentionally narrow. It exists only because user-saved runtime colors cannot be enumerated safely in Tailwind at build time.

## App Shell Files

The product shell is anchored by:

- [layout.tsx](/Users/mc/development/blockchain/ethereum/ai-nft-forge/apps/web/src/app/layout.tsx)
- [site-shell.tsx](/Users/mc/development/blockchain/ethereum/ai-nft-forge/apps/web/src/components/site-shell.tsx)
- [site-header.tsx](/Users/mc/development/blockchain/ethereum/ai-nft-forge/apps/web/src/components/site-header.tsx)
- [site-footer.tsx](/Users/mc/development/blockchain/ethereum/ai-nft-forge/apps/web/src/components/site-footer.tsx)

These files define the flagship chrome, typography baseline, shell spacing, and route-mode split.

## Public vs Private Expectations

Public routes should feel:

- cinematic
- premium
- media-forward
- white-label ready
- calm and high-ticket

Private routes should feel:

- structured
- precise
- scan-friendly
- operationally safe
- visually consistent with the public product family

The difference should come from spacing, panel density, and accent restraint, not from maintaining disconnected visual systems.

## Implementation Guidance

When editing UI:

1. Start from an existing shared primitive if one fits.
2. If not, add a reusable primitive in `packages/ui` before styling the route directly.
3. Prefer Tailwind tokens and utility composition over ad hoc arbitrary values.
4. Keep motion restrained and utility-driven.
5. Avoid one-off visual experiments that break the product-wide shell language.

## Anti-Patterns

Do not reintroduce:

- semantic stylesheet class systems
- page-specific CSS files
- CSS variable token files outside the shell/theme bridge
- route-local theme switchers
- light-theme dashboard fragments that break the flagship dark product language
- generic Tailwind dashboard styling with no premium art direction
