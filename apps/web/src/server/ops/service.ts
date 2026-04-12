import {
  createOpsReconciliationService,
  opsAlertAcknowledgeResponseSchema,
  opsAlertEscalationPolicyResponseSchema,
  opsAlertMuteResponseSchema,
  opsAlertRoutingPolicyResponseSchema,
  opsAlertSchedulePolicyResponseSchema,
  createOpsAlertScheduleDayMask,
  opsAlertUnmuteResponseSchema,
  parseOpsAlertScheduleDayMask,
  type OpsReconciliationIssueKind
} from "@ai-nft-forge/shared";

import { OpsServiceError } from "./error";

type AlertMuteRecord = {
  code: string;
  id: string;
  mutedUntil: Date;
};

type AlertRoutingPolicyRecord = {
  id: string;
  updatedAt: Date;
  webhookEnabled: boolean;
  webhookMinimumSeverity: "critical" | "warning";
};

type AlertEscalationPolicyRecord = {
  firstReminderDelayMinutes: number;
  id: string;
  repeatReminderIntervalMinutes: number;
  updatedAt: Date;
};

type AlertSchedulePolicyRecord = {
  activeDaysMask: number;
  endMinuteOfDay: number;
  id: string;
  startMinuteOfDay: number;
  timezone: string;
  updatedAt: Date;
};

type AlertStateRecord = {
  acknowledgedAt: Date | null;
  acknowledgedByUserId: string | null;
  code: string;
  firstObservedAt: Date;
  id: string;
  lastDeliveredAt: Date | null;
  lastObservedAt: Date;
  message: string;
  severity: "critical" | "warning";
  status: "active" | "resolved";
  title: string;
};

