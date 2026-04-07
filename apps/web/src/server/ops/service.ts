import {
  opsAlertAcknowledgeResponseSchema,
  opsAlertMuteResponseSchema,
  opsAlertUnmuteResponseSchema
} from "@ai-nft-forge/shared";

import { OpsServiceError } from "./error";

type AlertMuteRecord = {
  code: string;
  id: string;
  mutedUntil: Date;
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
  repositories: {
    opsAlertMuteRepository: {
      deleteByOwnerUserIdAndCode(input: {
        code: string;
        ownerUserId: string;
      }): Promise<{ count: number }>;
      findActiveByOwnerUserIdAndCode(input: {
        code: string;
        observedAt: Date;
        ownerUserId: string;
      }): Promise<AlertMuteRecord | null>;
      upsert(input: {
        code: string;
        mutedUntil: Date;
        ownerUserId: string;
      }): Promise<AlertMuteRecord>;
    };
    opsAlertStateRepository: {
      acknowledge(input: {
        acknowledgedAt: Date;
        acknowledgedByUserId: string;
        id: string;
      }): Promise<AlertStateRecord>;
      findByIdForOwner(input: {
        id: string;
        ownerUserId: string;
      }): Promise<AlertStateRecord | null>;
    };
  };
};

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
  return {
    async acknowledgeAlert(input: {
      alertStateId: string;
      ownerUserId: string;
    }) {
      const referenceTime = dependencies.now();
      const alertState =
        await dependencies.repositories.opsAlertStateRepository.findByIdForOwner(
          {
            id: input.alertStateId,
            ownerUserId: input.ownerUserId
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
        await dependencies.repositories.opsAlertMuteRepository.findActiveByOwnerUserIdAndCode(
          {
            code: alertState.code,
            observedAt: referenceTime,
            ownerUserId: input.ownerUserId
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
    }) {
      const referenceTime = dependencies.now();
      const alertState =
        await dependencies.repositories.opsAlertStateRepository.findByIdForOwner(
          {
            id: input.alertStateId,
            ownerUserId: input.ownerUserId
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
          ownerUserId: input.ownerUserId
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

    async unmuteAlert(input: { alertStateId: string; ownerUserId: string }) {
      const alertState =
        await dependencies.repositories.opsAlertStateRepository.findByIdForOwner(
          {
            id: input.alertStateId,
            ownerUserId: input.ownerUserId
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
        await dependencies.repositories.opsAlertMuteRepository.deleteByOwnerUserIdAndCode(
          {
            code: alertState.code,
            ownerUserId: input.ownerUserId
          }
        );

      return opsAlertUnmuteResponseSchema.parse({
        code: alertState.code,
        removed: result.count > 0
      });
    },

    async unmuteAlertByCode(input: { code: string; ownerUserId: string }) {
      const result =
        await dependencies.repositories.opsAlertMuteRepository.deleteByOwnerUserIdAndCode(
          {
            code: input.code,
            ownerUserId: input.ownerUserId
          }
        );

      return opsAlertUnmuteResponseSchema.parse({
        code: input.code,
        removed: result.count > 0
      });
    }
  };
}
