import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

import { resolvePrismaDatabaseConfiguration } from "./src/database-mode.js";

const prismaConfigDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRootDirectory = resolve(prismaConfigDirectory, "../..");
const fallbackEnvFilePaths = [
  resolve(repositoryRootDirectory, ".env.local"),
  resolve(repositoryRootDirectory, ".env")
];

for (const envFilePath of fallbackEnvFilePaths) {
  if (!existsSync(envFilePath)) {
    continue;
  }

  loadEnv({
    override: false,
    path: envFilePath,
    quiet: true
  });
}

const prismaDatabaseConfiguration = resolvePrismaDatabaseConfiguration(
  process.env
);

export default defineConfig({
  ...(prismaDatabaseConfiguration.datasourceUrl
    ? {
        datasource: {
          ...(prismaDatabaseConfiguration.shadowDatabaseUrl
            ? {
                shadowDatabaseUrl:
                  prismaDatabaseConfiguration.shadowDatabaseUrl
              }
            : {}),
          url: prismaDatabaseConfiguration.datasourceUrl
        }
      }
    : {}),
  migrations: {
    path: "prisma/migrations"
  },
  schema: "prisma/schema.prisma"
});
