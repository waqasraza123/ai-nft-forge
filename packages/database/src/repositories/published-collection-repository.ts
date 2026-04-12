import type { PublishedCollection } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type PublishedCollectionRepositoryDatabase = Pick<
  DatabaseExecutor,
  "publishedCollection"
>;

const publishedCollectionItemOrderBy = [
  {
    position: "asc" as const
  },
  {
    id: "asc" as const
  }
];

const publishedCollectionMintOrderBy = [
  {
    mintedAt: "desc" as const
  },
  {
    id: "desc" as const
  }
];

const publishedCollectionSummaryInclude = {
  mints: {
    orderBy: publishedCollectionMintOrderBy
  }
};

const publishedCollectionDetailInclude = {
  items: {
    include: {
      generatedAsset: {
        include: {
          generationRequest: {
            select: {
              id: true,
              pipelineKey: true,
              sourceAsset: {
                select: {
                  id: true,
                  originalFilename: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: publishedCollectionItemOrderBy
  },
  mints: {
    orderBy: publishedCollectionMintOrderBy
  }
};

const publishedCollectionPreviewInclude = {
  _count: {
    select: {
      items: true,
      mints: true
    }
  },
  items: {
    include: {
      generatedAsset: {
        include: {
          generationRequest: {
            select: {
              pipelineKey: true,
              sourceAsset: {
                select: {
                  originalFilename: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: publishedCollectionItemOrderBy
  }
};

export function createPublishedCollectionRepository(
  database: PublishedCollectionRepositoryDatabase
) {
  return {
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
      contractDeployTxHash?: string | null;
      contractDeployedAt?: Date | null;
      contractTokenUriBaseUrl?: string | null;
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
      workspaceId: string;
    }): Promise<PublishedCollection> {
      return database.publishedCollection.create({
        data: input
      });
    },

    findByDraftIdForOwner(input: {
      ownerUserId: string;
      sourceCollectionDraftId: string;
    }) {
      return database.publishedCollection.findFirst({
        include: publishedCollectionSummaryInclude,
        where: {
          ownerUserId: input.ownerUserId,
          sourceCollectionDraftId: input.sourceCollectionDraftId
        }
      });
    },

    findByDraftIdForWorkspace(input: {
      sourceCollectionDraftId: string;
      workspaceId: string;
    }) {
      return database.publishedCollection.findFirst({
        include: publishedCollectionSummaryInclude,
        where: {
          sourceCollectionDraftId: input.sourceCollectionDraftId,
          workspaceId: input.workspaceId
        }
      });
    },

    findByIdForOwner(input: { id: string; ownerUserId: string }) {
      return database.publishedCollection.findFirst({
        include: publishedCollectionSummaryInclude,
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    findByIdForWorkspace(input: { id: string; workspaceId: string }) {
      return database.publishedCollection.findFirst({
        include: publishedCollectionSummaryInclude,
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    findDetailedByBrandSlugAndCollectionSlug(input: {
      brandSlug: string;
      slug: string;
    }) {
      return database.publishedCollection.findUnique({
        include: publishedCollectionDetailInclude,
        where: {
          brandSlug_slug: {
            brandSlug: input.brandSlug,
            slug: input.slug
          }
        }
      });
    },

    listDetailedByOwnerUserId(ownerUserId: string) {
      return database.publishedCollection.findMany({
        include: {
          items: {
            orderBy: publishedCollectionItemOrderBy
          },
          mints: {
            orderBy: [
              {
                mintedAt: "desc"
              },
              {
                id: "desc"
              }
            ]
          }
        },
        orderBy: [
          {
            updatedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          ownerUserId
        }
      });
    },

    listDetailedByWorkspaceId(workspaceId: string) {
      return database.publishedCollection.findMany({
        include: {
          items: {
            orderBy: publishedCollectionItemOrderBy
          },
          mints: {
            orderBy: [
              {
                mintedAt: "desc"
              },
              {
                id: "desc"
              }
            ]
          }
        },
        orderBy: [
          {
            updatedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          workspaceId
        }
      });
    },

    listByWorkspaceIds(workspaceIds: string[]) {
      if (workspaceIds.length === 0) {
        return Promise.resolve([]);
      }

      return database.publishedCollection.findMany({
        orderBy: [
          {
            updatedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          workspaceId: {
            in: workspaceIds
          }
        }
      });
    },

    findByBrandSlugAndCollectionSlug(input: {
      brandSlug: string;
      slug: string;
    }) {
      return database.publishedCollection.findUnique({
        include: publishedCollectionSummaryInclude,
        where: {
          brandSlug_slug: {
            brandSlug: input.brandSlug,
            slug: input.slug
          }
        }
      });
    },

    listByOwnerUserId(ownerUserId: string) {
      return database.publishedCollection.findMany({
        include: publishedCollectionSummaryInclude,
        orderBy: [
          {
            updatedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          ownerUserId
        }
      });
    },

    listByWorkspaceId(workspaceId: string) {
      return database.publishedCollection.findMany({
        include: publishedCollectionSummaryInclude,
        orderBy: [
          {
            updatedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          workspaceId
        }
      });
    },

    listPreviewByBrandSlug(brandSlug: string) {
      return database.publishedCollection.findMany({
        include: publishedCollectionPreviewInclude,
        orderBy: [
          {
            isFeatured: "desc"
          },
          {
            displayOrder: "asc"
          },
          {
            updatedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          brandSlug
        }
      });
    },

    deleteByDraftIdForOwner(input: {
      ownerUserId: string;
      sourceCollectionDraftId: string;
    }): Promise<PublishedCollection | null> {
      return database.publishedCollection
        .findFirst({
          where: {
            ownerUserId: input.ownerUserId,
            sourceCollectionDraftId: input.sourceCollectionDraftId
          }
        })
        .then((publication) => {
          if (!publication) {
            return null;
          }

          return database.publishedCollection.delete({
            where: {
              id: publication.id
            }
          });
        });
    },

    deleteByDraftIdForWorkspace(input: {
      sourceCollectionDraftId: string;
      workspaceId: string;
    }): Promise<PublishedCollection | null> {
      return database.publishedCollection
        .findFirst({
          where: {
            sourceCollectionDraftId: input.sourceCollectionDraftId,
            workspaceId: input.workspaceId
          }
        })
        .then((publication) => {
          if (!publication) {
            return null;
          }

          return database.publishedCollection.delete({
            where: {
              id: publication.id
            }
          });
        });
    },

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
      contractDeployTxHash?: string | null;
      contractDeployedAt?: Date | null;
      contractTokenUriBaseUrl?: string | null;
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
    }): Promise<PublishedCollection> {
      return database.publishedCollection
        .findFirst({
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then((publication) => {
          if (!publication) {
            throw new Error("Published collection was not found.");
          }

          return database.publishedCollection.update({
            data: {
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
              contractDeployTxHash:
                input.contractDeployTxHash === undefined
                  ? publication.contractDeployTxHash
                  : input.contractDeployTxHash,
              contractDeployedAt:
                input.contractDeployedAt === undefined
                  ? publication.contractDeployedAt
                  : input.contractDeployedAt,
              contractTokenUriBaseUrl:
                input.contractTokenUriBaseUrl === undefined
                  ? publication.contractTokenUriBaseUrl
                  : input.contractTokenUriBaseUrl,
              displayOrder: input.displayOrder ?? publication.displayOrder,
              description: input.description,
              endAt:
                input.endAt === undefined ? publication.endAt : input.endAt,
              heroGeneratedAssetId:
                input.heroGeneratedAssetId === undefined
                  ? publication.heroGeneratedAssetId
                  : input.heroGeneratedAssetId,
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
              slug: input.slug,
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
              title: input.title
            },
            where: {
              id: publication.id
            }
          });
        });
    },

    updateByIdForWorkspace(input: {
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
      contractDeployTxHash?: string | null;
      contractDeployedAt?: Date | null;
      contractTokenUriBaseUrl?: string | null;
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
      title: string;
      totalSupply?: number | null;
      workspaceId: string;
    }): Promise<PublishedCollection> {
      return database.publishedCollection
        .findFirst({
          where: {
            id: input.id,
            workspaceId: input.workspaceId
          }
        })
        .then((publication) => {
          if (!publication) {
            throw new Error("Published collection was not found.");
          }

          return database.publishedCollection.update({
            data: {
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
              contractDeployTxHash:
                input.contractDeployTxHash === undefined
                  ? publication.contractDeployTxHash
                  : input.contractDeployTxHash,
              contractDeployedAt:
                input.contractDeployedAt === undefined
                  ? publication.contractDeployedAt
                  : input.contractDeployedAt,
              contractTokenUriBaseUrl:
                input.contractTokenUriBaseUrl === undefined
                  ? publication.contractTokenUriBaseUrl
                  : input.contractTokenUriBaseUrl,
              displayOrder: input.displayOrder ?? publication.displayOrder,
              description: input.description,
              endAt:
                input.endAt === undefined ? publication.endAt : input.endAt,
              heroGeneratedAssetId:
                input.heroGeneratedAssetId === undefined
                  ? publication.heroGeneratedAssetId
                  : input.heroGeneratedAssetId,
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
              slug: input.slug,
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
              title: input.title,
              totalSupply:
                input.totalSupply === undefined
                  ? publication.totalSupply
                  : input.totalSupply
            },
            where: {
              id: publication.id
            }
          });
        });
    },

    updateCommerceById(input: {
      id: string;
      soldCount: number;
      storefrontStatus?: "ended" | "live" | "sold_out" | "upcoming";
    }): Promise<PublishedCollection> {
      const data: {
        soldCount: number;
        storefrontStatus?: "ended" | "live" | "sold_out" | "upcoming";
      } = {
        soldCount: input.soldCount
      };

      if (input.storefrontStatus !== undefined) {
        data.storefrontStatus = input.storefrontStatus;
      }

      return database.publishedCollection.update({
        data,
        where: {
          id: input.id
        }
      });
    }
  };
}

export type PublishedCollectionRepository = ReturnType<
  typeof createPublishedCollectionRepository
>;
