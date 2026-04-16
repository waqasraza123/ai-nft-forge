import type {
  OpsReconciliationIssueDetail,
  OpsReconciliationIssueKind,
  OpsReconciliationIssueSeverity,
  OpsReconciliationIssueSummary,
  OpsReconciliationRunSummary
} from "./ops.js";
import {
  opsReconciliationIssueRepairResponseSchema,
  opsReconciliationIssueSummarySchema,
  opsReconciliationRunResponseSchema,
  opsReconciliationRunSummarySchema
} from "./ops.js";
import { sanitizeStorageFileName } from "./object-storage.js";

type CollectionDraftStatus = "draft" | "review_ready";
type GeneratedAssetModerationStatus =
  | "approved"
  | "pending_review"
  | "rejected";

type SourceAssetRecord = {
  id: string;
  originalFilename: string;
  storageBucket: string;
  storageObjectKey: string;
};

type GeneratedAssetRecord = {
  contentType: string;
  id: string;
  moderationStatus: GeneratedAssetModerationStatus;
  sourceAssetId: string;
  storageBucket: string;
  storageObjectKey: string;
};

type CollectionDraftRecord = {
  id: string;
  slug: string;
  status: CollectionDraftStatus;
  title: string;
  items: Array<{
    generatedAsset: {
      id: string;
      moderationStatus: GeneratedAssetModerationStatus;
    };
  }>;
};

type PublishedCollectionRecord = {
  brandName: string;
  brandSlug: string;
  contractAddress: string | null;
  contractChainKey: string | null;
  contractDeployTxHash: string | null;
  contractTokenUriBaseUrl: string | null;
  heroGeneratedAssetId: string | null;
  id: string;
  mints: Array<{
    id: string;
    recipientWalletAddress: string;
    tokenId: number;
    txHash: string;
  }>;
  slug: string;
  sourceCollectionDraftId: string;
  title: string;
  items: Array<{
    generatedAssetId: string;
    id: string;
    position: number;
    publicStorageBucket: string | null;
    publicStorageObjectKey: string | null;
  }>;
};

type PersistedRunRecord = {
  completedAt: Date;
  criticalIssueCount: number;
  id: string;
  issueCount: number;
  message: string | null;
  startedAt: Date;
  status: "failed" | "succeeded";
  warningIssueCount: number;
};

type PersistedIssueRecord = {
  detailJson: unknown;
  fingerprint: string;
  firstDetectedAt: Date;
  id: string;
  ignoredAt: Date | null;
  kind: OpsReconciliationIssueKind;
  lastDetectedAt: Date;
  latestRunId: string;
  message: string;
  repairMessage: string | null;
  repairedAt: Date | null;
  severity: OpsReconciliationIssueSeverity;
  status: "ignored" | "open" | "repaired";
  title: string;
};

type ReconciliationIssueCandidate = {
  detail: OpsReconciliationIssueDetail;
  fingerprint: string;
  kind: OpsReconciliationIssueKind;
  message: string;
  severity: OpsReconciliationIssueSeverity;
  title: string;
};

