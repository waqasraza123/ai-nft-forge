import { z } from "zod";

export const databaseModes = ["local", "neon"] as const;
export const databaseModeSchema = z.enum(databaseModes).default("local");

const optionalConnectionStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().min(1).optional());

const databaseModeEnvironmentSchema = z.object({
  DATABASE_MODE: databaseModeSchema,
  DATABASE_NEON_DIRECT_URL: optionalConnectionStringSchema,
  DATABASE_NEON_SHADOW_URL: optionalConnectionStringSchema,
  DATABASE_NEON_URL: optionalConnectionStringSchema,
  DATABASE_URL: optionalConnectionStringSchema
});

export type DatabaseMode = z.infer<typeof databaseModeSchema>;
export type DatabaseModeEnvironment = z.infer<
  typeof databaseModeEnvironmentSchema
>;
export type DatabaseRuntimeUrlSource = "DATABASE_NEON_URL" | "DATABASE_URL";
export type DatabasePrismaUrlSource =
  | "DATABASE_NEON_DIRECT_URL"
  | "DATABASE_NEON_SHADOW_URL"
  | DatabaseRuntimeUrlSource;

export type DatabaseRuntimeConfigurationSummary = {
  mode: DatabaseMode;
  urlConfigured: boolean;
  urlSource: DatabaseRuntimeUrlSource | null;
};

export type ResolvedDatabaseRuntimeConfiguration = {
  mode: DatabaseMode;
  url: string;
  urlSource: DatabaseRuntimeUrlSource;
};

export type ResolvedPrismaDatabaseConfiguration = {
  datasourceUrl?: string | undefined;
  datasourceUrlSource?: DatabasePrismaUrlSource | undefined;
  directUrl?: string | undefined;
  directUrlSource?: DatabasePrismaUrlSource | undefined;
  mode: DatabaseMode;
  shadowDatabaseUrl?: string | undefined;
  shadowDatabaseUrlSource?: DatabasePrismaUrlSource | undefined;
};

type PrismaCommand = {
  command: string;
  subcommand?: string | undefined;
} | null;

type ResolvePrismaDatabaseConfigurationOptions = {
  argv?: string[];
};

function parseDatabaseModeEnvironment(
  rawEnvironment: NodeJS.ProcessEnv
): DatabaseModeEnvironment {
  return databaseModeEnvironmentSchema.parse(rawEnvironment);
}

function requireEnvironmentValue(input: {
  context?: string | undefined;
  key: DatabasePrismaUrlSource | DatabaseRuntimeUrlSource;
  value: string | undefined;
}): string {
  if (input.value) {
    return input.value;
  }

  throw new Error(
    input.context
      ? `${input.key} is required ${input.context}.`
      : `${input.key} is required.`
  );
}

function resolvePrismaCommand(argv: string[]): PrismaCommand {
  const migrateCommandIndex = argv.indexOf("migrate");

  if (migrateCommandIndex >= 0) {
    return {
      command: "migrate",
      subcommand: argv[migrateCommandIndex + 1]
    };
  }

  const dbCommandIndex = argv.indexOf("db");

  if (dbCommandIndex >= 0) {
    return {
      command: "db",
      subcommand: argv[dbCommandIndex + 1]
    };
  }

  const validateCommandIndex = argv.indexOf("validate");

  if (validateCommandIndex >= 0) {
    return {
      command: "validate"
    };
  }

  const generateCommandIndex = argv.indexOf("generate");

  if (generateCommandIndex >= 0) {
    return {
      command: "generate"
    };
  }

  return null;
}

function requiresPrismaDatabaseConnection(command: PrismaCommand): boolean {
  if (!command) {
    return false;
  }

  return command.command === "migrate" || command.command === "db";
}

function requiresNeonShadowDatabase(command: PrismaCommand): boolean {
  return command?.command === "migrate" && command.subcommand === "dev";
}

export function resolveDatabaseMode(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): DatabaseMode {
  return parseDatabaseModeEnvironment(rawEnvironment).DATABASE_MODE;
}

export function describeDatabaseRuntimeConfiguration(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): DatabaseRuntimeConfigurationSummary {
  const env = parseDatabaseModeEnvironment(rawEnvironment);

  if (env.DATABASE_MODE === "neon") {
    return {
      mode: "neon",
      urlConfigured: Boolean(env.DATABASE_NEON_URL),
      urlSource: env.DATABASE_NEON_URL ? "DATABASE_NEON_URL" : null
    };
  }

  return {
    mode: "local",
    urlConfigured: Boolean(env.DATABASE_URL),
    urlSource: env.DATABASE_URL ? "DATABASE_URL" : null
  };
}

