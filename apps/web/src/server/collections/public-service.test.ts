import { describe, expect, it } from "vitest";

import { createPublicCollectionService } from "./public-service";

function createPreviewRecord(input: {
  contractAddress?: string | null;
  contractChainKey?: string | null;
  contractDeployedAt?: string | null;
  contractDeployTxHash?: string | null;
  displayOrder: number;
  heroGeneratedAssetId?: string | null;
  isFeatured?: boolean;
  itemCount?: number;
  launchAt?: string | null;
  priceLabel?: string | null;
  slug: string;
  soldCount?: number;
  storefrontHeadline?: string | null;
  storefrontStatus: "ended" | "live" | "sold_out" | "upcoming";
  title: string;
  totalSupply?: number | null;
}) {
  return {
    _count: {
      items: input.itemCount ?? 2,
      mints: 0
    },
    contractAddress: input.contractAddress ?? null,
    contractChainKey: input.contractChainKey ?? null,
    contractDeployedAt: input.contractDeployedAt
      ? new Date(input.contractDeployedAt)
      : null,
    contractDeployTxHash: input.contractDeployTxHash ?? null,
    description: `${input.title} description`,
    displayOrder: input.displayOrder,
    endAt: null,
    heroGeneratedAssetId: input.heroGeneratedAssetId ?? null,
    isFeatured: input.isFeatured ?? false,
    items: [
      {
        generatedAsset: {
          generationRequest: {
            pipelineKey: "collectible-portrait-v1",
            sourceAsset: {
              originalFilename: `${input.slug}-1.png`
            }
          },
          id: `${input.slug}_asset_1`,
          storageBucket: "ai-nft-forge-private",
          storageObjectKey: `generated-assets/${input.slug}/variant-1.png`,
          variantIndex: 1
        },
        publicStorageBucket: "ai-nft-forge-public",
        publicStorageObjectKey: `published-collections/${input.slug}/001.png`
      },
      {
        generatedAsset: {
          generationRequest: {
            pipelineKey: "collectible-portrait-v1",
            sourceAsset: {
              originalFilename: `${input.slug}-2.png`
            }
          },
          id: `${input.slug}_asset_2`,
          storageBucket: "ai-nft-forge-private",
          storageObjectKey: `generated-assets/${input.slug}/variant-2.png`,
          variantIndex: 2
        },
        publicStorageBucket: "ai-nft-forge-public",
        publicStorageObjectKey: `published-collections/${input.slug}/002.png`
      }
    ],
    launchAt: input.launchAt ? new Date(input.launchAt) : null,
    priceLabel: input.priceLabel ?? null,
    publishedAt: new Date("2026-04-08T00:30:00.000Z"),
    slug: input.slug,
    soldCount: input.soldCount ?? 0,
    storefrontHeadline: input.storefrontHeadline ?? null,
    storefrontStatus: input.storefrontStatus,
    title: input.title,
    totalSupply: input.totalSupply ?? null,
    updatedAt: new Date("2026-04-08T00:35:00.000Z")
  };
}

