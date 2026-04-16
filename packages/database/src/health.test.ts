import { describe, expect, it } from "vitest";

import { createDatabaseHealthSnapshot } from "./health.js";

describe("createDatabaseHealthSnapshot", () => {
  it("reports when a local database url is missing", () => {
    expect(createDatabaseHealthSnapshot({})).toEqual({
      liveConnectionDeferred: true,
      mode: "local",
      provider: "postgresql",
      status: "missing_database_url",
      urlConfigured: false,
      urlSource: null
    });
  });

  it("reports when a local database url is configured", () => {
    expect(
      createDatabaseHealthSnapshot({
        DATABASE_URL: "postgresql://forge:forge@localhost:5432/forge"
      })
    ).toEqual({
      liveConnectionDeferred: true,
      mode: "local",
      provider: "postgresql",
      status: "configured",
      urlConfigured: true,
      urlSource: "DATABASE_URL"
    });
  });

  it("reports when a neon runtime database url is configured", () => {
    expect(
      createDatabaseHealthSnapshot({
        DATABASE_MODE: "neon",
        DATABASE_NEON_URL:
          "postgresql://forge:forge@ep-example.us-east-1.aws.neon.tech/forge"
      })
    ).toEqual({
      liveConnectionDeferred: true,
      mode: "neon",
      provider: "postgresql",
      status: "configured",
      urlConfigured: true,
      urlSource: "DATABASE_NEON_URL"
    });
  });

  it("reports when a neon runtime database url is missing", () => {
    expect(
      createDatabaseHealthSnapshot({
        DATABASE_MODE: "neon"
      })
    ).toEqual({
      liveConnectionDeferred: true,
      mode: "neon",
      provider: "postgresql",
      status: "missing_database_url",
      urlConfigured: false,
      urlSource: null
    });
  });
});
