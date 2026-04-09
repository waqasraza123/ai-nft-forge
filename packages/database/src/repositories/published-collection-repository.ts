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
  }
};

const publishedCollectionPreviewInclude = {
  _count: {
    select: {
      items: true
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
      storefrontStatus?: "ended" | "live" | "sold_out" | "upcoming";
      totalSupply?: number | null;
      title: string;
    }): Promise<PublishedCollection> {
      return database.publishedCollection.create({
        data: input
      });
    },

    findByDraftIdForOwner(input: {
      ownerUserId: string;
      sourceCollectionDraftId: string;
    }): Promise<PublishedCollection | null> {
      return database.publishedCollection.findFirst({
        where: {
          ownerUserId: input.ownerUserId,
          sourceCollectionDraftId: input.sourceCollectionDraftId
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

    findByBrandSlugAndCollectionSlug(input: {
      brandSlug: string;
      slug: string;
    }): Promise<PublishedCollection | null> {
      return database.publishedCollection.findUnique({
        where: {
          brandSlug_slug: {
            brandSlug: input.brandSlug,
            slug: input.slug
          }
        }
      });
    },

    listByOwnerUserId(ownerUserId: string): Promise<PublishedCollection[]> {
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
          ownerUserId
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
    }
  };
}

export type PublishedCollectionRepository = ReturnType<
  typeof createPublishedCollectionRepository
>;
