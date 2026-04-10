import {
  aiNftForgeCollectionContractStandard,
  aiNftForgeSupportedCollectionContractChains,
  createCollectionContractName,
  createCollectionContractSymbol,
  createCollectionContractUrl,
  createCollectionMetadataManifestUrl,
  createCollectionPublicUrl,
  createCollectionTokenUriBaseUrl,
  createCollectionTokenUriTemplateUrl,
  createCollectionTokenUriUrl
} from "@ai-nft-forge/contracts";
import {
  collectionPublicContractResponseSchema,
  collectionPublicBrandPageResponseSchema,
  collectionPublicMetadataItemResponseSchema,
  collectionPublicMetadataManifestResponseSchema,
  collectionPublicPageResponseSchema,
  type CommerceCheckoutProviderMode,
  defaultStudioBrandAccentColor,
  defaultStudioBrandThemePreset,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioFeaturedReleaseLabel,
  type CollectionStorefrontStatus,
  studioBrandThemeSchema
} from "@ai-nft-forge/shared";

import { createCollectionCommerceAvailability } from "../commerce/availability";

type BrandRecord = {
  customDomain: string | null;
  name: string;
  slug: string;
  themeJson: unknown;
};

type PublishedCollectionDetailRecord = {
  brandName: string;
  brandSlug: string;
  contractAddress: string | null;
  contractChainKey: string | null;
  contractDeployedAt: Date | null;
  contractDeployTxHash: string | null;
  description: string | null;
  endAt: Date | null;
  heroGeneratedAssetId: string | null;
  id: string;
  items: Array<{
    id: string;
    generatedAsset: {
      generationRequest: {
        pipelineKey: string;
        sourceAsset: {
          originalFilename: string;
        };
      };
      id: string;
      storageBucket: string;
      storageObjectKey: string;
      variantIndex: number;
    };
    position: number;
    publicStorageBucket: string | null;
    publicStorageObjectKey: string | null;
  }>;
  launchAt: Date | null;
  priceLabel: string | null;
  primaryCtaHref: string | null;
  primaryCtaLabel: string | null;
  publishedAt: Date;
  secondaryCtaHref: string | null;
  secondaryCtaLabel: string | null;
  slug: string;
  soldCount: number;
  storefrontBody: string | null;
  storefrontHeadline: string | null;
  storefrontStatus: CollectionStorefrontStatus;
  totalSupply: number | null;
  title: string;
  updatedAt: Date;
  mints?: Array<{
    publishedCollectionItemId: string;
    tokenId: number;
  }>;
};

type PublishedCollectionPreviewRecord = {
  _count: {
    items: number;
    mints: number;
  };
  contractAddress: string | null;
  contractChainKey: string | null;
  contractDeployedAt: Date | null;
  contractDeployTxHash: string | null;
  displayOrder: number;
  description: string | null;
  endAt: Date | null;
  heroGeneratedAssetId: string | null;
  isFeatured: boolean;
  items: Array<{
    publicStorageBucket: string | null;
    publicStorageObjectKey: string | null;
    generatedAsset: {
      id: string;
      generationRequest: {
        pipelineKey: string;
        sourceAsset: {
          originalFilename: string;
        };
      };
      storageBucket: string;
      storageObjectKey: string;
      variantIndex: number;
    };
  }>;
  launchAt: Date | null;
  priceLabel: string | null;
  publishedAt: Date;
  soldCount: number;
  slug: string;
  storefrontHeadline: string | null;
  storefrontStatus: CollectionStorefrontStatus;
  totalSupply: number | null;
  title: string;
  updatedAt: Date;
};

type PublicCollectionRepositorySet = {
  brandRepository: {
    findFirstBySlug(slug: string): Promise<BrandRecord | null>;
  };
  publishedCollectionReservationRepository: {
    listByPublishedCollectionIdAndStatuses(input: {
      publishedCollectionId: string;
      statuses: Array<"pending" | "completed" | "expired" | "canceled">;
    }): Promise<
      Array<{
        id: string;
        publishedCollectionItemId: string;
        status: "pending" | "completed" | "expired" | "canceled";
      }>
    >;
  };
  publishedCollectionRepository: {
    findDetailedByBrandSlugAndCollectionSlug(input: {
      brandSlug: string;
      slug: string;
    }): Promise<PublishedCollectionDetailRecord | null>;
    listPreviewByBrandSlug(
      brandSlug: string
    ): Promise<PublishedCollectionPreviewRecord[]>;
  };
};

