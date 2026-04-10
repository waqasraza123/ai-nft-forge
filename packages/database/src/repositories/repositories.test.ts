import { describe, expect, it, vi } from "vitest";

import { createAuthSessionRepository } from "./auth-session-repository.js";
import { createBrandRepository } from "./brand-repository.js";
import { createCollectionDraftItemRepository } from "./collection-draft-item-repository.js";
import { createCollectionDraftRepository } from "./collection-draft-repository.js";
import { createGeneratedAssetRepository } from "./generated-asset-repository.js";
import { createGenerationRequestRepository } from "./generation-request-repository.js";
import { createOpsAlertDeliveryRepository } from "./ops-alert-delivery-repository.js";
import { createOpsAlertEscalationPolicyRepository } from "./ops-alert-escalation-policy-repository.js";
import { createOpsAlertMuteRepository } from "./ops-alert-mute-repository.js";
import { createOpsAlertRoutingPolicyRepository } from "./ops-alert-routing-policy-repository.js";
import { createOpsAlertSchedulePolicyRepository } from "./ops-alert-schedule-policy-repository.js";
import { createOpsAlertStateRepository } from "./ops-alert-state-repository.js";
import { createOpsObservabilityCaptureRepository } from "./ops-observability-capture-repository.js";
import { createOpsReconciliationIssueRepository } from "./ops-reconciliation-issue-repository.js";
import { createOpsReconciliationRunRepository } from "./ops-reconciliation-run-repository.js";
import { createPublishedCollectionItemRepository } from "./published-collection-item-repository.js";
import { createPublishedCollectionRepository } from "./published-collection-repository.js";
import { createSourceAssetRepository } from "./source-asset-repository.js";
import { createUserRepository } from "./user-repository.js";
import { createWorkspaceRepository } from "./workspace-repository.js";

