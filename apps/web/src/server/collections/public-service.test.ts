import { describe, expect, it } from "vitest";

import { createPublicCollectionService } from "./public-service";

function createPublicCollectionHarness() {
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
              landingDescription:
                "Limited portrait drops published from curated generated sets.",
              landingHeadline: "Collectible portrait releases"
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

          return {
            brandName: "Demo Studio",
            brandSlug: "demo-studio",
            description: "Release-ready portrait set",
            items: [
              {
                publicStorageBucket: "ai-nft-forge-public",
                publicStorageObjectKey:
                  "published-collections/draft_1/items/001-generated_asset_1-portrait-1.png",
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
                position: 1
              }
            ],
            publishedAt: new Date("2026-04-08T00:30:00.000Z"),
            slug: "genesis-portrait-set",
            title: "Genesis Portrait Set",
            updatedAt: new Date("2026-04-08T00:35:00.000Z")
          };
        },

        async listPreviewByBrandSlug(brandSlug) {
          if (brandSlug !== "demo-studio") {
            return [];
          }

          return [
            {
              _count: {
                items: 2
              },
              displayOrder: 0,
              description: "Release-ready portrait set",
              isFeatured: true,
              items: [
                {
                  publicStorageBucket: "ai-nft-forge-public",
                  publicStorageObjectKey:
                    "published-collections/draft_1/items/001-generated_asset_1-portrait-1.png",
                  generatedAsset: {
                    generationRequest: {
                      pipelineKey: "collectible-portrait-v1",
                      sourceAsset: {
                        originalFilename: "portrait-1.png"
                      }
                    },
                    storageBucket: "ai-nft-forge-private",
                    storageObjectKey:
                      "generated-assets/user_1/generation_1/variant-01.png",
                    variantIndex: 1
                  }
                }
              ],
              publishedAt: new Date("2026-04-08T00:30:00.000Z"),
              slug: "genesis-portrait-set",
              title: "Genesis Portrait Set",
              updatedAt: new Date("2026-04-08T00:35:00.000Z")
            }
          ];
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
    service
  };
}

