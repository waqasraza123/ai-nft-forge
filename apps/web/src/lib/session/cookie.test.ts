import { describe, expect, it } from "vitest";

import {
  createClearedSessionCookieDefinition,
  createSessionCookieDefinition,
  shouldUseSecureSessionCookie
} from "./cookie";

describe("session cookie helpers", () => {
  it("uses secure cookies only in production", () => {
    expect(shouldUseSecureSessionCookie("production")).toBe(true);
    expect(shouldUseSecureSessionCookie("development")).toBe(false);
    expect(shouldUseSecureSessionCookie(undefined)).toBe(false);
  });

  it("creates a durable session cookie definition", () => {
    const expiresAt = new Date("2026-04-05T00:00:00.000Z");

    expect(
      createSessionCookieDefinition({
        expiresAt,
        name: "session",
        nodeEnvironment: "production",
        value: "session_1"
      })
    ).toEqual({
      expires: expiresAt,
      httpOnly: true,
      name: "session",
      path: "/",
      sameSite: "lax",
      secure: true,
      value: "session_1"
    });
  });

  it("creates an expired cookie definition for logout", () => {
    const cookie = createClearedSessionCookieDefinition({
      name: "session",
      nodeEnvironment: "development"
    });

    expect(cookie.value).toBe("");
    expect(cookie.secure).toBe(false);
    expect(cookie.expires.getTime()).toBe(0);
  });
});
