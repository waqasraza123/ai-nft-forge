import {
  defaultStudioBrandAccentColor,
  defaultStudioBrandThemePreset,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioFeaturedReleaseLabel,
  studioBrandThemeSchema,
  studioSettingsResponseSchema,
  studioSettingsUpdateRequestSchema
} from "@ai-nft-forge/shared";

import { StudioSettingsServiceError } from "./error";

type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "archived" | "suspended";
};

type BrandRecord = {
  customDomain: string | null;
  id: string;
  name: string;
  slug: string;
  themeJson: unknown;
  workspaceId: string;
};

type PublishedCollectionRecord = {
  brandName: string;
  brandSlug: string;
  description: string | null;
  id: string;
  publishedAt: Date;
  slug: string;
  title: string;
  updatedAt: Date;
};

type StudioSettingsRepositorySet = {
  brandRepository: {
    create(input: {
      customDomain?: string | null;
      name: string;
      slug: string;
      themeJson: unknown;
      workspaceId: string;
    }): Promise<BrandRecord>;
    findFirstByOwnerUserId(ownerUserId: string): Promise<BrandRecord | null>;
    findFirstBySlug(slug: string): Promise<BrandRecord | null>;
    updateByIdForOwner(input: {
      customDomain?: string | null;
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      themeJson: unknown;
      workspaceId: string;
    }): Promise<BrandRecord>;
  };
  publishedCollectionRepository: {
    findByBrandSlugAndCollectionSlug(input: {
      brandSlug: string;
      slug: string;
    }): Promise<{ id: string } | null>;
    listByOwnerUserId(
      ownerUserId: string
    ): Promise<PublishedCollectionRecord[]>;
    updateByIdForOwner(input: {
      brandName: string;
      brandSlug: string;
      description: string | null;
      id: string;
      ownerUserId: string;
      slug: string;
      title: string;
    }): Promise<{ id: string }>;
  };
  workspaceRepository: {
    create(input: {
      name: string;
      ownerUserId: string;
      slug: string;
      status?: "active" | "archived" | "suspended";
    }): Promise<WorkspaceRecord>;
    findBySlug(slug: string): Promise<WorkspaceRecord | null>;
    findFirstByOwnerUserId(
      ownerUserId: string
    ): Promise<WorkspaceRecord | null>;
    updateByIdForOwner(input: {
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      status: "active" | "archived" | "suspended";
    }): Promise<WorkspaceRecord>;
  };
};

type StudioSettingsServiceDependencies = {
  repositories: StudioSettingsRepositorySet;
  runTransaction<T>(
    operation: (repositories: StudioSettingsRepositorySet) => Promise<T>
  ): Promise<T>;
};

