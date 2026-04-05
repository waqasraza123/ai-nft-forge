import { describe, expect, it } from "vitest";

import { createDatabaseHealthSnapshot } from "./health.js";

describe("createDatabaseHealthSnapshot", () => {
  it("reports when a database url is missing", () => {
    expect(createDatabaseHealthSnapshot({})).toEqual({
      liveConnectionDeferred: true,
      provider: "postgresql",
      status: "missing_database_url",
      urlConfigured: false
    });
  });

  it("reports when a database url is configured", () => {
    expect(
      createDatabaseHealthSnapshot({
        DATABASE_URL: "postgresql://forge:forge@localhost:5432/forge"
      })
    ).toEqual({
      liveConnectionDeferred: true,
      provider: "postgresql",
      status: "configured",
      urlConfigured: true
    });
  });
});
