import { z } from "zod";

import type { DatabaseClient } from "./client.js";

const databaseHealthEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional()
});

export type DatabaseHealthSnapshot = {
  liveConnectionDeferred: true;
  provider: "postgresql";
  status: "configured" | "missing_database_url";
  urlConfigured: boolean;
};

export type DatabaseConnectivityStatus = {
  provider: "postgresql";
  status: "configured" | "connection_failed" | "missing_database_url" | "ok";
};

export function createDatabaseHealthSnapshot(
  rawEnvironment: NodeJS.ProcessEnv
): DatabaseHealthSnapshot {
  const env = databaseHealthEnvSchema.parse(rawEnvironment);
  const urlConfigured = Boolean(env.DATABASE_URL);

  return {
    liveConnectionDeferred: true,
    provider: "postgresql",
    status: urlConfigured ? "configured" : "missing_database_url",
    urlConfigured
  };
}

export async function checkDatabaseConnection(
  client: DatabaseClient,
  rawEnvironment: NodeJS.ProcessEnv
): Promise<DatabaseConnectivityStatus> {
  const snapshot = createDatabaseHealthSnapshot(rawEnvironment);

  if (!snapshot.urlConfigured) {
    return {
      provider: "postgresql",
      status: "missing_database_url"
    };
  }

  try {
    await client.$queryRaw`SELECT 1`;

    return {
      provider: "postgresql",
      status: "ok"
    };
  } catch {
    return {
      provider: "postgresql",
      status: "connection_failed"
    };
  }
}
