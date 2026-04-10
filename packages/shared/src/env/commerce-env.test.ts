import { describe, expect, it } from "vitest";

import { parseCommerceEnv } from "./commerce-env.js";

describe("parseCommerceEnv", () => {
  it("provides manual checkout defaults", () => {
    expect(parseCommerceEnv({})).toEqual({
      COMMERCE_CHECKOUT_PROVIDER_MODE: "manual",
      COMMERCE_STRIPE_PUBLISHABLE_KEY: undefined,
      COMMERCE_STRIPE_SECRET_KEY: undefined,
      COMMERCE_STRIPE_WEBHOOK_SECRET: undefined,
      COMMERCE_RESERVATION_TTL_SECONDS: 900
    });
  });

  it("parses custom commerce configuration", () => {
    expect(
      parseCommerceEnv({
        COMMERCE_CHECKOUT_PROVIDER_MODE: "disabled",
        COMMERCE_RESERVATION_TTL_SECONDS: "1800"
      })
    ).toEqual({
      COMMERCE_CHECKOUT_PROVIDER_MODE: "disabled",
      COMMERCE_STRIPE_PUBLISHABLE_KEY: undefined,
      COMMERCE_STRIPE_SECRET_KEY: undefined,
      COMMERCE_STRIPE_WEBHOOK_SECRET: undefined,
      COMMERCE_RESERVATION_TTL_SECONDS: 1800
    });
  });

  it("requires Stripe credentials when stripe mode is enabled", () => {
    expect(() =>
      parseCommerceEnv({
        COMMERCE_CHECKOUT_PROVIDER_MODE: "stripe"
      })
    ).toThrow(
      "COMMERCE_STRIPE_PUBLISHABLE_KEY is required when COMMERCE_CHECKOUT_PROVIDER_MODE=stripe."
    );
  });
});
