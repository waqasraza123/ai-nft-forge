import {
  defaultStudioBrandAccentColor,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioBrandThemePreset,
  defaultStudioFeaturedReleaseLabel,
  studioBrandCreateRequestSchema,
  studioBrandResponseSchema,
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
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<BrandRecord | null>;
    findFirstByOwnerUserId(ownerUserId: string): Promise<BrandRecord | null>;
    findFirstBySlug(slug: string): Promise<BrandRecord | null>;
    listByOwnerUserId(ownerUserId: string): Promise<BrandRecord[]>;
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

function buildBrandThemeJson(input: {
  accentColor: string;
  featuredReleaseLabel: string;
  heroKicker?: string | null | undefined;
  landingDescription: string;
  landingHeadline: string;
  primaryCtaLabel?: string | null | undefined;
  secondaryCtaLabel?: string | null | undefined;
  storyBody?: string | null | undefined;
  storyHeadline?: string | null | undefined;
  themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
  wordmark?: string | null | undefined;
}) {
  return {
    accentColor: input.accentColor,
    featuredReleaseLabel: input.featuredReleaseLabel,
    heroKicker: normalizeOptionalText(input.heroKicker),
    landingDescription: input.landingDescription,
    landingHeadline: input.landingHeadline,
    primaryCtaLabel: normalizeOptionalText(input.primaryCtaLabel),
    secondaryCtaLabel: normalizeOptionalText(input.secondaryCtaLabel),
    storyBody: normalizeOptionalText(input.storyBody),
    storyHeadline: normalizeOptionalText(input.storyHeadline),
    themePreset: input.themePreset,
    wordmark: normalizeOptionalText(input.wordmark)
  };
}

function serializeBrand(input: BrandRecord) {
  const theme = parseBrandTheme(input.themeJson);

  return {
    accentColor: theme.accentColor,
    customDomain: input.customDomain,
    featuredReleaseLabel: theme.featuredReleaseLabel,
    heroKicker: theme.heroKicker,
    id: input.id,
    landingDescription: theme.landingDescription,
    landingHeadline: theme.landingHeadline,
    name: input.name,
    primaryCtaLabel: theme.primaryCtaLabel,
    publicBrandPath: `/brands/${input.slug}`,
    secondaryCtaLabel: theme.secondaryCtaLabel,
    slug: input.slug,
    storyBody: theme.storyBody,
    storyHeadline: theme.storyHeadline,
    themePreset: theme.themePreset,
    wordmark: theme.wordmark
  };
}

function serializeStudioSettings(input: {
  brands: BrandRecord[];
  workspace: WorkspaceRecord;
}) {
  return studioSettingsResponseSchema.parse({
    settings: {
      brand: serializeBrand(input.brands[0]!),
      brands: input.brands.map((brand) => serializeBrand(brand)),
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
  const [workspace, brands] = await Promise.all([
    input.repositories.workspaceRepository.findFirstByOwnerUserId(
      input.ownerUserId
    ),
    input.repositories.brandRepository.listByOwnerUserId(input.ownerUserId)
  ]);

  if (!workspace || brands.length === 0) {
    return studioSettingsResponseSchema.parse({
      settings: null
    });
  }

  return serializeStudioSettings({
    brands,
    workspace
  });
}

async function assertWorkspaceSlugAvailable(input: {
  existingWorkspaceId: string | null;
  repositories: Pick<StudioSettingsRepositorySet, "workspaceRepository">;
  workspaceSlug: string;
}) {
  const conflictingWorkspace =
    await input.repositories.workspaceRepository.findBySlug(input.workspaceSlug);

  if (
    conflictingWorkspace &&
    conflictingWorkspace.id !== input.existingWorkspaceId
  ) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_SLUG_CONFLICT",
      "Workspace slug is already in use.",
      409
    );
  }
}

async function assertBrandSlugAvailable(input: {
  brandSlug: string;
  existingBrandId: string | null;
  repositories: Pick<StudioSettingsRepositorySet, "brandRepository">;
}) {
  const conflictingBrand = await input.repositories.brandRepository.findFirstBySlug(
    input.brandSlug
  );

  if (conflictingBrand && conflictingBrand.id !== input.existingBrandId) {
    throw new StudioSettingsServiceError(
      "BRAND_SLUG_CONFLICT",
      "Brand slug is already in use.",
      409
    );
  }
}

async function assertPublicationRouteCompatibility(input: {
  nextBrandSlug: string;
  ownerUserId: string;
  publications: PublishedCollectionRecord[];
  repositories: Pick<StudioSettingsRepositorySet, "publishedCollectionRepository">;
}) {
  for (const publication of input.publications) {
    const routeConflict =
      await input.repositories.publishedCollectionRepository.findByBrandSlugAndCollectionSlug(
        {
          brandSlug: input.nextBrandSlug,
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

    async createStudioBrand(input: {
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
    }) {
      const parsedInput = studioBrandCreateRequestSchema.parse({
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
        wordmark: input.wordmark
      });

      return dependencies.runTransaction(async (repositories) => {
        const workspace =
          await repositories.workspaceRepository.findFirstByOwnerUserId(
            input.ownerUserId
          );

        if (!workspace) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_REQUIRED",
            "Create the workspace profile before adding additional brands.",
            409
          );
        }

        await assertBrandSlugAvailable({
          brandSlug: parsedInput.brandSlug,
          existingBrandId: null,
          repositories
        });

        const brand = await repositories.brandRepository.create({
          customDomain: normalizeOptionalDomain(parsedInput.customDomain),
          name: parsedInput.brandName,
          slug: parsedInput.brandSlug,
          themeJson: buildBrandThemeJson({
            accentColor: parsedInput.accentColor,
            featuredReleaseLabel: parsedInput.featuredReleaseLabel,
            heroKicker: parsedInput.heroKicker,
            landingDescription: parsedInput.landingDescription,
            landingHeadline: parsedInput.landingHeadline,
            primaryCtaLabel: parsedInput.primaryCtaLabel,
            secondaryCtaLabel: parsedInput.secondaryCtaLabel,
            storyBody: parsedInput.storyBody,
            storyHeadline: parsedInput.storyHeadline,
            themePreset: parsedInput.themePreset,
            wordmark: parsedInput.wordmark
          }),
          workspaceId: workspace.id
        });

        return studioBrandResponseSchema.parse({
          brand: serializeBrand(brand)
        });
      });
    },

    async updateStudioSettings(input: {
      accentColor: string;
      brandId?: string | null;
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
        brandId: input.brandId,
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
        const [existingWorkspace, existingBrands, ownedPublications] =
          await Promise.all([
            repositories.workspaceRepository.findFirstByOwnerUserId(
              input.ownerUserId
            ),
            repositories.brandRepository.listByOwnerUserId(input.ownerUserId),
            repositories.publishedCollectionRepository.listByOwnerUserId(
              input.ownerUserId
            )
          ]);
        const existingBrand = parsedInput.brandId
          ? existingBrands.find((brand) => brand.id === parsedInput.brandId) ??
            null
          : existingBrands[0] ?? null;

        if (parsedInput.brandId && !existingBrand) {
          throw new StudioSettingsServiceError(
            "BRAND_NOT_FOUND",
            "The requested brand was not found.",
            404
          );
        }

        await assertWorkspaceSlugAvailable({
          existingWorkspaceId: existingWorkspace?.id ?? null,
          repositories,
          workspaceSlug: parsedInput.workspaceSlug
        });
        await assertBrandSlugAvailable({
          brandSlug: parsedInput.brandSlug,
          existingBrandId: existingBrand?.id ?? null,
          repositories
        });

        const publicationsForBrand = existingBrand
          ? ownedPublications.filter(
              (publication) => publication.brandSlug === existingBrand.slug
            )
          : [];

        if (
          existingBrand &&
          existingBrand.slug !== parsedInput.brandSlug &&
          publicationsForBrand.length > 0
        ) {
          await assertPublicationRouteCompatibility({
            nextBrandSlug: parsedInput.brandSlug,
            ownerUserId: input.ownerUserId,
            publications: publicationsForBrand,
            repositories
          });
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
        const themeJson = buildBrandThemeJson({
          accentColor: parsedInput.accentColor,
          featuredReleaseLabel: parsedInput.featuredReleaseLabel,
          heroKicker: parsedInput.heroKicker,
          landingDescription: parsedInput.landingDescription,
          landingHeadline: parsedInput.landingHeadline,
          primaryCtaLabel: parsedInput.primaryCtaLabel,
          secondaryCtaLabel: parsedInput.secondaryCtaLabel,
          storyBody: parsedInput.storyBody,
          storyHeadline: parsedInput.storyHeadline,
          themePreset: parsedInput.themePreset,
          wordmark: parsedInput.wordmark
        });
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
          existingBrand &&
          publicationsForBrand.length > 0 &&
          (existingBrand.name !== parsedInput.brandName ||
            existingBrand.slug !== parsedInput.brandSlug)
        ) {
          await Promise.all(
            publicationsForBrand.map((publication) =>
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

        const refreshedBrands = existingBrand
          ? existingBrands.map((brandRecord) =>
              brandRecord.id === updatedBrand.id ? updatedBrand : brandRecord
            )
          : [...existingBrands, updatedBrand];

        return serializeStudioSettings({
          brands: refreshedBrands,
          workspace: updatedWorkspace
        });
      });
    }
  };
}
