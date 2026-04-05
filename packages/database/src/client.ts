import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

type DatabaseGlobal = typeof globalThis & {
  __aiNftForgeDatabaseClient?: PrismaClient;
};

const databaseClientEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1)
});

const databaseGlobal = globalThis as DatabaseGlobal;

function resolveDatabaseUrl(rawEnvironment: NodeJS.ProcessEnv): string {
  return databaseClientEnvironmentSchema.parse(rawEnvironment).DATABASE_URL;
}

export function createDatabaseClient(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const adapter = new PrismaPg({
    connectionString: resolveDatabaseUrl(rawEnvironment)
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
