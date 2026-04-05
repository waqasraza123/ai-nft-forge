import { describe, expect, it } from "vitest";

import { createHealthPayload } from "./health";

describe("createHealthPayload", () => {
  it("returns the stable phase and service markers", () => {
    const payload = createHealthPayload();

    expect(payload.service).toBe("web");
    expect(payload.status).toBe("ok");
    expect(payload.phase).toBe("phase-2");
    expect(Number.isNaN(Date.parse(payload.timestamp))).toBe(false);
  });
});