function createDetailedRecord(input?: {
  contractAddress?: string | null;
  contractChainKey?: string | null;
  contractDeployedAt?: string | null;
  contractDeployTxHash?: string | null;
  heroGeneratedAssetId?: string | null;
  launchAt?: string | null;
  priceLabel?: string | null;
  primaryCtaHref?: string | null;
  primaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  soldCount?: number;
  storefrontBody?: string | null;
  storefrontHeadline?: string | null;
  storefrontStatus?: "ended" | "live" | "sold_out" | "upcoming";
  totalSupply?: number | null;
}) {
  return {
    brandName: "Demo Studio",
    brandSlug: "demo-studio",
    contractAddress: input?.contractAddress ?? null,
    contractChainKey: input?.contractChainKey ?? null,
    contractDeployedAt: input?.contractDeployedAt
      ? new Date(input.contractDeployedAt)
      : null,
    contractDeployTxHash: input?.contractDeployTxHash ?? null,
    description: "Release-ready portrait set",
    endAt: null,
    heroGeneratedAssetId:
      input?.heroGeneratedAssetId === undefined
        ? "generated_asset_2"
        : input.heroGeneratedAssetId,
    items: [
      {
        generatedAsset: {
          generationRequest: {
            pipelineKey: "collectible-portrait-v1",
            sourceAsset: {
              originalFilename: "portrait-1.png"
            }
          },
          id: "generated_asset_1",
          storageBucket: "ai-nft-forge-private",
          storageObjectKey:
            "generated-assets/user_1/generation_1/variant-01.png",
          variantIndex: 1
        },
        position: 1,
        publicStorageBucket: "ai-nft-forge-public",
        publicStorageObjectKey:
          "published-collections/draft_1/items/001-generated_asset_1-portrait-1.png"
      },
      {
        generatedAsset: {
          generationRequest: {
            pipelineKey: "collectible-portrait-v1",
            sourceAsset: {
              originalFilename: "portrait-2.png"
            }
          },
          id: "generated_asset_2",
          storageBucket: "ai-nft-forge-private",
          storageObjectKey:
            "generated-assets/user_1/generation_1/variant-02.png",
          variantIndex: 2
        },
        position: 2,
        publicStorageBucket: "ai-nft-forge-public",
        publicStorageObjectKey:
          "published-collections/draft_1/items/002-generated_asset_2-portrait-2.png"
      }
    ],
    launchAt: input?.launchAt ? new Date(input.launchAt) : null,
    priceLabel: input?.priceLabel === undefined ? "0.18 ETH" : input.priceLabel,
    primaryCtaHref:
      input?.primaryCtaHref === undefined
        ? "https://example.com/mint"
        : input.primaryCtaHref,
    primaryCtaLabel:
      input?.primaryCtaLabel === undefined
        ? "Enter mint"
        : input.primaryCtaLabel,
    publishedAt: new Date("2026-04-08T00:30:00.000Z"),
    secondaryCtaHref:
      input?.secondaryCtaHref === undefined
        ? "https://example.com/lookbook"
        : input.secondaryCtaHref,
    secondaryCtaLabel:
      input?.secondaryCtaLabel === undefined
        ? "View lookbook"
        : input.secondaryCtaLabel,
    slug: "genesis-portrait-set",
    soldCount: input?.soldCount ?? 7,
    mints: [],
    storefrontBody:
      input?.storefrontBody === undefined
        ? "A launch-ready collectible portrait release with curated hero artwork."
        : input.storefrontBody,
    storefrontHeadline:
      input?.storefrontHeadline === undefined
        ? "Genesis Portrait Set"
        : input.storefrontHeadline,
    storefrontStatus: input?.storefrontStatus ?? "live",
    title: "Genesis Portrait Set",
    totalSupply: input?.totalSupply === undefined ? 10 : input.totalSupply,
    updatedAt: new Date("2026-04-08T00:35:00.000Z")
  };
}

function createPublicCollectionHarness() {
  const previews = [
    createPreviewRecord({
      displayOrder: 0,
      heroGeneratedAssetId: "genesis-portrait-set_asset_2",
      isFeatured: true,
      launchAt: "2026-04-08T00:30:00.000Z",
      priceLabel: "0.18 ETH",
      slug: "genesis-portrait-set",
      soldCount: 7,
      storefrontHeadline: "Genesis Portrait Set",
      storefrontStatus: "live",
      title: "Genesis Portrait Set",
      totalSupply: 10
    }),
    createPreviewRecord({
      displayOrder: 1,
      launchAt: "2026-04-10T12:00:00.000Z",
      slug: "night-run",
      storefrontStatus: "upcoming",
      title: "Night Run"
    }),
    createPreviewRecord({
      displayOrder: 2,
      slug: "afterglow",
      storefrontStatus: "ended",
      title: "Afterglow"
    }),
    createPreviewRecord({
      displayOrder: 3,
      slug: "closed-edition",
      soldCount: 12,
      storefrontStatus: "sold_out",
      title: "Closed Edition",
      totalSupply: 12
    })
  ];

  const service = createPublicCollectionService({
    repositories: {
      brandRepository: {
        async findFirstBySlug(slug) {
          if (slug !== "demo-studio") {
            return null;
          }

          return {
            customDomain: "collections.demo.example",
            name: "Demo Studio",
            slug: "demo-studio",
            themeJson: {
              accentColor: "#244f3c",
              featuredReleaseLabel: "Spotlight release",
              heroKicker: "Season three launch",
              landingDescription:
                "Limited portrait drops published from curated generated sets.",
              landingHeadline: "Collectible portrait releases",
              primaryCtaLabel: "Open spotlight",
              secondaryCtaLabel: "Browse archive",
              storyBody:
                "Each release is merchandised from published snapshots so launch pages stay stable after publication.",
              storyHeadline: "A release-led storefront for collectible drops.",
              themePreset: "midnight_launch",
              wordmark: "Demo Editions"
            }
          };
        }
      },
      publishedCollectionRepository: {
        async findDetailedByBrandSlugAndCollectionSlug(input) {
          if (
            input.brandSlug !== "demo-studio" ||
            input.slug !== "genesis-portrait-set"
          ) {
            return null;
          }

          return createDetailedRecord();
        },

        async listPreviewByBrandSlug(brandSlug) {
          if (brandSlug !== "demo-studio") {
            return [];
          }

          return previews;
        }
      }
    },
    storage: {
      async createDownloadDescriptor(input) {
        return {
          expiresAt: "2026-04-08T00:45:00.000Z",
          method: "GET" as const,
          url: `http://127.0.0.1:59000/${input.bucket}/${input.key}`
        };
      },
      createPublicUrl(input) {
        return `http://127.0.0.1:59000/${input.bucket}/${input.key}`;
      }
    }
  });

  return {
    previews,
    service
  };
}

