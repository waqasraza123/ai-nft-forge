import type { AuditLog, Prisma } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type AuditLogRepositoryDatabase = Pick<DatabaseExecutor, "auditLog">;

type CreateAuditLogInput = {
  action: string;
  actorId: string;
  actorType: string;
  entityId: string;
  entityType: string;
  metadataJson: Prisma.InputJsonValue;
};

export function createAuditLogRepository(database: AuditLogRepositoryDatabase) {
  return {
    create(input: CreateAuditLogInput): Promise<AuditLog> {
      return database.auditLog.create({
        data: input
      });
    }
  };
}

export type AuditLogRepository = ReturnType<typeof createAuditLogRepository>;
