import {
  workspaceRetentionBulkCancelRequestSchema,
  workspaceRetentionBulkCancelResponseSchema
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

    const body = workspaceRetentionBulkCancelRequestSchema.parse(
      await request.json()
    );
    const result =
      await createRuntimeWorkspaceRetentionService().cancelScheduledWorkspaceDecommissions(
        {
          actorUserId: access.session.user.id,
          workspaceIds: body.workspaceIds,
          workspaces: access.availableWorkspaces
        }
      );

    return NextResponse.json(
      workspaceRetentionBulkCancelResponseSchema.parse(result)
    );
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
