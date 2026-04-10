import { describe, expect, it } from "vitest";

import { CollectionDraftServiceError } from "./error";
import { createCollectionDraftService } from "./service";

function createDefaultPublicationStorefrontState() {
  return {
    endAt: null,
    heroGeneratedAssetId: null,
    launchAt: null,
    priceAmountMinor: null,
    priceCurrency: null,
    priceLabel: null,
    primaryCtaHref: null,
    primaryCtaLabel: null,
    secondaryCtaHref: null,
    secondaryCtaLabel: null,
    soldCount: 0,
    storefrontBody: null,
    storefrontHeadline: null,
    storefrontStatus: "ended" as const,
    totalSupply: null
  };
}

function createCollectionDraftHarness() {
  const nowValues = [
    "2026-04-08T00:00:00.000Z",
    "2026-04-08T00:05:00.000Z",
    "2026-04-08T00:10:00.000Z",
    "2026-04-08T00:15:00.000Z",
    "2026-04-08T00:20:00.000Z",
    "2026-04-08T00:25:00.000Z",
    "2026-04-08T00:30:00.000Z",
    "2026-04-08T00:35:00.000Z",
    "2026-04-08T00:40:00.000Z",
    "2026-04-08T00:45:00.000Z",
    "2026-04-08T00:50:00.000Z",
    "2026-04-08T00:55:00.000Z"
  ].map((value) => new Date(value));
  let nowIndex = 0;
  let draftIndex = 0;
  let draftItemIndex = 0;
  let publicationIndex = 0;
  let publicationItemIndex = 0;
  let publicationMintIndex = 0;
  const drafts = new Map<
    string,
    {
      createdAt: Date;
      description: string | null;
      id: string;
      ownerUserId: string;
      slug: string;
      status: "draft" | "review_ready";
      title: string;
      updatedAt: Date;
    }
  >();
  const draftItems = new Map<
    string,
    {
      collectionDraftId: string;
      createdAt: Date;
      generatedAssetId: string;
      id: string;
      position: number;
      updatedAt: Date;
    }
  >();
  const publications = new Map<
    string,
    {
      brandName: string;
      brandSlug: string;
      contractAddress: string | null;
      contractChainKey: string | null;
      contractDeployedAt: Date | null;
      contractDeployTxHash: string | null;
      contractTokenUriBaseUrl: string | null;
      createdAt: Date;
      displayOrder: number;
      description: string | null;
      endAt: Date | null;
      heroGeneratedAssetId: string | null;
      id: string;
      isFeatured: boolean;
      launchAt: Date | null;
      ownerUserId: string;
      priceAmountMinor: number | null;
      priceCurrency: string | null;
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
      storefrontStatus: "ended" | "live" | "sold_out" | "upcoming";
      totalSupply: number | null;
      title: string;
      updatedAt: Date;
      mints: Array<{
        id: string;
        mintedAt: Date;
        recipientWalletAddress: string;
        tokenId: number;
        txHash: string;
      }>;
    }
  >();
  const publicationItems = new Map<
    string,
    {
      createdAt: Date;
      generatedAssetId: string;
      id: string;
      position: number;
      publicStorageBucket: string | null;
      publicStorageObjectKey: string | null;
      publishedCollectionId: string;
      updatedAt: Date;
    }
  >();
  const copiedPublishedAssets = new Map<
    string,
    {
      contentType: string;
      destinationKey: string;
      sourceBucket: string;
      sourceKey: string;
      }
  >();
  const verifiedDeploymentTransactions: Array<{
    chainKey: "base" | "base-sepolia";
    deployTxHash: `0x${string}`;
    expectedContractName: string;
    expectedContractSymbol: string;
    expectedDeploymentData: `0x${string}`;
    expectedOwnerWalletAddress: string;
    expectedTokenUriBaseUrl: string;
  }> = [];
  const verifiedMintTransactions: Array<{
    chainKey: "base" | "base-sepolia";
    contractAddress: string;
    expectedMintData: `0x${string}`;
    expectedOwnerWalletAddress: string;
    recipientWalletAddress: string;
    tokenId: number;
    txHash: `0x${string}`;
  }> = [];
  const openReconciliationIssues: Array<{
    detailJson: unknown;
    kind:
      | "published_contract_deployment_unverified"
      | "published_contract_metadata_mismatch"
      | "published_contract_missing_onchain"
      | "published_contract_owner_mismatch"
      | "published_token_mint_unverified"
      | "published_token_owner_mismatch";
  }> = [];
  const publicationTargets = new Map<
    string,
    {
      name: string;
      slug: string;
    }
  >([
    [
      "user_1",
      {
        name: "Demo Studio",
        slug: "demo-studio"
      }
    ],
    [
      "user_2",
      {
        name: "Demo Studio",
        slug: "demo-studio"
      }
    ]
  ]);
  const generatedAssets = new Map<
    string,
    {
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
      moderationStatus: "approved" | "pending_review" | "rejected";
      ownerUserId: string;
      storageBucket: string;
      storageObjectKey: string;
      variantIndex: number;
    }
  >([
    [
      "generated_asset_1",
      {
        contentType: "image/png",
        createdAt: new Date("2026-04-08T00:01:00.000Z"),
        generationRequest: {
          id: "generation_1",
          pipelineKey: "collectible-portrait-v1",
          sourceAsset: {
            id: "source_asset_1",
            originalFilename: "portrait-1.png"
          }
        },
        id: "generated_asset_1",
        moderatedAt: new Date("2026-04-08T00:04:00.000Z"),
        moderationStatus: "approved" as const,
        ownerUserId: "user_1",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey: "generated-assets/user_1/generation_1/variant-01.png",
        variantIndex: 1
      }
    ],
    [
      "generated_asset_2",
      {
        contentType: "image/png",
        createdAt: new Date("2026-04-08T00:02:00.000Z"),
        generationRequest: {
          id: "generation_2",
          pipelineKey: "collectible-portrait-v1",
          sourceAsset: {
            id: "source_asset_2",
            originalFilename: "portrait-2.png"
          }
        },
        id: "generated_asset_2",
        moderatedAt: new Date("2026-04-08T00:05:00.000Z"),
        moderationStatus: "approved" as const,
        ownerUserId: "user_1",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey: "generated-assets/user_1/generation_2/variant-02.png",
        variantIndex: 2
      }
    ],
    [
      "generated_asset_3",
      {
        contentType: "image/png",
        createdAt: new Date("2026-04-08T00:03:00.000Z"),
        generationRequest: {
          id: "generation_3",
          pipelineKey: "collectible-portrait-v1",
          sourceAsset: {
            id: "source_asset_3",
            originalFilename: "portrait-3.png"
          }
        },
        id: "generated_asset_3",
        moderatedAt: new Date("2026-04-08T00:06:00.000Z"),
        moderationStatus: "approved" as const,
        ownerUserId: "user_2",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey: "generated-assets/user_2/generation_3/variant-01.png",
        variantIndex: 1
      }
    ]
  ]);

  function nextDate() {
    const value = nowValues[nowIndex] ?? nowValues[nowValues.length - 1]!;

    nowIndex += 1;

    return value;
  }

  function listDraftItemsForDraft(collectionDraftId: string) {
    return [...draftItems.values()]
      .filter((item) => item.collectionDraftId === collectionDraftId)
      .sort((left, right) => {
        if (left.position !== right.position) {
          return left.position - right.position;
        }

        return left.id.localeCompare(right.id);
      });
  }

  function touchDraft(collectionDraftId: string) {
    const draft = drafts.get(collectionDraftId);

    if (draft) {
      draft.updatedAt = nextDate();
    }
  }

  function clearPublicationItems(publishedCollectionId: string) {
    for (const publicationItem of publicationItems.values()) {
      if (publicationItem.publishedCollectionId === publishedCollectionId) {
        publicationItems.delete(publicationItem.id);
      }
    }
  }

  function serializeDraft(id: string) {
    const draft = drafts.get(id);

    if (!draft) {
      return null;
    }

    return {
      ...draft,
      items: listDraftItemsForDraft(id).map((item) => ({
        generatedAsset: generatedAssets.get(item.generatedAssetId)!,
        id: item.id,
        position: item.position
      }))
    };
  }

  const repositories = {
    brandRepository: {
      async findFirstByOwnerUserId(ownerUserId: string) {
        return publicationTargets.get(ownerUserId) ?? null;
      }
    },
    collectionDraftItemRepository: {
      async create(input: {
        collectionDraftId: string;
        generatedAssetId: string;
        position: number;
      }) {
        draftItemIndex += 1;
        const item = {
          collectionDraftId: input.collectionDraftId,
          createdAt: nextDate(),
          generatedAssetId: input.generatedAssetId,
          id: `draft_item_${draftItemIndex}`,
          position: input.position,
          updatedAt: nextDate()
        };

        draftItems.set(item.id, item);
        touchDraft(input.collectionDraftId);

        return item;
      },

      async deleteByIdForDraftOwner(input: {
        collectionDraftId: string;
        id: string;
        ownerUserId: string;
      }) {
        const item = draftItems.get(input.id);
        const draft = drafts.get(input.collectionDraftId);

        if (
          !item ||
          !draft ||
          draft.ownerUserId !== input.ownerUserId ||
          item.collectionDraftId !== input.collectionDraftId
        ) {
          return null;
        }

        draftItems.delete(item.id);
        touchDraft(input.collectionDraftId);

        return item;
      },

      async findByGeneratedAssetIdForDraft(input: {
        collectionDraftId: string;
        generatedAssetId: string;
      }) {
        return (
          [...draftItems.values()].find(
            (item) =>
              item.collectionDraftId === input.collectionDraftId &&
              item.generatedAssetId === input.generatedAssetId
          ) ?? null
        );
      },

      async listByCollectionDraftIdForOwner(input: {
        collectionDraftId: string;
        ownerUserId: string;
      }) {
        const draft = drafts.get(input.collectionDraftId);

        if (!draft || draft.ownerUserId !== input.ownerUserId) {
          return [];
        }

        return listDraftItemsForDraft(input.collectionDraftId);
      },

      async updatePosition(input: { id: string; position: number }) {
        const item = draftItems.get(input.id);

        if (!item) {
          throw new Error(
            "Collection draft item was not found in the test harness."
          );
        }

        const updatedItem = {
          ...item,
          position: input.position,
          updatedAt: nextDate()
        };

        draftItems.set(updatedItem.id, updatedItem);
        touchDraft(updatedItem.collectionDraftId);

        return updatedItem;
      }
    },

    collectionDraftRepository: {
      async create(input: {
        description: string | null;
        ownerUserId: string;
        slug: string;
        title: string;
      }) {
        draftIndex += 1;
        const timestamp = nextDate();
        const draft = {
          createdAt: timestamp,
          description: input.description,
          id: `draft_${draftIndex}`,
          ownerUserId: input.ownerUserId,
          slug: input.slug,
          status: "draft" as const,
          title: input.title,
          updatedAt: timestamp
        };

        drafts.set(draft.id, draft);

        return draft;
      },

      async findByIdForOwner(input: { id: string; ownerUserId: string }) {
        const draft = drafts.get(input.id);

        if (!draft || draft.ownerUserId !== input.ownerUserId) {
          return null;
        }

        return draft;
      },

      async findDetailedByIdForOwner(input: {
        id: string;
        ownerUserId: string;
      }) {
        const draft = drafts.get(input.id);

        if (!draft || draft.ownerUserId !== input.ownerUserId) {
          return null;
        }

        return serializeDraft(draft.id);
      },

      async findBySlugForOwner(input: { ownerUserId: string; slug: string }) {
        return (
          [...drafts.values()].find(
            (draft) =>
              draft.ownerUserId === input.ownerUserId &&
              draft.slug === input.slug
          ) ?? null
        );
      },

      async listByOwnerUserId(ownerUserId: string) {
        return [...drafts.values()]
          .filter((draft) => draft.ownerUserId === ownerUserId)
          .sort(
            (left, right) =>
              right.updatedAt.getTime() - left.updatedAt.getTime()
          )
          .map((draft) => serializeDraft(draft.id)!)
          .filter(Boolean);
      },

      async updateByIdForOwner(input: {
        description: string | null;
        id: string;
        ownerUserId: string;
        slug: string;
        status: "draft" | "review_ready";
        title: string;
      }) {
        const draft = drafts.get(input.id);

        if (!draft || draft.ownerUserId !== input.ownerUserId) {
          throw new Error(
            "Collection draft was not found in the test harness."
          );
        }

        const updatedDraft = {
          ...draft,
          description: input.description,
          slug: input.slug,
          status: input.status,
          title: input.title,
          updatedAt: nextDate()
        };

        drafts.set(updatedDraft.id, updatedDraft);

        return updatedDraft;
      }
    },

    generatedAssetRepository: {
      async findByIdForOwner(input: { id: string; ownerUserId: string }) {
        const asset = generatedAssets.get(input.id);

        if (!asset || asset.ownerUserId !== input.ownerUserId) {
          return null;
        }

        return asset;
      },

      async listRecentForOwnerUserId(input: {
        limit: number;
        ownerUserId: string;
      }) {
        return [...generatedAssets.values()]
          .filter((asset) => asset.ownerUserId === input.ownerUserId)
          .sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime()
          )
          .slice(0, input.limit);
      }
    },

    opsReconciliationIssueRepository: {
      async listOpenByOwnerUserId() {
        return openReconciliationIssues;
      }
    },

    publishedCollectionItemRepository: {
      async createMany(
        inputs: Array<{
          generatedAssetId: string;
          position: number;
          publicStorageBucket?: string | null;
          publicStorageObjectKey?: string | null;
          publishedCollectionId: string;
        }>
      ) {
        return inputs.map((input) => {
          publicationItemIndex += 1;
          const publicationItem = {
            createdAt: nextDate(),
            generatedAssetId: input.generatedAssetId,
            id: `published_item_${publicationItemIndex}`,
            position: input.position,
            publicStorageBucket: input.publicStorageBucket ?? null,
            publicStorageObjectKey: input.publicStorageObjectKey ?? null,
            publishedCollectionId: input.publishedCollectionId,
            updatedAt: nextDate()
          };

          publicationItems.set(publicationItem.id, publicationItem);

          return publicationItem;
        });
      },

      async listByPublishedCollectionId(publishedCollectionId: string) {
        return [...publicationItems.values()]
          .filter(
            (item) => item.publishedCollectionId === publishedCollectionId
          )
          .sort((left, right) => left.position - right.position)
          .map((item) => ({
            generatedAssetId: item.generatedAssetId,
            id: item.id,
            publicStorageBucket: item.publicStorageBucket,
            publicStorageObjectKey: item.publicStorageObjectKey
          }));
      },

      async findByPositionForPublishedCollection(input: {
        position: number;
        publishedCollectionId: string;
      }) {
        return (
          [...publicationItems.values()].find(
            (item) =>
              item.position === input.position &&
              item.publishedCollectionId === input.publishedCollectionId
          ) ?? null
        );
      },

      async deleteByPublishedCollectionId(publishedCollectionId: string) {
        const itemsToDelete = [...publicationItems.values()].filter(
          (item) => item.publishedCollectionId === publishedCollectionId
        );

        for (const item of itemsToDelete) {
          publicationItems.delete(item.id);
        }

        return {
          count: itemsToDelete.length
        };
      }
    },

    publishedCollectionRepository: {
      async create(input: {
        brandName: string;
        brandSlug: string;
        contractAddress?: string | null;
        contractChainKey?: string | null;
        contractDeployedAt?: Date | null;
        contractDeployTxHash?: string | null;
        contractTokenUriBaseUrl?: string | null;
        displayOrder: number;
        description: string | null;
        endAt?: Date | null;
        heroGeneratedAssetId?: string | null;
        isFeatured: boolean;
        launchAt?: Date | null;
        ownerUserId: string;
        priceAmountMinor?: number | null;
        priceCurrency?: string | null;
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
        storefrontStatus?: "ended" | "live" | "sold_out" | "upcoming";
        totalSupply?: number | null;
        title: string;
      }) {
        publicationIndex += 1;
        const publication = {
          brandName: input.brandName,
          brandSlug: input.brandSlug,
          contractAddress: input.contractAddress ?? null,
          contractChainKey: input.contractChainKey ?? null,
          contractDeployedAt: input.contractDeployedAt ?? null,
          contractDeployTxHash: input.contractDeployTxHash ?? null,
          contractTokenUriBaseUrl: input.contractTokenUriBaseUrl ?? null,
          createdAt: nextDate(),
          displayOrder: input.displayOrder,
          description: input.description,
          ...createDefaultPublicationStorefrontState(),
          endAt: input.endAt ?? null,
          heroGeneratedAssetId: input.heroGeneratedAssetId ?? null,
          id: `published_collection_${publicationIndex}`,
          isFeatured: input.isFeatured,
          launchAt: input.launchAt ?? null,
          ownerUserId: input.ownerUserId,
          priceAmountMinor: input.priceAmountMinor ?? null,
          priceCurrency: input.priceCurrency ?? null,
          priceLabel: input.priceLabel ?? null,
          primaryCtaHref: input.primaryCtaHref ?? null,
          primaryCtaLabel: input.primaryCtaLabel ?? null,
          publishedAt: input.publishedAt,
          secondaryCtaHref: input.secondaryCtaHref ?? null,
          secondaryCtaLabel: input.secondaryCtaLabel ?? null,
          slug: input.slug,
          soldCount: input.soldCount ?? 0,
          sourceCollectionDraftId: input.sourceCollectionDraftId,
          storefrontBody: input.storefrontBody ?? null,
          storefrontHeadline: input.storefrontHeadline ?? null,
          storefrontStatus: input.storefrontStatus ?? "ended",
          totalSupply: input.totalSupply ?? null,
          title: input.title,
          updatedAt: nextDate(),
          mints: []
        };

        publications.set(publication.id, publication);

        return publication;
      },

      async deleteByDraftIdForOwner(input: {
        ownerUserId: string;
        sourceCollectionDraftId: string;
      }) {
        const publication = [...publications.values()].find(
          (candidate) =>
            candidate.ownerUserId === input.ownerUserId &&
            candidate.sourceCollectionDraftId === input.sourceCollectionDraftId
        );

        if (!publication) {
          return null;
        }

        clearPublicationItems(publication.id);
        publications.delete(publication.id);

        return publication;
      },

      async findByBrandSlugAndCollectionSlug(input: {
        brandSlug: string;
        slug: string;
      }) {
        return (
          [...publications.values()].find(
            (publication) =>
              publication.brandSlug === input.brandSlug &&
              publication.slug === input.slug
          ) ?? null
        );
      },

      async findByDraftIdForOwner(input: {
        ownerUserId: string;
        sourceCollectionDraftId: string;
      }) {
        return (
          [...publications.values()].find(
            (publication) =>
              publication.ownerUserId === input.ownerUserId &&
              publication.sourceCollectionDraftId ===
                input.sourceCollectionDraftId
          ) ?? null
        );
      },

      async listByOwnerUserId(ownerUserId: string) {
        return [...publications.values()]
          .filter((publication) => publication.ownerUserId === ownerUserId)
          .sort(
            (left, right) =>
              right.updatedAt.getTime() - left.updatedAt.getTime()
          );
      },

      async updateByIdForOwner(input: {
        brandName: string;
        brandSlug: string;
        contractAddress?: string | null;
        contractChainKey?: string | null;
        contractDeployedAt?: Date | null;
        contractDeployTxHash?: string | null;
        contractTokenUriBaseUrl?: string | null;
        displayOrder?: number;
        description: string | null;
        endAt?: Date | null;
        heroGeneratedAssetId?: string | null;
        id: string;
        isFeatured?: boolean;
        launchAt?: Date | null;
        ownerUserId: string;
        priceAmountMinor?: number | null;
        priceCurrency?: string | null;
        priceLabel?: string | null;
        primaryCtaHref?: string | null;
        primaryCtaLabel?: string | null;
        secondaryCtaHref?: string | null;
        secondaryCtaLabel?: string | null;
        slug: string;
        soldCount?: number;
        storefrontBody?: string | null;
        storefrontHeadline?: string | null;
        storefrontStatus?: "ended" | "live" | "sold_out" | "upcoming";
        totalSupply?: number | null;
        title: string;
      }) {
        const publication = publications.get(input.id);

        if (!publication || publication.ownerUserId !== input.ownerUserId) {
          throw new Error(
            "Published collection was not found in the test harness."
          );
        }

        const updatedPublication = {
          ...publication,
          brandName: input.brandName,
          brandSlug: input.brandSlug,
          contractAddress:
            input.contractAddress === undefined
              ? publication.contractAddress
              : input.contractAddress,
          contractChainKey:
            input.contractChainKey === undefined
              ? publication.contractChainKey
              : input.contractChainKey,
          contractDeployedAt:
            input.contractDeployedAt === undefined
              ? publication.contractDeployedAt
              : input.contractDeployedAt,
          contractDeployTxHash:
            input.contractDeployTxHash === undefined
              ? publication.contractDeployTxHash
              : input.contractDeployTxHash,
          contractTokenUriBaseUrl:
            input.contractTokenUriBaseUrl === undefined
              ? publication.contractTokenUriBaseUrl
              : input.contractTokenUriBaseUrl,
          displayOrder: input.displayOrder ?? publication.displayOrder,
          description: input.description,
          endAt: input.endAt === undefined ? publication.endAt : input.endAt,
          heroGeneratedAssetId:
            input.heroGeneratedAssetId === undefined
              ? publication.heroGeneratedAssetId
              : input.heroGeneratedAssetId,
          slug: input.slug,
          title: input.title,
          isFeatured: input.isFeatured ?? publication.isFeatured,
          launchAt:
            input.launchAt === undefined
              ? publication.launchAt
              : input.launchAt,
          priceAmountMinor:
            input.priceAmountMinor === undefined
              ? publication.priceAmountMinor
              : input.priceAmountMinor,
          priceCurrency:
            input.priceCurrency === undefined
              ? publication.priceCurrency
              : input.priceCurrency,
          priceLabel:
            input.priceLabel === undefined
              ? publication.priceLabel
              : input.priceLabel,
          primaryCtaHref:
            input.primaryCtaHref === undefined
              ? publication.primaryCtaHref
              : input.primaryCtaHref,
          primaryCtaLabel:
            input.primaryCtaLabel === undefined
              ? publication.primaryCtaLabel
              : input.primaryCtaLabel,
          secondaryCtaHref:
            input.secondaryCtaHref === undefined
              ? publication.secondaryCtaHref
              : input.secondaryCtaHref,
          secondaryCtaLabel:
            input.secondaryCtaLabel === undefined
              ? publication.secondaryCtaLabel
              : input.secondaryCtaLabel,
          soldCount:
            input.soldCount === undefined
              ? publication.soldCount
              : input.soldCount,
          storefrontBody:
            input.storefrontBody === undefined
              ? publication.storefrontBody
              : input.storefrontBody,
          storefrontHeadline:
            input.storefrontHeadline === undefined
              ? publication.storefrontHeadline
              : input.storefrontHeadline,
          storefrontStatus:
            input.storefrontStatus ?? publication.storefrontStatus,
          totalSupply:
            input.totalSupply === undefined
              ? publication.totalSupply
              : input.totalSupply,
          updatedAt: nextDate()
        };

        publications.set(updatedPublication.id, updatedPublication);

        return updatedPublication;
      }
    },

    publishedCollectionMintRepository: {
      async create(input: {
        mintedAt: Date;
        ownerUserId: string;
        publishedCollectionId: string;
        publishedCollectionItemId: string;
        recipientWalletAddress: string;
        tokenId: number;
        txHash: string;
      }) {
        const publication = publications.get(input.publishedCollectionId);

        if (!publication || publication.ownerUserId !== input.ownerUserId) {
          throw new Error(
            "Published collection was not found in the test harness."
          );
        }

        publicationMintIndex += 1;
        const mint = {
          id: `published_mint_${publicationMintIndex}`,
          mintedAt: input.mintedAt,
          recipientWalletAddress: input.recipientWalletAddress,
          tokenId: input.tokenId,
          txHash: input.txHash
        };

        publication.mints.push(mint);
        publication.updatedAt = nextDate();

        return mint;
      },

      async findByTokenIdForPublishedCollection(input: {
        publishedCollectionId: string;
        tokenId: number;
      }) {
        const publication = publications.get(input.publishedCollectionId);

        return (
          publication?.mints.find((mint) => mint.tokenId === input.tokenId) ??
          null
        );
      }
    }
  };
  const service = createCollectionDraftService({
    now: () => nextDate(),
    onchain: {
      async verifyDeploymentTransaction(input) {
        verifiedDeploymentTransactions.push(input);

        return {
          contractAddress: "0x1111111111111111111111111111111111111111",
          deployedAt: new Date("2026-04-08T01:00:00.000Z"),
          deployTxHash: input.deployTxHash
        };
      },
      async verifyMintTransaction(input) {
        verifiedMintTransactions.push(input);

        return {
          mintedAt: new Date("2026-04-08T01:05:00.000Z"),
          txHash: input.txHash
        };
      }
    },
    repositories,
    async runTransaction<T>(
      operation: (repositorySet: typeof repositories) => Promise<T>
    ) {
      return operation(repositories);
    },
    storage: {
      async copyPublishedAsset(input) {
        copiedPublishedAssets.set(input.destinationKey, {
          contentType: input.contentType,
          destinationKey: input.destinationKey,
          sourceBucket: input.sourceBucket,
          sourceKey: input.sourceKey
        });

        return {
          bucket: "ai-nft-forge-public",
          key: input.destinationKey
        };
      },
      async deletePublishedAsset(input) {
        copiedPublishedAssets.delete(input.key);
      }
    }
  });

  return {
    copiedPublishedAssets,
    draftItems,
    drafts,
    openReconciliationIssues,
    publicationItems,
    publicationTargets,
    publications,
    verifiedDeploymentTransactions,
    verifiedMintTransactions,
    setGeneratedAssetModeration(
      generatedAssetId: string,
      moderationStatus: "approved" | "pending_review" | "rejected"
    ) {
      const asset = generatedAssets.get(generatedAssetId);

      if (!asset) {
        throw new Error("Generated asset was not found in the test harness.");
      }

      generatedAssets.set(generatedAssetId, {
        ...asset,
        moderatedAt:
          moderationStatus === "pending_review" ? null : nextDate(),
        moderationStatus
      });
    },
    setPublicationTarget(
      ownerUserId: string,
      target: {
        name: string;
        slug: string;
      } | null
    ) {
      if (!target) {
        publicationTargets.delete(ownerUserId);
        return;
      }

      publicationTargets.set(ownerUserId, target);
    },
    pushOpenOnchainIssue(issue: {
      detailJson: unknown;
      kind:
        | "published_contract_deployment_unverified"
        | "published_contract_metadata_mismatch"
        | "published_contract_missing_onchain"
        | "published_contract_owner_mismatch"
        | "published_token_mint_unverified"
        | "published_token_owner_mismatch";
    }) {
      openReconciliationIssues.push(issue);
    },
    service
  };
}

