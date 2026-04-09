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
  defaultStudioBrandAccentColor,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioFeaturedReleaseLabel,
  studioBrandThemeSchema
} from "@ai-nft-forge/shared";

type BrandRecord = {
  customDomain: string | null;
  name: string;
  slug: string;
  themeJson: unknown;
};

type PublishedCollectionDetailRecord = {
  brandName: string;
  brandSlug: string;
  description: string | null;
  items: Array<{
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
  publishedAt: Date;
  slug: string;
  title: string;
  updatedAt: Date;
};

type PublishedCollectionPreviewRecord = {
  _count: {
    items: number;
  };
  displayOrder: number;
  description: string | null;
  isFeatured: boolean;
  items: Array<{
    publicStorageBucket: string | null;
    publicStorageObjectKey: string | null;
    generatedAsset: {
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
  publishedAt: Date;
  slug: string;
  title: string;
  updatedAt: Date;
};

type PublicCollectionRepositorySet = {
  brandRepository: {
    findFirstBySlug(slug: string): Promise<BrandRecord | null>;
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
  repositories: PublicCollectionRepositorySet;
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
      landingDescription:
        parsedTheme.data.landingDescription ??
        defaultStudioBrandLandingDescription,
      landingHeadline:
        parsedTheme.data.landingHeadline ?? defaultStudioBrandLandingHeadline
    };
  }

  return {
    accentColor: defaultStudioBrandAccentColor,
    featuredReleaseLabel: defaultStudioFeaturedReleaseLabel,
    landingDescription: defaultStudioBrandLandingDescription,
    landingHeadline: defaultStudioBrandLandingHeadline
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
        publications.map(async (publication) => {
          const previewItem = publication.items[0] ?? null;

          if (!previewItem) {
            return {
              collectionSlug: publication.slug,
              coverImageUrl: null,
              coverImageUrlExpiresAt: null,
              description: publication.description,
              displayOrder: publication.displayOrder,
              itemCount: publication._count.items,
              isFeatured: publication.isFeatured,
              previewPipelineKey: null,
              previewSourceAssetOriginalFilename: null,
              previewVariantIndex: null,
              publicPath: buildCollectionPublicPath({
                brandSlug: input.brandSlug,
                collectionSlug: publication.slug
              }),
              publishedAt: publication.publishedAt.toISOString(),
              title: publication.title,
              updatedAt: publication.updatedAt.toISOString()
            };
          }

          const previewImage = await resolveCollectionImageAccess({
            createDownloadDescriptor:
              dependencies.storage.createDownloadDescriptor,
            createPublicUrl: dependencies.storage.createPublicUrl,
            generatedAsset: previewItem.generatedAsset,
            publicStorageBucket: previewItem.publicStorageBucket,
            publicStorageObjectKey: previewItem.publicStorageObjectKey
          });

          return {
            collectionSlug: publication.slug,
            coverImageUrl: previewImage.url,
            coverImageUrlExpiresAt: previewImage.expiresAt,
            description: publication.description,
            displayOrder: publication.displayOrder,
            itemCount: publication._count.items,
            isFeatured: publication.isFeatured,
            previewPipelineKey:
              previewItem.generatedAsset.generationRequest.pipelineKey,
            previewSourceAssetOriginalFilename:
              previewItem.generatedAsset.generationRequest.sourceAsset
                .originalFilename,
            previewVariantIndex: previewItem.generatedAsset.variantIndex,
            publicPath: buildCollectionPublicPath({
              brandSlug: input.brandSlug,
              collectionSlug: publication.slug
            }),
            publishedAt: publication.publishedAt.toISOString(),
            title: publication.title,
            updatedAt: publication.updatedAt.toISOString()
          };
        })
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
          accentColor: theme.accentColor,
          brandName: brand.name,
          brandSlug: brand.slug,
          collections,
          customDomain: brand.customDomain,
          featuredReleaseLabel: theme.featuredReleaseLabel,
          landingDescription: theme.landingDescription,
          landingHeadline: theme.landingHeadline,
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

      return collectionPublicPageResponseSchema.parse({
        collection: {
          brandName: publication.brandName,
          brandSlug: publication.brandSlug,
          collectionSlug: publication.slug,
          description: publication.description,
          items,
          publishedAt: publication.publishedAt.toISOString(),
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
