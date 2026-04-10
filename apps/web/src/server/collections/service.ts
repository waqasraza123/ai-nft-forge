import {
  createCollectionContractName,
  createCollectionContractSymbol,
  createCollectionTokenUriBaseUrl,
  getSupportedCollectionContractChainByKey
} from "@ai-nft-forge/contracts";
import { getAiNftForgeCollectionContractArtifact } from "@ai-nft-forge/contracts/server";
import {
  collectionContractDeploymentIntentRequestSchema,
  collectionContractDeploymentIntentResponseSchema,
  collectionContractMintIntentRequestSchema,
  collectionContractMintIntentResponseSchema,
  collectionDraftCreateRequestSchema,
  collectionDraftItemReorderRequestSchema,
  collectionDraftListResponseSchema,
  collectionDraftPublishRequestSchema,
  collectionPublicationMerchandisingRequestSchema,
  collectionDraftResponseSchema,
  collectionDraftUpdateRequestSchema,
  sanitizeStorageFileName,
  type CollectionContractChainKey,
  type CollectionDraftStatus,
  type CollectionStorefrontStatus,
  type GeneratedAssetModerationStatus
} from "@ai-nft-forge/shared";
import { encodeDeployData, encodeFunctionData } from "viem";

import { CollectionDraftServiceError } from "./error";

type GeneratedAssetCandidateRecord = {
  contentType: string;
  createdAt: Date;
  generationRequest: {
    id: string;
    pipelineKey: string;
    sourceAsset: {
      id: string;
      originalFilename: string;
    };
  };
  id: string;
  moderatedAt: Date | null;
  moderationStatus: GeneratedAssetModerationStatus;
  storageBucket: string;
  storageObjectKey: string;
  variantIndex: number;
};

type CollectionDraftItemRecord = {
  generatedAsset: GeneratedAssetCandidateRecord;
  id: string;
  position: number;
};

type CollectionDraftRecord = {
  createdAt: Date;
  description: string | null;
  id: string;
  items: CollectionDraftItemRecord[];
  slug: string;
  status: CollectionDraftStatus;
  title: string;
  updatedAt: Date;
};

type PublishedCollectionRecord = {
  brandName: string;
  brandSlug: string;
  contractAddress: string | null;
  contractChainKey: string | null;
  contractDeployedAt: Date | null;
  contractDeployTxHash: string | null;
  displayOrder: number;
  description: string | null;
  endAt: Date | null;
  heroGeneratedAssetId: string | null;
  id: string;
  isFeatured: boolean;
  launchAt: Date | null;
  priceLabel: string | null;
  primaryCtaHref: string | null;
  primaryCtaLabel: string | null;
  publishedAt: Date;
  secondaryCtaHref: string | null;
  secondaryCtaLabel: string | null;
  slug: string;
  soldCount: number;
  sourceCollectionDraftId: string;
  storefrontBody: string | null;
  storefrontHeadline: string | null;
  storefrontStatus: CollectionStorefrontStatus;
  totalSupply: number | null;
  title: string;
  updatedAt: Date;
  mints?: Array<{
    id: string;
    mintedAt: Date;
    recipientWalletAddress: string;
    tokenId: number;
    txHash: string;
  }>;
};

type PublicationTargetRecord = {
  name: string;
  slug: string;
};

type CollectionDraftRepositorySet = {
  collectionDraftItemRepository: {
    create(input: {
      collectionDraftId: string;
      generatedAssetId: string;
      position: number;
    }): Promise<unknown>;
    deleteByIdForDraftOwner(input: {
      collectionDraftId: string;
      id: string;
      ownerUserId: string;
    }): Promise<{ id: string } | null>;
    findByGeneratedAssetIdForDraft(input: {
      collectionDraftId: string;
      generatedAssetId: string;
    }): Promise<{ id: string } | null>;
    listByCollectionDraftIdForOwner(input: {
      collectionDraftId: string;
      ownerUserId: string;
    }): Promise<Array<{ id: string; position: number }>>;
    updatePosition(input: { id: string; position: number }): Promise<unknown>;
  };
  brandRepository: {
    findFirstByOwnerUserId(
      ownerUserId: string
    ): Promise<PublicationTargetRecord | null>;
  };
  collectionDraftRepository: {
    create(input: {
      description: string | null;
      ownerUserId: string;
      slug: string;
      title: string;
    }): Promise<{ id: string }>;
    findByIdForOwner(input: { id: string; ownerUserId: string }): Promise<{
      description: string | null;
      id: string;
      slug: string;
      status: CollectionDraftStatus;
      title: string;
    } | null>;
    findDetailedByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<CollectionDraftRecord | null>;
    findBySlugForOwner(input: {
      ownerUserId: string;
      slug: string;
    }): Promise<{ id: string } | null>;
    listByOwnerUserId(ownerUserId: string): Promise<CollectionDraftRecord[]>;
    updateByIdForOwner(input: {
      description: string | null;
      id: string;
      ownerUserId: string;
      slug: string;
      status: CollectionDraftStatus;
      title: string;
    }): Promise<{ id: string }>;
  };
  generatedAssetRepository: {
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<{
      id: string;
      moderationStatus: GeneratedAssetModerationStatus;
    } | null>;
    listRecentForOwnerUserId(input: {
      limit: number;
      ownerUserId: string;
    }): Promise<GeneratedAssetCandidateRecord[]>;
  };
  publishedCollectionItemRepository: {
    createMany(
      inputs: Array<{
        generatedAssetId: string;
        position: number;
        publicStorageBucket?: string | null;
        publicStorageObjectKey?: string | null;
        publishedCollectionId: string;
      }>
    ): Promise<unknown[]>;
    listByPublishedCollectionId(publishedCollectionId: string): Promise<
      Array<{
        generatedAssetId: string;
        id: string;
        publicStorageBucket: string | null;
        publicStorageObjectKey: string | null;
      }>
    >;
    findByPositionForPublishedCollection(input: {
      position: number;
      publishedCollectionId: string;
    }): Promise<{ id: string; position: number } | null>;
    deleteByPublishedCollectionId(
      publishedCollectionId: string
    ): Promise<{ count: number }>;
  };
  publishedCollectionRepository: {
    create(input: {
      brandName: string;
      brandSlug: string;
      displayOrder: number;
      description: string | null;
      endAt?: Date | null;
      heroGeneratedAssetId?: string | null;
      isFeatured: boolean;
      launchAt?: Date | null;
      contractAddress?: string | null;
      contractChainKey?: string | null;
      contractDeployedAt?: Date | null;
      contractDeployTxHash?: string | null;
      ownerUserId: string;
      priceLabel?: string | null;
      primaryCtaHref?: string | null;
      primaryCtaLabel?: string | null;
      publishedAt: Date;
      secondaryCtaHref?: string | null;
      secondaryCtaLabel?: string | null;
      slug: string;
      soldCount?: number;
      sourceCollectionDraftId: string;
      storefrontBody?: string | null;
      storefrontHeadline?: string | null;
      storefrontStatus?: CollectionStorefrontStatus;
      totalSupply?: number | null;
      title: string;
    }): Promise<{ id: string }>;
    deleteByDraftIdForOwner(input: {
      ownerUserId: string;
      sourceCollectionDraftId: string;
    }): Promise<PublishedCollectionRecord | null>;
    findByBrandSlugAndCollectionSlug(input: {
      brandSlug: string;
      slug: string;
    }): Promise<PublishedCollectionRecord | null>;
    findByDraftIdForOwner(input: {
      ownerUserId: string;
      sourceCollectionDraftId: string;
    }): Promise<PublishedCollectionRecord | null>;
    listByOwnerUserId(
      ownerUserId: string
    ): Promise<PublishedCollectionRecord[]>;
    updateByIdForOwner(input: {
      brandName: string;
      brandSlug: string;
      displayOrder?: number;
      description: string | null;
      endAt?: Date | null;
      heroGeneratedAssetId?: string | null;
      id: string;
      isFeatured?: boolean;
      launchAt?: Date | null;
      contractAddress?: string | null;
      contractChainKey?: string | null;
      contractDeployedAt?: Date | null;
      contractDeployTxHash?: string | null;
      ownerUserId: string;
      priceLabel?: string | null;
      primaryCtaHref?: string | null;
      primaryCtaLabel?: string | null;
      secondaryCtaHref?: string | null;
      secondaryCtaLabel?: string | null;
      slug: string;
      soldCount?: number;
      storefrontBody?: string | null;
      storefrontHeadline?: string | null;
      storefrontStatus?: CollectionStorefrontStatus;
      totalSupply?: number | null;
      title: string;
    }): Promise<{ id: string }>;
  };
  publishedCollectionMintRepository: {
    create(input: {
      mintedAt: Date;
      ownerUserId: string;
      publishedCollectionId: string;
      publishedCollectionItemId: string;
      recipientWalletAddress: string;
      tokenId: number;
      txHash: string;
    }): Promise<unknown>;
    findByTokenIdForPublishedCollection(input: {
      publishedCollectionId: string;
      tokenId: number;
    }): Promise<{ id: string } | null>;
  };
};