type PublicCollectionStorageBoundary = {
  createDownloadDescriptor(input: { bucket: string; key: string }): Promise<{
    expiresAt: string;
    method: "GET";
    url: string;
  }>;
  createPublicUrl(input: { bucket: string; key: string }): string;
};

type PublicCollectionServiceDependencies = {
  checkoutProviderMode: CommerceCheckoutProviderMode;
  repositories: PublicCollectionRepositorySet;
  reservationTtlSeconds: number;
  storage: PublicCollectionStorageBoundary;
};

function buildCollectionPublicPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `/brands/${input.brandSlug}/collections/${input.collectionSlug}`;
}

function buildCollectionMetadataPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `${buildCollectionPublicPath(input)}/metadata`;
}

function buildCollectionMetadataItemPath(input: {
  brandSlug: string;
  collectionSlug: string;
  editionNumber: number;
}) {
  return `${buildCollectionMetadataPath(input)}/${input.editionNumber.toString()}`;
}

function createCollectionEditionName(input: {
  editionNumber: number;
  title: string;
}) {
  return `${input.title} #${input.editionNumber.toString()}`;
}

function createCollectionEditionDescription(input: {
  collectionTitle: string;
  description: string | null;
  pipelineKey: string;
  sourceAssetOriginalFilename: string;
  variantIndex: number;
}) {
  const baseDescription =
    input.description ??
    `Published collectible release from ${input.collectionTitle}.`;

  return `${baseDescription} Source asset ${input.sourceAssetOriginalFilename}, variant ${input.variantIndex.toString()}, generated via ${input.pipelineKey}.`;
}

