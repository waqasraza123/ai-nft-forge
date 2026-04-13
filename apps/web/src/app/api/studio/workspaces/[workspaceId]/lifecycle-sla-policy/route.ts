import {
  studioWorkspaceLifecycleSlaPolicyResponseSchema,
  workspaceLifecycleSlaPolicySchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioOwnerApiSession
} from "../../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../../server/studio-settings/runtime";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const params = await context.params;
    const body = workspaceLifecycleSlaPolicySchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeStudioSettingsService().updateWorkspaceLifecycleSlaPolicy(
        {
          lifecycleSlaPolicy: body,
          ownerUserId: session.ownerUserId,
          role: session.role,
          workspaceId: params.workspaceId
        }
      );

    return NextResponse.json(
      studioWorkspaceLifecycleSlaPolicyResponseSchema.parse(result)
    );
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