type PublicPublicationAssetRecord = {
  bucket: string;
  key: string;
};

type CollectionDraftServiceDependencies = {
  now: () => Date;
  repositories: CollectionDraftRepositorySet;
  runTransaction<T>(
    operation: (repositories: CollectionDraftRepositorySet) => Promise<T>
  ): Promise<T>;
  storage: {
    copyPublishedAsset(input: {
      contentType: string;
      destinationKey: string;
      sourceBucket: string;
      sourceKey: string;
    }): Promise<PublicPublicationAssetRecord>;
    deletePublishedAsset(input: PublicPublicationAssetRecord): Promise<void>;
  };
};

const generatedAssetCandidateLimit = 48;

function sanitizeCollectionDraftSlugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeOptionalDescription(value: string | null | undefined) {
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

function resolveRemainingSupply(totalSupply: number | null, soldCount: number) {
  if (typeof totalSupply !== "number") {
    return null;
  }

  return Math.max(0, totalSupply - soldCount);
}

function countMintedTokens(publication: PublishedCollectionRecord) {
  return publication.mints?.length ?? 0;
}

function serializeOnchainDeployment(publication: PublishedCollectionRecord) {
  if (
    !publication.contractAddress ||
    !publication.contractChainKey ||
    !publication.contractDeployTxHash ||
    !publication.contractDeployedAt
  ) {
    return null;
  }

  const chain = getSupportedCollectionContractChainByKey(
    publication.contractChainKey as CollectionContractChainKey
  );

  if (!chain) {
    return null;
  }

  return {
    chain,
    contractAddress: publication.contractAddress,
    deployedAt: publication.contractDeployedAt.toISOString(),
    deployTxHash: publication.contractDeployTxHash
  };
}

function serializePublication(publication: PublishedCollectionRecord) {
  const remainingSupply = resolveRemainingSupply(
    publication.totalSupply,
    publication.soldCount
  );

  return {
    activeDeployment: serializeOnchainDeployment(publication),
    brandName: publication.brandName,
    brandSlug: publication.brandSlug,
    collectionSlug: publication.slug,
    displayOrder: publication.displayOrder,
    endAt: publication.endAt?.toISOString() ?? null,
    heroGeneratedAssetId: publication.heroGeneratedAssetId,
    id: publication.id,
    isFeatured: publication.isFeatured,
    launchAt: publication.launchAt?.toISOString() ?? null,
    mintedTokenCount: countMintedTokens(publication),
    mints:
      publication.mints?.map((mint) => ({
        id: mint.id,
        mintedAt: mint.mintedAt.toISOString(),
        recipientWalletAddress: mint.recipientWalletAddress,
        tokenId: mint.tokenId,
        txHash: mint.txHash
      })) ?? [],
    priceLabel: publication.priceLabel,
    primaryCtaHref: publication.primaryCtaHref,
    primaryCtaLabel: publication.primaryCtaLabel,
    publicPath: `/brands/${publication.brandSlug}/collections/${publication.slug}`,
    publishedAt: publication.publishedAt.toISOString(),
    remainingSupply,
    secondaryCtaHref: publication.secondaryCtaHref,
    secondaryCtaLabel: publication.secondaryCtaLabel,
    soldCount: publication.soldCount,
    storefrontBody: publication.storefrontBody,
    storefrontHeadline: publication.storefrontHeadline,
    storefrontStatus: publication.storefrontStatus,
    totalSupply: publication.totalSupply,
    updatedAt: publication.updatedAt.toISOString()
  };
}

function serializePublicationTarget(target: PublicationTargetRecord) {
  return {
    brandName: target.name,
    brandSlug: target.slug,
    publicBrandPath: `/brands/${target.slug}`
  };
}

async function createAvailableCollectionDraftSlug(input: {
  ownerUserId: string;
  repositories: Pick<CollectionDraftRepositorySet, "collectionDraftRepository">;
  title: string;
}) {
  const baseSlug =
    sanitizeCollectionDraftSlugPart(input.title) || "collection-draft";

  for (let suffix = 0; suffix < 200; suffix += 1) {
    const candidateSlug =
      suffix === 0 ? baseSlug : `${baseSlug}-${(suffix + 1).toString()}`;
    const existingDraft =
      await input.repositories.collectionDraftRepository.findBySlugForOwner({
        ownerUserId: input.ownerUserId,
        slug: candidateSlug
      });

    if (!existingDraft) {
      return candidateSlug;
    }
  }

  throw new CollectionDraftServiceError(
    "DRAFT_SLUG_CONFLICT",
    "A unique collection draft slug could not be created.",
    409
  );
}

function serializeGeneratedAssetCandidate(
  asset: GeneratedAssetCandidateRecord
) {
  return {
    createdAt: asset.createdAt.toISOString(),
    generatedAssetId: asset.id,
    generationRequestId: asset.generationRequest.id,
    moderatedAt: asset.moderatedAt?.toISOString() ?? null,
    moderationStatus: asset.moderationStatus,
    pipelineKey: asset.generationRequest.pipelineKey,
    sourceAssetId: asset.generationRequest.sourceAsset.id,
    sourceAssetOriginalFilename:
      asset.generationRequest.sourceAsset.originalFilename,
    variantIndex: asset.variantIndex
  };
}

function buildPublishedCollectionPublicObjectKey(input: {
  generatedAssetId: string;
  originalFilename: string;
  position: number;
  sourceCollectionDraftId: string;
}) {
  return `published-collections/${input.sourceCollectionDraftId}/items/${input.position.toString().padStart(3, "0")}-${input.generatedAssetId}-${sanitizeStorageFileName(
    input.originalFilename
  )}`;
}

function toPublicPublicationAssetRecord(input: {
  publicStorageBucket: string | null;
  publicStorageObjectKey: string | null;
}): PublicPublicationAssetRecord | null {
  if (!input.publicStorageBucket || !input.publicStorageObjectKey) {
    return null;
  }

  return {
    bucket: input.publicStorageBucket,
    key: input.publicStorageObjectKey
  };
}

function isPublicPublicationAssetRecord(
  asset: PublicPublicationAssetRecord | null
): asset is PublicPublicationAssetRecord {
  return asset !== null;
}

async function deletePublishedAssetsBestEffort(
  deletePublishedAsset: CollectionDraftServiceDependencies["storage"]["deletePublishedAsset"],
  assets: PublicPublicationAssetRecord[]
) {
  const uniqueAssets = [
    ...new Map(assets.map((asset) => [asset.key, asset])).values()
  ];

  await Promise.all(
    uniqueAssets.map(async (asset) => {
      try {
        await deletePublishedAsset(asset);
      } catch {
        return null;
      }
    })
  );
}

async function promoteDraftAssetsToPublicStorage(input: {
  copyPublishedAsset: CollectionDraftServiceDependencies["storage"]["copyPublishedAsset"];
  deletePublishedAsset: CollectionDraftServiceDependencies["storage"]["deletePublishedAsset"];
  draft: CollectionDraftRecord;
}) {
  const copiedAssets: PublicPublicationAssetRecord[] = [];

  try {
    const promotedAssets = await Promise.all(
      input.draft.items.map(async (item) => {
        const publicAsset = await input.copyPublishedAsset({
          contentType: item.generatedAsset.contentType,
          destinationKey: buildPublishedCollectionPublicObjectKey({
            generatedAssetId: item.generatedAsset.id,
            originalFilename:
              item.generatedAsset.generationRequest.sourceAsset
                .originalFilename,
            position: item.position,
            sourceCollectionDraftId: input.draft.id
          }),
          sourceBucket: item.generatedAsset.storageBucket,
          sourceKey: item.generatedAsset.storageObjectKey
        });

        copiedAssets.push(publicAsset);

        return {
          generatedAssetId: item.generatedAsset.id,
          position: item.position,
          publicStorageBucket: publicAsset.bucket,
          publicStorageObjectKey: publicAsset.key
        };
      })
    );

    return {
      copiedAssets,
      promotedAssets
    };
  } catch (error) {
    await deletePublishedAssetsBestEffort(
      input.deletePublishedAsset,
      copiedAssets
    );
    throw error;
  }
}

function serializeCollectionDraft(input: {
  draft: CollectionDraftRecord;
  publication: PublishedCollectionRecord | null;
}) {
  return {
    createdAt: input.draft.createdAt.toISOString(),
    description: input.draft.description,
    id: input.draft.id,
    itemCount: input.draft.items.length,
    items: input.draft.items.map((item) => ({
      generatedAsset: serializeGeneratedAssetCandidate(item.generatedAsset),
      id: item.id,
      position: item.position
    })),
    publication: input.publication
      ? serializePublication(input.publication)
      : null,
    slug: input.draft.slug,
    status: input.draft.status,
    title: input.draft.title,
    updatedAt: input.draft.updatedAt.toISOString()
  };
}

async function loadSerializedCollectionDraftList(
  repositories: CollectionDraftRepositorySet,
  ownerUserId: string
) {
  const [drafts, generatedAssetCandidates, publications, publicationTarget] =
    await Promise.all([
      repositories.collectionDraftRepository.listByOwnerUserId(ownerUserId),
      repositories.generatedAssetRepository.listRecentForOwnerUserId({
        limit: generatedAssetCandidateLimit,
        ownerUserId
      }),
      repositories.publishedCollectionRepository.listByOwnerUserId(ownerUserId),
      repositories.brandRepository.findFirstByOwnerUserId(ownerUserId)
    ]);
  const publicationByDraftId = new Map(
    publications.map((publication) => [
      publication.sourceCollectionDraftId,
      publication
    ])
  );

  return collectionDraftListResponseSchema.parse({
    drafts: drafts.map((draft) =>
      serializeCollectionDraft({
        draft,
        publication: publicationByDraftId.get(draft.id) ?? null
      })
    ),
    generatedAssetCandidates: generatedAssetCandidates.map((asset) =>
      serializeGeneratedAssetCandidate(asset)
    ),
    publicationTarget: publicationTarget
      ? serializePublicationTarget(publicationTarget)
      : null
  });
}

async function loadCollectionDraftRecordById(input: {
  collectionDraftId: string;
  ownerUserId: string;
  repositories: Pick<CollectionDraftRepositorySet, "collectionDraftRepository">;
}) {
  const draft =
    await input.repositories.collectionDraftRepository.findDetailedByIdForOwner(
      {
        id: input.collectionDraftId,
        ownerUserId: input.ownerUserId
      }
    );

  if (!draft) {
    throw new CollectionDraftServiceError(
      "DRAFT_NOT_FOUND",
      "Collection draft was not found.",
      404
    );
  }

  return draft;
}

async function loadSerializedCollectionDraftById(input: {
  collectionDraftId: string;
  ownerUserId: string;
  repositories: Pick<
    CollectionDraftRepositorySet,
    "collectionDraftRepository" | "publishedCollectionRepository"
  >;
}) {
  const [draft, publication] = await Promise.all([
    loadCollectionDraftRecordById({
      collectionDraftId: input.collectionDraftId,
      ownerUserId: input.ownerUserId,
      repositories: input.repositories
    }),
    input.repositories.publishedCollectionRepository.findByDraftIdForOwner({
      ownerUserId: input.ownerUserId,
      sourceCollectionDraftId: input.collectionDraftId
    })
  ]);

  return collectionDraftResponseSchema.parse({
    draft: serializeCollectionDraft({
      draft,
      publication
    })
  });
}

function assertDraftReadyForPublication(draft: CollectionDraftRecord) {
  if (draft.status !== "review_ready" || draft.items.length === 0) {
    throw new CollectionDraftServiceError(
      "DRAFT_NOT_READY",
      "Collection draft must be review-ready with at least one curated generated asset before publication.",
      409
    );
  }

  if (
    draft.items.some(
      (item) => item.generatedAsset.moderationStatus !== "approved"
    )
  ) {
    throw new CollectionDraftServiceError(
      "GENERATED_ASSET_NOT_APPROVED",
      "Only approved generated assets can be published in a collection.",
      409
    );
  }
}

function sortPublicationsForMerchandising(
  publications: PublishedCollectionRecord[]
) {
  return [...publications].sort((left, right) => {
    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }

    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    const updatedAtDifference =
      right.updatedAt.getTime() - left.updatedAt.getTime();

    if (updatedAtDifference !== 0) {
      return updatedAtDifference;
    }

    return right.id.localeCompare(left.id);
  });
}

