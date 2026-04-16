import { describe, expect, it } from "vitest";

import { createPublicStorageUrl } from "./object-storage.js";

describe("createPublicStorageUrl", () => {
  it("builds path-style public object URLs", () => {
    expect(
      createPublicStorageUrl({
        bucket: "ai-nft-forge-public",
        endpoint: "http://127.0.0.1:59000",
        forcePathStyle: true,
        key: "published-collections/draft_1/items/1-asset 1.png"
      })
    ).toBe(
      "http://127.0.0.1:59000/ai-nft-forge-public/published-collections/draft_1/items/1-asset%201.png"
    );
  });

  it("prefers an explicit public base URL when configured", () => {
    expect(
      createPublicStorageUrl({
        bucket: "ai-nft-forge-public",
        endpoint: "https://account-id.r2.cloudflarestorage.com",
        forcePathStyle: false,
        key: "published-collections/draft_1/items/cover.png",
        publicBaseUrl: "https://forge-public.r2.dev"
      })
    ).toBe(
      "https://forge-public.r2.dev/published-collections/draft_1/items/cover.png"
    );
  });

  it("builds virtual-hosted public object URLs", () => {
    expect(
      createPublicStorageUrl({
        bucket: "ai-nft-forge-public",
        endpoint: "https://storage.example.com",
        forcePathStyle: false,
        key: "published-collections/draft_1/items/cover.png"
      })
    ).toBe(
      "https://ai-nft-forge-public.storage.example.com/published-collections/draft_1/items/cover.png"
    );
  });
});