function normalizeOptionalDomain(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function parseBrandTheme(themeJson: unknown) {
  const parsedTheme = studioBrandThemeSchema.safeParse(themeJson);

  if (parsedTheme.success) {
    return {
      accentColor: parsedTheme.data.accentColor,
      featuredReleaseLabel:
        parsedTheme.data.featuredReleaseLabel ??
        defaultStudioFeaturedReleaseLabel,
      heroKicker: parsedTheme.data.heroKicker ?? null,
      landingDescription:
        parsedTheme.data.landingDescription ??
        defaultStudioBrandLandingDescription,
      landingHeadline:
        parsedTheme.data.landingHeadline ?? defaultStudioBrandLandingHeadline,
      primaryCtaLabel: parsedTheme.data.primaryCtaLabel ?? null,
      secondaryCtaLabel: parsedTheme.data.secondaryCtaLabel ?? null,
      storyBody: parsedTheme.data.storyBody ?? null,
      storyHeadline: parsedTheme.data.storyHeadline ?? null,
      themePreset:
        parsedTheme.data.themePreset ?? defaultStudioBrandThemePreset,
      wordmark: parsedTheme.data.wordmark ?? null
    };
  }

  return {
    accentColor: defaultStudioBrandAccentColor,
    featuredReleaseLabel: defaultStudioFeaturedReleaseLabel,
    heroKicker: null,
    landingDescription: defaultStudioBrandLandingDescription,
    landingHeadline: defaultStudioBrandLandingHeadline,
    primaryCtaLabel: null,
    secondaryCtaLabel: null,
    storyBody: null,
    storyHeadline: null,
    themePreset: defaultStudioBrandThemePreset,
    wordmark: null
  };
}

function serializeStudioSettings(input: {
  brand: BrandRecord;
  workspace: WorkspaceRecord;
}) {
  const theme = parseBrandTheme(input.brand.themeJson);

  return studioSettingsResponseSchema.parse({
    settings: {
      brand: {
        accentColor: theme.accentColor,
        customDomain: input.brand.customDomain,
        featuredReleaseLabel: theme.featuredReleaseLabel,
        heroKicker: theme.heroKicker,
        id: input.brand.id,
        landingDescription: theme.landingDescription,
        landingHeadline: theme.landingHeadline,
        name: input.brand.name,
        primaryCtaLabel: theme.primaryCtaLabel,
        publicBrandPath: `/brands/${input.brand.slug}`,
        secondaryCtaLabel: theme.secondaryCtaLabel,
        slug: input.brand.slug,
        storyBody: theme.storyBody,
        storyHeadline: theme.storyHeadline,
        themePreset: theme.themePreset,
        wordmark: theme.wordmark
      },
      workspace: {
        id: input.workspace.id,
        name: input.workspace.name,
        slug: input.workspace.slug,
        status: input.workspace.status
      }
    }
  });
}

async function loadOwnerStudioSettings(input: {
  ownerUserId: string;
  repositories: StudioSettingsRepositorySet;
}) {
  const [workspace, brand] = await Promise.all([
    input.repositories.workspaceRepository.findFirstByOwnerUserId(
      input.ownerUserId
    ),
    input.repositories.brandRepository.findFirstByOwnerUserId(input.ownerUserId)
  ]);

  if (!workspace || !brand) {
    return studioSettingsResponseSchema.parse({
      settings: null
    });
  }

  return serializeStudioSettings({
    brand,
    workspace
  });
}

export function createStudioSettingsService(
  dependencies: StudioSettingsServiceDependencies
) {
  return {
    async getStudioSettings(input: { ownerUserId: string }) {
      return loadOwnerStudioSettings({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories
      });
    },

    async updateStudioSettings(input: {
      accentColor: string;
      brandName: string;
      brandSlug: string;
      customDomain?: string | null;
      featuredReleaseLabel: string;
      heroKicker?: string | null;
      landingDescription: string;
      landingHeadline: string;
      ownerUserId: string;
      primaryCtaLabel?: string | null;
      secondaryCtaLabel?: string | null;
      storyBody?: string | null;
      storyHeadline?: string | null;
      themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
      wordmark?: string | null;
      workspaceName: string;
      workspaceSlug: string;
    }) {
      const parsedInput = studioSettingsUpdateRequestSchema.parse({
        accentColor: input.accentColor,
        brandName: input.brandName,
        brandSlug: input.brandSlug,
        customDomain: input.customDomain,
        featuredReleaseLabel: input.featuredReleaseLabel,
        heroKicker: input.heroKicker,
        landingDescription: input.landingDescription,
        landingHeadline: input.landingHeadline,
        primaryCtaLabel: input.primaryCtaLabel,
        secondaryCtaLabel: input.secondaryCtaLabel,
        storyBody: input.storyBody,
        storyHeadline: input.storyHeadline,
        themePreset: input.themePreset,
        wordmark: input.wordmark,
        workspaceName: input.workspaceName,
        workspaceSlug: input.workspaceSlug
      });

      return dependencies.runTransaction(async (repositories) => {
        const [existingWorkspace, existingBrand] = await Promise.all([
          repositories.workspaceRepository.findFirstByOwnerUserId(
            input.ownerUserId
          ),
          repositories.brandRepository.findFirstByOwnerUserId(input.ownerUserId)
        ]);

        const conflictingWorkspace =
          await repositories.workspaceRepository.findBySlug(
            parsedInput.workspaceSlug
          );

        if (
          conflictingWorkspace &&
          conflictingWorkspace.id !== existingWorkspace?.id
        ) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_SLUG_CONFLICT",
            "Workspace slug is already in use.",
            409
          );
        }

        const conflictingBrand =
          await repositories.brandRepository.findFirstBySlug(
            parsedInput.brandSlug
          );

        if (conflictingBrand && conflictingBrand.id !== existingBrand?.id) {
          throw new StudioSettingsServiceError(
            "BRAND_SLUG_CONFLICT",
            "Brand slug is already in use.",
            409
          );
        }

        const ownedPublications =
          existingBrand || conflictingBrand
            ? await repositories.publishedCollectionRepository.listByOwnerUserId(
                input.ownerUserId
              )
            : [];

        if (ownedPublications.length > 0) {
          for (const publication of ownedPublications) {
            const routeConflict =
              await repositories.publishedCollectionRepository.findByBrandSlugAndCollectionSlug(
                {
                  brandSlug: parsedInput.brandSlug,
                  slug: publication.slug
                }
              );

            if (routeConflict && routeConflict.id !== publication.id) {
              throw new StudioSettingsServiceError(
                "BRAND_PUBLICATION_CONFLICT",
                "The requested brand slug would conflict with an existing published collection route.",
                409
              );
            }
          }
        }

        const workspace =
          existingWorkspace ??
          (await repositories.workspaceRepository.create({
            name: parsedInput.workspaceName,
            ownerUserId: input.ownerUserId,
            slug: parsedInput.workspaceSlug,
            status: "active"
          }));

        const updatedWorkspace =
          existingWorkspace?.id === workspace.id
            ? await repositories.workspaceRepository.updateByIdForOwner({
                id: existingWorkspace.id,
                name: parsedInput.workspaceName,
                ownerUserId: input.ownerUserId,
                slug: parsedInput.workspaceSlug,
                status: existingWorkspace.status
              })
            : workspace;

        const themeJson = {
          accentColor: parsedInput.accentColor,
          featuredReleaseLabel: parsedInput.featuredReleaseLabel,
          heroKicker: normalizeOptionalText(parsedInput.heroKicker),
          landingDescription: parsedInput.landingDescription,
          landingHeadline: parsedInput.landingHeadline,
          primaryCtaLabel: normalizeOptionalText(parsedInput.primaryCtaLabel),
          secondaryCtaLabel: normalizeOptionalText(
            parsedInput.secondaryCtaLabel
          ),
          storyBody: normalizeOptionalText(parsedInput.storyBody),
          storyHeadline: normalizeOptionalText(parsedInput.storyHeadline),
          themePreset: parsedInput.themePreset,
          wordmark: normalizeOptionalText(parsedInput.wordmark)
        };
        const brand =
          existingBrand ??
          (await repositories.brandRepository.create({
            customDomain: normalizeOptionalDomain(parsedInput.customDomain),
            name: parsedInput.brandName,
            slug: parsedInput.brandSlug,
            themeJson,
            workspaceId: updatedWorkspace.id
          }));

        const updatedBrand =
          existingBrand?.id === brand.id
            ? await repositories.brandRepository.updateByIdForOwner({
                customDomain: normalizeOptionalDomain(parsedInput.customDomain),
                id: existingBrand.id,
                name: parsedInput.brandName,
                ownerUserId: input.ownerUserId,
                slug: parsedInput.brandSlug,
                themeJson,
                workspaceId: updatedWorkspace.id
              })
            : brand;

        if (
          ownedPublications.length > 0 &&
          (existingBrand?.name !== parsedInput.brandName ||
            existingBrand?.slug !== parsedInput.brandSlug)
        ) {
          await Promise.all(
            ownedPublications.map((publication) =>
              repositories.publishedCollectionRepository.updateByIdForOwner({
                brandName: parsedInput.brandName,
                brandSlug: parsedInput.brandSlug,
                description: publication.description,
                id: publication.id,
                ownerUserId: input.ownerUserId,
                slug: publication.slug,
                title: publication.title
              })
            )
          );
        }

        return serializeStudioSettings({
          brand: updatedBrand,
          workspace: updatedWorkspace
        });
      });
    }
  };
}
