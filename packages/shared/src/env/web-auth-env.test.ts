import { describe, expect, it } from "vitest";

import { parseWebAuthEnv } from "./web-auth-env.js";

describe("parseWebAuthEnv", () => {
  it("applies durable auth defaults", () => {
    expect(parseWebAuthEnv({})).toEqual({
      AUTH_MESSAGE_STATEMENT: "Sign in to AI NFT Forge",
      AUTH_NONCE_TTL_MINUTES: 10,
      AUTH_SESSION_COOKIE_NAME: "ai_nft_forge_session",
      AUTH_SESSION_TTL_DAYS: 30
    });
  });

  it("parses explicit auth env overrides", () => {
    expect(
      parseWebAuthEnv({
        AUTH_MESSAGE_STATEMENT: "Sign in to Demo",
        AUTH_NONCE_TTL_MINUTES: "5",
        AUTH_SESSION_COOKIE_NAME: "demo_session",
        AUTH_SESSION_TTL_DAYS: "14"
      })
    ).toEqual({
      AUTH_MESSAGE_STATEMENT: "Sign in to Demo",
      AUTH_NONCE_TTL_MINUTES: 5,
      AUTH_SESSION_COOKIE_NAME: "demo_session",
      AUTH_SESSION_TTL_DAYS: 14
    });
  });
});
