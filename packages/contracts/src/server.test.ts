import { describe, expect, it } from "vitest";

import {
  aiNftForgeCollectionContractName,
  getSupportedCollectionContractChainByKey
} from "./index.js";
import { getAiNftForgeCollectionContractArtifact } from "./server.js";

describe("@ai-nft-forge/contracts/server", () => {
  it("resolves supported chain metadata by key", () => {
    expect(getSupportedCollectionContractChainByKey("base-sepolia")).toEqual({
      chainId: 84532,
      key: "base-sepolia",
      label: "Base Sepolia",
      network: "development"
    });
    expect(getSupportedCollectionContractChainByKey("base")).toEqual({
      chainId: 8453,
      key: "base",
      label: "Base",
      network: "production"
    });
  });

  it("compiles the collection contract artifact", () => {
    const artifact = getAiNftForgeCollectionContractArtifact();
    const abiEntries = artifact.abi.filter(
      (entry): entry is { name?: string; type?: string } =>
        typeof entry === "object" && entry !== null
    );

    expect(artifact.contractName).toBe(aiNftForgeCollectionContractName);
    expect(artifact.bytecode.startsWith("0x")).toBe(true);
    expect(artifact.bytecode.length).toBeGreaterThan(2);
    expect(abiEntries.some((entry) => entry.name === "ownerMint")).toBe(true);
    expect(abiEntries.some((entry) => entry.name === "baseTokenUri")).toBe(
      true
    );
  });
});
