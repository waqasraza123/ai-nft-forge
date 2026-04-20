import { createHash, randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "pg";
import { config as loadEnv } from "dotenv";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptDirectory, "..");
const repositoryRootDirectory = resolve(packageDirectory, "../..");
const migrationsDirectory = resolve(packageDirectory, "prisma/migrations");
const migrationTableName = '"_prisma_migrations"';
const advisoryLockKey = 8_587_045;

for (const envFilePath of [
  resolve(repositoryRootDirectory, ".env.local"),
  resolve(repositoryRootDirectory, ".env")
]) {
  if (!existsSync(envFilePath)) {
    continue;
  }

  loadEnv({
    override: false,
    path: envFilePath,
    quiet: true
  });
}

function resolveConnectionString() {
  const mode = process.env.DATABASE_MODE?.trim() ?? "local";

  if (mode !== "neon") {
    throw new Error(
      "The cloud Neon migration fallback only supports DATABASE_MODE=neon."
    );
  }

  const connectionString =
    process.env.DATABASE_NEON_DIRECT_URL ?? process.env.DATABASE_NEON_URL;

  if (!connectionString || connectionString.trim().length === 0) {
    throw new Error(
      "DATABASE_NEON_DIRECT_URL or DATABASE_NEON_URL is required for the cloud Neon migration fallback."
    );
  }

  const normalizedConnectionUrl = new URL(connectionString);

  if (
    normalizedConnectionUrl.searchParams.get("sslmode") === "require" &&
    !normalizedConnectionUrl.searchParams.has("uselibpqcompat")
  ) {
    normalizedConnectionUrl.searchParams.set("sslmode", "verify-full");
  }

  return normalizedConnectionUrl.toString();
}

function listMigrationDirectories() {
  return readdirSync(migrationsDirectory, {
    withFileTypes: true
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function readMigrationSql(migrationName) {
  return readFileSync(
    resolve(migrationsDirectory, migrationName, "migration.sql"),
    "utf8"
  );
}

function computeChecksum(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${migrationTableName} (
      "id" TEXT PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" TEXT NOT NULL UNIQUE,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);
}

async function acquireLock(client) {
  await client.query("SELECT pg_advisory_lock($1)", [advisoryLockKey]);
}

async function releaseLock(client) {
  await client.query("SELECT pg_advisory_unlock($1)", [advisoryLockKey]);
}

async function loadAppliedMigrations(client) {
  const result = await client.query(`
    SELECT
      "migration_name",
      "finished_at",
      "rolled_back_at",
      "started_at",
      "logs"
    FROM ${migrationTableName}
    ORDER BY "migration_name" ASC
  `);

  return new Map(
    result.rows.map((row) => [
      row.migration_name,
      {
        finishedAt: row.finished_at,
        logs: row.logs,
        rolledBackAt: row.rolled_back_at,
        startedAt: row.started_at
      }
    ])
  );
}

function splitMigrationState(migrationNames, appliedMigrations) {
  const applied = [];
  const failed = [];
  const pending = [];

  for (const migrationName of migrationNames) {
    const record = appliedMigrations.get(migrationName);

    if (!record) {
      pending.push(migrationName);
      continue;
    }

    if (record.finishedAt && !record.rolledBackAt) {
      applied.push(migrationName);
      continue;
    }

    failed.push(migrationName);
  }

  return {
    applied,
    failed,
    pending
  };
}

function printStatusSummary(summary) {
  process.stdout.write(
    `${JSON.stringify(
      {
        appliedMigrations: summary.applied,
        failedMigrations: summary.failed,
        pendingMigrations: summary.pending,
        provider: "postgresql",
        status:
          summary.failed.length > 0
            ? "failed_migrations"
            : summary.pending.length > 0
              ? "pending_migrations"
              : "up_to_date"
      },
      null,
      2
    )}\n`
  );
}

async function deployPendingMigrations(client, summary) {
  if (summary.failed.length > 0) {
    throw new Error(
      `Cannot continue because these migrations previously failed: ${summary.failed.join(
        ", "
      )}. Resolve or remove the failed rows from _prisma_migrations before retrying.`
    );
  }

  if (summary.pending.length === 0) {
    process.stdout.write("No pending migrations to apply.\n");
    return;
  }

  for (const migrationName of summary.pending) {
    const migrationSql = readMigrationSql(migrationName);
    const migrationId = randomUUID();
    const checksum = computeChecksum(migrationSql);

    await client.query(
      `
        INSERT INTO ${migrationTableName} (
          "id",
          "checksum",
          "migration_name",
          "started_at",
          "applied_steps_count"
        )
        VALUES ($1, $2, $3, NOW(), 0)
      `,
      [migrationId, checksum, migrationName]
    );

    try {
      await client.query("BEGIN");
      await client.query(migrationSql);
      await client.query("COMMIT");

      await client.query(
        `
          UPDATE ${migrationTableName}
          SET "finished_at" = NOW(),
              "applied_steps_count" = 1
          WHERE "id" = $1
        `,
        [migrationId]
      );

      process.stdout.write(`Applied migration ${migrationName}.\n`);
    } catch (error) {
      await client.query("ROLLBACK");

      const logs =
        error instanceof Error ? error.stack ?? error.message : String(error);

      await client.query(
        `
          UPDATE ${migrationTableName}
          SET "logs" = $2
          WHERE "id" = $1
        `,
        [migrationId, logs]
      );

      throw error;
    }
  }

  process.stdout.write("All pending migrations applied.\n");
}

async function main() {
  const command = process.argv[2];

  if (command !== "deploy" && command !== "status") {
    throw new Error(
      'Expected "deploy" or "status" as the first fallback migration argument.'
    );
  }

  const client = new Client({
    connectionString: resolveConnectionString()
  });

  await client.connect();

  try {
    await ensureMigrationTable(client);
    await acquireLock(client);

    const migrationNames = listMigrationDirectories();
    const appliedMigrations = await loadAppliedMigrations(client);
    const summary = splitMigrationState(migrationNames, appliedMigrations);

    if (command === "status") {
      printStatusSummary(summary);

      if (summary.failed.length > 0) {
        process.exitCode = 1;
      }

      return;
    }

    await deployPendingMigrations(client, summary);
  } finally {
    try {
      await releaseLock(client);
    } catch {}

    await client.end();
  }
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
