import { z } from "zod";

export const defaultWorkspaceDecommissionRetentionDays = 30;
export const defaultWorkspaceMinimumDecommissionRetentionDays = 7;
export const defaultWorkspaceRequireDecommissionReason = false;

export const workspaceDecommissionRetentionDaysSchema = z
  .number()
  .int()
  .min(7)
  .max(365);

export const workspaceRetentionPolicySchema = z
  .object({
    defaultDecommissionRetentionDays: workspaceDecommissionRetentionDaysSchema,
    minimumDecommissionRetentionDays: workspaceDecommissionRetentionDaysSchema,
    requireDecommissionReason: z.boolean()
  })
  .superRefine((value, context) => {
    if (
      value.defaultDecommissionRetentionDays <
      value.minimumDecommissionRetentionDays
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Default decommission retention must be greater than or equal to the minimum retention window.",
        path: ["defaultDecommissionRetentionDays"]
      });
    }
  });

export type WorkspaceRetentionPolicy = z.infer<
  typeof workspaceRetentionPolicySchema
>;
