import type { DatabaseClient } from "./client.js";
import {
  describeDatabaseRuntimeConfiguration,
  type DatabaseMode,
  type DatabaseRuntimeUrlSource
} from "./database-mode.js";

export type DatabaseHealthSnapshot = {
  liveConnectionDeferred: true;
  mode: DatabaseMode;
  provider: "postgresql";
  status: "configured" | "missing_database_url";
  urlConfigured: boolean;
  urlSource: DatabaseRuntimeUrlSource | null;
};

export type DatabaseConnectivityStatus = {
  provider: "postgresql";
  status: "configured" | "connection_failed" | "missing_database_url" | "ok";
};

export function createDatabaseHealthSnapshot(
  rawEnvironment: NodeJS.ProcessEnv
): DatabaseHealthSnapshot {
  const runtimeConfiguration =
    describeDatabaseRuntimeConfiguration(rawEnvironment);

  return {
    liveConnectionDeferred: true,
    mode: runtimeConfiguration.mode,
    provider: "postgresql",
    status: runtimeConfiguration.urlConfigured
      ? "configured"
      : "missing_database_url",
    urlConfigured: runtimeConfiguration.urlConfigured,
    urlSource: runtimeConfiguration.urlSource
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
