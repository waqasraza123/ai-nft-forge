import { NextResponse } from "next/server";

import { workspaceFleetScopedActionRequestSchema } from "@ai-nft-forge/shared";

import { createOpsErrorResponse } from "../../../../../../../server/ops/http";
import { OpsServiceError } from "../../../../../../../server/ops/error";
import { createRuntimeOpsService } from "../../../../../../../server/ops/runtime-service";
import {
  findAccessibleWorkspaceById,
  getCurrentStudioAccess
} from "../../../../../../../server/studio/access";
import { assertWorkspaceIsActive } from "../../../../../../../server/studio/workspace-state";

type FleetAcknowledgeAlertRouteContext = {
  params: Promise<{
    alertStateId: string;
  }>;
};

export async function POST(
  request: Request,
  context: FleetAcknowledgeAlertRouteContext
) {
  try {
    const access = await getCurrentStudioAccess();

    if (!access) {
      throw new OpsServiceError(
        "SESSION_REQUIRED",
        "An active studio session is required.",
        401
      );
    }

    const body = workspaceFleetScopedActionRequestSchema.parse(
      await request.json()
    );
    const workspace = findAccessibleWorkspaceById({
      access,
      workspaceId: body.workspaceId
    });

    if (!workspace) {
      throw new OpsServiceError(
        "WORKSPACE_NOT_FOUND",
        "The requested workspace is not available to this actor.",
        404
      );
    }
    assertWorkspaceIsActive(workspace, (message) => {
      return new OpsServiceError("WORKSPACE_NOT_ACTIVE", message, 409);
    });

    const { alertStateId } = await context.params;
    const result = await createRuntimeOpsService().acknowledgeAlert({
      alertStateId,
      ownerUserId: workspace.ownerUserId,
      workspaceId: workspace.id
    });

    return NextResponse.json(result, {
      status: 200
    });
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
