import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

import { resolveDatabaseRuntimeUrl } from "./database-mode.js";

type DatabaseGlobal = typeof globalThis & {
  __aiNftForgeDatabaseClient?: PrismaClient;
};

const databaseGlobal = globalThis as DatabaseGlobal;

export function createDatabaseClient(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const adapter = new PrismaPg({
    connectionString: resolveDatabaseRuntimeUrl(rawEnvironment)
  });

  return new PrismaClient({
    adapter,
    log: ["error"]
  });
}

export function getDatabaseClient(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return createDatabaseClient(rawEnvironment);
  }

  if (!databaseGlobal.__aiNftForgeDatabaseClient) {
    databaseGlobal.__aiNftForgeDatabaseClient =
      createDatabaseClient(rawEnvironment);
  }

  return databaseGlobal.__aiNftForgeDatabaseClient;
}

export type DatabaseClient = PrismaClient;
export type DatabaseTransactionClient = Prisma.TransactionClient;
export type DatabaseExecutor = PrismaClient | Prisma.TransactionClient;
