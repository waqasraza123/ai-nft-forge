import { NextResponse } from "next/server";

import { createOpsErrorResponse } from "../../../../../../../../server/ops/http";
import { OpsServiceError } from "../../../../../../../../server/ops/error";
import { createRuntimeOpsService } from "../../../../../../../../server/ops/runtime-service";
import {
  findAccessibleWorkspaceById,
  getCurrentStudioAccess
} from "../../../../../../../../server/studio/access";

type FleetReconciliationRunRouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: FleetReconciliationRunRouteContext
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

    const { workspaceId } = await context.params;
    const workspace = findAccessibleWorkspaceById({
      access,
      workspaceId
    });

    if (!workspace) {
      throw new OpsServiceError(
        "WORKSPACE_NOT_FOUND",
        "The requested workspace is not available to this actor.",
        404
      );
    }

    const result = await createRuntimeOpsService().runReconciliation({
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
