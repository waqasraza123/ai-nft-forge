import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";

const repositoryRootMarkerFileName = "pnpm-workspace.yaml";
const envFileNames = [".env.local", ".env"];

function findRepositoryRootDirectory(startDirectory: string): string | null {
  let currentDirectory = startDirectory;

  while (true) {
    if (
      existsSync(resolve(currentDirectory, repositoryRootMarkerFileName))
    ) {
      return currentDirectory;
    }

    const parentDirectory = resolve(currentDirectory, "..");

    if (parentDirectory === currentDirectory) {
      return null;
    }

    currentDirectory = parentDirectory;
  }
}

export function loadRepositoryEnvironment(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): void {
  const currentModuleDirectory = dirname(fileURLToPath(import.meta.url));
  const repositoryRootDirectory =
    findRepositoryRootDirectory(currentModuleDirectory);

  if (!repositoryRootDirectory) {
    return;
  }

  for (const envFileName of envFileNames) {
    const envFilePath = resolve(repositoryRootDirectory, envFileName);

    if (!existsSync(envFilePath)) {
      continue;
    }

    loadEnv({
      override: false,
      path: envFilePath,
      processEnv: rawEnvironment,
      quiet: true
    });
  }
}
