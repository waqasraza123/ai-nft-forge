import { expect, test } from "@playwright/test";

import {
  createAuthenticatedBrowserSmokeSession,
  getBrowserSmokeBaseURLFromConfig,
  resetBrowserSmokeState,
  seedBrowserSmokeData
} from "./support/browser-smoke";

test.describe("studio assets browser smoke", () => {
  test("redirects unauthenticated browsers to sign-in", async ({ page }) => {
    await resetBrowserSmokeState();

    await page.goto("/studio/assets");

    await expect(page).toHaveURL(/\/sign-in\?next=%2Fstudio$/u);
    await expect(
      page.getByRole("heading", {
        name: "Wallet access and Base Account sign-in"
      })
    ).toBeVisible();
  });

  test("renders history inspection and retry flow for authenticated operators", async ({
    browser
  }, testInfo) => {
    await resetBrowserSmokeState();

    const baseURL = getBrowserSmokeBaseURLFromConfig(testInfo.config);
    const authenticatedSession = await createAuthenticatedBrowserSmokeSession({
      baseURL
    });

    await seedBrowserSmokeData({
      userId: authenticatedSession.session.user.id
    });

    const context = await browser.newContext({
      storageState: authenticatedSession.storageState
    });
    const page = await context.newPage();
    const mainAssetCard = page.locator("article.surface-card", {
      has: page.getByRole("heading", {
        name: "portrait-main.png"
      })
    });
    const workflowStatusCard = page.locator("article.surface-card", {
      has: page.getByRole("heading", {
        name: "Workflow status"
      })
    });

    try {
      await page.goto("/studio/assets");

      await expect(
        page.getByRole("heading", {
          name: "Upload, dispatch, review history, and retrieve generated outputs"
        })
      ).toBeVisible();
      await expect(mainAssetCard).toContainText("2 generation runs");
      await expect(mainAssetCard).toContainText("Generation failed");
      await mainAssetCard.getByRole("button", { name: "Inspect run" }).click();
      await expect(mainAssetCard).toContainText(
        "Viewing an archived generation run."
      );
      await expect(mainAssetCard).toContainText("Generation completed.");
      await expect(mainAssetCard).toContainText("2 stored outputs");
      await mainAssetCard.getByRole("button", { name: "Inspect run" }).click();
      await expect(mainAssetCard).toContainText("Generation failed.");
      await mainAssetCard
        .getByRole("button", { name: "Retry failed run" })
        .click();
      await expect(workflowStatusCard).toContainText(
        "Failed generation request re-queued for worker processing."
      );
      await expect(mainAssetCard).toContainText("3 generation runs");
      await expect(mainAssetCard).toContainText("Generation queued");
    } finally {
      await context.close();
    }
  });
});