describe("createPublicCollectionService", () => {
  it("groups public brand releases and resolves the configured storefront theme", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicBrandBySlug({
      brandSlug: "demo-studio"
    });

    expect(result?.brand.theme.themePreset).toBe("midnight_launch");
    expect(result?.brand.theme.wordmark).toBe("Demo Editions");
    expect(result?.brand.theme.storyHeadline).toBe(
      "A release-led storefront for collectible drops."
    );
    expect(result?.brand.collectionCount).toBe(4);
    expect(result?.brand.featuredRelease?.collectionSlug).toBe(
      "genesis-portrait-set"
    );
    expect(result?.brand.liveReleases).toHaveLength(0);
    expect(result?.brand.upcomingReleases).toHaveLength(1);
    expect(result?.brand.archiveReleases).toHaveLength(2);
    expect(result?.brand.collections[0]?.heroImageUrl).toContain(
      "published-collections/genesis-portrait-set/002.png"
    );
    expect(result?.brand.collections[0]?.availabilityLabel).toBe(
      "3 remaining of 10"
    );
  });

  it("returns null when the public brand route is not configured", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicBrandBySlug({
      brandSlug: "missing-brand"
    });

    expect(result).toBeNull();
  });

  it("falls back to default storefront copy for older brand themes", async () => {
    const service = createPublicCollectionService({
      repositories: {
        brandRepository: {
          async findFirstBySlug() {
            return {
              customDomain: null,
              name: "Legacy Studio",
              slug: "legacy-studio",
              themeJson: {
                accentColor: "#1f4a6b"
              }
            };
          }
        },
        publishedCollectionRepository: {
          async findDetailedByBrandSlugAndCollectionSlug() {
            return null;
          },
          async listPreviewByBrandSlug() {
            return [];
          }
        }
      },
      storage: {
        async createDownloadDescriptor(input) {
          return {
            expiresAt: "2026-04-08T00:45:00.000Z",
            method: "GET" as const,
            url: `http://127.0.0.1:59000/${input.bucket}/${input.key}`
          };
        },
        createPublicUrl(input) {
          return `http://127.0.0.1:59000/${input.bucket}/${input.key}`;
        }
      }
    });

    const result = await service.getPublicBrandBySlug({
      brandSlug: "legacy-studio"
    });

    expect(result?.brand.theme.themePreset).toBe("editorial_warm");
    expect(result?.brand.theme.wordmark).toBeNull();
    expect(result?.brand.theme.storyHeadline).toBeNull();
    expect(result?.brand.theme.landingHeadline).toBe(
      "Published collection releases"
    );
  });

  it("resolves a public collection page with hero selection, CTAs, and availability summaries", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicCollectionBySlugs({
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set"
    });

    expect(result?.collection.heroGeneratedAssetId).toBe("generated_asset_2");
    expect(result?.collection.heroImageUrl).toContain(
      "002-generated_asset_2-portrait-2.png"
    );
    expect(result?.collection.remainingSupply).toBe(3);
    expect(result?.collection.availabilityLabel).toBe("3 remaining of 10");
    expect(result?.collection.primaryCtaLabel).toBe("Enter mint");
    expect(result?.collection.secondaryCtaHref).toBe(
      "https://example.com/lookbook"
    );
    expect(result?.collection.relatedCollections).toHaveLength(3);
    expect(result?.collection.relatedCollections[0]?.collectionSlug).toBe(
      "night-run"
    );
  });

  it("falls back to the first published item when no explicit hero asset is stored", async () => {
    const service = createPublicCollectionService({
      repositories: {
        brandRepository: {
          async findFirstBySlug() {
            return {
              customDomain: null,
              name: "Demo Studio",
              slug: "demo-studio",
              themeJson: {
                accentColor: "#244f3c"
              }
            };
          }
        },
        publishedCollectionRepository: {
          async findDetailedByBrandSlugAndCollectionSlug() {
            return createDetailedRecord({
              heroGeneratedAssetId: null,
              primaryCtaHref: null,
              primaryCtaLabel: null,
              secondaryCtaHref: null,
              secondaryCtaLabel: null,
              storefrontStatus: "upcoming",
              totalSupply: null
            });
          },
          async listPreviewByBrandSlug() {
            return [];
          }
        }
      },
      storage: {
        async createDownloadDescriptor(input) {
          return {
            expiresAt: "2026-04-08T00:45:00.000Z",
            method: "GET" as const,
            url: `http://127.0.0.1:59000/${input.bucket}/${input.key}`
          };
        },
        createPublicUrl(input) {
          return `http://127.0.0.1:59000/${input.bucket}/${input.key}`;
        }
      }
    });

    const result = await service.getPublicCollectionBySlugs({
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set"
    });

    expect(result?.collection.heroImageUrl).toContain(
      "001-generated_asset_1-portrait-1.png"
    );
    expect(result?.collection.availabilityLabel).toBe("Upcoming release");
    expect(result?.collection.primaryCtaLabel).toBeNull();
  });

  it("resolves metadata and contract manifests from the published snapshot", async () => {
    const harness = createPublicCollectionHarness();

    const manifest =
      await harness.service.getPublicCollectionMetadataManifestBySlugs({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set"
      });
    const metadata =
      await harness.service.getPublicCollectionMetadataItemBySlugs({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        editionNumber: 1
      });
    const contract = await harness.service.getPublicCollectionContractBySlugs({
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://forge.example"
    });

    expect(manifest?.metadata.itemCount).toBe(2);
    expect(metadata?.metadata.name).toBe("Genesis Portrait Set #1");
    expect(contract?.contract.tokenUriExampleUrl).toBe(
      "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/token-uri/1"
    );
  });

  it("falls back to signed private URLs when a legacy publication has no public asset copy", async () => {
    const service = createPublicCollectionService({
      repositories: {
        brandRepository: {
          async findFirstBySlug() {
            return {
              customDomain: null,
              name: "Legacy Studio",
              slug: "legacy-studio",
              themeJson: {
                accentColor: "#1f4a6b"
              }
            };
          }
        },
        publishedCollectionRepository: {
          async findDetailedByBrandSlugAndCollectionSlug() {
            return {
              ...createDetailedRecord({
                heroGeneratedAssetId: null,
                priceLabel: null,
                primaryCtaHref: null,
                primaryCtaLabel: null,
                secondaryCtaHref: null,
                secondaryCtaLabel: null,
                storefrontStatus: "ended",
                totalSupply: null
              }),
              brandName: "Legacy Studio",
              brandSlug: "legacy-studio",
              items: [
                {
                  generatedAsset: {
                    generationRequest: {
                      pipelineKey: "collectible-portrait-v1",
                      sourceAsset: {
                        originalFilename: "legacy.png"
                      }
                    },
                    id: "generated_asset_legacy",
                    storageBucket: "ai-nft-forge-private",
                    storageObjectKey: "generated-assets/user_1/legacy.png",
                    variantIndex: 1
                  },
                  position: 1,
                  publicStorageBucket: null,
                  publicStorageObjectKey: null
                }
              ],
              slug: "legacy-release",
              title: "Legacy Release"
            };
          },
          async listPreviewByBrandSlug() {
            return [];
          }
        }
      },
      storage: {
        async createDownloadDescriptor(input) {
          return {
            expiresAt: "2026-04-08T00:45:00.000Z",
            method: "GET" as const,
            url: `http://127.0.0.1:59000/${input.bucket}/${input.key}`
          };
        },
        createPublicUrl(input) {
          return `http://127.0.0.1:59000/${input.bucket}/${input.key}`;
        }
      }
    });

    const result = await service.getPublicCollectionBySlugs({
      brandSlug: "legacy-studio",
      collectionSlug: "legacy-release"
    });

    expect(result?.collection.items[0]?.imageUrl).toContain(
      "generated-assets/user_1/legacy.png"
    );
    expect(result?.collection.items[0]?.imageUrlExpiresAt).toBe(
      "2026-04-08T00:45:00.000Z"
    );
    expect(result?.collection.availabilityLabel).toBe("Archived release");
  });
});
