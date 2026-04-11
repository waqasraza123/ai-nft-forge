import { z } from "zod";

import {
  collectionBrandNameSchema,
  collectionBrandSlugSchema,
  collectionDraftSlugSchema
} from "./collections.js";

export const studioWorkspaceNameSchema = z.string().trim().min(1).max(120);
export const studioWorkspaceSlugSchema = collectionDraftSlugSchema;
export const defaultStudioBrandAccentColor = "#8b5e34";
export const defaultStudioBrandThemePreset = "editorial_warm";
export const defaultStudioBrandLandingHeadline =
  "Published collection releases";
export const defaultStudioBrandLandingDescription =
  "Explore curated collection drops assembled from generated art variants and published as immutable releases.";
export const defaultStudioFeaturedReleaseLabel = "Featured release";
export const studioBrandThemePresetSchema = z.enum([
  "editorial_warm",
  "gallery_mono",
  "midnight_launch"
]);
export const studioBrandAccentColorSchema = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, {
    message: "Expected a six-digit hex color beginning with #."
  });
export const studioBrandLandingHeadlineSchema = z
  .string()
  .trim()
  .min(1)
  .max(120);
export const studioBrandLandingDescriptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(280);
export const studioFeaturedReleaseLabelSchema = z
  .string()
  .trim()
  .min(1)
  .max(40);
export const studioBrandWordmarkSchema = z.string().trim().max(40);
export const studioBrandHeroKickerSchema = z.string().trim().max(60);
export const studioBrandStoryHeadlineSchema = z.string().trim().max(120);
export const studioBrandStoryBodySchema = z.string().trim().max(600);
export const studioBrandCtaLabelSchema = z.string().trim().max(40);
export const studioCustomDomainSchema = z
  .string()
  .trim()
  .max(253)
  .regex(/^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i, {
    message: "Expected a valid domain name."
  });

export const studioBrandThemeSchema = z.object({
  accentColor: studioBrandAccentColorSchema,
  featuredReleaseLabel: studioFeaturedReleaseLabelSchema.nullish(),
  heroKicker: studioBrandHeroKickerSchema.nullish(),
  landingDescription: studioBrandLandingDescriptionSchema.nullish(),
  landingHeadline: studioBrandLandingHeadlineSchema.nullish(),
  primaryCtaLabel: studioBrandCtaLabelSchema.nullish(),
  secondaryCtaLabel: studioBrandCtaLabelSchema.nullish(),
  storyBody: studioBrandStoryBodySchema.nullish(),
  storyHeadline: studioBrandStoryHeadlineSchema.nullish(),
  themePreset: studioBrandThemePresetSchema.nullish(),
  wordmark: studioBrandWordmarkSchema.nullish()
});

export const studioWorkspaceSummarySchema = z.object({
  id: z.string().min(1),
  name: studioWorkspaceNameSchema,
  slug: studioWorkspaceSlugSchema,
  status: z.enum(["active", "suspended", "archived"])
});

export const studioBrandSummarySchema = z.object({
  accentColor: studioBrandAccentColorSchema,
  customDomain: studioCustomDomainSchema.nullable(),
  featuredReleaseLabel: studioFeaturedReleaseLabelSchema,
  heroKicker: studioBrandHeroKickerSchema.nullable(),
  id: z.string().min(1),
  landingDescription: studioBrandLandingDescriptionSchema,
  landingHeadline: studioBrandLandingHeadlineSchema,
  name: collectionBrandNameSchema,
  primaryCtaLabel: studioBrandCtaLabelSchema.nullable(),
  publicBrandPath: z.string().min(1),
  secondaryCtaLabel: studioBrandCtaLabelSchema.nullable(),
  slug: collectionBrandSlugSchema,
  storyBody: studioBrandStoryBodySchema.nullable(),
  storyHeadline: studioBrandStoryHeadlineSchema.nullable(),
  themePreset: studioBrandThemePresetSchema,
  wordmark: studioBrandWordmarkSchema.nullable()
});

