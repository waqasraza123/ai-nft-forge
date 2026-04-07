import { opsAlertAcknowledgeResponseSchema } from "@ai-nft-forge/shared";

import { OpsServiceError } from "./error";

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

function serializeAlertState(alertState: AlertStateRecord) {
  return {
    acknowledgedAt: alertState.acknowledgedAt?.toISOString() ?? null,
    acknowledgedByUserId: alertState.acknowledgedByUserId,
    code: alertState.code,
    firstObservedAt: alertState.firstObservedAt.toISOString(),
    id: alertState.id,
    lastDeliveredAt: alertState.lastDeliveredAt?.toISOString() ?? null,
    lastObservedAt: alertState.lastObservedAt.toISOString(),
    message: alertState.message,
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

      const acknowledgedAlert =
        await dependencies.repositories.opsAlertStateRepository.acknowledge({
          acknowledgedAt: dependencies.now(),
          acknowledgedByUserId: input.ownerUserId,
          id: alertState.id
        });

      return opsAlertAcknowledgeResponseSchema.parse({
        alert: serializeAlertState(acknowledgedAlert)
      });
    }
  };
}
