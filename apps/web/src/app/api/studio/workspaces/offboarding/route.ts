import { workspaceOffboardingOverviewResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { createStudioSettingsErrorResponse } from "../../../../../server/studio-settings/http";
import { getCurrentStudioAccess } from "../../../../../server/studio/access";
import { StudioSettingsServiceError } from "../../../../../server/studio-settings/error";
import { createRuntimeWorkspaceOffboardingService } from "../../../../../server/workspaces/offboarding-service";

export async function GET() {
  try {
    const access = await getCurrentStudioAccess();

    if (!access) {
      throw new StudioSettingsServiceError(
        "SESSION_REQUIRED",
        "An active studio session is required.",
        401
      );
    }

    const result =
      await createRuntimeWorkspaceOffboardingService().getAccessibleWorkspaceOffboardingOverview(
        {
          currentWorkspaceId: access.workspace?.id ?? null,
          workspaces: access.availableWorkspaces
        }
      );

    return NextResponse.json(workspaceOffboardingOverviewResponseSchema.parse(result));
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
