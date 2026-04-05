import { describe, expect, it } from "vitest";

import {
  createStudioSignInRedirectPath,
  resolveStudioAccessDecision
} from "./guard";

describe("studio auth guard", () => {
  it("builds the sign-in redirect path for studio", () => {
    expect(createStudioSignInRedirectPath("/studio")).toBe(
      "/sign-in?next=%2Fstudio"
    );
  });

  it("redirects unauthenticated access", () => {
    expect(resolveStudioAccessDecision(null)).toEqual({
      kind: "redirect",
      location: "/sign-in?next=%2Fstudio"
    });
  });

  it("allows authenticated access", () => {
    expect(
      resolveStudioAccessDecision({
        expiresAt: "2026-04-05T00:00:00.000Z",
        user: {
          avatarUrl: null,
          displayName: null,
          id: "user_1",
          walletAddress: "0xA7D9DdBE1f17865597fBD27EC712455208B6B76D"
        }
      })
    ).toEqual({
      kind: "allow"
    });
  });
});