describe("createPublicCollectionService", () => {
  it("resolves a branded public collection directory with durable public preview image URLs", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicBrandBySlug({
      brandSlug: "demo-studio"
    });

    expect(result?.brand.brandName).toBe("Demo Studio");
    expect(result?.brand.accentColor).toBe("#244f3c");
    expect(result?.brand.landingHeadline).toBe("Collectible portrait releases");
    expect(result?.brand.featuredReleaseLabel).toBe("Spotlight release");
    expect(result?.brand.collections).toHaveLength(1);
    expect(result?.brand.collections[0]?.coverImageUrl).toContain(
      "published-collections/draft_1/items/001-generated_asset_1"
    );
    expect(result?.brand.collections[0]?.coverImageUrlExpiresAt).toBeNull();
    expect(result?.brand.collections[0]?.isFeatured).toBe(true);
    expect(result?.brand.collections[0]?.itemCount).toBe(2);
  });

  it("returns null when the public brand route is not configured", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicBrandBySlug({
      brandSlug: "missing-brand"
    });

    expect(result).toBeNull();
  });

  it("falls back to default storefront copy when older brand themes omit landing fields", async () => {
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

    expect(result?.brand.landingHeadline).toBe("Published collection releases");
    expect(result?.brand.landingDescription).toContain(
      "curated collection drops"
    );
    expect(result?.brand.featuredReleaseLabel).toBe("Featured release");
  });

  it("resolves a public collection page with durable public image URLs", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicCollectionBySlugs({
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set"
    });

    expect(result?.collection.brandName).toBe("Demo Studio");
    expect(result?.collection.items).toHaveLength(1);
    expect(result?.collection.items[0]?.imageUrl).toContain(
      "published-collections/draft_1/items/001-generated_asset_1"
    );
    expect(result?.collection.items[0]?.imageUrlExpiresAt).toBeNull();
  });

  it("resolves a public collection metadata manifest from the published snapshot", async () => {
    const harness = createPublicCollectionHarness();

    const result =
      await harness.service.getPublicCollectionMetadataManifestBySlugs({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set"
      });

    expect(result?.metadata.metadataPath).toBe(
      "/brands/demo-studio/collections/genesis-portrait-set/metadata"
    );
    expect(result?.metadata.itemCount).toBe(1);
    expect(result?.metadata.items[0]).toMatchObject({
      editionNumber: 1,
      generatedAssetId: "generated_asset_1",
      metadataPath:
        "/brands/demo-studio/collections/genesis-portrait-set/metadata/1",
      name: "Genesis Portrait Set #1",
      pipelineKey: "collectible-portrait-v1",
      sourceAssetOriginalFilename: "portrait-1.png",
      variantIndex: 1
    });
  });

  it("resolves a public collection metadata item with signed image access", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicCollectionMetadataItemBySlugs(
      {
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        editionNumber: 1
      }
    );

    expect(result?.metadata.name).toBe("Genesis Portrait Set #1");
    expect(result?.metadata.externalUrl).toBe(
      "/brands/demo-studio/collections/genesis-portrait-set"
    );
    expect(result?.metadata.imageUrl).toContain(
      "published-collections/draft_1/items/001-generated_asset_1"
    );
    expect(result?.metadata.imageUrlExpiresAt).toBeNull();
    expect(result?.metadata.attributes).toEqual(
      expect.arrayContaining([
        {
          traitType: "Edition",
          value: 1
        },
        {
          traitType: "Pipeline",
          value: "collectible-portrait-v1"
        }
      ])
    );
  });

  it("resolves a public collection contract manifest for the initial chain publishing path", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicCollectionContractBySlugs({
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://forge.example"
    });

    expect(result?.contract).toMatchObject({
      brandName: "Demo Studio",
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      collectionUrl:
        "https://forge.example/brands/demo-studio/collections/genesis-portrait-set",
      contractUrl:
        "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/contract",
      itemCount: 1,
      metadataUrl:
        "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/metadata",
      name: "Demo Studio Genesis Portrait Set",
      standard: "erc721",
      symbol: "DEMOGENESIS",
      tokenUriBaseUrl:
        "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/token-uri",
      tokenUriExampleUrl:
        "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/token-uri/1",
      tokenUriTemplate:
        "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/token-uri/{tokenId}"
    });
    expect(result?.contract.supportedChains).toEqual([
      {
        chainId: 84532,
        key: "base-sepolia",
        label: "Base Sepolia",
        network: "development"
      },
      {
        chainId: 8453,
        key: "base",
        label: "Base",
        network: "production"
      }
    ]);
  });

  it("returns null when the public collection is not published", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicCollectionBySlugs({
      brandSlug: "missing-brand",
      collectionSlug: "missing-collection"
    });

    expect(result).toBeNull();
  });

  it("returns null when a contract manifest is requested for an unpublished collection", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicCollectionContractBySlugs({
      brandSlug: "missing-brand",
      collectionSlug: "missing-collection",
      origin: "https://forge.example"
    });

    expect(result).toBeNull();
  });

  it("returns null when a requested metadata edition does not exist", async () => {
    const harness = createPublicCollectionHarness();

    const result = await harness.service.getPublicCollectionMetadataItemBySlugs(
      {
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        editionNumber: 2
      }
    );

    expect(result).toBeNull();
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
              brandName: "Legacy Studio",
              brandSlug: "legacy-studio",
              description: null,
              items: [
                {
                  publicStorageBucket: null,
                  publicStorageObjectKey: null,
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
                  position: 1
                }
              ],
              publishedAt: new Date("2026-04-08T00:30:00.000Z"),
              slug: "legacy-release",
              title: "Legacy Release",
              updatedAt: new Date("2026-04-08T00:35:00.000Z")
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
  });
});
