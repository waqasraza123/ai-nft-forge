import { expect, test } from "@playwright/test";

import {
  createAuthenticatedBrowserSmokeSession,
  getBrowserSmokeBaseURLFromConfig,
  resetBrowserSmokeState,
  seedPublicStorefrontData
} from "./support/browser-smoke";

test("renders the public storefront brand and collection routes from published data", async ({
  page
}, testInfo) => {
  await resetBrowserSmokeState();

  const baseURL = getBrowserSmokeBaseURLFromConfig(testInfo.config);
  const authenticatedSession = await createAuthenticatedBrowserSmokeSession({
    baseURL
  });
  const storefront = await seedPublicStorefrontData({
    userId: authenticatedSession.session.user.id
  });

  await page.goto(storefront.brandPath);

  await expect(
    page.getByRole("heading", {
      name: "Curated launch storefront"
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Live releases"
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Archive"
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Midnight Portraits"
    })
  ).toBeVisible();

  await page.goto(storefront.collectionPath);

  await expect(
    page.getByRole("heading", {
      name: "Midnight Portraits"
    })
  ).toBeVisible();
  await expect(
    page.getByText("Release status")
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Enter mint" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Reserve the next available edition for 0.18 ETH"
    })
  ).toBeVisible();
  await expect(page.getByText("Supply")).toBeVisible();
});
