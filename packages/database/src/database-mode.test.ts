import { describe, expect, it } from "vitest";

import {
  describeDatabaseRuntimeConfiguration,
  resolveDatabaseMode,
  resolveDatabaseRuntimeConfiguration,
  resolvePrismaDatabaseConfiguration
} from "./database-mode.js";

describe("resolveDatabaseMode", () => {
  it("defaults to local mode", () => {
    expect(resolveDatabaseMode({})).toBe("local");
  });

  it("returns neon mode when explicitly configured", () => {
    expect(
      resolveDatabaseMode({
        DATABASE_MODE: "neon"
      })
    ).toBe("neon");
  });
});

describe("describeDatabaseRuntimeConfiguration", () => {
  it("describes local runtime configuration", () => {
    expect(
      describeDatabaseRuntimeConfiguration({
        DATABASE_URL: "postgresql://forge:forge@127.0.0.1:5432/forge"
      })
    ).toEqual({
      mode: "local",
      urlConfigured: true,
      urlSource: "DATABASE_URL"
    });
  });

  it("describes neon runtime configuration", () => {
    expect(
      describeDatabaseRuntimeConfiguration({
        DATABASE_MODE: "neon",
        DATABASE_NEON_URL:
          "postgresql://forge:forge@ep-example.us-east-1.aws.neon.tech/forge"
      })
    ).toEqual({
      mode: "neon",
      urlConfigured: true,
      urlSource: "DATABASE_NEON_URL"
    });
  });
});

describe("resolveDatabaseRuntimeConfiguration", () => {
  it("uses DATABASE_URL for local runtime", () => {
    expect(
      resolveDatabaseRuntimeConfiguration({
        DATABASE_URL: "postgresql://forge:forge@127.0.0.1:5432/forge"
      })
    ).toEqual({
      mode: "local",
      url: "postgresql://forge:forge@127.0.0.1:5432/forge",
      urlSource: "DATABASE_URL"
    });
  });

  it("uses DATABASE_NEON_URL for neon runtime", () => {
    expect(
      resolveDatabaseRuntimeConfiguration({
        DATABASE_MODE: "neon",
        DATABASE_NEON_URL:
          "postgresql://forge:forge@ep-example.us-east-1.aws.neon.tech/forge"
      })
    ).toEqual({
      mode: "neon",
      url: "postgresql://forge:forge@ep-example.us-east-1.aws.neon.tech/forge",
      urlSource: "DATABASE_NEON_URL"
    });
  });
});

describe("resolvePrismaDatabaseConfiguration", () => {
  it("does not require urls for prisma validate in local mode", () => {
    expect(
      resolvePrismaDatabaseConfiguration(
        {},
        {
          argv: ["prisma", "validate"]
        }
      )
    ).toEqual({
      mode: "local"
    });
  });

  it("uses DATABASE_URL for local migrate deploy", () => {
    expect(
      resolvePrismaDatabaseConfiguration(
        {
          DATABASE_URL: "postgresql://forge:forge@127.0.0.1:5432/forge"
        },
        {
          argv: ["prisma", "migrate", "deploy"]
        }
      )
    ).toEqual({
      datasourceUrl: "postgresql://forge:forge@127.0.0.1:5432/forge",
      datasourceUrlSource: "DATABASE_URL",
      directUrl: "postgresql://forge:forge@127.0.0.1:5432/forge",
      directUrlSource: "DATABASE_URL",
      mode: "local"
    });
  });

  it("uses DATABASE_NEON_DIRECT_URL for neon Prisma commands when configured", () => {
    expect(
      resolvePrismaDatabaseConfiguration(
        {
          DATABASE_MODE: "neon",
          DATABASE_NEON_DIRECT_URL:
            "postgresql://forge:forge@ep-direct.us-east-1.aws.neon.tech/forge",
          DATABASE_NEON_URL:
            "postgresql://forge:forge@ep-runtime.us-east-1.aws.neon.tech/forge"
        },
        {
          argv: ["prisma", "migrate", "status"]
        }
      )
    ).toEqual({
      datasourceUrl:
        "postgresql://forge:forge@ep-direct.us-east-1.aws.neon.tech/forge",
      datasourceUrlSource: "DATABASE_NEON_DIRECT_URL",
      directUrl:
        "postgresql://forge:forge@ep-direct.us-east-1.aws.neon.tech/forge",
      directUrlSource: "DATABASE_NEON_DIRECT_URL",
      mode: "neon"
    });
  });

  it("falls back to DATABASE_NEON_URL for non-migrate neon Prisma commands", () => {
    expect(
      resolvePrismaDatabaseConfiguration(
        {
          DATABASE_MODE: "neon",
          DATABASE_NEON_URL:
            "postgresql://forge:forge@ep-runtime.us-east-1.aws.neon.tech/forge"
        },
        {
          argv: ["prisma", "validate"]
        }
      )
    ).toEqual({
      datasourceUrl:
        "postgresql://forge:forge@ep-runtime.us-east-1.aws.neon.tech/forge",
      datasourceUrlSource: "DATABASE_NEON_URL",
      mode: "neon"
    });
  });

  it("requires direct and shadow urls for neon migrate dev", () => {
    expect(() =>
      resolvePrismaDatabaseConfiguration(
        {
          DATABASE_MODE: "neon",
          DATABASE_NEON_URL:
            "postgresql://forge:forge@ep-runtime.us-east-1.aws.neon.tech/forge"
        },
        {
          argv: ["prisma", "migrate", "dev"]
        }
      )
    ).toThrowError(
      "DATABASE_NEON_DIRECT_URL is required when DATABASE_MODE=neon and prisma migrate dev is used."
    );
  });

  it("returns direct and shadow urls for neon migrate dev", () => {
    expect(
      resolvePrismaDatabaseConfiguration(
        {
          DATABASE_MODE: "neon",
          DATABASE_NEON_DIRECT_URL:
            "postgresql://forge:forge@ep-direct.us-east-1.aws.neon.tech/forge",
          DATABASE_NEON_SHADOW_URL:
            "postgresql://forge:forge@ep-shadow.us-east-1.aws.neon.tech/forge"
        },
        {
          argv: ["prisma", "migrate", "dev"]
        }
      )
    ).toEqual({
      datasourceUrl:
        "postgresql://forge:forge@ep-direct.us-east-1.aws.neon.tech/forge",
      datasourceUrlSource: "DATABASE_NEON_DIRECT_URL",
      directUrl:
        "postgresql://forge:forge@ep-direct.us-east-1.aws.neon.tech/forge",
      directUrlSource: "DATABASE_NEON_DIRECT_URL",
      mode: "neon",
      shadowDatabaseUrl:
        "postgresql://forge:forge@ep-shadow.us-east-1.aws.neon.tech/forge",
      shadowDatabaseUrlSource: "DATABASE_NEON_SHADOW_URL"
    });
  });
});