describe("createCollectionDraftService", () => {
  it("creates a collection draft with a generated owner-scoped slug", async () => {
    const harness = createCollectionDraftHarness();

    const result = await harness.service.createCollectionDraft({
      description: " First pass release set ",
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    expect(result.draft.slug).toBe("genesis-portrait-set");
    expect(result.draft.description).toBe("First pass release set");
    expect(result.draft.status).toBe("draft");
    expect(result.draft.publication).toBeNull();
  });

  it("lists collection drafts with recent generated asset candidates", async () => {
    const harness = createCollectionDraftHarness();

    await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    const result = await harness.service.listCollectionDrafts({
      ownerUserId: "user_1"
    });

    expect(result.drafts).toHaveLength(1);
    expect(result.generatedAssetCandidates).toHaveLength(2);
    expect(result.generatedAssetCandidates[0]?.generatedAssetId).toBe(
      "generated_asset_2"
    );
    expect(result.generatedAssetCandidates[0]?.moderationStatus).toBe(
      "approved"
    );
    expect(result.publicationTarget).toEqual({
      brandName: "Demo Studio",
      brandSlug: "demo-studio",
      publicBrandPath: "/brands/demo-studio"
    });
  });

  it("rejects curation for generated assets that are still pending review", async () => {
    const harness = createCollectionDraftHarness();
    const draft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    harness.setGeneratedAssetModeration(
      "generated_asset_1",
      "pending_review"
    );

    await expect(
      harness.service.addCollectionDraftItem({
        collectionDraftId: draft.draft.id,
        generatedAssetId: "generated_asset_1",
        ownerUserId: "user_1"
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "GENERATED_ASSET_NOT_APPROVED",
        "Only approved generated assets can be added to a collection draft.",
        409
      )
    );
  });

  it("requires at least one curated generated asset before review-ready status", async () => {
    const harness = createCollectionDraftHarness();
    const draft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await expect(
      harness.service.updateCollectionDraft({
        collectionDraftId: draft.draft.id,
        description: null,
        ownerUserId: "user_1",
        slug: draft.draft.slug,
        status: "review_ready",
        title: draft.draft.title
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "DRAFT_NOT_READY",
        "Collection draft needs at least one curated generated asset before it can be marked review-ready.",
        409
      )
    );
  });

  it("supports curation, reorder, and review-ready transitions", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_2",
      ownerUserId: "user_1"
    });
    const reorderedDraft = await harness.service.reorderCollectionDraftItems({
      collectionDraftId: createdDraft.draft.id,
      itemIds: ["draft_item_2", "draft_item_1"],
      ownerUserId: "user_1"
    });
    const updatedDraft = await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: "Release candidate set",
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: "Genesis Portrait Set"
    });

    expect(reorderedDraft.draft.items[0]?.generatedAsset.generatedAssetId).toBe(
      "generated_asset_2"
    );
    expect(updatedDraft.draft.status).toBe("review_ready");
    expect(updatedDraft.draft.itemCount).toBe(2);
  });

  it("blocks review-ready transitions when curated assets are no longer approved", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    harness.setGeneratedAssetModeration("generated_asset_1", "rejected");

    await expect(
      harness.service.updateCollectionDraft({
        collectionDraftId: createdDraft.draft.id,
        description: null,
        ownerUserId: "user_1",
        slug: createdDraft.draft.slug,
        status: "review_ready",
        title: createdDraft.draft.title
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "GENERATED_ASSET_NOT_APPROVED",
        "Only approved generated assets can move a collection draft to review-ready.",
        409
      )
    );
  });

  it("publishes a review-ready draft to a public route snapshot", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: "Release candidate set",
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });

    const result = await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    expect(result.draft.publication?.publicPath).toBe(
      "/brands/demo-studio/collections/genesis-portrait-set"
    );
    expect(harness.publications.size).toBe(1);
    expect(harness.publicationItems.size).toBe(1);
    expect(harness.copiedPublishedAssets.size).toBe(1);
    expect(
      [...harness.publicationItems.values()][0]?.publicStorageObjectKey
    ).toBe(
      "published-collections/draft_1/items/001-generated_asset_1-portrait-1.png"
    );
  });

  it("blocks publication when a curated generated asset is no longer approved", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: "Release candidate set",
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    harness.setGeneratedAssetModeration("generated_asset_1", "rejected");

    await expect(
      harness.service.publishCollectionDraft({
        collectionDraftId: createdDraft.draft.id,
        ownerUserId: "user_1"
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "GENERATED_ASSET_NOT_APPROVED",
        "Only approved generated assets can be published in a collection.",
        409
      )
    );
  });

  it("rejects publication when another draft already owns the same public route", async () => {
    const harness = createCollectionDraftHarness();
    const firstDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });
    const secondDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_2",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: firstDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.addCollectionDraftItem({
      collectionDraftId: secondDraft.draft.id,
      generatedAssetId: "generated_asset_3",
      ownerUserId: "user_2"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: firstDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: "foundation",
      status: "review_ready",
      title: firstDraft.draft.title
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: secondDraft.draft.id,
      description: null,
      ownerUserId: "user_2",
      slug: "foundation",
      status: "review_ready",
      title: secondDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: firstDraft.draft.id,
      ownerUserId: "user_1"
    });

    await expect(
      harness.service.publishCollectionDraft({
        collectionDraftId: secondDraft.draft.id,
        ownerUserId: "user_2"
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "COLLECTION_PUBLICATION_CONFLICT",
        "Another published collection already uses this public route.",
        409
      )
    );
  });

  it("republishes an existing published draft with refreshed metadata and items", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: "Release candidate set",
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    const firstPublication = await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_2",
      ownerUserId: "user_1"
    });

    harness.setPublicationTarget("user_1", {
      name: "Premium Studio",
      slug: "premium-studio"
    });

    const secondPublication = await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    expect(firstPublication.draft.publication?.id).toBe(
      secondPublication.draft.publication?.id
    );
    expect(secondPublication.draft.publication?.brandSlug).toBe(
      "premium-studio"
    );
    expect(harness.publications.size).toBe(1);
    expect(harness.publicationItems.size).toBe(2);
    expect(harness.copiedPublishedAssets.size).toBe(2);
  });

  it("unpublishes a published collection draft", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    const result = await harness.service.unpublishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    expect(result.draft.publication).toBeNull();
    expect(harness.publications.size).toBe(0);
    expect(harness.publicationItems.size).toBe(0);
    expect(harness.copiedPublishedAssets.size).toBe(0);
  });

  it("returns a draft to draft status and clears publication when the last curated item is removed", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    const curatedDraft = await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });

    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    const result = await harness.service.removeCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      itemId: curatedDraft.draft.items[0]!.id,
      ownerUserId: "user_1"
    });

    expect(result.draft.itemCount).toBe(0);
    expect(result.draft.status).toBe("draft");
    expect(result.draft.publication).toBeNull();
    expect(harness.drafts.get(createdDraft.draft.id)?.status).toBe("draft");
    expect(harness.publications.size).toBe(0);
    expect(harness.copiedPublishedAssets.size).toBe(0);
  });

  it("requires studio settings before publication", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    harness.setPublicationTarget("user_1", null);

    await expect(
      harness.service.publishCollectionDraft({
        collectionDraftId: createdDraft.draft.id,
        ownerUserId: "user_1"
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "STUDIO_SETTINGS_REQUIRED",
        "Studio settings must define a brand profile before collection publication.",
        409
      )
    );
  });

  it(
    "prepares a deployment intent and records a verified contract deployment",
    async () => {
      const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    const intent = await harness.service.createCollectionContractDeploymentIntent(
      {
        chainKey: "base-sepolia",
        collectionDraftId: createdDraft.draft.id,
        origin: "https://forge.example",
        ownerUserId: "user_1",
        ownerWalletAddress: "0x1111111111111111111111111111111111111111"
      }
    );
    const result = await harness.service.recordCollectionContractDeployment({
      chainKey: "base-sepolia",
      collectionDraftId: createdDraft.draft.id,
      deployTxHash: `0x${"a".repeat(64)}`,
      origin: "https://forge.example",
      ownerUserId: "user_1",
      ownerWalletAddress: "0x1111111111111111111111111111111111111111"
    });

    expect(intent.deployment.transaction.to).toBeNull();
    expect(result.draft.publication?.activeDeployment).toMatchObject({
      chain: {
        key: "base-sepolia"
      },
      contractAddress: "0x1111111111111111111111111111111111111111",
      deployTxHash: `0x${"a".repeat(64)}`
    });
    expect(harness.verifiedDeploymentTransactions[0]).toMatchObject({
      chainKey: "base-sepolia",
      deployTxHash: `0x${"a".repeat(64)}`,
      expectedContractName: "Demo Studio Genesis Portrait Set",
      expectedContractSymbol: "DEMOGENESIS",
      expectedOwnerWalletAddress: "0x1111111111111111111111111111111111111111",
      expectedTokenUriBaseUrl:
        "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/token-uri"
    });
      expect(
        harness.verifiedDeploymentTransactions[0]?.expectedDeploymentData
      ).toBe(intent.deployment.transaction.data);
    },
    15_000
  );

  it("prepares a mint intent and records a verified mint", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });
    await harness.service.recordCollectionContractDeployment({
      chainKey: "base-sepolia",
      collectionDraftId: createdDraft.draft.id,
      deployTxHash: `0x${"b".repeat(64)}`,
      origin: "https://forge.example",
      ownerUserId: "user_1",
      ownerWalletAddress: "0x1111111111111111111111111111111111111111"
    });

    const intent = await harness.service.createCollectionContractMintIntent({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1",
      recipientWalletAddress: "0x2222222222222222222222222222222222222222",
      tokenId: 1
    });
    const result = await harness.service.recordCollectionContractMint({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1",
      ownerWalletAddress: "0x1111111111111111111111111111111111111111",
      recipientWalletAddress: "0x2222222222222222222222222222222222222222",
      tokenId: 1,
      txHash: `0x${"c".repeat(64)}`
    });

    expect(intent.mint.transaction.to).toBe(
      "0x1111111111111111111111111111111111111111"
    );
    expect(result.draft.publication?.mintedTokenCount).toBe(1);
    expect(result.draft.publication?.mints[0]).toMatchObject({
      recipientWalletAddress: "0x2222222222222222222222222222222222222222",
      tokenId: 1,
      txHash: `0x${"c".repeat(64)}`
    });
    expect(harness.verifiedMintTransactions[0]).toMatchObject({
      chainKey: "base-sepolia",
      contractAddress: "0x1111111111111111111111111111111111111111",
      expectedOwnerWalletAddress: "0x1111111111111111111111111111111111111111",
      recipientWalletAddress: "0x2222222222222222222222222222222222222222",
      tokenId: 1,
      txHash: `0x${"c".repeat(64)}`
    });
    expect(harness.verifiedMintTransactions[0]?.expectedMintData).toBe(
      intent.mint.transaction.data
    );
  });

  it("blocks mint intent while open onchain reconciliation issues exist", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });
    await harness.service.recordCollectionContractDeployment({
      chainKey: "base-sepolia",
      collectionDraftId: createdDraft.draft.id,
      deployTxHash: `0x${"d".repeat(64)}`,
      origin: "https://forge.example",
      ownerUserId: "user_1",
      ownerWalletAddress: "0x1111111111111111111111111111111111111111"
    });

    const publication = [...harness.publications.values()][0]!;

    harness.pushOpenOnchainIssue({
      detailJson: {
        publishedCollectionId: publication.id
      },
      kind: "published_contract_missing_onchain"
    });

    await expect(
      harness.service.createCollectionContractMintIntent({
        collectionDraftId: createdDraft.draft.id,
        ownerUserId: "user_1",
        recipientWalletAddress: "0x2222222222222222222222222222222222222222",
        tokenId: 1
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "ONCHAIN_RECONCILIATION_REQUIRED",
        "Resolve the open onchain reconciliation issues for this published collection before minting additional tokens.",
        409
      )
    );
  });

  it("blocks mint recording while open onchain reconciliation issues exist", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });
    await harness.service.recordCollectionContractDeployment({
      chainKey: "base-sepolia",
      collectionDraftId: createdDraft.draft.id,
      deployTxHash: `0x${"e".repeat(64)}`,
      origin: "https://forge.example",
      ownerUserId: "user_1",
      ownerWalletAddress: "0x1111111111111111111111111111111111111111"
    });

    const publication = [...harness.publications.values()][0]!;

    harness.pushOpenOnchainIssue({
      detailJson: {
        publishedCollectionId: publication.id
      },
      kind: "published_contract_owner_mismatch"
    });

    await expect(
      harness.service.recordCollectionContractMint({
        collectionDraftId: createdDraft.draft.id,
        ownerUserId: "user_1",
        ownerWalletAddress: "0x1111111111111111111111111111111111111111",
        recipientWalletAddress: "0x2222222222222222222222222222222222222222",
        tokenId: 1,
        txHash: `0x${"f".repeat(64)}`
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "ONCHAIN_RECONCILIATION_REQUIRED",
        "Resolve the open onchain reconciliation issues for this published collection before minting additional tokens.",
        409
      )
    );
  });

  it("blocks unpublish after verified onchain deployment is recorded", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });
    await harness.service.recordCollectionContractDeployment({
      chainKey: "base-sepolia",
      collectionDraftId: createdDraft.draft.id,
      deployTxHash: `0x${"d".repeat(64)}`,
      origin: "https://forge.example",
      ownerUserId: "user_1",
      ownerWalletAddress: "0x1111111111111111111111111111111111111111"
    });

    await expect(
      harness.service.unpublishCollectionDraft({
        collectionDraftId: createdDraft.draft.id,
        ownerUserId: "user_1"
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "ONCHAIN_COLLECTION_IMMUTABLE",
        "Published collections with recorded deployment or mint activity can no longer be republished or unpublished.",
        409
      )
    );
  });

  it("stores storefront merchandising on the published snapshot", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_2",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: "Release candidate set",
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    const result =
      await harness.service.updateCollectionPublicationMerchandising({
        collectionDraftId: createdDraft.draft.id,
        displayOrder: 4,
        endAt: "2026-04-20T12:00:00.000Z",
        heroGeneratedAssetId: "generated_asset_2",
        isFeatured: true,
        launchAt: "2026-04-10T12:00:00.000Z",
        ownerUserId: "user_1",
        priceAmountMinor: 1800,
        priceCurrency: "usd",
        priceLabel: "0.18 ETH",
        primaryCtaHref: "https://example.com/mint",
        primaryCtaLabel: "Enter mint",
        secondaryCtaHref: "https://example.com/lookbook",
        secondaryCtaLabel: "View lookbook",
        soldCount: 3,
        storefrontBody: "Launch-ready collectible release.",
        storefrontHeadline: "Genesis Portrait Set",
        storefrontStatus: "live",
        totalSupply: 10
      });

    expect(result.draft.publication).toMatchObject({
      displayOrder: 4,
      heroGeneratedAssetId: "generated_asset_2",
      isFeatured: true,
      priceAmountMinor: 1800,
      priceCurrency: "usd",
      priceLabel: "0.18 ETH",
      primaryCtaLabel: "Enter mint",
      remainingSupply: 7,
      secondaryCtaLabel: "View lookbook",
      soldCount: 3,
      storefrontHeadline: "Genesis Portrait Set",
      storefrontStatus: "live",
      totalSupply: 10
    });
    expect(harness.publications.values().next().value).toMatchObject({
      heroGeneratedAssetId: "generated_asset_2",
      soldCount: 3,
      storefrontStatus: "live"
    });
  });

  it("rejects a storefront hero asset that is not part of the published snapshot", async () => {
    const harness = createCollectionDraftHarness();
    const createdDraft = await harness.service.createCollectionDraft({
      ownerUserId: "user_1",
      title: "Genesis Portrait Set"
    });

    await harness.service.addCollectionDraftItem({
      collectionDraftId: createdDraft.draft.id,
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });
    await harness.service.updateCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      description: null,
      ownerUserId: "user_1",
      slug: createdDraft.draft.slug,
      status: "review_ready",
      title: createdDraft.draft.title
    });
    await harness.service.publishCollectionDraft({
      collectionDraftId: createdDraft.draft.id,
      ownerUserId: "user_1"
    });

    await expect(
      harness.service.updateCollectionPublicationMerchandising({
        collectionDraftId: createdDraft.draft.id,
        displayOrder: 0,
        endAt: null,
        heroGeneratedAssetId: "generated_asset_missing",
        isFeatured: false,
        launchAt: null,
        ownerUserId: "user_1",
        priceAmountMinor: null,
        priceCurrency: null,
        priceLabel: null,
        primaryCtaHref: null,
        primaryCtaLabel: null,
        secondaryCtaHref: null,
        secondaryCtaLabel: null,
        soldCount: 0,
        storefrontBody: null,
        storefrontHeadline: null,
        storefrontStatus: "ended",
        totalSupply: null
      })
    ).rejects.toEqual(
      new CollectionDraftServiceError(
        "INVALID_REQUEST",
        "Selected storefront hero asset is not part of the published collection snapshot.",
        400
      )
    );
  });
});