type OpsServiceDependencies = {
  now: () => Date;
  onchain?: {
    inspectPublishedCollectionState(input: {
      ownerWalletAddress: string;
      publication: {
        brandName: string;
        brandSlug: string;
        contractAddress: string | null;
        contractChainKey: string | null;
        contractDeployTxHash: string | null;
        contractTokenUriBaseUrl: string | null;
        heroGeneratedAssetId: string | null;
        id: string;
        items: Array<{
          generatedAssetId: string;
          id: string;
          position: number;
          publicStorageBucket: string | null;
          publicStorageObjectKey: string | null;
        }>;
        mints: Array<{
          id: string;
          recipientWalletAddress: string;
          tokenId: number;
          txHash: string;
        }>;
        slug: string;
        sourceCollectionDraftId: string;
        title: string;
      };
    }): Promise<
      Array<{
        detail: Record<string, string | number | boolean | null>;
        kind: OpsReconciliationIssueKind;
        message: string;
        severity: "critical" | "warning";
        title: string;
      }>
    >;
  };
  repositories: {
    opsAlertMuteRepository: {
      deleteByWorkspaceIdAndCode(input: {
        code: string;
        workspaceId: string;
      }): Promise<{ count: number }>;
      findActiveByWorkspaceIdAndCode(input: {
        code: string;
        observedAt: Date;
        workspaceId: string;
      }): Promise<AlertMuteRecord | null>;
      upsert(input: {
        code: string;
        mutedUntil: Date;
        ownerUserId: string;
        workspaceId: string;
      }): Promise<AlertMuteRecord>;
    };
    opsAlertRoutingPolicyRepository: {
      deleteByWorkspaceId(input: {
        workspaceId: string;
      }): Promise<{ count: number }>;
      upsert(input: {
        ownerUserId: string;
        webhookEnabled: boolean;
        webhookMinimumSeverity: "critical" | "warning";
        workspaceId: string;
      }): Promise<AlertRoutingPolicyRecord>;
    };
    opsAlertEscalationPolicyRepository: {
      deleteByWorkspaceId(input: {
        workspaceId: string;
      }): Promise<{ count: number }>;
      upsert(input: {
        firstReminderDelayMinutes: number;
        ownerUserId: string;
        repeatReminderIntervalMinutes: number;
        workspaceId: string;
      }): Promise<AlertEscalationPolicyRecord>;
    };
    opsAlertSchedulePolicyRepository: {
      deleteByWorkspaceId(input: {
        workspaceId: string;
      }): Promise<{ count: number }>;
      upsert(input: {
        activeDaysMask: number;
        endMinuteOfDay: number;
        ownerUserId: string;
        startMinuteOfDay: number;
        timezone: string;
        workspaceId: string;
      }): Promise<AlertSchedulePolicyRecord>;
    };
    opsAlertStateRepository: {
      acknowledge(input: {
        acknowledgedAt: Date;
        acknowledgedByUserId: string;
        id: string;
      }): Promise<AlertStateRecord>;
      findByIdForWorkspace(input: {
        id: string;
        workspaceId: string;
      }): Promise<AlertStateRecord | null>;
    };
    collectionDraftRepository?: {
      listByWorkspaceId(workspaceId: string): Promise<
        Array<{
          id: string;
          items: Array<{
            generatedAsset: {
              id: string;
              moderationStatus: "approved" | "pending_review" | "rejected";
            };
          }>;
          slug: string;
          status: "draft" | "review_ready";
          title: string;
        }>
      >;
      updateStatusByIdForWorkspace(input: {
        id: string;
        status: "draft" | "review_ready";
        workspaceId: string;
      }): Promise<{ id: string } | null>;
    };
    generatedAssetRepository?: {
      findByIdForWorkspace(input: {
        id: string;
        workspaceId: string;
      }): Promise<{
        contentType: string;
        id: string;
        moderationStatus: "approved" | "pending_review" | "rejected";
        sourceAssetId: string;
        storageBucket: string;
        storageObjectKey: string;
      } | null>;
      listByWorkspaceId(workspaceId: string): Promise<
        Array<{
          contentType: string;
          id: string;
          moderationStatus: "approved" | "pending_review" | "rejected";
          sourceAssetId: string;
          storageBucket: string;
          storageObjectKey: string;
        }>
      >;
    };
    opsReconciliationIssueRepository?: {
      findByIdForWorkspace(input: {
        id: string;
        workspaceId: string;
      }): Promise<{
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
        severity: "critical" | "warning";
        status: "ignored" | "open" | "repaired";
        title: string;
      } | null>;
      markIgnoredForWorkspace(input: {
        id: string;
        ignoredAt: Date;
        workspaceId: string;
      }): Promise<{
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
        severity: "critical" | "warning";
        status: "ignored" | "open" | "repaired";
        title: string;
      } | null>;
      markRepairedForWorkspace(input: {
        id: string;
        repairedAt: Date;
        repairMessage: string;
        workspaceId: string;
      }): Promise<{
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
        severity: "critical" | "warning";
        status: "ignored" | "open" | "repaired";
        title: string;
      } | null>;
      upsertObserved(input: {
        detailJson: Record<string, string | number | boolean | null>;
        fingerprint: string;
        kind: OpsReconciliationIssueKind;
        lastDetectedAt: Date;
        latestRunId: string;
        message: string;
        ownerUserId: string;
        severity: "critical" | "warning";
        title: string;
        workspaceId: string;
      }): Promise<{
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
        severity: "critical" | "warning";
        status: "ignored" | "open" | "repaired";
        title: string;
      }>;
    };
    opsReconciliationRunRepository?: {
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
      }): Promise<{
        completedAt: Date;
        criticalIssueCount: number;
        id: string;
        issueCount: number;
        message: string | null;
        startedAt: Date;
        status: "failed" | "succeeded";
        warningIssueCount: number;
      }>;
    };
    publishedCollectionItemRepository?: {
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
    publishedCollectionRepository?: {
      findByIdForWorkspace(input: {
        id: string;
        workspaceId: string;
      }): Promise<{
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
      } | null>;
      listDetailedByWorkspaceId(workspaceId: string): Promise<
        Array<{
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
          items: Array<{
            generatedAssetId: string;
            id: string;
            position: number;
            publicStorageBucket: string | null;
            publicStorageObjectKey: string | null;
          }>;
          slug: string;
          sourceCollectionDraftId: string;
          title: string;
        }>
      >;
    };
    sourceAssetRepository?: {
      findById(id: string): Promise<{
        id: string;
        originalFilename: string;
        storageBucket: string;
        storageObjectKey: string;
      } | null>;
      listByWorkspaceId(workspaceId: string): Promise<
        Array<{
          id: string;
          originalFilename: string;
          storageBucket: string;
          storageObjectKey: string;
        }>
      >;
    };
    userRepository?: {
      findById(id: string): Promise<{
        id: string;
        walletAddress: string;
      } | null>;
    };
  };
  storage?: {
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

function serializeAlertRoutingPolicy(policy: AlertRoutingPolicyRecord | null) {
  return {
    id: policy?.id ?? null,
    source: policy ? "owner_override" : "default",
    updatedAt: policy?.updatedAt.toISOString() ?? null,
    webhookMode: policy
      ? policy.webhookEnabled
        ? policy.webhookMinimumSeverity === "critical"
          ? "critical_only"
          : "all"
        : "disabled"
      : "all"
  } as const;
}

function serializeAlertEscalationPolicy(
  policy: AlertEscalationPolicyRecord | null
) {
  return {
    firstReminderDelayMinutes: policy?.firstReminderDelayMinutes ?? null,
    id: policy?.id ?? null,
    repeatReminderIntervalMinutes:
      policy?.repeatReminderIntervalMinutes ?? null,
    source: policy ? "owner_override" : "default",
    updatedAt: policy?.updatedAt.toISOString() ?? null
  } as const;
}

function serializeAlertSchedulePolicy(policy: AlertSchedulePolicyRecord | null) {
  return {
    activeDays: policy
      ? parseOpsAlertScheduleDayMask(policy.activeDaysMask)
      : [],
    endMinuteOfDay: policy?.endMinuteOfDay ?? null,
    id: policy?.id ?? null,
    source: policy ? "owner_override" : "default",
    startMinuteOfDay: policy?.startMinuteOfDay ?? null,
    timezone: policy?.timezone ?? null,
    updatedAt: policy?.updatedAt.toISOString() ?? null
  } as const;
}

function parseAlertRoutingWebhookMode(
  webhookMode: "all" | "critical_only" | "disabled"
) {
  if (webhookMode === "disabled") {
    return {
      webhookEnabled: false,
      webhookMinimumSeverity: "warning" as const
    };
  }

  if (webhookMode === "critical_only") {
    return {
      webhookEnabled: true,
      webhookMinimumSeverity: "critical" as const
    };
  }

  return {
    webhookEnabled: true,
    webhookMinimumSeverity: "warning" as const
  };
}

function serializeAlertState(
  alertState: AlertStateRecord,
  mutedUntil: Date | null
) {
  return {
    acknowledgedAt: alertState.acknowledgedAt?.toISOString() ?? null,
    acknowledgedByUserId: alertState.acknowledgedByUserId,
    code: alertState.code,
    firstObservedAt: alertState.firstObservedAt.toISOString(),
    id: alertState.id,
    lastDeliveredAt: alertState.lastDeliveredAt?.toISOString() ?? null,
    lastObservedAt: alertState.lastObservedAt.toISOString(),
    message: alertState.message,
    mutedUntil: mutedUntil?.toISOString() ?? null,
    severity: alertState.severity,
    status: alertState.status,
    title: alertState.title
  };
}

export function createOpsService(dependencies: OpsServiceDependencies) {
  const getReconciliationService = () => {
    const {
      collectionDraftRepository,
      generatedAssetRepository,
      opsReconciliationIssueRepository,
      opsReconciliationRunRepository,
      publishedCollectionItemRepository,
      publishedCollectionRepository,
      sourceAssetRepository,
      userRepository
    } = dependencies.repositories;

    if (
      !collectionDraftRepository ||
      !generatedAssetRepository ||
      !opsReconciliationIssueRepository ||
      !opsReconciliationRunRepository ||
      !publishedCollectionItemRepository ||
      !publishedCollectionRepository ||
      !sourceAssetRepository ||
      !userRepository ||
      !dependencies.onchain ||
      !dependencies.storage
    ) {
      throw new OpsServiceError(
        "RECONCILIATION_UNAVAILABLE",
        "Reconciliation dependencies are not configured for this runtime.",
        500
      );
    }

    return createOpsReconciliationService({
      now: dependencies.now,
      repositories: {
        collectionDraftRepository,
        generatedAssetRepository,
        opsReconciliationIssueRepository,
        opsReconciliationRunRepository,
        publishedCollectionItemRepository,
        publishedCollectionRepository,
        sourceAssetRepository,
        userRepository
      },
      storage: dependencies.storage,
      onchain: dependencies.onchain
    });
  };

  return {
    async acknowledgeAlert(input: {
      alertStateId: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const referenceTime = dependencies.now();
      const alertState =
        await dependencies.repositories.opsAlertStateRepository.findByIdForWorkspace(
          {
            id: input.alertStateId,
            workspaceId: input.workspaceId
          }
        );

      if (!alertState) {
        throw new OpsServiceError(
          "ALERT_NOT_FOUND",
          "Alert state was not found.",
          404
        );
      }

      if (alertState.status !== "active") {
        throw new OpsServiceError(
          "ALERT_NOT_ACTIVE",
          "Only active alerts can be acknowledged.",
          409
        );
      }

      const activeMute =
        await dependencies.repositories.opsAlertMuteRepository.findActiveByWorkspaceIdAndCode(
          {
            code: alertState.code,
            observedAt: referenceTime,
            workspaceId: input.workspaceId
          }
        );

      const acknowledgedAlert =
        await dependencies.repositories.opsAlertStateRepository.acknowledge({
          acknowledgedAt: referenceTime,
          acknowledgedByUserId: input.ownerUserId,
          id: alertState.id
        });

      return opsAlertAcknowledgeResponseSchema.parse({
        alert: serializeAlertState(
          acknowledgedAlert,
          activeMute?.mutedUntil ?? null
        )
      });
    },

    async muteAlert(input: {
      alertStateId: string;
      durationHours: number;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const referenceTime = dependencies.now();
      const alertState =
        await dependencies.repositories.opsAlertStateRepository.findByIdForWorkspace(
          {
            id: input.alertStateId,
            workspaceId: input.workspaceId
          }
        );

      if (!alertState) {
        throw new OpsServiceError(
          "ALERT_NOT_FOUND",
          "Alert state was not found.",
          404
        );
      }

      if (alertState.status !== "active") {
        throw new OpsServiceError(
          "ALERT_NOT_ACTIVE",
          "Only active alerts can be muted.",
          409
        );
      }

      const mutedUntil = new Date(
        referenceTime.getTime() + input.durationHours * 60 * 60 * 1000
      );
      const mute =
        await dependencies.repositories.opsAlertMuteRepository.upsert({
          code: alertState.code,
          mutedUntil,
          ownerUserId: input.ownerUserId,
          workspaceId: input.workspaceId
        });

      return opsAlertMuteResponseSchema.parse({
        alert: serializeAlertState(alertState, mute.mutedUntil),
        mute: {
          code: mute.code,
          id: mute.id,
          mutedUntil: mute.mutedUntil.toISOString()
        }
      });
    },

    async unmuteAlert(input: {
      alertStateId: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const alertState =
        await dependencies.repositories.opsAlertStateRepository.findByIdForWorkspace(
          {
            id: input.alertStateId,
            workspaceId: input.workspaceId
          }
        );

      if (!alertState) {
        throw new OpsServiceError(
          "ALERT_NOT_FOUND",
          "Alert state was not found.",
          404
        );
      }

      const result =
        await dependencies.repositories.opsAlertMuteRepository.deleteByWorkspaceIdAndCode(
          {
            code: alertState.code,
            workspaceId: input.workspaceId
          }
        );

      return opsAlertUnmuteResponseSchema.parse({
        code: alertState.code,
        removed: result.count > 0
      });
    },

    async unmuteAlertByCode(input: {
      code: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const result =
        await dependencies.repositories.opsAlertMuteRepository.deleteByWorkspaceIdAndCode(
          {
            code: input.code,
            workspaceId: input.workspaceId
          }
        );

      return opsAlertUnmuteResponseSchema.parse({
        code: input.code,
        removed: result.count > 0
      });
    },

    async updateAlertRoutingPolicy(input: {
      ownerUserId: string;
      webhookMode: "all" | "critical_only" | "disabled";
      workspaceId: string;
    }) {
      const policy =
        await dependencies.repositories.opsAlertRoutingPolicyRepository.upsert({
          ownerUserId: input.ownerUserId,
          workspaceId: input.workspaceId,
          ...parseAlertRoutingWebhookMode(input.webhookMode)
        });

      return opsAlertRoutingPolicyResponseSchema.parse({
        policy: serializeAlertRoutingPolicy(policy)
      });
    },

    async resetAlertRoutingPolicy(input: {
      ownerUserId: string;
      workspaceId: string;
    }) {
      await dependencies.repositories.opsAlertRoutingPolicyRepository.deleteByWorkspaceId(
        {
          workspaceId: input.workspaceId
        }
      );

      return opsAlertRoutingPolicyResponseSchema.parse({
        policy: serializeAlertRoutingPolicy(null)
      });
    },

    async updateAlertEscalationPolicy(input: {
      firstReminderDelayMinutes: number;
      ownerUserId: string;
      repeatReminderIntervalMinutes: number;
      workspaceId: string;
    }) {
      const policy =
        await dependencies.repositories.opsAlertEscalationPolicyRepository.upsert(
          {
            firstReminderDelayMinutes: input.firstReminderDelayMinutes,
            ownerUserId: input.ownerUserId,
            repeatReminderIntervalMinutes:
              input.repeatReminderIntervalMinutes,
            workspaceId: input.workspaceId
          }
        );

      return opsAlertEscalationPolicyResponseSchema.parse({
        policy: serializeAlertEscalationPolicy(policy)
      });
    },

    async resetAlertEscalationPolicy(input: {
      ownerUserId: string;
      workspaceId: string;
    }) {
      await dependencies.repositories.opsAlertEscalationPolicyRepository.deleteByWorkspaceId(
        {
          workspaceId: input.workspaceId
        }
      );

      return opsAlertEscalationPolicyResponseSchema.parse({
        policy: serializeAlertEscalationPolicy(null)
      });
    },

    async updateAlertSchedulePolicy(input: {
      activeDays: Array<"sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat">;
      endMinuteOfDay: number;
      ownerUserId: string;
      startMinuteOfDay: number;
      timezone: string;
      workspaceId: string;
    }) {
      const policy =
        await dependencies.repositories.opsAlertSchedulePolicyRepository.upsert({
          activeDaysMask: createOpsAlertScheduleDayMask(input.activeDays),
          endMinuteOfDay: input.endMinuteOfDay,
          ownerUserId: input.ownerUserId,
          startMinuteOfDay: input.startMinuteOfDay,
          timezone: input.timezone,
          workspaceId: input.workspaceId
        });

      return opsAlertSchedulePolicyResponseSchema.parse({
        policy: serializeAlertSchedulePolicy(policy)
      });
    },

    async resetAlertSchedulePolicy(input: {
      ownerUserId: string;
      workspaceId: string;
    }) {
      await dependencies.repositories.opsAlertSchedulePolicyRepository.deleteByWorkspaceId(
        {
          workspaceId: input.workspaceId
        }
      );

      return opsAlertSchedulePolicyResponseSchema.parse({
        policy: serializeAlertSchedulePolicy(null)
      });
    },

    async runReconciliation(input: { ownerUserId: string; workspaceId: string }) {
      return getReconciliationService().run({
        ownerUserId: input.ownerUserId,
        workspaceId: input.workspaceId
      });
    },

    async repairReconciliationIssue(input: {
      issueId: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      try {
        return await getReconciliationService().repairIssue({
          issueId: input.issueId,
          ownerUserId: input.ownerUserId,
          workspaceId: input.workspaceId
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected repair error.";

        if (message.includes("not found")) {
          throw new OpsServiceError("RECONCILIATION_ISSUE_NOT_FOUND", message, 404);
        }

        throw new OpsServiceError(
          "RECONCILIATION_REPAIR_FAILED",
          message,
          409
        );
      }
    },

    async ignoreReconciliationIssue(input: {
      issueId: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      try {
        return await getReconciliationService().ignoreIssue({
          issueId: input.issueId,
          ownerUserId: input.ownerUserId,
          workspaceId: input.workspaceId
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected ignore error.";

        throw new OpsServiceError(
          "RECONCILIATION_ISSUE_NOT_FOUND",
          message,
          404
        );
      }
    }
  };
}
