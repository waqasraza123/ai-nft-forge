import { z } from "zod";

import { booleanEnvironmentValueSchema } from "./boolean-environment-value.js";
import {
  optionalTrimmedStringSchema,
  optionalUrlSchema
} from "./optional-environment-value.js";
import { workspaceLifecycleNotificationProviderLabels } from "../workspace-lifecycle.js";

export const workerLogLevels = ["debug", "info", "warn", "error"] as const;
export const generationAdapterKinds = ["storage_copy", "http_backend"] as const;

export type WorkerLogLevel = (typeof workerLogLevels)[number];
export type GenerationAdapterKind = (typeof generationAdapterKinds)[number];

export const workerEnvSchema = z
  .object({
    COMMERCE_FULFILLMENT_QUEUE_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .max(32)
      .default(1),
    GENERATION_ADAPTER_KIND: z
      .enum(generationAdapterKinds)
      .default("storage_copy"),
    GENERATION_BACKEND_AUTH_TOKEN: optionalTrimmedStringSchema,
    GENERATION_BACKEND_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120000)
      .default(30000),
    GENERATION_BACKEND_URL: optionalUrlSchema,
    GENERATION_QUEUE_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .max(32)
      .default(1),
    LOG_LEVEL: z.enum(workerLogLevels).default("info"),
    NOOP_QUEUE_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .max(32)
      .default(1),
    OPS_ALERT_WEBHOOK_BEARER_TOKEN: optionalTrimmedStringSchema,
    OPS_ALERT_WEBHOOK_ENABLED: booleanEnvironmentValueSchema.default(false),
    OPS_ALERT_WEBHOOK_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(30000)
      .default(5000),
    OPS_ALERT_WEBHOOK_URL: optionalUrlSchema,
    OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86400)
      .default(300),
    OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS: z.coerce
      .number()
      .int()
      .min(0)
      .max(3600)
      .default(15),
    OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86400)
      .default(600),
    OPS_OBSERVABILITY_CAPTURE_RUN_ON_START:
      booleanEnvironmentValueSchema.default(true),
    OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED:
      booleanEnvironmentValueSchema.default(false),
    OPS_RECONCILIATION_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86400)
      .default(300),
    OPS_RECONCILIATION_JITTER_SECONDS: z.coerce
      .number()
      .int()
      .min(0)
      .max(3600)
      .default(15),
    OPS_RECONCILIATION_LOCK_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86400)
      .default(600),
    OPS_RECONCILIATION_RUN_ON_START:
      booleanEnvironmentValueSchema.default(true),
    OPS_RECONCILIATION_SCHEDULE_ENABLED:
      booleanEnvironmentValueSchema.default(false),
    REDIS_URL: z.string().url().default("redis://127.0.0.1:56379"),
    WORKER_SERVICE_NAME: z.string().trim().min(1).default("ai-nft-forge-worker"),
    WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86400)
      .default(300),
    WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS: z.coerce
      .number()
      .int()
      .min(0)
      .max(3600)
      .default(15),
    WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86400)
      .default(600),
    WORKSPACE_LIFECYCLE_AUTOMATION_RUN_ON_START:
      booleanEnvironmentValueSchema.default(true),
    WORKSPACE_LIFECYCLE_AUTOMATION_SCHEDULE_ENABLED:
      booleanEnvironmentValueSchema.default(false),
    WORKSPACE_LIFECYCLE_QUEUE_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .max(32)
      .default(1),
    WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN: optionalTrimmedStringSchema,
    WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED:
      booleanEnvironmentValueSchema.default(false),
    WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(30000)
      .default(5000),
    WORKSPACE_LIFECYCLE_WEBHOOK_URL: optionalUrlSchema,
    WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_BEARER_TOKEN:
      optionalTrimmedStringSchema,
    WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_ENABLED:
      booleanEnvironmentValueSchema.default(false),
    WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(30000)
      .default(5000),
    WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL: optionalUrlSchema
  })
  .superRefine((value, context) => {
    if (
      value.GENERATION_ADAPTER_KIND === "http_backend" &&
      !value.GENERATION_BACKEND_URL
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "GENERATION_BACKEND_URL is required when GENERATION_ADAPTER_KIND=http_backend.",
        path: ["GENERATION_BACKEND_URL"]
      });
    }

    if (value.OPS_ALERT_WEBHOOK_ENABLED && !value.OPS_ALERT_WEBHOOK_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "OPS_ALERT_WEBHOOK_URL is required when OPS_ALERT_WEBHOOK_ENABLED=true.",
        path: ["OPS_ALERT_WEBHOOK_URL"]
      });
    }

    if (
      value.WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED &&
      !value.WORKSPACE_LIFECYCLE_WEBHOOK_URL
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "WORKSPACE_LIFECYCLE_WEBHOOK_URL is required when WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED=true.",
        path: ["WORKSPACE_LIFECYCLE_WEBHOOK_URL"]
      });
    }

    if (
      value.WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_ENABLED &&
      !value.WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL is required when WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_ENABLED=true.",
        path: ["WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL"]
      });
    }
  });

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export type WorkspaceLifecycleWebhookProviderConfig = {
  bearerToken: string | undefined;
  enabled: boolean;
  key: "primary" | "secondary";
  label: string;
  timeoutMs: number;
  url: string | undefined;
};

export function parseWorkerEnv(rawEnvironment: NodeJS.ProcessEnv): WorkerEnv {
  return workerEnvSchema.parse(rawEnvironment);
}

export function resolveWorkspaceLifecycleWebhookProviders(
  env: Pick<
    WorkerEnv,
    | "WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_URL"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_BEARER_TOKEN"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_ENABLED"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_TIMEOUT_MS"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL"
  >
): WorkspaceLifecycleWebhookProviderConfig[] {
  return [
    {
      bearerToken: env.WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN,
      enabled:
        env.WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED &&
        Boolean(env.WORKSPACE_LIFECYCLE_WEBHOOK_URL),
      key: "primary",
      label: workspaceLifecycleNotificationProviderLabels.primary,
      timeoutMs: env.WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS,
      url: env.WORKSPACE_LIFECYCLE_WEBHOOK_URL
    },
    {
      bearerToken: env.WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_BEARER_TOKEN,
      enabled:
        env.WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_ENABLED &&
        Boolean(env.WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL),
      key: "secondary",
      label: workspaceLifecycleNotificationProviderLabels.secondary,
      timeoutMs: env.WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_TIMEOUT_MS,
      url: env.WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL
    }
  ];
}