type CreateOpsReconciliationServiceDependencies = {
  now: () => Date;
  onchain?: {
    inspectPublishedCollectionState(input: {
      ownerWalletAddress: string;
      publication: PublishedCollectionRecord;
    }): Promise<Array<Omit<ReconciliationIssueCandidate, "fingerprint">>>;
  };
  repositories: {
    collectionDraftRepository: {
      listByWorkspaceId(workspaceId: string): Promise<CollectionDraftRecord[]>;
      updateStatusByIdForWorkspace(input: {
        id: string;
        status: CollectionDraftStatus;
        workspaceId: string;
      }): Promise<{ id: string } | null>;
    };
    generatedAssetRepository: {
      findByIdForWorkspace(input: {
        id: string;
        workspaceId: string;
      }): Promise<GeneratedAssetRecord | null>;
      listByWorkspaceId(workspaceId: string): Promise<GeneratedAssetRecord[]>;
    };
    opsReconciliationIssueRepository: {
      findByIdForWorkspace(input: {
        id: string;
        workspaceId: string;
      }): Promise<PersistedIssueRecord | null>;
      markIgnoredForWorkspace(input: {
        id: string;
        ignoredAt: Date;
        workspaceId: string;
      }): Promise<PersistedIssueRecord | null>;
      markRepairedForWorkspace(input: {
        id: string;
        repairedAt: Date;
        repairMessage: string;
        workspaceId: string;
      }): Promise<PersistedIssueRecord | null>;
      upsertObserved(input: {
        detailJson: OpsReconciliationIssueDetail;
        fingerprint: string;
        kind: OpsReconciliationIssueKind;
        lastDetectedAt: Date;
        latestRunId: string;
        message: string;
        ownerUserId: string;
        severity: OpsReconciliationIssueSeverity;
        title: string;
        workspaceId: string;
      }): Promise<PersistedIssueRecord>;
    };
    opsReconciliationRunRepository: {
      create(input: {
        completedAt: Date;
        criticalIssueCount: number;
        issueCount: number;
        message?: string | null;
        ownerUserId: string;
        startedAt: Date;
        status: "failed" | "succeeded";
        warningIssueCount: number;
        workspaceId: string;
      }): Promise<PersistedRunRecord>;
    };
    publishedCollectionItemRepository: {
      findByGeneratedAssetIdForPublishedCollection(input: {
        generatedAssetId: string;
        publishedCollectionId: string;
      }): Promise<{
        generatedAssetId: string;
        id: string;
        position: number;
        publicStorageBucket: string | null;
        publicStorageObjectKey: string | null;
      } | null>;
      updatePublicStorageById(input: {
        id: string;
        publicStorageBucket: string | null;
        publicStorageObjectKey: string | null;
      }): Promise<{ id: string }>;
    };
    publishedCollectionRepository: {
      findByIdForWorkspace(input: {
        id: string;
        workspaceId: string;
      }): Promise<{
        id: string;
        slug: string;
        sourceCollectionDraftId: string;
      } | null>;
      listDetailedByWorkspaceId(
        workspaceId: string
      ): Promise<PublishedCollectionRecord[]>;
    };
    sourceAssetRepository: {
      findById(id: string): Promise<SourceAssetRecord | null>;
      listByWorkspaceId(workspaceId: string): Promise<SourceAssetRecord[]>;
    };
    userRepository?: {
      findById(
        id: string
      ): Promise<{ id: string; walletAddress: string } | null>;
    };
  };
  storage: {
    copyPublishedAsset(input: {
      contentType: string;
      destinationKey: string;
      sourceBucket: string;
      sourceKey: string;
    }): Promise<{
      bucket: string;
      key: string;
    }>;
    headPrivateObject(input: {
      bucket: string;
      key: string;
    }): Promise<{ byteSize: number | null; contentType: string | null } | null>;
    headPublicObject(input: {
      bucket: string;
      key: string;
    }): Promise<{ byteSize: number | null; contentType: string | null } | null>;
  };
};

function buildPublishedCollectionPublicObjectKey(input: {
  generatedAssetId: string;
  originalFilename: string;
  position: number;
  sourceCollectionDraftId: string;
}) {
  return `published-collections/${input.sourceCollectionDraftId}/items/${input.position.toString().padStart(3, "0")}-${input.generatedAssetId}-${sanitizeStorageFileName(
    input.originalFilename
  )}`;
}

function createFingerprint(
  kind: OpsReconciliationIssueKind,
  detail: OpsReconciliationIssueDetail
) {
  const serializedDetail = Object.keys(detail)
    .sort()
    .map((key) => `${key}:${String(detail[key])}`)
    .join("|");

  return `${kind}|${serializedDetail}`;
}

export function isRepairableOpsReconciliationIssueKind(
  kind: OpsReconciliationIssueKind
) {
  return (
    kind === "published_public_asset_missing" ||
    kind === "draft_contains_unapproved_asset" ||
    kind === "review_ready_draft_invalid"
  );
}

export function isOnchainReconciliationIssueKind(
  kind: OpsReconciliationIssueKind
) {
  return (
    kind === "published_contract_deployment_unverified" ||
    kind === "published_contract_metadata_mismatch" ||
    kind === "published_contract_missing_onchain" ||
    kind === "published_contract_owner_mismatch" ||
    kind === "published_token_mint_unverified" ||
    kind === "published_token_owner_mismatch"
  );
}

function serializeRun(run: PersistedRunRecord): OpsReconciliationRunSummary {
  return opsReconciliationRunSummarySchema.parse({
    completedAt: run.completedAt.toISOString(),
    criticalIssueCount: run.criticalIssueCount,
    id: run.id,
    issueCount: run.issueCount,
    message: run.message,
    startedAt: run.startedAt.toISOString(),
    status: run.status,
    warningIssueCount: run.warningIssueCount
  });
}

function parseIssueDetail(detailJson: unknown): OpsReconciliationIssueDetail {
  const parsedDetail =
    opsReconciliationIssueSummarySchema.shape.detail.safeParse(detailJson);

  return parsedDetail.success ? parsedDetail.data : {};
}

