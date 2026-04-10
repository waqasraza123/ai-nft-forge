import { describe, expect, it, vi } from "vitest";

import {
  createOpsReconciliationService,
  isOnchainReconciliationIssueKind,
  isRepairableOpsReconciliationIssueKind
} from "./ops-reconciliation-service.js";

describe("ops reconciliation service", () => {
  it("classifies onchain reconciliation issue kinds separately from repairable issues", () => {
    expect(
      isOnchainReconciliationIssueKind("published_contract_missing_onchain")
    ).toBe(true);
    expect(
      isOnchainReconciliationIssueKind("published_token_owner_mismatch")
    ).toBe(true);
    expect(
      isRepairableOpsReconciliationIssueKind("published_contract_missing_onchain")
    ).toBe(false);
    expect(
      isRepairableOpsReconciliationIssueKind("published_public_asset_missing")
    ).toBe(true);
  });

  it("persists onchain reconciliation issues returned by the chain inspector", async () => {
    const createRun = vi.fn().mockResolvedValue({
      completedAt: new Date("2026-04-10T12:00:30.000Z"),
      criticalIssueCount: 1,
      id: "run_1",
      issueCount: 1,
      message: "Reconciliation recorded open issues.",
      startedAt: new Date("2026-04-10T12:00:00.000Z"),
      status: "succeeded",
      warningIssueCount: 0
    });
    const upsertObserved = vi.fn().mockResolvedValue({
      detailJson: {
        contractAddress: "0x1111111111111111111111111111111111111111",
        publishedCollectionId: "publication_1"
      },
      fingerprint: "fingerprint_1",
      firstDetectedAt: new Date("2026-04-10T12:00:30.000Z"),
      id: "issue_1",
      ignoredAt: null,
      kind: "published_contract_missing_onchain",
      lastDetectedAt: new Date("2026-04-10T12:00:30.000Z"),
      latestRunId: "run_1",
      message: "The recorded contract address does not currently have deployed bytecode onchain.",
      repairMessage: null,
      repairedAt: null,
      severity: "critical",
      status: "open",
      title: "Published contract missing onchain"
    });
    const inspectPublishedCollectionState = vi.fn().mockResolvedValue([
      {
        detail: {
          contractAddress: "0x1111111111111111111111111111111111111111",
          publishedCollectionId: "publication_1"
        },
        kind: "published_contract_missing_onchain",
        message:
          "The recorded contract address does not currently have deployed bytecode onchain.",
        severity: "critical",
        title: "Published contract missing onchain"
      }
    ]);
    const service = createOpsReconciliationService({
      now: vi
        .fn()
        .mockReturnValueOnce(new Date("2026-04-10T12:00:00.000Z"))
        .mockReturnValueOnce(new Date("2026-04-10T12:00:30.000Z")),
      onchain: {
        inspectPublishedCollectionState
      },
      repositories: {
        collectionDraftRepository: {
          listByOwnerUserId: vi.fn().mockResolvedValue([]),
          updateStatusByIdForOwner: vi.fn()
        },
        generatedAssetRepository: {
          findByIdForOwner: vi.fn(),
          listByOwnerUserId: vi.fn().mockResolvedValue([])
        },
        opsReconciliationIssueRepository: {
          findByIdForOwner: vi.fn(),
          markIgnored: vi.fn(),
          markRepaired: vi.fn(),
          upsertObserved
        },
        opsReconciliationRunRepository: {
          create: createRun
        },
        publishedCollectionItemRepository: {
          findByGeneratedAssetIdForPublishedCollection: vi.fn(),
          updatePublicStorageById: vi.fn()
        },
        publishedCollectionRepository: {
          findByIdForOwner: vi.fn(),
          listDetailedByOwnerUserId: vi.fn().mockResolvedValue([
            {
              brandName: "Demo Studio",
              brandSlug: "demo-studio",
              contractAddress: "0x1111111111111111111111111111111111111111",
              contractChainKey: "base-sepolia",
              contractDeployTxHash:
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              contractTokenUriBaseUrl:
                "https://forge.example/brands/demo-studio/collections/spring-drop/token-uri",
              heroGeneratedAssetId: null,
              id: "publication_1",
              items: [],
              mints: [],
              slug: "spring-drop",
              sourceCollectionDraftId: "draft_1",
              title: "Spring Drop"
            }
          ])
        },
        sourceAssetRepository: {
          findById: vi.fn(),
          listByOwnerUserId: vi.fn().mockResolvedValue([])
        },
        userRepository: {
          findById: vi.fn().mockResolvedValue({
            id: "user_1",
            walletAddress: "0x2222222222222222222222222222222222222222"
          })
        }
      },
      storage: {
        copyPublishedAsset: vi.fn(),
        headPrivateObject: vi.fn(),
        headPublicObject: vi.fn()
      }
    });

    const result = await service.run({
      ownerUserId: "user_1"
    });

    expect(result.run.issueCount).toBe(1);
    expect(result.run.criticalIssueCount).toBe(1);
    expect(inspectPublishedCollectionState).toHaveBeenCalledWith({
      ownerWalletAddress: "0x2222222222222222222222222222222222222222",
      publication: expect.objectContaining({
        id: "publication_1"
      })
    });
    expect(upsertObserved).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "published_contract_missing_onchain",
        ownerUserId: "user_1",
        severity: "critical"
      })
    );
  });
});
