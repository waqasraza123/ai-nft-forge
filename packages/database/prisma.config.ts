import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const prismaConfigDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRootDirectory = resolve(prismaConfigDirectory, "../..");
const fallbackEnvFilePaths = [
  resolve(repositoryRootDirectory, ".env.local"),
  resolve(repositoryRootDirectory, ".env")
];

function resolveDatasourceUrl(): string {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL;
  }

  for (const envFilePath of fallbackEnvFilePaths) {
    if (!existsSync(envFilePath)) {
      continue;
    }

    loadEnv({
      override: false,
      path: envFilePath,
      quiet: true
    });

    if (process.env.DATABASE_URL?.trim()) {
      return process.env.DATABASE_URL;
    }
  }

  throw new Error(
    `DATABASE_URL is required for Prisma commands. Checked process.env and: ${fallbackEnvFilePaths.join(
      ", "
    )}`
  );
}

export default defineConfig({
  datasource: {
    url: resolveDatasourceUrl()
  },
  migrations: {
    path: "prisma/migrations"
  },
  schema: "prisma/schema.prisma"
});
