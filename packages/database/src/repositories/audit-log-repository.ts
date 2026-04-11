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
    },

    listByEntity(input: {
      actions?: string[];
      cursor?: string;
      entityId: string;
      entityType: string;
      limit?: number;
    }): Promise<AuditLog[]> {
      return database.auditLog.findMany({
        ...(input.cursor
          ? {
              cursor: {
                id: input.cursor
              },
              skip: 1
            }
          : {}),
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: input.limit ?? 50,
        where: {
          ...(input.actions && input.actions.length > 0
            ? {
                action: {
                  in: input.actions
                }
              }
            : {}),
          entityId: input.entityId,
          entityType: input.entityType
        }
      });
    }
  };
}

export type AuditLogRepository = ReturnType<typeof createAuditLogRepository>;
