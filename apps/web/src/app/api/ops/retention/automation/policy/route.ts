import {
  workspaceRetentionBulkAutomationPolicyRequestSchema,
  workspaceRetentionBulkAutomationPolicyResponseSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { OpsServiceError } from "../../../../../../server/ops/error";
import { createOpsErrorResponse } from "../../../../../../server/ops/http";
import { getCurrentStudioAccess } from "../../../../../../server/studio/access";
import { createRuntimeWorkspaceRetentionService } from "../../../../../../server/workspaces/retention-service";

export async function POST(request: Request) {
  try {
    const access = await getCurrentStudioAccess();

    if (!access) {
      throw new OpsServiceError(
        "SESSION_REQUIRED",
        "An active studio session is required.",
        401
      );
    }

    const body = workspaceRetentionBulkAutomationPolicyRequestSchema.parse(
      await request.json()
    );
    const result =
      await createRuntimeWorkspaceRetentionService().updateAccessibleWorkspaceLifecycleAutomationPolicy(
        {
          actorUserId: access.session.user.id,
          currentWorkspaceId: access.workspace?.id ?? null,
          enabled: body.enabled,
          workspaces: access.availableWorkspaces,
          workspaceIds: body.workspaceIds
        }
      );

    return NextResponse.json(
      workspaceRetentionBulkAutomationPolicyResponseSchema.parse(result)
    );
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