export const studioSettingsSummarySchema = z.object({
  brand: studioBrandSummarySchema,
  brands: z.array(studioBrandSummarySchema),
  workspace: studioWorkspaceSummarySchema
});

export const studioSettingsResponseSchema = z.object({
  settings: studioSettingsSummarySchema.nullable()
});

export const studioSettingsUpdateRequestSchema = z.object({
  brandId: z.string().min(1).nullish(),
  accentColor: studioBrandAccentColorSchema,
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  customDomain: studioCustomDomainSchema.nullish(),
  featuredReleaseLabel: studioFeaturedReleaseLabelSchema,
  heroKicker: studioBrandHeroKickerSchema.nullish(),
  landingDescription: studioBrandLandingDescriptionSchema,
  landingHeadline: studioBrandLandingHeadlineSchema,
  primaryCtaLabel: studioBrandCtaLabelSchema.nullish(),
  secondaryCtaLabel: studioBrandCtaLabelSchema.nullish(),
  storyBody: studioBrandStoryBodySchema.nullish(),
  storyHeadline: studioBrandStoryHeadlineSchema.nullish(),
  themePreset: studioBrandThemePresetSchema,
  wordmark: studioBrandWordmarkSchema.nullish(),
  workspaceName: studioWorkspaceNameSchema,
  workspaceSlug: studioWorkspaceSlugSchema
});

export const studioBrandCreateRequestSchema = z.object({
  accentColor: studioBrandAccentColorSchema,
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  customDomain: studioCustomDomainSchema.nullish(),
  featuredReleaseLabel: studioFeaturedReleaseLabelSchema,
  heroKicker: studioBrandHeroKickerSchema.nullish(),
  landingDescription: studioBrandLandingDescriptionSchema,
  landingHeadline: studioBrandLandingHeadlineSchema,
  primaryCtaLabel: studioBrandCtaLabelSchema.nullish(),
  secondaryCtaLabel: studioBrandCtaLabelSchema.nullish(),
  storyBody: studioBrandStoryBodySchema.nullish(),
  storyHeadline: studioBrandStoryHeadlineSchema.nullish(),
  themePreset: studioBrandThemePresetSchema,
  wordmark: studioBrandWordmarkSchema.nullish()
});

export const studioBrandUpdateRequestSchema = studioBrandCreateRequestSchema;

export const studioBrandResponseSchema = z.object({
  brand: studioBrandSummarySchema
});

export const studioSettingsErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "BRAND_NOT_FOUND",
      "BRAND_PUBLICATION_CONFLICT",
      "BRAND_SLUG_CONFLICT",
      "INVALID_REQUEST",
      "INTERNAL_SERVER_ERROR",
      "SESSION_REQUIRED",
      "WORKSPACE_REQUIRED",
      "WORKSPACE_SLUG_CONFLICT"
    ]),
    message: z.string().min(1)
  })
});

export type StudioBrandSummary = z.infer<typeof studioBrandSummarySchema>;
export type StudioBrandTheme = z.infer<typeof studioBrandThemeSchema>;
export type StudioBrandResponse = z.infer<typeof studioBrandResponseSchema>;
export type StudioBrandCreateRequest = z.infer<
  typeof studioBrandCreateRequestSchema
>;
export type StudioBrandUpdateRequest = z.infer<
  typeof studioBrandUpdateRequestSchema
>;
export type StudioSettingsErrorResponse = z.infer<
  typeof studioSettingsErrorResponseSchema
>;
export type StudioSettingsResponse = z.infer<
  typeof studioSettingsResponseSchema
>;
export type StudioSettingsSummary = z.infer<typeof studioSettingsSummarySchema>;
export type StudioSettingsUpdateRequest = z.infer<
  typeof studioSettingsUpdateRequestSchema
>;
export type StudioWorkspaceSummary = z.infer<
  typeof studioWorkspaceSummarySchema
>;
