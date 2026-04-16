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
  const latestOperatorActionCard = page.locator("article.surface-card", {
    has: page.getByRole("heading", {
      name: "Latest operator action"
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
    await expect(latestOperatorActionCard).toContainText(
      "Generation retry was queued from the ops surface."
    );

    await page.getByRole("button", { name: "Run reconciliation" }).click();
    await expect(latestOperatorActionCard).toContainText(
      "Reconciliation run completed from the ops surface."
    );
    await expect(
      page.getByRole("heading", { name: "Open reconciliation issues" })
    ).toBeVisible();
    await expect(
      page.getByText("Published public asset missing")
    ).toBeVisible();
    await expect(page.getByText("Review-ready draft is invalid")).toBeVisible();

    const reviewReadyIssue = page.locator(".ops-activity-item", {
      hasText: "Review-ready draft is invalid"
    });

    await reviewReadyIssue
      .getByRole("button", { name: "Repair issue" })
      .click();
    await expect(latestOperatorActionCard).toContainText(
      "Reconciliation repair completed from the ops surface."
    );

    await page.goto("/studio/collections");
    await page
      .getByRole("button", { name: seededState.invalidDraftTitle })
      .click();
    await expect(
      page.getByText("Review-ready draft is no longer valid")
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
