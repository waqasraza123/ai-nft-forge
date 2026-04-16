import {
  workspaceDecommissionResponseSchema,
  workspaceDecommissionScheduleRequestSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioOwnerApiSession
} from "../../../../../../server/studio-settings/http";
import { createRuntimeWorkspaceDecommissionService } from "../../../../../../server/workspaces/decommission-service";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { workspaceId } = await context.params;
    const body = workspaceDecommissionScheduleRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeWorkspaceDecommissionService().scheduleWorkspaceDecommission(
        {
          ...body,
          ownerUserId: session.ownerUserId,
          workspaceId
        }
      );

    return NextResponse.json(workspaceDecommissionResponseSchema.parse(result));
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { workspaceId } = await context.params;
    const result =
      await createRuntimeWorkspaceDecommissionService().cancelWorkspaceDecommission(
        {
          ownerUserId: session.ownerUserId,
          workspaceId
        }
      );

    return NextResponse.json(workspaceDecommissionResponseSchema.parse(result));
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