describe("database repositories", () => {
  it("delegates wallet user upserts through the user repository", async () => {
    const database = {
      user: {
        findUnique: vi.fn(),
        upsert: vi.fn().mockResolvedValue({
          id: "user_1",
          walletAddress: "0xabc"
        })
      }
    };
    const repository = createUserRepository(database as never);

    const result = await repository.upsertWalletUser({
      walletAddress: "0xabc"
    });

    expect(database.user.upsert).toHaveBeenCalledWith({
      create: {
        walletAddress: "0xabc"
      },
      update: {},
      where: {
        walletAddress: "0xabc"
      }
    });
    expect(result.walletAddress).toBe("0xabc");
  });

  it("delegates active session lookup through the auth session repository", async () => {
    const database = {
      authSession: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "session_1"
        }),
        update: vi.fn()
      }
    };
    const repository = createAuthSessionRepository(database as never);
    const now = new Date("2026-04-05T00:00:00.000Z");

    const result = await repository.findActiveById("session_1", now);

    expect(database.authSession.findFirst).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          gt: now
        },
        id: "session_1",
        revokedAt: null
      }
    });
    expect(result?.id).toBe("session_1");
  });

  it("delegates source asset listing through the source asset repository", async () => {
    const database = {
      sourceAsset: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "asset_1"
          }
        ]),
        update: vi.fn()
      }
    };
    const repository = createSourceAssetRepository(database as never);

    const result = await repository.listByOwnerUserId("user_1");

    expect(database.sourceAsset.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(result[0]?.id).toBe("asset_1");
  });

  it("delegates owner-scoped workspace lookup and update through the workspace repository", async () => {
    const database = {
      workspace: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "workspace_1"
        }),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "workspace_1",
          slug: "forge-ops"
        }),
        updateMany: vi.fn().mockResolvedValue({
          count: 1
        })
      }
    };
    const repository = createWorkspaceRepository(database as never);

    const workspace = await repository.findFirstByOwnerUserId("user_1");
    const updatedWorkspace = await repository.updateByIdForOwner({
      id: "workspace_1",
      name: "Forge Ops",
      ownerUserId: "user_1",
      slug: "forge-ops",
      status: "active"
    });

    expect(database.workspace.findFirst).toHaveBeenCalledWith({
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(database.workspace.updateMany).toHaveBeenCalledWith({
      data: {
        name: "Forge Ops",
        slug: "forge-ops",
        status: "active"
      },
      where: {
        id: "workspace_1",
        ownerUserId: "user_1"
      }
    });
    expect(database.workspace.findUniqueOrThrow).toHaveBeenCalledWith({
      where: {
        id: "workspace_1"
      }
    });
    expect(workspace?.id).toBe("workspace_1");
    expect(updatedWorkspace.slug).toBe("forge-ops");
  });

  it("delegates owner-scoped brand lookup and update through the brand repository", async () => {
    const database = {
      brand: {
        create: vi.fn(),
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({
            id: "brand_1"
          })
          .mockResolvedValueOnce({
            id: "brand_2"
          }),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "brand_1",
          slug: "forge-editions"
        }),
        updateMany: vi.fn().mockResolvedValue({
          count: 1
        })
      }
    };
    const repository = createBrandRepository(database as never);

    const ownerBrand = await repository.findFirstByOwnerUserId("user_1");
    const slugBrand = await repository.findFirstBySlug("forge-editions");
    const updatedBrand = await repository.updateByIdForOwner({
      customDomain: "collections.example.com",
      id: "brand_1",
      name: "Forge Editions",
      ownerUserId: "user_1",
      slug: "forge-editions",
      themeJson: {
        accentColor: "#8b5e34"
      },
      workspaceId: "workspace_1"
    });

    expect(database.brand.findFirst).toHaveBeenNthCalledWith(1, {
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      where: {
        workspace: {
          ownerUserId: "user_1"
        }
      }
    });
    expect(database.brand.findFirst).toHaveBeenNthCalledWith(2, {
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      where: {
        slug: "forge-editions"
      }
    });
    expect(database.brand.updateMany).toHaveBeenCalledWith({
      data: {
        customDomain: "collections.example.com",
        name: "Forge Editions",
        slug: "forge-editions",
        themeJson: {
          accentColor: "#8b5e34"
        },
        workspaceId: "workspace_1"
      },
      where: {
        id: "brand_1",
        workspace: {
          ownerUserId: "user_1"
        }
      }
    });
    expect(database.brand.findUniqueOrThrow).toHaveBeenCalledWith({
      where: {
        id: "brand_1"
      }
    });
    expect(ownerBrand?.id).toBe("brand_1");
    expect(slugBrand?.id).toBe("brand_2");
    expect(updatedBrand.slug).toBe("forge-editions");
  });

  it("delegates active generation lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "generation_1"
        }),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);

    const result = await repository.findActiveForSourceAsset({
      ownerUserId: "user_1",
      sourceAssetId: "asset_1"
    });

    expect(database.generationRequest.findFirst).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        ownerUserId: "user_1",
        sourceAssetId: "asset_1",
        status: {
          in: ["queued", "running"]
        }
      }
    });
    expect(result?.id).toBe("generation_1");
  });

  it("delegates user id listing through the user repository", async () => {
    const database = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "user_1"
          },
          {
            id: "user_2"
          }
        ]),
        findUnique: vi.fn(),
        upsert: vi.fn()
      }
    };
    const repository = createUserRepository(database as never);

    const result = await repository.listIds();

    expect(database.user.findMany).toHaveBeenCalledWith({
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      select: {
        id: true
      }
    });
    expect(result).toEqual(["user_1", "user_2"]);
  });

  it("delegates distinct generation owner lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            ownerUserId: "user_1"
          },
          {
            ownerUserId: "user_2"
          }
        ]),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);

    const result = await repository.listDistinctOwnerUserIds();

    expect(database.generationRequest.findMany).toHaveBeenCalledWith({
      distinct: ["ownerUserId"],
      orderBy: {
        ownerUserId: "asc"
      },
      select: {
        ownerUserId: true
      }
    });
    expect(result).toEqual(["user_1", "user_2"]);
  });

  it("delegates recent owner-scoped generation activity lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "generation_2"
          }
        ]),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);

    const result = await repository.listRecentForOwnerUserId({
      limit: 5,
      orderBy: "failedAtDesc",
      ownerUserId: "user_1",
      statuses: ["failed"]
    });

    expect(database.generationRequest.findMany).toHaveBeenCalledWith({
      include: {
        _count: {
          select: {
            generatedAssets: true
          }
        },
        sourceAsset: {
          select: {
            id: true,
            originalFilename: true,
            status: true
          }
        }
      },
      orderBy: [
        {
          failedAt: "desc"
        },
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: 5,
      where: {
        ownerUserId: "user_1",
        status: {
          in: ["failed"]
        }
      }
    });
    expect(result[0]?.id).toBe("generation_2");
  });

  it("delegates recent windowed generation lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "generation_3"
          }
        ]),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);
    const since = new Date("2026-04-07T05:00:00.000Z");

    const result = await repository.listRecentForOwnerUserIdSince({
      ownerUserId: "user_1",
      since
    });

    expect(database.generationRequest.findMany).toHaveBeenCalledWith({
      include: {
        _count: {
          select: {
            generatedAssets: true
          }
        },
        sourceAsset: {
          select: {
            id: true,
            originalFilename: true,
            status: true
          }
        }
      },
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      where: {
        createdAt: {
          gte: since
        },
        ownerUserId: "user_1"
      }
    });
    expect(result[0]?.id).toBe("generation_3");
  });

  it("delegates owner-scoped collection draft detail lookup through the collection draft repository", async () => {
    const database = {
      collectionDraft: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "draft_1"
        }),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createCollectionDraftRepository(database as never);

    const result = await repository.findDetailedByIdForOwner({
      id: "draft_1",
      ownerUserId: "user_1"
    });

    expect(database.collectionDraft.findFirst).toHaveBeenCalledWith({
      include: {
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
          orderBy: [
            {
              position: "asc"
            },
            {
              id: "asc"
            }
          ]
        }
      },
      where: {
        id: "draft_1",
        ownerUserId: "user_1"
      }
    });
    expect(result?.id).toBe("draft_1");
  });

  it("delegates collection draft item deletion through the collection draft item repository", async () => {
    const database = {
      collectionDraftItem: {
        create: vi.fn(),
        delete: vi.fn().mockResolvedValue({
          id: "draft_item_1"
        }),
        findFirst: vi.fn().mockResolvedValue({
          id: "draft_item_1"
        }),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createCollectionDraftItemRepository(database as never);

    const result = await repository.deleteByIdForDraftOwner({
      collectionDraftId: "draft_1",
      id: "draft_item_1",
      ownerUserId: "user_1"
    });

    expect(database.collectionDraftItem.findFirst).toHaveBeenCalledWith({
      where: {
        collectionDraft: {
          ownerUserId: "user_1"
        },
        collectionDraftId: "draft_1",
        id: "draft_item_1"
      }
    });
    expect(database.collectionDraftItem.delete).toHaveBeenCalledWith({
      where: {
        id: "draft_item_1"
      }
    });
    expect(result?.id).toBe("draft_item_1");
  });

  it("delegates recent owner-scoped generated asset lookup through the generated asset repository", async () => {
    const database = {
      generatedAsset: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "generated_asset_2"
          }
        ])
      }
    };
    const repository = createGeneratedAssetRepository(database as never);

    const result = await repository.listRecentForOwnerUserId({
      limit: 4,
      ownerUserId: "user_1"
    });

    expect(database.generatedAsset.findMany).toHaveBeenCalledWith({
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
      },
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: 4,
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(result[0]?.id).toBe("generated_asset_2");
  });

  it("delegates published collection route lookup through the published collection repository", async () => {
    const database = {
      publishedCollection: {
        create: vi.fn(),
        delete: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({
          id: "published_collection_1"
        }),
        update: vi.fn()
      }
    };
    const repository = createPublishedCollectionRepository(database as never);

    const result = await repository.findDetailedByBrandSlugAndCollectionSlug({
      brandSlug: "demo-studio",
      slug: "foundation"
    });

    expect(database.publishedCollection.findUnique).toHaveBeenCalledWith({
      include: {
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
          orderBy: [
            {
              position: "asc"
            },
            {
              id: "asc"
            }
          ]
        }
      },
      where: {
        brandSlug_slug: {
          brandSlug: "demo-studio",
          slug: "foundation"
        }
      }
    });
    expect(result?.id).toBe("published_collection_1");
  });

  it("delegates published collection deletion through the published collection repository", async () => {
    const database = {
      publishedCollection: {
        create: vi.fn(),
        delete: vi.fn().mockResolvedValue({
          id: "published_collection_1"
        }),
        findFirst: vi.fn().mockResolvedValue({
          id: "published_collection_1"
        }),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createPublishedCollectionRepository(database as never);

    const result = await repository.deleteByDraftIdForOwner({
      ownerUserId: "user_1",
      sourceCollectionDraftId: "draft_1"
    });

    expect(database.publishedCollection.findFirst).toHaveBeenCalledWith({
      where: {
        ownerUserId: "user_1",
        sourceCollectionDraftId: "draft_1"
      }
    });
    expect(database.publishedCollection.delete).toHaveBeenCalledWith({
      where: {
        id: "published_collection_1"
      }
    });
    expect(result?.id).toBe("published_collection_1");
  });

  it("delegates public brand preview listing through the published collection repository", async () => {
    const database = {
      publishedCollection: {
        create: vi.fn(),
        delete: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "published_collection_2"
          }
        ]),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createPublishedCollectionRepository(database as never);

    const result = await repository.listPreviewByBrandSlug("demo-studio");

    expect(database.publishedCollection.findMany).toHaveBeenCalledWith({
      include: {
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
          orderBy: [
            {
              position: "asc"
            },
            {
              id: "asc"
            }
          ]
        }
      },
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
        brandSlug: "demo-studio"
      }
    });
    expect(result[0]?.id).toBe("published_collection_2");
  });

  it("delegates published collection item replacement through the published collection item repository", async () => {
    const database = {
      publishedCollectionItem: {
        create: vi.fn().mockResolvedValue({
          id: "published_item_1"
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "published_item_1",
            publicStorageBucket: "ai-nft-forge-public",
            publicStorageObjectKey:
              "published-collections/draft_1/items/001-generated_asset_1-portrait-1.png"
          }
        ]),
        deleteMany: vi.fn().mockResolvedValue({
          count: 1
        })
      }
    };
    const repository = createPublishedCollectionItemRepository(
      database as never
    );

    const created = await repository.createMany([
      {
        generatedAssetId: "generated_asset_1",
        position: 1,
        publicStorageBucket: "ai-nft-forge-public",
        publicStorageObjectKey:
          "published-collections/draft_1/items/001-generated_asset_1-portrait-1.png",
        publishedCollectionId: "published_collection_1"
      }
    ]);
    const listed = await repository.listByPublishedCollectionId(
      "published_collection_1"
    );
    const deleted = await repository.deleteByPublishedCollectionId(
      "published_collection_1"
    );

    expect(database.publishedCollectionItem.create).toHaveBeenCalledWith({
      data: {
        generatedAssetId: "generated_asset_1",
        position: 1,
        publicStorageBucket: "ai-nft-forge-public",
        publicStorageObjectKey:
          "published-collections/draft_1/items/001-generated_asset_1-portrait-1.png",
        publishedCollectionId: "published_collection_1"
      }
    });
    expect(database.publishedCollectionItem.findMany).toHaveBeenCalledWith({
      orderBy: [
        {
          position: "asc"
        },
        {
          id: "asc"
        }
      ],
      select: {
        generatedAssetId: true,
        id: true,
        publicStorageBucket: true,
        publicStorageObjectKey: true
      },
      where: {
        publishedCollectionId: "published_collection_1"
      }
    });
    expect(database.publishedCollectionItem.deleteMany).toHaveBeenCalledWith({
      where: {
        publishedCollectionId: "published_collection_1"
      }
    });
    expect(created[0]?.id).toBe("published_item_1");
    expect(listed[0]?.publicStorageBucket).toBe("ai-nft-forge-public");
    expect(deleted.count).toBe(1);
  });

  it("delegates oldest owner-scoped generation lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "generation_queued_1"
        }),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);

    const result = await repository.findOldestForOwnerUserId({
      ownerUserId: "user_1",
      statuses: ["queued"]
    });

    expect(database.generationRequest.findFirst).toHaveBeenCalledWith({
      include: {
        _count: {
          select: {
            generatedAssets: true
          }
        },
        sourceAsset: {
          select: {
            id: true,
            originalFilename: true,
            status: true
          }
        }
      },
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      where: {
        ownerUserId: "user_1",
        status: {
          in: ["queued"]
        }
      }
    });
    expect(result?.id).toBe("generation_queued_1");
  });

  it("delegates generated asset listing through the generated asset repository", async () => {
    const database = {
      generatedAsset: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "generated_asset_1"
          }
        ])
      }
    };
    const repository = createGeneratedAssetRepository(database as never);

    const result = await repository.listByGenerationRequestIds([
      "generation_1",
      "generation_2"
    ]);

    expect(database.generatedAsset.findMany).toHaveBeenCalledWith({
      orderBy: [
        {
          generationRequestId: "desc"
        },
        {
          variantIndex: "asc"
        }
      ],
      where: {
        generationRequestId: {
          in: ["generation_1", "generation_2"]
        }
      }
    });
    expect(result[0]?.id).toBe("generated_asset_1");
  });

  it("delegates generated asset ownership lookup through the generated asset repository", async () => {
    const database = {
      generatedAsset: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "generated_asset_2"
        }),
        findMany: vi.fn()
      }
    };
    const repository = createGeneratedAssetRepository(database as never);

    const result = await repository.findByIdForOwner({
      id: "generated_asset_2",
      ownerUserId: "user_1"
    });

    expect(database.generatedAsset.findFirst).toHaveBeenCalledWith({
      where: {
        id: "generated_asset_2",
        ownerUserId: "user_1"
      }
    });
    expect(result?.id).toBe("generated_asset_2");
  });

  it("delegates generated asset moderation updates through the generated asset repository", async () => {
    const database = {
      generatedAsset: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "generated_asset_2"
        }),
        findMany: vi.fn(),
        update: vi.fn().mockResolvedValue({
          id: "generated_asset_2",
          moderationStatus: "approved"
        })
      }
    };
    const repository = createGeneratedAssetRepository(database as never);
    const moderatedAt = new Date("2026-04-09T00:10:00.000Z");

    const result = await repository.updateModerationByIdForOwner({
      id: "generated_asset_2",
      moderatedAt,
      moderationStatus: "approved",
      ownerUserId: "user_1"
    });

    expect(database.generatedAsset.findFirst).toHaveBeenCalledWith({
      where: {
        id: "generated_asset_2",
        ownerUserId: "user_1"
      }
    });
    expect(database.generatedAsset.update).toHaveBeenCalledWith({
      data: {
        moderatedAt,
        moderationStatus: "approved"
      },
      where: {
        id: "generated_asset_2"
      }
    });
    expect(result?.moderationStatus).toBe("approved");
  });

  it("delegates observability capture creation through the ops capture repository", async () => {
    const database = {
      opsObservabilityCapture: {
        create: vi.fn().mockResolvedValue({
          id: "capture_1"
        }),
        findMany: vi.fn()
      }
    };
    const repository = createOpsObservabilityCaptureRepository(
      database as never
    );

    const result = await repository.create({
      backendReadinessMessage: "Ready",
      backendReadinessStatus: "ready",
      capturedAt: new Date("2026-04-07T09:00:00.000Z"),
      criticalAlertCount: 1,
      observabilityMessage:
        "1 critical and 0 warning operator alerts are active.",
      observabilityStatus: "critical",
      oldestQueuedAgeSeconds: 900,
      oldestRunningAgeSeconds: 1200,
      ownerUserId: "user_1",
      queueActiveCount: 0,
      queueCompletedCount: 4,
      queueConcurrency: 1,
      queueDelayedCount: 0,
      queueFailedCount: 2,
      queuePausedCount: 0,
      queueStatus: "ok",
      queueWaitingCount: 3,
      warningAlertCount: 0,
      windows: [
        {
          averageCompletionSeconds: 180,
          capturedAt: new Date("2026-04-07T09:00:00.000Z"),
          failedCount: 2,
          from: new Date("2026-04-07T08:00:00.000Z"),
          label: "Last hour",
          maxCompletionSeconds: 240,
          ownerUserId: "user_1",
          queuedCount: 1,
          runningCount: 0,
          storedAssetCount: 3,
          succeededCount: 1,
          successRatePercent: 33.3,
          totalCount: 4,
          windowKey: "1h"
        }
      ],
      workerAdapter: "http_backend"
    });

    expect(database.opsObservabilityCapture.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        backendReadinessMessage: "Ready",
        backendReadinessStatus: "ready",
        criticalAlertCount: 1,
        observabilityStatus: "critical",
        ownerUserId: "user_1",
        queueStatus: "ok",
        warningAlertCount: 0,
        windowSnapshots: {
          create: [
            expect.objectContaining({
              label: "Last hour",
              ownerUserId: "user_1",
              windowKey: "1h"
            })
          ]
        }
      })
    });
    expect(result.id).toBe("capture_1");
  });

  it("delegates alert state ownership and resolution through the ops alert state repository", async () => {
    const database = {
      opsAlertState: {
        findFirst: vi.fn().mockResolvedValue({
          id: "alert_state_1"
        }),
        create: vi.fn().mockResolvedValue({
          id: "alert_state_1"
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "alert_state_1"
          }
        ]),
        update: vi.fn().mockResolvedValue({
          id: "alert_state_1",
          status: "resolved"
        })
      }
    };
    const repository = createOpsAlertStateRepository(database as never);
    const observedAt = new Date("2026-04-07T09:00:00.000Z");

    await repository.createActive({
      code: "QUEUE_STALLED",
      message: "3 generation jobs are waiting while no jobs are active.",
      observedAt,
      ownerUserId: "user_1",
      severity: "critical",
      title: "The generation queue appears stalled."
    });
    const acknowledged = await repository.acknowledge({
      acknowledgedAt: observedAt,
      acknowledgedByUserId: "user_1",
      id: "alert_state_1"
    });
    const found = await repository.findByIdForOwner({
      id: "alert_state_1",
      ownerUserId: "user_1"
    });
    const states = await repository.listByOwnerUserIdAndCodes({
      codes: ["QUEUE_STALLED"],
      ownerUserId: "user_1"
    });
    const resolved = await repository.markResolved({
      id: "alert_state_1",
      observedAt
    });

    expect(database.opsAlertState.create).toHaveBeenCalledWith({
      data: {
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "QUEUE_STALLED",
        firstWebhookDeliveredAt: null,
        firstObservedAt: observedAt,
        lastAuditLogDeliveredAt: null,
        lastObservedAt: observedAt,
        lastWebhookDeliveredAt: null,
        message: "3 generation jobs are waiting while no jobs are active.",
        ownerUserId: "user_1",
        severity: "critical",
        status: "active",
        title: "The generation queue appears stalled."
      }
    });
    expect(database.opsAlertState.update).toHaveBeenNthCalledWith(1, {
      data: {
        acknowledgedAt: observedAt,
        acknowledgedByUserId: "user_1"
      },
      where: {
        id: "alert_state_1"
      }
    });
    expect(database.opsAlertState.findFirst).toHaveBeenCalledWith({
      where: {
        id: "alert_state_1",
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertState.findMany).toHaveBeenCalledWith({
      where: {
        code: {
          in: ["QUEUE_STALLED"]
        },
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertState.update).toHaveBeenCalledWith({
      data: {
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        lastObservedAt: observedAt,
        resolvedAt: observedAt,
        status: "resolved"
      },
      where: {
        id: "alert_state_1"
      }
    });
    expect(acknowledged.id).toBe("alert_state_1");
    expect(found?.id).toBe("alert_state_1");
    expect(states[0]?.id).toBe("alert_state_1");
    expect(resolved.status).toBe("resolved");
  });

  it("delegates alert delivery persistence through the ops alert delivery repository", async () => {
    const database = {
      opsAlertDelivery: {
        create: vi.fn().mockResolvedValue({
          id: "alert_delivery_1"
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "alert_delivery_1"
          }
        ])
      }
    };
    const repository = createOpsAlertDeliveryRepository(database as never);

    const created = await repository.create({
      alertStateId: "alert_state_1",
      captureId: "capture_1",
      code: "QUEUE_STALLED",
      deliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      deliveryChannel: "audit_log",
      deliveryState: "delivered",
      failureMessage: null,
      message: "3 generation jobs are waiting while no jobs are active.",
      ownerUserId: "user_1",
      severity: "critical",
      title: "The generation queue appears stalled."
    });
    const deliveries = await repository.listRecentForOwnerUserId({
      limit: 5,
      ownerUserId: "user_1"
    });

    expect(database.opsAlertDelivery.create).toHaveBeenCalledWith({
      data: {
        alertStateId: "alert_state_1",
        captureId: "capture_1",
        code: "QUEUE_STALLED",
        deliveredAt: new Date("2026-04-07T09:00:00.000Z"),
        deliveryChannel: "audit_log",
        deliveryState: "delivered",
        failureMessage: null,
        message: "3 generation jobs are waiting while no jobs are active.",
        ownerUserId: "user_1",
        severity: "critical",
        title: "The generation queue appears stalled."
      }
    });
    expect(database.opsAlertDelivery.findMany).toHaveBeenCalledWith({
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: 5,
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(created.id).toBe("alert_delivery_1");
    expect(deliveries[0]?.id).toBe("alert_delivery_1");
  });

  it("delegates active alert mute persistence through the ops alert mute repository", async () => {
    const database = {
      opsAlertMute: {
        deleteMany: vi.fn().mockResolvedValue({
          count: 1
        }),
        findFirst: vi.fn().mockResolvedValue({
          id: "mute_1"
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "mute_1"
          }
        ]),
        upsert: vi.fn().mockResolvedValue({
          code: "QUEUE_STALLED",
          id: "mute_1",
          mutedUntil: new Date("2026-04-08T09:00:00.000Z"),
          ownerUserId: "user_1"
        })
      }
    };
    const repository = createOpsAlertMuteRepository(database as never);
    const observedAt = new Date("2026-04-07T09:00:00.000Z");
    const mutedUntil = new Date("2026-04-08T09:00:00.000Z");

    const mute = await repository.upsert({
      code: "QUEUE_STALLED",
      mutedUntil,
      ownerUserId: "user_1"
    });
    const activeMute = await repository.findActiveByOwnerUserIdAndCode({
      code: "QUEUE_STALLED",
      observedAt,
      ownerUserId: "user_1"
    });
    const activeMutes = await repository.listActiveByOwnerUserId({
      observedAt,
      ownerUserId: "user_1"
    });
    const activeMutesByCode = await repository.listActiveByOwnerUserIdAndCodes({
      codes: ["QUEUE_STALLED"],
      observedAt,
      ownerUserId: "user_1"
    });
    const deleted = await repository.deleteByOwnerUserIdAndCode({
      code: "QUEUE_STALLED",
      ownerUserId: "user_1"
    });

    expect(database.opsAlertMute.upsert).toHaveBeenCalledWith({
      create: {
        code: "QUEUE_STALLED",
        mutedUntil,
        ownerUserId: "user_1"
      },
      update: {
        mutedUntil
      },
      where: {
        ownerUserId_code: {
          code: "QUEUE_STALLED",
          ownerUserId: "user_1"
        }
      }
    });
    expect(database.opsAlertMute.findFirst).toHaveBeenCalledWith({
      where: {
        code: "QUEUE_STALLED",
        mutedUntil: {
          gt: observedAt
        },
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertMute.findMany).toHaveBeenNthCalledWith(1, {
      orderBy: [
        {
          mutedUntil: "desc"
        },
        {
          id: "desc"
        }
      ],
      where: {
        mutedUntil: {
          gt: observedAt
        },
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertMute.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        code: {
          in: ["QUEUE_STALLED"]
        },
        mutedUntil: {
          gt: observedAt
        },
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertMute.deleteMany).toHaveBeenCalledWith({
      where: {
        code: "QUEUE_STALLED",
        ownerUserId: "user_1"
      }
    });
    expect(mute.id).toBe("mute_1");
    expect(activeMute?.id).toBe("mute_1");
    expect(activeMutes[0]?.id).toBe("mute_1");
    expect(activeMutesByCode[0]?.id).toBe("mute_1");
    expect(deleted.count).toBe(1);
  });

  it("delegates owner-scoped alert routing policy persistence through the routing policy repository", async () => {
    const database = {
      opsAlertRoutingPolicy: {
        deleteMany: vi.fn().mockResolvedValue({
          count: 1
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: "routing_1"
        }),
        upsert: vi.fn().mockResolvedValue({
          id: "routing_1",
          ownerUserId: "user_1",
          webhookEnabled: false,
          webhookMinimumSeverity: "critical"
        })
      }
    };
    const repository = createOpsAlertRoutingPolicyRepository(database as never);

    const policy = await repository.upsert({
      ownerUserId: "user_1",
      webhookEnabled: false,
      webhookMinimumSeverity: "critical"
    });
    const found = await repository.findByOwnerUserId("user_1");
    const deleted = await repository.deleteByOwnerUserId({
      ownerUserId: "user_1"
    });

    expect(database.opsAlertRoutingPolicy.upsert).toHaveBeenCalledWith({
      create: {
        ownerUserId: "user_1",
        webhookEnabled: false,
        webhookMinimumSeverity: "critical"
      },
      update: {
        webhookEnabled: false,
        webhookMinimumSeverity: "critical"
      },
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertRoutingPolicy.findUnique).toHaveBeenCalledWith({
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertRoutingPolicy.deleteMany).toHaveBeenCalledWith({
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(policy.id).toBe("routing_1");
    expect(found?.id).toBe("routing_1");
    expect(deleted.count).toBe(1);
  });

  it("delegates owner-scoped alert escalation policy persistence through the escalation policy repository", async () => {
    const database = {
      opsAlertEscalationPolicy: {
        deleteMany: vi.fn().mockResolvedValue({
          count: 1
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: "escalation_1"
        }),
        upsert: vi.fn().mockResolvedValue({
          firstReminderDelayMinutes: 60,
          id: "escalation_1",
          ownerUserId: "user_1",
          repeatReminderIntervalMinutes: 180
        })
      }
    };
    const repository = createOpsAlertEscalationPolicyRepository(
      database as never
    );

    const policy = await repository.upsert({
      firstReminderDelayMinutes: 60,
      ownerUserId: "user_1",
      repeatReminderIntervalMinutes: 180
    });
    const found = await repository.findByOwnerUserId("user_1");
    const deleted = await repository.deleteByOwnerUserId({
      ownerUserId: "user_1"
    });

    expect(database.opsAlertEscalationPolicy.upsert).toHaveBeenCalledWith({
      create: {
        firstReminderDelayMinutes: 60,
        ownerUserId: "user_1",
        repeatReminderIntervalMinutes: 180
      },
      update: {
        firstReminderDelayMinutes: 60,
        repeatReminderIntervalMinutes: 180
      },
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertEscalationPolicy.findUnique).toHaveBeenCalledWith({
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertEscalationPolicy.deleteMany).toHaveBeenCalledWith({
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(policy.id).toBe("escalation_1");
    expect(found?.id).toBe("escalation_1");
    expect(deleted.count).toBe(1);
  });

  it("delegates owner-scoped alert schedule policy persistence through the schedule policy repository", async () => {
    const database = {
      opsAlertSchedulePolicy: {
        deleteMany: vi.fn().mockResolvedValue({
          count: 1
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: "schedule_1"
        }),
        upsert: vi.fn().mockResolvedValue({
          activeDaysMask: 62,
          endMinuteOfDay: 1020,
          id: "schedule_1",
          ownerUserId: "user_1",
          startMinuteOfDay: 540,
          timezone: "America/New_York"
        })
      }
    };
    const repository = createOpsAlertSchedulePolicyRepository(
      database as never
    );

    const policy = await repository.upsert({
      activeDaysMask: 62,
      endMinuteOfDay: 1020,
      ownerUserId: "user_1",
      startMinuteOfDay: 540,
      timezone: "America/New_York"
    });
    const found = await repository.findByOwnerUserId("user_1");
    const deleted = await repository.deleteByOwnerUserId({
      ownerUserId: "user_1"
    });

    expect(database.opsAlertSchedulePolicy.upsert).toHaveBeenCalledWith({
      create: {
        activeDaysMask: 62,
        endMinuteOfDay: 1020,
        ownerUserId: "user_1",
        startMinuteOfDay: 540,
        timezone: "America/New_York"
      },
      update: {
        activeDaysMask: 62,
        endMinuteOfDay: 1020,
        startMinuteOfDay: 540,
        timezone: "America/New_York"
      },
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertSchedulePolicy.findUnique).toHaveBeenCalledWith({
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertSchedulePolicy.deleteMany).toHaveBeenCalledWith({
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(policy.id).toBe("schedule_1");
    expect(found?.id).toBe("schedule_1");
    expect(deleted.count).toBe(1);
  });

  it("delegates reconciliation run persistence through the run repository", async () => {
    const database = {
      opsReconciliationRun: {
        create: vi.fn().mockResolvedValue({
          id: "run_1"
        }),
        findFirst: vi.fn().mockResolvedValue({
          id: "run_1"
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "run_1"
          }
        ])
      }
    };
    const repository = createOpsReconciliationRunRepository(database as never);

    const created = await repository.create({
      completedAt: new Date("2026-04-10T12:00:00.000Z"),
      criticalIssueCount: 1,
      issueCount: 2,
      ownerUserId: "user_1",
      startedAt: new Date("2026-04-10T11:59:00.000Z"),
      status: "succeeded",
      warningIssueCount: 1
    });
    const latest = await repository.findLatestByOwnerUserId("user_1");
    const recent = await repository.listRecentByOwnerUserId({
      limit: 5,
      ownerUserId: "user_1"
    });

    expect(database.opsReconciliationRun.create).toHaveBeenCalled();
    expect(database.opsReconciliationRun.findFirst).toHaveBeenCalled();
    expect(database.opsReconciliationRun.findMany).toHaveBeenCalled();
    expect(created.id).toBe("run_1");
    expect(latest?.id).toBe("run_1");
    expect(recent[0]?.id).toBe("run_1");
  });

  it("delegates reconciliation issue persistence through the issue repository", async () => {
    const database = {
      opsReconciliationIssue: {
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue({
          id: "issue_1",
          status: "open"
        }),
        findFirst: vi.fn().mockResolvedValue({
          id: "issue_1"
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "issue_1"
          }
        ]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({
          id: "issue_1",
          status: "repaired"
        })
      }
    };
    const repository = createOpsReconciliationIssueRepository(
      database as never
    );

    const created = await repository.upsertObserved({
      detailJson: {
        collectionDraftId: "draft_1"
      },
      fingerprint: "draft_contains_unapproved_asset|collectionDraftId:draft_1",
      kind: "draft_contains_unapproved_asset",
      lastDetectedAt: new Date("2026-04-10T12:00:00.000Z"),
      latestRunId: "run_1",
      message: "Draft contains unapproved asset.",
      ownerUserId: "user_1",
      severity: "warning",
      title: "Draft contains unapproved asset"
    });
    const repaired = await repository.markRepaired({
      id: "issue_1",
      ownerUserId: "user_1",
      repairedAt: new Date("2026-04-10T12:05:00.000Z"),
      repairMessage: "The draft was downgraded back to draft."
    });
    const openCount = await repository.countOpenByOwnerUserIdAndSeverity({
      ownerUserId: "user_1",
      severity: "warning"
    });

    expect(database.opsReconciliationIssue.create).toHaveBeenCalled();
    expect(database.opsReconciliationIssue.update).toHaveBeenCalled();
    expect(created.id).toBe("issue_1");
    expect(repaired?.id).toBe("issue_1");
    expect(openCount).toBe(1);
  });
});