export function resolveDatabaseRuntimeConfiguration(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): ResolvedDatabaseRuntimeConfiguration {
  const env = parseDatabaseModeEnvironment(rawEnvironment);

  if (env.DATABASE_MODE === "neon") {
    return {
      mode: "neon",
      url: requireEnvironmentValue({
        context: "when DATABASE_MODE=neon",
        key: "DATABASE_NEON_URL",
        value: env.DATABASE_NEON_URL
      }),
      urlSource: "DATABASE_NEON_URL"
    };
  }

  return {
    mode: "local",
    url: requireEnvironmentValue({
      context: "when DATABASE_MODE=local",
      key: "DATABASE_URL",
      value: env.DATABASE_URL
    }),
    urlSource: "DATABASE_URL"
  };
}

export function resolveDatabaseRuntimeUrl(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): string {
  return resolveDatabaseRuntimeConfiguration(rawEnvironment).url;
}

export function resolvePrismaDatabaseConfiguration(
  rawEnvironment: NodeJS.ProcessEnv = process.env,
  options: ResolvePrismaDatabaseConfigurationOptions = {}
): ResolvedPrismaDatabaseConfiguration {
  const env = parseDatabaseModeEnvironment(rawEnvironment);
  const prismaCommand = resolvePrismaCommand(options.argv ?? process.argv);
  const databaseConnectionRequired =
    requiresPrismaDatabaseConnection(prismaCommand);

  if (env.DATABASE_MODE === "local") {
    if (!env.DATABASE_URL && !databaseConnectionRequired) {
      return {
        mode: "local"
      };
    }

    const localDatabaseUrl = requireEnvironmentValue({
      context: "when DATABASE_MODE=local",
      key: "DATABASE_URL",
      value: env.DATABASE_URL
    });

    return {
      datasourceUrl: localDatabaseUrl,
      datasourceUrlSource: "DATABASE_URL",
      directUrl: localDatabaseUrl,
      directUrlSource: "DATABASE_URL",
      mode: "local"
    };
  }

  const requiresShadowDatabase = requiresNeonShadowDatabase(prismaCommand);

  if (requiresShadowDatabase) {
    const directUrl = requireEnvironmentValue({
      context: "when DATABASE_MODE=neon and prisma migrate dev is used",
      key: "DATABASE_NEON_DIRECT_URL",
      value: env.DATABASE_NEON_DIRECT_URL
    });

    return {
      datasourceUrl: directUrl,
      datasourceUrlSource: "DATABASE_NEON_DIRECT_URL",
      directUrl,
      directUrlSource: "DATABASE_NEON_DIRECT_URL",
      mode: "neon",
      shadowDatabaseUrl: requireEnvironmentValue({
        context: "when DATABASE_MODE=neon and prisma migrate dev is used",
        key: "DATABASE_NEON_SHADOW_URL",
        value: env.DATABASE_NEON_SHADOW_URL
      }),
      shadowDatabaseUrlSource: "DATABASE_NEON_SHADOW_URL"
    };
  }

  const prismaDatasourceUrl =
    env.DATABASE_NEON_DIRECT_URL ?? env.DATABASE_NEON_URL;

  if (!prismaDatasourceUrl && !databaseConnectionRequired) {
    if (!env.DATABASE_NEON_DIRECT_URL) {
      return {
        mode: "neon"
      };
    }

    return {
      directUrl: env.DATABASE_NEON_DIRECT_URL,
      directUrlSource: "DATABASE_NEON_DIRECT_URL",
      mode: "neon"
    };
  }

  const datasourceUrl = requireEnvironmentValue({
    context:
      "when DATABASE_MODE=neon. Set DATABASE_NEON_DIRECT_URL for Prisma or DATABASE_NEON_URL as the runtime fallback",
    key: env.DATABASE_NEON_DIRECT_URL
      ? "DATABASE_NEON_DIRECT_URL"
      : "DATABASE_NEON_URL",
    value: prismaDatasourceUrl
  });

  return {
    datasourceUrl,
    datasourceUrlSource: env.DATABASE_NEON_DIRECT_URL
      ? "DATABASE_NEON_DIRECT_URL"
      : "DATABASE_NEON_URL",
    ...(env.DATABASE_NEON_DIRECT_URL
      ? {
          directUrl: env.DATABASE_NEON_DIRECT_URL,
          directUrlSource: "DATABASE_NEON_DIRECT_URL" as const
        }
      : {}),
    mode: "neon"
  };
}
