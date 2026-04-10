import { describe, expect, it } from "vitest";

import { parseCommerceEnv } from "./commerce-env.js";

describe("parseCommerceEnv", () => {
  it("provides manual checkout defaults", () => {
    expect(parseCommerceEnv({})).toEqual({
      COMMERCE_CHECKOUT_PROVIDER_MODE: "manual",
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
      COMMERCE_RESERVATION_TTL_SECONDS: 1800
    });
  });
});