function publicationHasOnchainActivity(publication: PublishedCollectionRecord) {
  return Boolean(publication.contractAddress) || countMintedTokens(publication) > 0;
}

function assertPublicationMutable(publication: PublishedCollectionRecord) {
  if (!publicationHasOnchainActivity(publication)) {
    return;
  }

  throw new CollectionDraftServiceError(
    "ONCHAIN_COLLECTION_IMMUTABLE",
    "Published collections with recorded deployment or mint activity can no longer be republished or unpublished.",
    409
  );
}

export function createCollectionDraftService(
  dependencies: CollectionDraftServiceDependencies
) {
  return {
    async addCollectionDraftItem(input: {
      collectionDraftId: string;
      generatedAssetId: string;
      ownerUserId: string;
    }) {
      return dependencies.runTransaction(async (repositories) => {
        const draft =
          await repositories.collectionDraftRepository.findByIdForOwner({
            id: input.collectionDraftId,
            ownerUserId: input.ownerUserId
          });

        if (!draft) {
          throw new CollectionDraftServiceError(
            "DRAFT_NOT_FOUND",
            "Collection draft was not found.",
            404
          );
        }

        const generatedAsset =
          await repositories.generatedAssetRepository.findByIdForOwner({
            id: input.generatedAssetId,
            ownerUserId: input.ownerUserId
          });

        if (!generatedAsset) {
          throw new CollectionDraftServiceError(
            "GENERATED_ASSET_NOT_FOUND",
            "Generated asset was not found.",
            404
          );
        }

        if (generatedAsset.moderationStatus !== "approved") {
          throw new CollectionDraftServiceError(
            "GENERATED_ASSET_NOT_APPROVED",
            "Only approved generated assets can be added to a collection draft.",
            409
          );
        }

        const existingDraftItem =
          await repositories.collectionDraftItemRepository.findByGeneratedAssetIdForDraft(
            {
              collectionDraftId: input.collectionDraftId,
              generatedAssetId: input.generatedAssetId
            }
          );

        if (existingDraftItem) {
          throw new CollectionDraftServiceError(
            "GENERATED_ASSET_ALREADY_INCLUDED",
            "Generated asset is already included in this collection draft.",
            409
          );
        }

        const existingItems =
          await repositories.collectionDraftItemRepository.listByCollectionDraftIdForOwner(
            {
              collectionDraftId: input.collectionDraftId,
              ownerUserId: input.ownerUserId
            }
          );

        await repositories.collectionDraftItemRepository.create({
          collectionDraftId: input.collectionDraftId,
          generatedAssetId: input.generatedAssetId,
          position: existingItems.length + 1
        });

        return loadSerializedCollectionDraftById({
          collectionDraftId: input.collectionDraftId,
          ownerUserId: input.ownerUserId,
          repositories
        });
      });
    },

    async createCollectionDraft(input: {
      description?: string | null;
      ownerUserId: string;
      title: string;
    }) {
      const parsedInput = collectionDraftCreateRequestSchema.parse(input);
      const slug = await createAvailableCollectionDraftSlug({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        title: parsedInput.title
      });
      const createdDraft =
        await dependencies.repositories.collectionDraftRepository.create({
          description: normalizeOptionalDescription(parsedInput.description),
          ownerUserId: input.ownerUserId,
          slug,
          title: parsedInput.title
        });

      return loadSerializedCollectionDraftById({
        collectionDraftId: createdDraft.id,
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories
      });
    },

    async listCollectionDrafts(input: { ownerUserId: string }) {
      return loadSerializedCollectionDraftList(
        dependencies.repositories,
        input.ownerUserId
      );
    },

    async publishCollectionDraft(input: {
      collectionDraftId: string;
      ownerUserId: string;
    }) {
      collectionDraftPublishRequestSchema.parse({});
      const draft = await loadCollectionDraftRecordById({
        collectionDraftId: input.collectionDraftId,
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories
      });
      const publicationTarget =
        await dependencies.repositories.brandRepository.findFirstByOwnerUserId(
          input.ownerUserId
        );

      if (!publicationTarget) {
        throw new CollectionDraftServiceError(
          "STUDIO_SETTINGS_REQUIRED",
          "Studio settings must define a brand profile before collection publication.",
          409
        );
      }

      assertDraftReadyForPublication(draft);

      const routeConflict =
        await dependencies.repositories.publishedCollectionRepository.findByBrandSlugAndCollectionSlug(
          {
            brandSlug: publicationTarget.slug,
            slug: draft.slug
          }
        );
      const existingPublication =
        await dependencies.repositories.publishedCollectionRepository.findByDraftIdForOwner(
          {
            ownerUserId: input.ownerUserId,
            sourceCollectionDraftId: input.collectionDraftId
          }
        );
      const ownerPublications =
        await dependencies.repositories.publishedCollectionRepository.listByOwnerUserId(
          input.ownerUserId
        );
      const existingPublicAssets = existingPublication
        ? (
            await dependencies.repositories.publishedCollectionItemRepository.listByPublishedCollectionId(
              existingPublication.id
            )
          )
            .map(toPublicPublicationAssetRecord)
            .filter(isPublicPublicationAssetRecord)
        : [];

      if (
        routeConflict &&
        routeConflict.sourceCollectionDraftId !== input.collectionDraftId
      ) {
        throw new CollectionDraftServiceError(
          "COLLECTION_PUBLICATION_CONFLICT",
          "Another published collection already uses this public route.",
          409
        );
      }

      if (existingPublication) {
        assertPublicationMutable(existingPublication);
      }

      const { copiedAssets, promotedAssets } =
        await promoteDraftAssetsToPublicStorage({
          copyPublishedAsset: dependencies.storage.copyPublishedAsset,
          deletePublishedAsset: dependencies.storage.deletePublishedAsset,
          draft
        });

      try {
        const result = await dependencies.runTransaction(
          async (repositories) => {
            const nextHeroGeneratedAssetId =
              existingPublication?.heroGeneratedAssetId &&
              draft.items.some(
                (item) =>
                  item.generatedAsset.id ===
                  existingPublication.heroGeneratedAssetId
              )
                ? existingPublication.heroGeneratedAssetId
                : null;
            const publication =
              existingPublication ??
              (await repositories.publishedCollectionRepository.create({
                brandName: publicationTarget.name,
                brandSlug: publicationTarget.slug,
                displayOrder:
                  (sortPublicationsForMerchandising(
                    ownerPublications.filter(
                      (publication) =>
                        publication.brandSlug === publicationTarget.slug
                    )
                  ).at(-1)?.displayOrder ?? -1) + 1,
                description: draft.description,
                endAt: null,
                heroGeneratedAssetId: null,
                isFeatured:
                  ownerPublications.filter(
                    (publication) =>
                      publication.brandSlug === publicationTarget.slug
                  ).length === 0,
                launchAt: null,
                ownerUserId: input.ownerUserId,
                priceLabel: null,
                primaryCtaHref: null,
                primaryCtaLabel: null,
                publishedAt: dependencies.now(),
                secondaryCtaHref: null,
                secondaryCtaLabel: null,
                slug: draft.slug,
                soldCount: 0,
                sourceCollectionDraftId: draft.id,
                storefrontBody: null,
                storefrontHeadline: null,
                storefrontStatus: "ended",
                totalSupply: null,
                title: draft.title
              }));

            if (existingPublication) {
              await repositories.publishedCollectionRepository.updateByIdForOwner(
                {
                  brandName: publicationTarget.name,
                  brandSlug: publicationTarget.slug,
                  description: draft.description,
                  heroGeneratedAssetId: nextHeroGeneratedAssetId,
                  id: existingPublication.id,
                  ownerUserId: input.ownerUserId,
                  slug: draft.slug,
                  title: draft.title
                }
              );
              await repositories.publishedCollectionItemRepository.deleteByPublishedCollectionId(
                existingPublication.id
              );
            }

            await repositories.publishedCollectionItemRepository.createMany(
              promotedAssets.map((asset) => ({
                generatedAssetId: asset.generatedAssetId,
                position: asset.position,
                publicStorageBucket: asset.publicStorageBucket,
                publicStorageObjectKey: asset.publicStorageObjectKey,
                publishedCollectionId: publication.id
              }))
            );

            return loadSerializedCollectionDraftById({
              collectionDraftId: input.collectionDraftId,
              ownerUserId: input.ownerUserId,
              repositories
            });
          }
        );

        const copiedAssetKeySet = new Set(
          copiedAssets.map((asset) => asset.key)
        );
        await deletePublishedAssetsBestEffort(
          dependencies.storage.deletePublishedAsset,
          existingPublicAssets.filter(
            (asset) => !copiedAssetKeySet.has(asset.key)
          )
        );

        return result;
      } catch (error) {
        await deletePublishedAssetsBestEffort(
          dependencies.storage.deletePublishedAsset,
          copiedAssets
        );
        throw error;
      }
    },

    async updateCollectionPublicationMerchandising(input: {
      collectionDraftId: string;
      displayOrder: number;
      endAt: string | null;
      heroGeneratedAssetId: string | null;
      isFeatured: boolean;
      launchAt: string | null;
      ownerUserId: string;
      priceLabel: string | null;
      primaryCtaHref: string | null;
      primaryCtaLabel: string | null;
      secondaryCtaHref: string | null;
      secondaryCtaLabel: string | null;
      soldCount: number;
      storefrontBody: string | null;
      storefrontHeadline: string | null;
      storefrontStatus: CollectionStorefrontStatus;
      totalSupply: number | null;
    }) {
      const parsedInput = collectionPublicationMerchandisingRequestSchema.parse(
        {
          displayOrder: input.displayOrder,
          endAt: input.endAt,
          heroGeneratedAssetId: input.heroGeneratedAssetId,
          isFeatured: input.isFeatured,
          launchAt: input.launchAt,
          priceLabel: input.priceLabel,
          primaryCtaHref: input.primaryCtaHref,
          primaryCtaLabel: input.primaryCtaLabel,
          secondaryCtaHref: input.secondaryCtaHref,
          secondaryCtaLabel: input.secondaryCtaLabel,
          soldCount: input.soldCount,
          storefrontBody: input.storefrontBody,
          storefrontHeadline: input.storefrontHeadline,
          storefrontStatus: input.storefrontStatus,
          totalSupply: input.totalSupply
        }
      );

      return dependencies.runTransaction(async (repositories) => {
        const draft =
          await repositories.collectionDraftRepository.findByIdForOwner({
            id: input.collectionDraftId,
            ownerUserId: input.ownerUserId
          });

        if (!draft) {
          throw new CollectionDraftServiceError(
            "DRAFT_NOT_FOUND",
            "Collection draft was not found.",
            404
          );
        }

        const publication =
          await repositories.publishedCollectionRepository.findByDraftIdForOwner(
            {
              ownerUserId: input.ownerUserId,
              sourceCollectionDraftId: input.collectionDraftId
            }
          );

        if (!publication) {
          throw new CollectionDraftServiceError(
            "COLLECTION_PUBLICATION_NOT_FOUND",
            "Published collection was not found for this draft.",
            404
          );
        }

        assertPublicationMutable(publication);

        const publicationItems =
          await repositories.publishedCollectionItemRepository.listByPublishedCollectionId(
            publication.id
          );

        if (
          parsedInput.heroGeneratedAssetId &&
          !publicationItems.some(
            (item) => item.generatedAssetId === parsedInput.heroGeneratedAssetId
          )
        ) {
          throw new CollectionDraftServiceError(
            "INVALID_REQUEST",
            "Selected storefront hero asset is not part of the published collection snapshot.",
            400
          );
        }

        if (parsedInput.isFeatured) {
          const ownerPublications =
            await repositories.publishedCollectionRepository.listByOwnerUserId(
              input.ownerUserId
            );
          const siblingFeaturedPublications = ownerPublications.filter(
            (candidate) =>
              candidate.id !== publication.id &&
              candidate.brandSlug === publication.brandSlug &&
              candidate.isFeatured
          );

          await Promise.all(
            siblingFeaturedPublications.map((candidate) =>
              repositories.publishedCollectionRepository.updateByIdForOwner({
                brandName: candidate.brandName,
                brandSlug: candidate.brandSlug,
                description: candidate.description,
                displayOrder: candidate.displayOrder,
                id: candidate.id,
                isFeatured: false,
                ownerUserId: input.ownerUserId,
                slug: candidate.slug,
                title: candidate.title
              })
            )
          );
        }

        await repositories.publishedCollectionRepository.updateByIdForOwner({
          brandName: publication.brandName,
          brandSlug: publication.brandSlug,
          description: draft.description,
          displayOrder: parsedInput.displayOrder,
          endAt: parsedInput.endAt ? new Date(parsedInput.endAt) : null,
          heroGeneratedAssetId: parsedInput.heroGeneratedAssetId ?? null,
          id: publication.id,
          isFeatured: parsedInput.isFeatured,
          launchAt: parsedInput.launchAt
            ? new Date(parsedInput.launchAt)
            : null,
          ownerUserId: input.ownerUserId,
          priceLabel: normalizeOptionalText(parsedInput.priceLabel),
          primaryCtaHref: normalizeOptionalText(parsedInput.primaryCtaHref),
          primaryCtaLabel: normalizeOptionalText(parsedInput.primaryCtaLabel),
          secondaryCtaHref: normalizeOptionalText(parsedInput.secondaryCtaHref),
          secondaryCtaLabel: normalizeOptionalText(
            parsedInput.secondaryCtaLabel
          ),
          soldCount: parsedInput.soldCount,
          slug: publication.slug,
          storefrontBody: normalizeOptionalText(parsedInput.storefrontBody),
          storefrontHeadline: normalizeOptionalText(
            parsedInput.storefrontHeadline
          ),
          storefrontStatus: parsedInput.storefrontStatus,
          totalSupply: parsedInput.totalSupply ?? null,
          title: draft.title
        });

        return loadSerializedCollectionDraftById({
          collectionDraftId: input.collectionDraftId,
          ownerUserId: input.ownerUserId,
          repositories
        });
      });
    },

    async createCollectionContractDeploymentIntent(input: {
      chainKey: CollectionContractChainKey;
      collectionDraftId: string;
      origin: string;
      ownerUserId: string;
      ownerWalletAddress: string;
    }) {
      const parsedInput = collectionContractDeploymentIntentRequestSchema.parse({
        chainKey: input.chainKey
      });
      const publication =
        await dependencies.repositories.publishedCollectionRepository.findByDraftIdForOwner(
          {
            ownerUserId: input.ownerUserId,
            sourceCollectionDraftId: input.collectionDraftId
          }
        );

      if (!publication) {
        throw new CollectionDraftServiceError(
          "COLLECTION_PUBLICATION_NOT_FOUND",
          "Published collection was not found for this draft.",
          404
        );
      }

      if (publication.contractAddress) {
        throw new CollectionDraftServiceError(
          "ONCHAIN_COLLECTION_ALREADY_DEPLOYED",
          "A contract deployment has already been recorded for this published collection.",
          409
        );
      }

      const chain = getSupportedCollectionContractChainByKey(
        parsedInput.chainKey
      );

      if (!chain) {
        throw new CollectionDraftServiceError(
          "INVALID_REQUEST",
          "Selected chain is not supported.",
          400
        );
      }

      const contractName = createCollectionContractName({
        brandName: publication.brandName,
        collectionTitle: publication.title
      });
      const contractSymbol = createCollectionContractSymbol({
        brandSlug: publication.brandSlug,
        collectionSlug: publication.slug
      });
      const tokenUriBaseUrl = createCollectionTokenUriBaseUrl({
        brandSlug: publication.brandSlug,
        collectionSlug: publication.slug,
        origin: input.origin
      });
      const artifact = getAiNftForgeCollectionContractArtifact();
      const deploymentData = (encodeDeployData as unknown as (input: {
        abi: unknown[];
        args: unknown[];
        bytecode: `0x${string}`;
      }) => `0x${string}`)({
        abi: artifact.abi,
        args: [
          contractName,
          contractSymbol,
          input.ownerWalletAddress,
          tokenUriBaseUrl
        ],
        bytecode: artifact.bytecode
      });

      return collectionContractDeploymentIntentResponseSchema.parse({
        deployment: {
          chain,
          contractName,
          contractSymbol,
          ownerWalletAddress: input.ownerWalletAddress,
          tokenUriBaseUrl,
          transaction: {
            data: deploymentData,
            to: null,
            value: "0x0"
          }
        }
      });
    },

    async recordCollectionContractDeployment(input: {
      chainKey: CollectionContractChainKey;
      collectionDraftId: string;
      contractAddress: string;
      deployedAt?: string;
      deployTxHash: string;
      ownerUserId: string;
    }) {
      const chain = getSupportedCollectionContractChainByKey(input.chainKey);

      if (!chain) {
        throw new CollectionDraftServiceError(
          "INVALID_REQUEST",
          "Selected chain is not supported.",
          400
        );
      }

      const publication =
        await dependencies.repositories.publishedCollectionRepository.findByDraftIdForOwner(
          {
            ownerUserId: input.ownerUserId,
            sourceCollectionDraftId: input.collectionDraftId
          }
        );

      if (!publication) {
        throw new CollectionDraftServiceError(
          "COLLECTION_PUBLICATION_NOT_FOUND",
          "Published collection was not found for this draft.",
          404
        );
      }

      if (publication.contractAddress) {
        throw new CollectionDraftServiceError(
          "ONCHAIN_COLLECTION_ALREADY_DEPLOYED",
          "A contract deployment has already been recorded for this published collection.",
          409
        );
      }

      await dependencies.repositories.publishedCollectionRepository.updateByIdForOwner(
        {
          brandName: publication.brandName,
          brandSlug: publication.brandSlug,
          contractAddress: input.contractAddress,
          contractChainKey: chain.key,
          contractDeployedAt: input.deployedAt
            ? new Date(input.deployedAt)
            : dependencies.now(),
          contractDeployTxHash: input.deployTxHash,
          description: publication.description,
          displayOrder: publication.displayOrder,
          endAt: publication.endAt,
          heroGeneratedAssetId: publication.heroGeneratedAssetId,
          id: publication.id,
          isFeatured: publication.isFeatured,
          launchAt: publication.launchAt,
          ownerUserId: input.ownerUserId,
          priceLabel: publication.priceLabel,
          primaryCtaHref: publication.primaryCtaHref,
          primaryCtaLabel: publication.primaryCtaLabel,
          secondaryCtaHref: publication.secondaryCtaHref,
          secondaryCtaLabel: publication.secondaryCtaLabel,
          slug: publication.slug,
          soldCount: publication.soldCount,
          storefrontBody: publication.storefrontBody,
          storefrontHeadline: publication.storefrontHeadline,
          storefrontStatus: publication.storefrontStatus,
          title: publication.title,
          totalSupply: publication.totalSupply
        }
      );

      return loadSerializedCollectionDraftById({
        collectionDraftId: input.collectionDraftId,
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories
      });
    },

    async createCollectionContractMintIntent(input: {
      collectionDraftId: string;
      ownerUserId: string;
      recipientWalletAddress: string;
      tokenId: number;
    }) {
      const parsedInput = collectionContractMintIntentRequestSchema.parse({
        recipientWalletAddress: input.recipientWalletAddress,
        tokenId: input.tokenId
      });
      const publication =
        await dependencies.repositories.publishedCollectionRepository.findByDraftIdForOwner(
          {
            ownerUserId: input.ownerUserId,
            sourceCollectionDraftId: input.collectionDraftId
          }
        );

      if (!publication) {
        throw new CollectionDraftServiceError(
          "COLLECTION_PUBLICATION_NOT_FOUND",
          "Published collection was not found for this draft.",
          404
        );
      }

      const deployment = serializeOnchainDeployment(publication);

      if (!deployment) {
        throw new CollectionDraftServiceError(
          "ONCHAIN_DEPLOYMENT_REQUIRED",
          "Record an onchain contract deployment before minting tokens.",
          409
        );
      }

      const publicationItem =
        await dependencies.repositories.publishedCollectionItemRepository.findByPositionForPublishedCollection(
          {
            position: parsedInput.tokenId,
            publishedCollectionId: publication.id
          }
        );

      if (!publicationItem) {
        throw new CollectionDraftServiceError(
          "ONCHAIN_TOKEN_NOT_FOUND",
          "The requested token ID does not exist in the published collection snapshot.",
          404
        );
      }

      const existingMint =
        await dependencies.repositories.publishedCollectionMintRepository.findByTokenIdForPublishedCollection(
          {
            publishedCollectionId: publication.id,
            tokenId: parsedInput.tokenId
          }
        );

      if (existingMint) {
        throw new CollectionDraftServiceError(
          "ONCHAIN_TOKEN_ALREADY_MINTED",
          "The requested token ID has already been recorded as minted.",
          409
        );
      }

      const artifact = getAiNftForgeCollectionContractArtifact();
      const mintData = (encodeFunctionData as unknown as (input: {
        abi: unknown[];
        args: unknown[];
        functionName: string;
      }) => `0x${string}`)({
        abi: artifact.abi,
        args: [parsedInput.recipientWalletAddress, BigInt(parsedInput.tokenId)],
        functionName: "ownerMint"
      });

      return collectionContractMintIntentResponseSchema.parse({
        mint: {
          chain: deployment.chain,
          contractAddress: deployment.contractAddress,
          recipientWalletAddress: parsedInput.recipientWalletAddress,
          tokenId: parsedInput.tokenId,
          transaction: {
            data: mintData,
            to: deployment.contractAddress,
            value: "0x0"
          }
        }
      });
    },

    async recordCollectionContractMint(input: {
      collectionDraftId: string;
      mintedAt?: string;
      ownerUserId: string;
      recipientWalletAddress: string;
      tokenId: number;
      txHash: string;
    }) {
      const parsedInput = collectionContractMintIntentRequestSchema.parse({
        recipientWalletAddress: input.recipientWalletAddress,
        tokenId: input.tokenId
      });
      const publication =
        await dependencies.repositories.publishedCollectionRepository.findByDraftIdForOwner(
          {
            ownerUserId: input.ownerUserId,
            sourceCollectionDraftId: input.collectionDraftId
          }
        );

      if (!publication) {
        throw new CollectionDraftServiceError(
          "COLLECTION_PUBLICATION_NOT_FOUND",
          "Published collection was not found for this draft.",
          404
        );
      }

      const deployment = serializeOnchainDeployment(publication);

      if (!deployment) {
        throw new CollectionDraftServiceError(
          "ONCHAIN_DEPLOYMENT_REQUIRED",
          "Record an onchain contract deployment before minting tokens.",
          409
        );
      }

      const publicationItem =
        await dependencies.repositories.publishedCollectionItemRepository.findByPositionForPublishedCollection(
          {
            position: parsedInput.tokenId,
            publishedCollectionId: publication.id
          }
        );

      if (!publicationItem) {
        throw new CollectionDraftServiceError(
          "ONCHAIN_TOKEN_NOT_FOUND",
          "The requested token ID does not exist in the published collection snapshot.",
          404
        );
      }

      const existingMint =
        await dependencies.repositories.publishedCollectionMintRepository.findByTokenIdForPublishedCollection(
          {
            publishedCollectionId: publication.id,
            tokenId: parsedInput.tokenId
          }
        );

      if (existingMint) {
        throw new CollectionDraftServiceError(
          "ONCHAIN_TOKEN_ALREADY_MINTED",
          "The requested token ID has already been recorded as minted.",
          409
        );
      }

      await dependencies.repositories.publishedCollectionMintRepository.create({
        mintedAt: input.mintedAt ? new Date(input.mintedAt) : dependencies.now(),
        ownerUserId: input.ownerUserId,
        publishedCollectionId: publication.id,
        publishedCollectionItemId: publicationItem.id,
        recipientWalletAddress: parsedInput.recipientWalletAddress,
        tokenId: parsedInput.tokenId,
        txHash: input.txHash
      });

      return loadSerializedCollectionDraftById({
        collectionDraftId: input.collectionDraftId,
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories
      });
    },

    async removeCollectionDraftItem(input: {
      collectionDraftId: string;
      itemId: string;
      ownerUserId: string;
    }) {
      const deletedPublicAssets: PublicPublicationAssetRecord[] = [];
      const result = await dependencies.runTransaction(async (repositories) => {
        const draft =
          await repositories.collectionDraftRepository.findByIdForOwner({
            id: input.collectionDraftId,
            ownerUserId: input.ownerUserId
          });

        if (!draft) {
          throw new CollectionDraftServiceError(
            "DRAFT_NOT_FOUND",
            "Collection draft was not found.",
            404
          );
        }

        const deletedItem =
          await repositories.collectionDraftItemRepository.deleteByIdForDraftOwner(
            {
              collectionDraftId: input.collectionDraftId,
              id: input.itemId,
              ownerUserId: input.ownerUserId
            }
          );

        if (!deletedItem) {
          throw new CollectionDraftServiceError(
            "DRAFT_ITEM_NOT_FOUND",
            "Collection draft item was not found.",
            404
          );
        }

        const remainingItems =
          await repositories.collectionDraftItemRepository.listByCollectionDraftIdForOwner(
            {
              collectionDraftId: input.collectionDraftId,
              ownerUserId: input.ownerUserId
            }
          );

        await Promise.all(
          remainingItems.map((item, index) =>
            item.position === index + 1
              ? Promise.resolve()
              : repositories.collectionDraftItemRepository.updatePosition({
                  id: item.id,
                  position: index + 1
                })
          )
        );

        if (draft.status === "review_ready" && remainingItems.length === 0) {
          const existingPublication =
            await repositories.publishedCollectionRepository.findByDraftIdForOwner(
              {
                ownerUserId: input.ownerUserId,
                sourceCollectionDraftId: input.collectionDraftId
              }
            );

          if (existingPublication) {
            deletedPublicAssets.push(
              ...(
                await repositories.publishedCollectionItemRepository.listByPublishedCollectionId(
                  existingPublication.id
                )
              )
                .map(toPublicPublicationAssetRecord)
                .filter(isPublicPublicationAssetRecord)
            );
          }

          await repositories.collectionDraftRepository.updateByIdForOwner({
            description: draft.description,
            id: input.collectionDraftId,
            ownerUserId: input.ownerUserId,
            slug: draft.slug,
            status: "draft",
            title: draft.title
          });
          await repositories.publishedCollectionRepository.deleteByDraftIdForOwner(
            {
              ownerUserId: input.ownerUserId,
              sourceCollectionDraftId: input.collectionDraftId
            }
          );
        }

        return loadSerializedCollectionDraftById({
          collectionDraftId: input.collectionDraftId,
          ownerUserId: input.ownerUserId,
          repositories
        });
      });

      await deletePublishedAssetsBestEffort(
        dependencies.storage.deletePublishedAsset,
        deletedPublicAssets
      );

      return result;
    },

    async reorderCollectionDraftItems(input: {
      collectionDraftId: string;
      itemIds: string[];
      ownerUserId: string;
    }) {
      const parsedInput = collectionDraftItemReorderRequestSchema.parse({
        itemIds: input.itemIds
      });

      return dependencies.runTransaction(async (repositories) => {
        const draft =
          await repositories.collectionDraftRepository.findByIdForOwner({
            id: input.collectionDraftId,
            ownerUserId: input.ownerUserId
          });

        if (!draft) {
          throw new CollectionDraftServiceError(
            "DRAFT_NOT_FOUND",
            "Collection draft was not found.",
            404
          );
        }

        const existingItems =
          await repositories.collectionDraftItemRepository.listByCollectionDraftIdForOwner(
            {
              collectionDraftId: input.collectionDraftId,
              ownerUserId: input.ownerUserId
            }
          );

        if (existingItems.length !== parsedInput.itemIds.length) {
          throw new CollectionDraftServiceError(
            "DRAFT_REORDER_MISMATCH",
            "Collection draft reorder payload does not match the current items.",
            409
          );
        }

        const existingItemIdSet = new Set(existingItems.map((item) => item.id));

        if (
          parsedInput.itemIds.some(
            (itemId) => !existingItemIdSet.has(itemId)
          ) ||
          new Set(parsedInput.itemIds).size !== parsedInput.itemIds.length
        ) {
          throw new CollectionDraftServiceError(
            "DRAFT_REORDER_MISMATCH",
            "Collection draft reorder payload does not match the current items.",
            409
          );
        }

        await Promise.all(
          parsedInput.itemIds.map((itemId, index) =>
            repositories.collectionDraftItemRepository.updatePosition({
              id: itemId,
              position: index + 1
            })
          )
        );

        return loadSerializedCollectionDraftById({
          collectionDraftId: input.collectionDraftId,
          ownerUserId: input.ownerUserId,
          repositories
        });
      });
    },

    async unpublishCollectionDraft(input: {
      collectionDraftId: string;
      ownerUserId: string;
    }) {
      const deletedPublicAssets: PublicPublicationAssetRecord[] = [];
      const result = await dependencies.runTransaction(async (repositories) => {
        const draft =
          await repositories.collectionDraftRepository.findByIdForOwner({
            id: input.collectionDraftId,
            ownerUserId: input.ownerUserId
          });

        if (!draft) {
          throw new CollectionDraftServiceError(
            "DRAFT_NOT_FOUND",
            "Collection draft was not found.",
            404
          );
        }

        const existingPublication =
          await repositories.publishedCollectionRepository.findByDraftIdForOwner(
            {
              ownerUserId: input.ownerUserId,
              sourceCollectionDraftId: input.collectionDraftId
            }
          );

        if (existingPublication) {
          assertPublicationMutable(existingPublication);
          deletedPublicAssets.push(
            ...(
              await repositories.publishedCollectionItemRepository.listByPublishedCollectionId(
                existingPublication.id
              )
            )
              .map(toPublicPublicationAssetRecord)
              .filter(isPublicPublicationAssetRecord)
          );
        }

        const deletedPublication =
          await repositories.publishedCollectionRepository.deleteByDraftIdForOwner(
            {
              ownerUserId: input.ownerUserId,
              sourceCollectionDraftId: input.collectionDraftId
            }
          );

        if (!deletedPublication) {
          throw new CollectionDraftServiceError(
            "COLLECTION_PUBLICATION_NOT_FOUND",
            "Published collection was not found for this draft.",
            404
          );
        }

        if (deletedPublication.isFeatured) {
          const nextFeaturedPublication = sortPublicationsForMerchandising(
            (
              await repositories.publishedCollectionRepository.listByOwnerUserId(
                input.ownerUserId
              )
            ).filter(
              (publication) =>
                publication.brandSlug === deletedPublication.brandSlug
            )
          )[0];

          if (nextFeaturedPublication) {
            await repositories.publishedCollectionRepository.updateByIdForOwner(
              {
                brandName: nextFeaturedPublication.brandName,
                brandSlug: nextFeaturedPublication.brandSlug,
                description: nextFeaturedPublication.description,
                displayOrder: nextFeaturedPublication.displayOrder,
                id: nextFeaturedPublication.id,
                isFeatured: true,
                ownerUserId: input.ownerUserId,
                slug: nextFeaturedPublication.slug,
                title: nextFeaturedPublication.title
              }
            );
          }
        }

        return loadSerializedCollectionDraftById({
          collectionDraftId: input.collectionDraftId,
          ownerUserId: input.ownerUserId,
          repositories
        });
      });

      await deletePublishedAssetsBestEffort(
        dependencies.storage.deletePublishedAsset,
        deletedPublicAssets
      );

      return result;
    },

    async updateCollectionDraft(input: {
      collectionDraftId: string;
      description: string | null;
      ownerUserId: string;
      slug: string;
      status: CollectionDraftStatus;
      title: string;
    }) {
      const parsedInput = collectionDraftUpdateRequestSchema.parse({
        description: input.description,
        slug: input.slug,
        status: input.status,
        title: input.title
      });
      const existingDraft =
        await dependencies.repositories.collectionDraftRepository.findByIdForOwner(
          {
            id: input.collectionDraftId,
            ownerUserId: input.ownerUserId
          }
        );

      if (!existingDraft) {
        throw new CollectionDraftServiceError(
          "DRAFT_NOT_FOUND",
          "Collection draft was not found.",
          404
        );
      }

      const conflictingDraft =
        await dependencies.repositories.collectionDraftRepository.findBySlugForOwner(
          {
            ownerUserId: input.ownerUserId,
            slug: parsedInput.slug
          }
        );

      if (conflictingDraft && conflictingDraft.id !== input.collectionDraftId) {
        throw new CollectionDraftServiceError(
          "DRAFT_SLUG_CONFLICT",
          "Collection draft slug is already in use.",
          409
        );
      }

      if (parsedInput.status === "review_ready") {
        const detailedDraft =
          await dependencies.repositories.collectionDraftRepository.findDetailedByIdForOwner(
            {
              id: input.collectionDraftId,
              ownerUserId: input.ownerUserId
            }
          );

        if (!detailedDraft || detailedDraft.items.length === 0) {
          throw new CollectionDraftServiceError(
            "DRAFT_NOT_READY",
            "Collection draft needs at least one curated generated asset before it can be marked review-ready.",
            409
          );
        }

        if (
          detailedDraft.items.some(
            (item) => item.generatedAsset.moderationStatus !== "approved"
          )
        ) {
          throw new CollectionDraftServiceError(
            "GENERATED_ASSET_NOT_APPROVED",
            "Only approved generated assets can move a collection draft to review-ready.",
            409
          );
        }
      }

      const publication =
        await dependencies.repositories.publishedCollectionRepository.findByDraftIdForOwner(
          {
            ownerUserId: input.ownerUserId,
            sourceCollectionDraftId: input.collectionDraftId
          }
        );

      if (publication) {
        assertPublicationMutable(publication);
        const routeConflict =
          await dependencies.repositories.publishedCollectionRepository.findByBrandSlugAndCollectionSlug(
            {
              brandSlug: publication.brandSlug,
              slug: parsedInput.slug
            }
          );

        if (routeConflict && routeConflict.id !== publication.id) {
          throw new CollectionDraftServiceError(
            "COLLECTION_PUBLICATION_CONFLICT",
            "Another published collection already uses this public route.",
            409
          );
        }
      }

      await dependencies.repositories.collectionDraftRepository.updateByIdForOwner(
        {
          description: normalizeOptionalDescription(parsedInput.description),
          id: input.collectionDraftId,
          ownerUserId: input.ownerUserId,
          slug: parsedInput.slug,
          status: parsedInput.status,
          title: parsedInput.title
        }
      );

      if (publication) {
        await dependencies.repositories.publishedCollectionRepository.updateByIdForOwner(
          {
            brandName: publication.brandName,
            brandSlug: publication.brandSlug,
            description: normalizeOptionalDescription(parsedInput.description),
            displayOrder: publication.displayOrder,
            id: publication.id,
            isFeatured: publication.isFeatured,
            ownerUserId: input.ownerUserId,
            slug: parsedInput.slug,
            title: parsedInput.title
          }
        );
      }

      return loadSerializedCollectionDraftById({
        collectionDraftId: input.collectionDraftId,
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories
      });
    }
  };
}
