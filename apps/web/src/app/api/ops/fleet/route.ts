import { NextResponse } from "next/server";

import { workspaceFleetOverviewResponseSchema } from "@ai-nft-forge/shared";

import { createOpsErrorResponse } from "../../../../server/ops/http";
import { OpsServiceError } from "../../../../server/ops/error";
import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeWorkspaceFleetService } from "../../../../server/workspaces/fleet-service";

export async function GET() {
  try {
    const access = await getCurrentStudioAccess();

    if (!access) {
      throw new OpsServiceError(
        "SESSION_REQUIRED",
        "An active studio session is required.",
        401
      );
    }

    const result =
      await createRuntimeWorkspaceFleetService().getAccessibleWorkspaceFleet({
        currentWorkspaceId: access.workspace?.id ?? null,
        workspaces: access.availableWorkspaces
      });

    return NextResponse.json(
      workspaceFleetOverviewResponseSchema.parse(result)
    );
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
