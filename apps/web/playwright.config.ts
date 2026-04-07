import { defineConfig, devices } from "@playwright/test";

import {
  resolveBrowserSmokeEnvironment,
  resolveBrowserSmokePaths
} from "../../scripts/browser-smoke-env.mjs";

const browserSmokeEnvironment = resolveBrowserSmokeEnvironment();
const { repoRoot } = resolveBrowserSmokePaths();

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/*.smoke.ts"],
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: "playwright-report"
      }
    ]
  ],
  use: {
    baseURL: browserSmokeEnvironment.PLAYWRIGHT_BASE_URL,
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: [
    {
      command: "pnpm --filter @ai-nft-forge/generation-backend start",
      cwd: repoRoot,
      env: browserSmokeEnvironment,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: browserSmokeEnvironment.PLAYWRIGHT_BACKEND_HEALTH_URL
    },
    {
      command:
        "pnpm --filter @ai-nft-forge/web start -- --hostname 127.0.0.1 --port 3100",
      cwd: repoRoot,
      env: browserSmokeEnvironment,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: `${browserSmokeEnvironment.PLAYWRIGHT_BASE_URL}/api/health`
    }
  ]
});
