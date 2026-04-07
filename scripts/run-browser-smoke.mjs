import { spawnSync } from "node:child_process";

import {
  resolveBrowserSmokeEnvironment,
  resolveBrowserSmokePaths
} from "./browser-smoke-env.mjs";

const { repoRoot } = resolveBrowserSmokePaths();
const browserSmokeEnvironment = resolveBrowserSmokeEnvironment();

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: browserSmokeEnvironment,
    shell: false,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runCommand("pnpm", ["infra:up"]);
runCommand("pnpm", [
  "--filter",
  "@ai-nft-forge/database",
  "prisma:migrate:deploy"
]);
runCommand("pnpm", ["build"]);
runCommand("pnpm", ["--filter", "@ai-nft-forge/web", "test:smoke"]);
