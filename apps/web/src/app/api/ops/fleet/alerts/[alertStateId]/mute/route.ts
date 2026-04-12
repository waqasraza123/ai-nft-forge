import { NextResponse } from "next/server";

import {
  opsAlertMuteRequestSchema,
  workspaceFleetScopedActionRequestSchema
} from "@ai-nft-forge/shared";

import { createOpsErrorResponse } from "../../../../../../../server/ops/http";
import { OpsServiceError } from "../../../../../../../server/ops/error";
import { createRuntimeOpsService } from "../../../../../../../server/ops/runtime-service";
import {
  findAccessibleWorkspaceById,
  getCurrentStudioAccess
} from "../../../../../../../server/studio/access";
import { assertWorkspaceIsActive } from "../../../../../../../server/studio/workspace-state";

type FleetMuteAlertRouteContext = {
  params: Promise<{
    alertStateId: string;
  }>;
};

export async function POST(
  request: Request,
  context: FleetMuteAlertRouteContext
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

    const rawBody = await request.json();
    const workspaceBody =
      workspaceFleetScopedActionRequestSchema.parse(rawBody);
    const muteBody = opsAlertMuteRequestSchema.parse(rawBody);
    const workspace = findAccessibleWorkspaceById({
      access,
      workspaceId: workspaceBody.workspaceId
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
    const result = await createRuntimeOpsService().muteAlert({
      alertStateId,
      durationHours: muteBody.durationHours,
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
