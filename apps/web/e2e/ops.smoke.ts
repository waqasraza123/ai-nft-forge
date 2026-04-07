import { expect, test } from "@playwright/test";

import {
  createAuthenticatedBrowserSmokeSession,
  getBrowserSmokeBaseURLFromConfig,
  resetBrowserSmokeState,
  seedBrowserSmokeData
} from "./support/browser-smoke";

test("renders authenticated ops diagnostics and retry ergonomics", async ({
  browser
}, testInfo) => {
  await resetBrowserSmokeState();

  const baseURL = getBrowserSmokeBaseURLFromConfig(testInfo.config);
  const authenticatedSession = await createAuthenticatedBrowserSmokeSession({
    baseURL
  });
  const seededState = await seedBrowserSmokeData({
    userId: authenticatedSession.session.user.id
  });
  const context = await browser.newContext({
    storageState: authenticatedSession.storageState
  });
  const page = await context.newPage();
  const activeGenerationRequestsCard = page.locator("article.surface-card", {
    has: page.getByRole("heading", {
      name: "Active generation requests"
    })
  });
  const retryableFailuresCard = page.locator("article.surface-card", {
    has: page.getByRole("heading", {
      name: "Retryable failures"
    })
  });

  try {
    await page.goto("/ops");

    await expect(
      page.getByRole("heading", {
        name: "Live runtime, alerts, and queue diagnostics for the generation path"
      })
    ).toBeVisible();
    await expect(
      page.getByText("Recent generation failures are elevated.")
    ).toBeVisible();
    await expect(
      page.getByText(
        "Running owner-scoped generation work is longer than expected."
      )
    ).toBeVisible();
    await expect(activeGenerationRequestsCard).toContainText(
      seededState.runningAssetFilename
    );
    await expect(activeGenerationRequestsCard).not.toContainText(
      seededState.mainAssetFilename
    );

    const mainFailureItem = retryableFailuresCard.locator(
      ".ops-activity-item",
      {
        hasText: seededState.mainAssetFilename
      }
    );

    await mainFailureItem
      .getByRole("button", { name: "Retry generation" })
      .click();
    await expect(
      page.getByText("Generation retry was queued from the ops surface.")
    ).toBeVisible();
    await expect(activeGenerationRequestsCard).toContainText(
      seededState.mainAssetFilename
    );
    await expect(activeGenerationRequestsCard).toContainText("queued");
  } finally {
    await context.close();
  }
});