function serializeIssue(
  issue: PersistedIssueRecord
): OpsReconciliationIssueSummary {
  return opsReconciliationIssueSummarySchema.parse({
    detail: parseIssueDetail(issue.detailJson),
    fingerprint: issue.fingerprint,
    firstDetectedAt: issue.firstDetectedAt.toISOString(),
    id: issue.id,
    ignoredAt: issue.ignoredAt?.toISOString() ?? null,
    kind: issue.kind,
    lastDetectedAt: issue.lastDetectedAt.toISOString(),
    latestRunId: issue.latestRunId,
    message: issue.message,
    repairMessage: issue.repairMessage,
    repairable: isRepairableOpsReconciliationIssueKind(issue.kind),
    repairedAt: issue.repairedAt?.toISOString() ?? null,
    severity: issue.severity,
    status: issue.status,
    title: issue.title
  });
}

function addIssue(
  issues: ReconciliationIssueCandidate[],
  input: Omit<ReconciliationIssueCandidate, "fingerprint">
) {
  issues.push({
    ...input,
    fingerprint: createFingerprint(input.kind, input.detail)
  });
}

export function createOpsReconciliationService(
  dependencies: CreateOpsReconciliationServiceDependencies
) {
  return {
    async run(input: { ownerUserId: string; workspaceId: string }) {
      const startedAt = dependencies.now();

      try {
        const [sourceAssets, generatedAssets, drafts, publications] =
          await Promise.all([
            dependencies.repositories.sourceAssetRepository.listByWorkspaceId(
              input.workspaceId
            ),
            dependencies.repositories.generatedAssetRepository.listByWorkspaceId(
              input.workspaceId
            ),
            dependencies.repositories.collectionDraftRepository.listByWorkspaceId(
              input.workspaceId
            ),
            dependencies.repositories.publishedCollectionRepository.listDetailedByWorkspaceId(
              input.workspaceId
            )
          ]);
        const ownerUser =
          dependencies.onchain && dependencies.repositories.userRepository
            ? await dependencies.repositories.userRepository.findById(
                input.ownerUserId
              )
            : null;
        const completedAt = dependencies.now();
        const issues: ReconciliationIssueCandidate[] = [];

        for (const sourceAsset of sourceAssets) {
          const objectHead = await dependencies.storage.headPrivateObject({
            bucket: sourceAsset.storageBucket,
            key: sourceAsset.storageObjectKey
          });

          if (!objectHead) {
            addIssue(issues, {
              detail: {
                bucket: sourceAsset.storageBucket,
                objectKey: sourceAsset.storageObjectKey,
                originalFilename: sourceAsset.originalFilename,
                sourceAssetId: sourceAsset.id
              },
              kind: "source_asset_object_missing",
              message:
                "The stored source asset object is missing from private storage.",
              severity: "critical",
              title: "Source asset object missing"
            });
          }
        }

        for (const generatedAsset of generatedAssets) {
          const objectHead = await dependencies.storage.headPrivateObject({
            bucket: generatedAsset.storageBucket,
            key: generatedAsset.storageObjectKey
          });

          if (!objectHead) {
            addIssue(issues, {
              detail: {
                bucket: generatedAsset.storageBucket,
                generatedAssetId: generatedAsset.id,
                objectKey: generatedAsset.storageObjectKey,
                sourceAssetId: generatedAsset.sourceAssetId
              },
              kind: "generated_asset_object_missing",
              message:
                "The generated asset object is missing from private storage.",
              severity: "critical",
              title: "Generated asset object missing"
            });
          }
        }

        for (const draft of drafts) {
          const invalidAssets = draft.items.filter(
            (item) => item.generatedAsset.moderationStatus !== "approved"
          );

          if (invalidAssets.length === 0) {
            continue;
          }

          const invalidAssetIds = invalidAssets
            .map((item) => item.generatedAsset.id)
            .join(",");

          addIssue(issues, {
            detail: {
              collectionDraftId: draft.id,
              collectionSlug: draft.slug,
              draftStatus: draft.status,
              invalidAssetIds,
              invalidItemCount: invalidAssets.length
            },
            kind: "draft_contains_unapproved_asset",
            message:
              "The draft still contains one or more generated assets that are no longer approved.",
            severity: "warning",
            title: "Draft contains unapproved asset"
          });

          if (draft.status === "review_ready") {
            addIssue(issues, {
              detail: {
                collectionDraftId: draft.id,
                collectionSlug: draft.slug,
                invalidAssetIds,
                invalidItemCount: invalidAssets.length
              },
              kind: "review_ready_draft_invalid",
              message:
                "A review-ready draft contains generated assets that are no longer approved.",
              severity: "critical",
              title: "Review-ready draft is invalid"
            });
          }
        }

        for (const publication of publications) {
          const publicationAssetIds = new Set(
            publication.items.map((item) => item.generatedAssetId)
          );

          if (
            publication.heroGeneratedAssetId &&
            !publicationAssetIds.has(publication.heroGeneratedAssetId)
          ) {
            addIssue(issues, {
              detail: {
                collectionSlug: publication.slug,
                heroGeneratedAssetId: publication.heroGeneratedAssetId,
                publishedCollectionId: publication.id
              },
              kind: "published_hero_asset_missing_from_snapshot",
              message:
                "The published hero asset no longer belongs to the immutable publication snapshot.",
              severity: "critical",
              title: "Published hero asset missing from snapshot"
            });
          }

          for (const item of publication.items) {
            const hasStoredPublicAsset =
              typeof item.publicStorageBucket === "string" &&
              item.publicStorageBucket.length > 0 &&
              typeof item.publicStorageObjectKey === "string" &&
              item.publicStorageObjectKey.length > 0;
            const publicObjectHead = hasStoredPublicAsset
              ? await dependencies.storage.headPublicObject({
                  bucket: item.publicStorageBucket!,
                  key: item.publicStorageObjectKey!
                })
              : null;

            if (hasStoredPublicAsset && publicObjectHead) {
              continue;
            }

            addIssue(issues, {
              detail: {
                generatedAssetId: item.generatedAssetId,
                publicStorageBucket: item.publicStorageBucket,
                publicStorageObjectKey: item.publicStorageObjectKey,
                publishedCollectionId: publication.id,
                publishedCollectionItemId: item.id,
                publishedCollectionSlug: publication.slug
              },
              kind: "published_public_asset_missing",
              message:
                "A published collection item is missing its public storefront object.",
              severity: "critical",
              title: "Published public asset missing"
            });
          }

          if (dependencies.onchain) {
            if (!ownerUser?.walletAddress) {
              throw new Error(
                "The owner wallet address is required for onchain reconciliation."
              );
            }

            const onchainIssues =
              await dependencies.onchain.inspectPublishedCollectionState({
                ownerWalletAddress: ownerUser.walletAddress,
                publication
              });

            for (const issue of onchainIssues) {
              addIssue(issues, issue);
            }
          }
        }

        const warningIssueCount = issues.filter(
          (issue) => issue.severity === "warning"
        ).length;
        const criticalIssueCount = issues.length - warningIssueCount;
        const persistedRun =
          await dependencies.repositories.opsReconciliationRunRepository.create(
            {
              completedAt,
              criticalIssueCount,
              issueCount: issues.length,
              message:
                issues.length > 0
                  ? "Reconciliation recorded open issues."
                  : "Reconciliation completed without issues.",
              ownerUserId: input.ownerUserId,
              startedAt,
              status: "succeeded",
              warningIssueCount,
              workspaceId: input.workspaceId
            }
          );

        await Promise.all(
          issues.map((issue) =>
            dependencies.repositories.opsReconciliationIssueRepository.upsertObserved(
              {
                detailJson: issue.detail,
                fingerprint: issue.fingerprint,
                kind: issue.kind,
                lastDetectedAt: completedAt,
                latestRunId: persistedRun.id,
                message: issue.message,
                ownerUserId: input.ownerUserId,
                severity: issue.severity,
                title: issue.title,
                workspaceId: input.workspaceId
              }
            )
          )
        );

        return opsReconciliationRunResponseSchema.parse({
          run: serializeRun(persistedRun)
        });
      } catch (error) {
        const completedAt = dependencies.now();
        const message =
          error instanceof Error
            ? error.message
            : "Unknown reconciliation failure.";
        const persistedRun =
          await dependencies.repositories.opsReconciliationRunRepository.create(
            {
              completedAt,
              criticalIssueCount: 0,
              issueCount: 0,
              message,
              ownerUserId: input.ownerUserId,
              startedAt,
              status: "failed",
              warningIssueCount: 0,
              workspaceId: input.workspaceId
            }
          );

        return opsReconciliationRunResponseSchema.parse({
          run: serializeRun(persistedRun)
        });
      }
    },

    async repairIssue(input: {
      issueId: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const issue =
        await dependencies.repositories.opsReconciliationIssueRepository.findByIdForWorkspace(
          {
            id: input.issueId,
            workspaceId: input.workspaceId
          }
        );

      if (!issue) {
        throw new Error("Reconciliation issue was not found.");
      }

      if (!isRepairableOpsReconciliationIssueKind(issue.kind)) {
        throw new Error("This reconciliation issue is not repairable.");
      }

      const detail = parseIssueDetail(issue.detailJson);
      const repairedAt = dependencies.now();

      if (issue.kind === "published_public_asset_missing") {
        const publishedCollectionId = String(
          detail.publishedCollectionId ?? ""
        );
        const generatedAssetId = String(detail.generatedAssetId ?? "");

        if (!publishedCollectionId || !generatedAssetId) {
          throw new Error(
            "The stored reconciliation issue is missing repair context."
          );
        }

        const [publication, generatedAsset] = await Promise.all([
          dependencies.repositories.publishedCollectionRepository.findByIdForWorkspace(
            {
              id: publishedCollectionId,
              workspaceId: input.workspaceId
            }
          ),
          dependencies.repositories.generatedAssetRepository.findByIdForWorkspace(
            {
              id: generatedAssetId,
              workspaceId: input.workspaceId
            }
          )
        ]);

        if (!publication || !generatedAsset) {
          throw new Error(
            "The missing public asset no longer has a repair target."
          );
        }

        const publicationItem =
          await dependencies.repositories.publishedCollectionItemRepository.findByGeneratedAssetIdForPublishedCollection(
            {
              generatedAssetId,
              publishedCollectionId: publication.id
            }
          );

        if (!publicationItem) {
          throw new Error("The published collection item no longer exists.");
        }

        const [sourceAsset, privateObjectHead] = await Promise.all([
          dependencies.repositories.sourceAssetRepository.findById(
            generatedAsset.sourceAssetId
          ),
          dependencies.storage.headPrivateObject({
            bucket: generatedAsset.storageBucket,
            key: generatedAsset.storageObjectKey
          })
        ]);

        if (!sourceAsset || !privateObjectHead) {
          throw new Error(
            "The private generated asset is missing, so the public asset cannot be repaired."
          );
        }

        const destinationKey =
          publicationItem.publicStorageObjectKey ??
          buildPublishedCollectionPublicObjectKey({
            generatedAssetId,
            originalFilename: sourceAsset.originalFilename,
            position: publicationItem.position,
            sourceCollectionDraftId: publication.sourceCollectionDraftId
          });
        const publicAsset = await dependencies.storage.copyPublishedAsset({
          contentType: generatedAsset.contentType,
          destinationKey,
          sourceBucket: generatedAsset.storageBucket,
          sourceKey: generatedAsset.storageObjectKey
        });

        await dependencies.repositories.publishedCollectionItemRepository.updatePublicStorageById(
          {
            id: publicationItem.id,
            publicStorageBucket: publicAsset.bucket,
            publicStorageObjectKey: publicAsset.key
          }
        );
      }

      if (
        issue.kind === "draft_contains_unapproved_asset" ||
        issue.kind === "review_ready_draft_invalid"
      ) {
        const collectionDraftId = String(detail.collectionDraftId ?? "");

        if (!collectionDraftId) {
          throw new Error(
            "The stored reconciliation issue is missing draft context."
          );
        }

        const repairedDraft =
          await dependencies.repositories.collectionDraftRepository.updateStatusByIdForWorkspace(
            {
              id: collectionDraftId,
              status: "draft",
              workspaceId: input.workspaceId
            }
          );

        if (!repairedDraft) {
          throw new Error("The collection draft no longer exists.");
        }
      }

      const repairedIssue =
        await dependencies.repositories.opsReconciliationIssueRepository.markRepairedForWorkspace(
          {
            id: issue.id,
            repairedAt,
            repairMessage:
              issue.kind === "published_public_asset_missing"
                ? "The public storefront asset was recopied from private storage."
                : "The draft was downgraded back to draft.",
            workspaceId: input.workspaceId
          }
        );

      if (!repairedIssue) {
        throw new Error(
          "The reconciliation issue could not be marked repaired."
        );
      }

      return opsReconciliationIssueRepairResponseSchema.parse({
        issue: serializeIssue(repairedIssue)
      });
    },

    async ignoreIssue(input: {
      issueId: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const ignoredIssue =
        await dependencies.repositories.opsReconciliationIssueRepository.markIgnoredForWorkspace(
          {
            id: input.issueId,
            ignoredAt: dependencies.now(),
            workspaceId: input.workspaceId
          }
        );

      if (!ignoredIssue) {
        throw new Error("Reconciliation issue was not found.");
      }

      return opsReconciliationIssueRepairResponseSchema.parse({
        issue: serializeIssue(ignoredIssue)
      });
    },

    serializeIssue,
    serializeRun
  };
}