async function resolveCollectionImageAccess(input: {
  createDownloadDescriptor: PublicCollectionStorageBoundary["createDownloadDescriptor"];
  createPublicUrl: PublicCollectionStorageBoundary["createPublicUrl"];
  generatedAsset: {
    storageBucket: string;
    storageObjectKey: string;
  };
  publicStorageBucket: string | null;
  publicStorageObjectKey: string | null;
}) {
  if (input.publicStorageBucket && input.publicStorageObjectKey) {
    return {
      expiresAt: null,
      url: input.createPublicUrl({
        bucket: input.publicStorageBucket,
        key: input.publicStorageObjectKey
      })
    };
  }

  const signedImage = await input.createDownloadDescriptor({
    bucket: input.generatedAsset.storageBucket,
    key: input.generatedAsset.storageObjectKey
  });

  return {
    expiresAt: signedImage.expiresAt,
    url: signedImage.url
  };
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

function resolveRemainingSupply(totalSupply: number | null, soldCount: number) {
  if (typeof totalSupply !== "number") {
    return null;
  }

  return Math.max(0, totalSupply - soldCount);
}

function createAvailabilityLabel(input: {
  launchAt: Date | null;
  priceLabel: string | null;
  remainingSupply: number | null;
  soldCount: number;
  storefrontStatus: CollectionStorefrontStatus;
  totalSupply: number | null;
}) {
  switch (input.storefrontStatus) {
    case "upcoming":
      return input.launchAt
        ? `Launches ${input.launchAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short"
          })}`
        : "Upcoming release";
    case "live":
      if (input.remainingSupply !== null && input.totalSupply !== null) {
        return `${input.remainingSupply.toString()} remaining of ${input.totalSupply.toString()}`;
      }

      return input.priceLabel
        ? `Available now · ${input.priceLabel}`
        : "Available now";
    case "sold_out":
      if (input.totalSupply !== null) {
        return `Sold out · ${input.soldCount.toString()} of ${input.totalSupply.toString()} claimed`;
      }

      return "Sold out";
    case "ended":
    default:
      return "Archived release";
  }
}

function serializeOnchainDeployment(input: {
  contractAddress: string | null;
  contractChainKey: string | null;
  contractDeployedAt: Date | null;
  contractDeployTxHash: string | null;
}) {
  if (
    !input.contractAddress ||
    !input.contractChainKey ||
    !input.contractDeployedAt ||
    !input.contractDeployTxHash
  ) {
    return null;
  }

  const chain = aiNftForgeSupportedCollectionContractChains.find(
    (candidate) => candidate.key === input.contractChainKey
  );

  if (!chain) {
    return null;
  }

  return {
    chain,
    contractAddress: input.contractAddress,
    deployedAt: input.contractDeployedAt.toISOString(),
    deployTxHash: input.contractDeployTxHash
  };
}

function resolveHeroPreviewItem(
  publication:
    | PublishedCollectionPreviewRecord
    | PublishedCollectionDetailRecord
) {
  return (
    publication.items.find(
      (item) => item.generatedAsset.id === publication.heroGeneratedAssetId
    ) ??
    publication.items[0] ??
    null
  );
}

async function serializeBrandPreview(input: {
  brandSlug: string;
  createDownloadDescriptor: PublicCollectionStorageBoundary["createDownloadDescriptor"];
  createPublicUrl: PublicCollectionStorageBoundary["createPublicUrl"];
  publication: PublishedCollectionPreviewRecord;
}) {
  const heroItem = resolveHeroPreviewItem(input.publication);
  const remainingSupply = resolveRemainingSupply(
    input.publication.totalSupply,
    input.publication.soldCount
  );

  if (!heroItem) {
    return {
      activeDeployment: serializeOnchainDeployment(input.publication),
      availabilityLabel: createAvailabilityLabel({
        launchAt: input.publication.launchAt,
        priceLabel: input.publication.priceLabel,
        remainingSupply,
        soldCount: input.publication.soldCount,
        storefrontStatus: input.publication.storefrontStatus,
        totalSupply: input.publication.totalSupply
      }),
      collectionSlug: input.publication.slug,
      description: input.publication.description,
      displayOrder: input.publication.displayOrder,
      endAt: input.publication.endAt?.toISOString() ?? null,
      heroGeneratedAssetId: input.publication.heroGeneratedAssetId,
      heroImageUrl: null,
      heroImageUrlExpiresAt: null,
      itemCount: input.publication._count.items,
      isFeatured: input.publication.isFeatured,
      launchAt: input.publication.launchAt?.toISOString() ?? null,
      mintedTokenCount: input.publication._count.mints,
      previewPipelineKey: null,
      previewSourceAssetOriginalFilename: null,
      previewVariantIndex: null,
      priceLabel: input.publication.priceLabel,
      publicPath: buildCollectionPublicPath({
        brandSlug: input.brandSlug,
        collectionSlug: input.publication.slug
      }),
      publishedAt: input.publication.publishedAt.toISOString(),
      remainingSupply,
      soldCount: input.publication.soldCount,
      storefrontHeadline: input.publication.storefrontHeadline,
      storefrontStatus: input.publication.storefrontStatus,
      title: input.publication.title,
      totalSupply: input.publication.totalSupply,
      updatedAt: input.publication.updatedAt.toISOString()
    };
  }

  const heroImage = await resolveCollectionImageAccess({
    createDownloadDescriptor: input.createDownloadDescriptor,
    createPublicUrl: input.createPublicUrl,
    generatedAsset: heroItem.generatedAsset,
    publicStorageBucket: heroItem.publicStorageBucket,
    publicStorageObjectKey: heroItem.publicStorageObjectKey
  });

  return {
    activeDeployment: serializeOnchainDeployment(input.publication),
    availabilityLabel: createAvailabilityLabel({
      launchAt: input.publication.launchAt,
      priceLabel: input.publication.priceLabel,
      remainingSupply,
      soldCount: input.publication.soldCount,
      storefrontStatus: input.publication.storefrontStatus,
      totalSupply: input.publication.totalSupply
    }),
    collectionSlug: input.publication.slug,
    description: input.publication.description,
    displayOrder: input.publication.displayOrder,
    endAt: input.publication.endAt?.toISOString() ?? null,
    heroGeneratedAssetId: input.publication.heroGeneratedAssetId,
    heroImageUrl: heroImage.url,
    heroImageUrlExpiresAt: heroImage.expiresAt,
    itemCount: input.publication._count.items,
    isFeatured: input.publication.isFeatured,
    launchAt: input.publication.launchAt?.toISOString() ?? null,
    mintedTokenCount: input.publication._count.mints,
    previewPipelineKey: heroItem.generatedAsset.generationRequest.pipelineKey,
    previewSourceAssetOriginalFilename:
      heroItem.generatedAsset.generationRequest.sourceAsset.originalFilename,
    previewVariantIndex: heroItem.generatedAsset.variantIndex,
    priceLabel: input.publication.priceLabel,
    publicPath: buildCollectionPublicPath({
      brandSlug: input.brandSlug,
      collectionSlug: input.publication.slug
    }),
    publishedAt: input.publication.publishedAt.toISOString(),
    remainingSupply,
    soldCount: input.publication.soldCount,
    storefrontHeadline: input.publication.storefrontHeadline,
    storefrontStatus: input.publication.storefrontStatus,
    title: input.publication.title,
    totalSupply: input.publication.totalSupply,
    updatedAt: input.publication.updatedAt.toISOString()
  };
}

export function createPublicCollectionService(
  dependencies: PublicCollectionServiceDependencies
) {
  return {
    async getPublicBrandBySlug(input: { brandSlug: string }) {
      const brand =
        await dependencies.repositories.brandRepository.findFirstBySlug(
          input.brandSlug
        );

      if (!brand) {
        return null;
      }

      const theme = parseBrandTheme(brand.themeJson);

      const publications =
        await dependencies.repositories.publishedCollectionRepository.listPreviewByBrandSlug(
          input.brandSlug
        );

      const collections = await Promise.all(
        publications.map((publication) =>
          serializeBrandPreview({
            brandSlug: input.brandSlug,
            createDownloadDescriptor:
              dependencies.storage.createDownloadDescriptor,
            createPublicUrl: dependencies.storage.createPublicUrl,
            publication
          })
        )
      );
      const featuredRelease =
        collections.find((collection) => collection.isFeatured) ?? null;
      const nonFeaturedCollections = collections.filter(
        (collection) => collection.publicPath !== featuredRelease?.publicPath
      );

      const latestPublishedAt = publications.reduce<string | null>(
        (latestValue, publication) => {
          const candidateValue = publication.publishedAt.toISOString();

          if (!latestValue || candidateValue > latestValue) {
            return candidateValue;
          }

          return latestValue;
        },
        null
      );

      return collectionPublicBrandPageResponseSchema.parse({
        brand: {
          brandName: brand.name,
          brandSlug: brand.slug,
          collectionCount: collections.length,
          collections,
          customDomain: brand.customDomain,
          featuredRelease,
          liveReleases: nonFeaturedCollections.filter(
            (collection) => collection.storefrontStatus === "live"
          ),
          theme: {
            accentColor: theme.accentColor,
            featuredReleaseLabel: theme.featuredReleaseLabel,
            heroKicker: theme.heroKicker,
            landingDescription: theme.landingDescription,
            landingHeadline: theme.landingHeadline,
            primaryCtaLabel: theme.primaryCtaLabel,
            secondaryCtaLabel: theme.secondaryCtaLabel,
            storyBody: theme.storyBody,
            storyHeadline: theme.storyHeadline,
            themePreset: theme.themePreset,
            wordmark: theme.wordmark
          },
          upcomingReleases: nonFeaturedCollections.filter(
            (collection) => collection.storefrontStatus === "upcoming"
          ),
          archiveReleases: nonFeaturedCollections.filter((collection) =>
            ["ended", "sold_out"].includes(collection.storefrontStatus)
          ),
          latestPublishedAt,
          publicPath: `/brands/${brand.slug}`
        }
      });
    },

    async getPublicCollectionBySlugs(input: {
      brandSlug: string;
      collectionSlug: string;
    }) {
      const publication =
        await dependencies.repositories.publishedCollectionRepository.findDetailedByBrandSlugAndCollectionSlug(
          {
            brandSlug: input.brandSlug,
            slug: input.collectionSlug
          }
        );

      if (!publication) {
        return null;
      }

      const items = await Promise.all(
        publication.items.map(async (item) => {
          const resolvedImage = await resolveCollectionImageAccess({
            createDownloadDescriptor:
              dependencies.storage.createDownloadDescriptor,
            createPublicUrl: dependencies.storage.createPublicUrl,
            generatedAsset: item.generatedAsset,
            publicStorageBucket: item.publicStorageBucket,
            publicStorageObjectKey: item.publicStorageObjectKey
          });

          return {
            generatedAssetId: item.generatedAsset.id,
            imageUrl: resolvedImage.url,
            imageUrlExpiresAt: resolvedImage.expiresAt,
            pipelineKey: item.generatedAsset.generationRequest.pipelineKey,
            position: item.position,
            sourceAssetOriginalFilename:
              item.generatedAsset.generationRequest.sourceAsset
                .originalFilename,
            variantIndex: item.generatedAsset.variantIndex
          };
        })
      );
      const heroItem = resolveHeroPreviewItem(publication);
      const heroImage = heroItem
        ? await resolveCollectionImageAccess({
            createDownloadDescriptor:
              dependencies.storage.createDownloadDescriptor,
            createPublicUrl: dependencies.storage.createPublicUrl,
            generatedAsset: heroItem.generatedAsset,
            publicStorageBucket: heroItem.publicStorageBucket,
            publicStorageObjectKey: heroItem.publicStorageObjectKey
          })
        : null;
      const relatedCollections = (
        await dependencies.repositories.publishedCollectionRepository.listPreviewByBrandSlug(
          publication.brandSlug
        )
      )
        .filter((candidate) => candidate.slug !== publication.slug)
        .slice(0, 3)
        .map((candidate) => ({
          collectionSlug: candidate.slug,
          displayOrder: candidate.displayOrder,
          isFeatured: candidate.isFeatured,
          publicPath: buildCollectionPublicPath({
            brandSlug: publication.brandSlug,
            collectionSlug: candidate.slug
          }),
          storefrontStatus: candidate.storefrontStatus,
          title: candidate.title
        }));
      const brand =
        await dependencies.repositories.brandRepository.findFirstBySlug(
          publication.brandSlug
        );
      const theme = parseBrandTheme(brand?.themeJson ?? null);
      const reservations =
        await dependencies.repositories.publishedCollectionReservationRepository.listByPublishedCollectionIdAndStatuses(
          {
            publishedCollectionId: publication.id,
            statuses: ["pending", "completed"]
          }
        );
      const remainingSupply = resolveRemainingSupply(
        publication.totalSupply,
        publication.soldCount
      );
      const commerce = createCollectionCommerceAvailability({
        items: publication.items.map((item) => ({
          id: item.id,
          position: item.position
        })),
        mints: publication.mints ?? [],
        providerMode: dependencies.checkoutProviderMode,
        reservations,
        reservationTtlSeconds: dependencies.reservationTtlSeconds,
        storefrontStatus: publication.storefrontStatus
      });

      return collectionPublicPageResponseSchema.parse({
        collection: {
          activeDeployment: serializeOnchainDeployment(publication),
          availabilityLabel: createAvailabilityLabel({
            launchAt: publication.launchAt,
            priceLabel: publication.priceLabel,
            remainingSupply,
            soldCount: publication.soldCount,
            storefrontStatus: publication.storefrontStatus,
            totalSupply: publication.totalSupply
          }),
          brandPublicPath: `/brands/${publication.brandSlug}`,
          brandTheme: {
            accentColor: theme.accentColor,
            featuredReleaseLabel: theme.featuredReleaseLabel,
            heroKicker: theme.heroKicker,
            landingDescription: theme.landingDescription,
            landingHeadline: theme.landingHeadline,
            primaryCtaLabel: theme.primaryCtaLabel,
            secondaryCtaLabel: theme.secondaryCtaLabel,
            storyBody: theme.storyBody,
            storyHeadline: theme.storyHeadline,
            themePreset: theme.themePreset,
            wordmark: theme.wordmark
          },
          brandName: publication.brandName,
          brandSlug: publication.brandSlug,
          collectionSlug: publication.slug,
          commerce: commerce.availability,
          description: publication.description,
          endAt: publication.endAt?.toISOString() ?? null,
          heroGeneratedAssetId: publication.heroGeneratedAssetId,
          heroImageUrl: heroImage?.url ?? null,
          heroImageUrlExpiresAt: heroImage?.expiresAt ?? null,
          items,
          launchAt: publication.launchAt?.toISOString() ?? null,
          mintedTokenCount: publication.mints?.length ?? 0,
          priceLabel: publication.priceLabel,
          primaryCtaHref: publication.primaryCtaHref,
          primaryCtaLabel: publication.primaryCtaLabel,
          publishedAt: publication.publishedAt.toISOString(),
          relatedCollections,
          remainingSupply,
          secondaryCtaHref: publication.secondaryCtaHref,
          secondaryCtaLabel: publication.secondaryCtaLabel,
          soldCount: publication.soldCount,
          storefrontBody: publication.storefrontBody,
          storefrontHeadline: publication.storefrontHeadline,
          storefrontStatus: publication.storefrontStatus,
          totalSupply: publication.totalSupply,
          title: publication.title,
          updatedAt: publication.updatedAt.toISOString()
        }
      });
    },

    async getPublicCollectionMetadataManifestBySlugs(input: {
      brandSlug: string;
      collectionSlug: string;
    }) {
      const publication =
        await dependencies.repositories.publishedCollectionRepository.findDetailedByBrandSlugAndCollectionSlug(
          {
            brandSlug: input.brandSlug,
            slug: input.collectionSlug
          }
        );

      if (!publication) {
        return null;
      }

      const collectionPath = buildCollectionPublicPath({
        brandSlug: publication.brandSlug,
        collectionSlug: publication.slug
      });
      const metadataPath = buildCollectionMetadataPath({
        brandSlug: publication.brandSlug,
        collectionSlug: publication.slug
      });

      return collectionPublicMetadataManifestResponseSchema.parse({
        metadata: {
          brandName: publication.brandName,
          brandSlug: publication.brandSlug,
          collectionPath,
          collectionSlug: publication.slug,
          description: publication.description,
          itemCount: publication.items.length,
          items: publication.items.map((item) => ({
            editionNumber: item.position,
            generatedAssetId: item.generatedAsset.id,
            metadataPath: buildCollectionMetadataItemPath({
              brandSlug: publication.brandSlug,
              collectionSlug: publication.slug,
              editionNumber: item.position
            }),
            name: createCollectionEditionName({
              editionNumber: item.position,
              title: publication.title
            }),
            pipelineKey: item.generatedAsset.generationRequest.pipelineKey,
            sourceAssetOriginalFilename:
              item.generatedAsset.generationRequest.sourceAsset
                .originalFilename,
            variantIndex: item.generatedAsset.variantIndex
          })),
          metadataPath,
          publishedAt: publication.publishedAt.toISOString(),
          title: publication.title,
          updatedAt: publication.updatedAt.toISOString()
        }
      });
    },

    async getPublicCollectionMetadataItemBySlugs(input: {
      brandSlug: string;
      collectionSlug: string;
      editionNumber: number;
    }) {
      const publication =
        await dependencies.repositories.publishedCollectionRepository.findDetailedByBrandSlugAndCollectionSlug(
          {
            brandSlug: input.brandSlug,
            slug: input.collectionSlug
          }
        );

      if (!publication) {
        return null;
      }

      const item =
        publication.items.find(
          (candidate) => candidate.position === input.editionNumber
        ) ?? null;

      if (!item) {
        return null;
      }

      const image = await resolveCollectionImageAccess({
        createDownloadDescriptor: dependencies.storage.createDownloadDescriptor,
        createPublicUrl: dependencies.storage.createPublicUrl,
        generatedAsset: item.generatedAsset,
        publicStorageBucket: item.publicStorageBucket,
        publicStorageObjectKey: item.publicStorageObjectKey
      });
      const collectionPath = buildCollectionPublicPath({
        brandSlug: publication.brandSlug,
        collectionSlug: publication.slug
      });

      return collectionPublicMetadataItemResponseSchema.parse({
        metadata: {
          attributes: [
            {
              traitType: "Brand",
              value: publication.brandName
            },
            {
              traitType: "Collection",
              value: publication.title
            },
            {
              traitType: "Edition",
              value: item.position
            },
            {
              traitType: "Pipeline",
              value: item.generatedAsset.generationRequest.pipelineKey
            },
            {
              traitType: "Source Asset",
              value:
                item.generatedAsset.generationRequest.sourceAsset
                  .originalFilename
            },
            {
              traitType: "Variant",
              value: item.generatedAsset.variantIndex
            }
          ],
          brandName: publication.brandName,
          brandSlug: publication.brandSlug,
          collectionPath,
          collectionSlug: publication.slug,
          description: createCollectionEditionDescription({
            collectionTitle: publication.title,
            description: publication.description,
            pipelineKey: item.generatedAsset.generationRequest.pipelineKey,
            sourceAssetOriginalFilename:
              item.generatedAsset.generationRequest.sourceAsset
                .originalFilename,
            variantIndex: item.generatedAsset.variantIndex
          }),
          editionNumber: item.position,
          externalUrl: collectionPath,
          generatedAssetId: item.generatedAsset.id,
          imageUrl: image.url,
          imageUrlExpiresAt: image.expiresAt,
          metadataPath: buildCollectionMetadataItemPath({
            brandSlug: publication.brandSlug,
            collectionSlug: publication.slug,
            editionNumber: item.position
          }),
          name: createCollectionEditionName({
            editionNumber: item.position,
            title: publication.title
          }),
          pipelineKey: item.generatedAsset.generationRequest.pipelineKey,
          publishedAt: publication.publishedAt.toISOString(),
          sourceAssetOriginalFilename:
            item.generatedAsset.generationRequest.sourceAsset.originalFilename,
          title: publication.title,
          variantIndex: item.generatedAsset.variantIndex
        }
      });
    },

    async getPublicCollectionContractBySlugs(input: {
      brandSlug: string;
      collectionSlug: string;
      origin: string;
    }) {
      const publication =
        await dependencies.repositories.publishedCollectionRepository.findDetailedByBrandSlugAndCollectionSlug(
          {
            brandSlug: input.brandSlug,
            slug: input.collectionSlug
          }
        );

      if (!publication) {
        return null;
      }

      return collectionPublicContractResponseSchema.parse({
        contract: {
          activeDeployment: serializeOnchainDeployment(publication),
          brandName: publication.brandName,
          brandSlug: publication.brandSlug,
          collectionUrl: createCollectionPublicUrl({
            brandSlug: publication.brandSlug,
            collectionSlug: publication.slug,
            origin: input.origin
          }),
          collectionSlug: publication.slug,
          contractUrl: createCollectionContractUrl({
            brandSlug: publication.brandSlug,
            collectionSlug: publication.slug,
            origin: input.origin
          }),
          description: publication.description,
          itemCount: publication.items.length,
          metadataUrl: createCollectionMetadataManifestUrl({
            brandSlug: publication.brandSlug,
            collectionSlug: publication.slug,
            origin: input.origin
          }),
          mintedTokenCount: publication.mints?.length ?? 0,
          mintedTokenIds:
            publication.mints?.map((mint) => mint.tokenId).sort((left, right) => left - right) ??
            [],
          name: createCollectionContractName({
            brandName: publication.brandName,
            collectionTitle: publication.title
          }),
          publishedAt: publication.publishedAt.toISOString(),
          standard: aiNftForgeCollectionContractStandard,
          supportedChains: aiNftForgeSupportedCollectionContractChains,
          symbol: createCollectionContractSymbol({
            brandSlug: publication.brandSlug,
            collectionSlug: publication.slug
          }),
          title: publication.title,
          tokenUriBaseUrl: createCollectionTokenUriBaseUrl({
            brandSlug: publication.brandSlug,
            collectionSlug: publication.slug,
            origin: input.origin
          }),
          tokenUriExampleUrl: createCollectionTokenUriUrl({
            brandSlug: publication.brandSlug,
            collectionSlug: publication.slug,
            origin: input.origin,
            tokenId: 1
          }),
          tokenUriTemplate: createCollectionTokenUriTemplateUrl({
            brandSlug: publication.brandSlug,
            collectionSlug: publication.slug,
            origin: input.origin
          }),
          updatedAt: publication.updatedAt.toISOString()
        }
      });
    }
  };
}
