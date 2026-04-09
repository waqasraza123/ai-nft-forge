import { describe, expect, it } from "vitest";

import {
  aiNftForgeCollectionContractStandard,
  aiNftForgeSupportedCollectionContractChains,
  createCollectionContractName,
  createCollectionContractPath,
  createCollectionContractSymbol,
  createCollectionContractUrl,
  createCollectionMetadataManifestPath,
  createCollectionMetadataManifestUrl,
  createCollectionPublicPath,
  createCollectionPublicUrl,
  createCollectionTokenUriBasePath,
  createCollectionTokenUriBaseUrl,
  createCollectionTokenUriPath,
  createCollectionTokenUriTemplatePath,
  createCollectionTokenUriTemplateUrl,
  createCollectionTokenUriUrl
} from "./index.js";

describe("@ai-nft-forge/contracts", () => {
  it("exposes the supported chain catalog for collection publishing", () => {
    expect(aiNftForgeCollectionContractStandard).toBe("erc721");
    expect(aiNftForgeSupportedCollectionContractChains).toEqual([
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

  it("builds deterministic collection contract identity values", () => {
    expect(
      createCollectionContractName({
        brandName: "Demo Studio",
        collectionTitle: "Genesis Portrait Set"
      })
    ).toBe("Demo Studio Genesis Portrait Set");

    expect(
      createCollectionContractSymbol({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set"
      })
    ).toBe("DEMOGENESIS");
  });

  it("builds stable public collection contract and token uri paths", () => {
    expect(
      createCollectionPublicPath({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set"
      })
    ).toBe("/brands/demo-studio/collections/genesis-portrait-set");
    expect(
      createCollectionContractPath({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set"
      })
    ).toBe("/brands/demo-studio/collections/genesis-portrait-set/contract");
    expect(
      createCollectionMetadataManifestPath({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set"
      })
    ).toBe("/brands/demo-studio/collections/genesis-portrait-set/metadata");
    expect(
      createCollectionTokenUriBasePath({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set"
      })
    ).toBe("/brands/demo-studio/collections/genesis-portrait-set/token-uri");
    expect(
      createCollectionTokenUriPath({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        tokenId: 1
      })
    ).toBe("/brands/demo-studio/collections/genesis-portrait-set/token-uri/1");
    expect(
      createCollectionTokenUriTemplatePath({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set"
      })
    ).toBe(
      "/brands/demo-studio/collections/genesis-portrait-set/token-uri/{tokenId}"
    );
  });

  it("resolves absolute public urls from an origin", () => {
    expect(
      createCollectionPublicUrl({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        origin: "https://forge.example/"
      })
    ).toBe(
      "https://forge.example/brands/demo-studio/collections/genesis-portrait-set"
    );
    expect(
      createCollectionContractUrl({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        origin: "https://forge.example/"
      })
    ).toBe(
      "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/contract"
    );
    expect(
      createCollectionMetadataManifestUrl({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        origin: "https://forge.example/"
      })
    ).toBe(
      "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/metadata"
    );
    expect(
      createCollectionTokenUriBaseUrl({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        origin: "https://forge.example/"
      })
    ).toBe(
      "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/token-uri"
    );
    expect(
      createCollectionTokenUriUrl({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        origin: "https://forge.example/",
        tokenId: 1
      })
    ).toBe(
      "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/token-uri/1"
    );
    expect(
      createCollectionTokenUriTemplateUrl({
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        origin: "https://forge.example/"
      })
    ).toBe(
      "https://forge.example/brands/demo-studio/collections/genesis-portrait-set/token-uri/{tokenId}"
    );
  });
});
