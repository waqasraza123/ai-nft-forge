import {
  workspaceDecommissionNotificationRecordRequestSchema,
  workspaceDecommissionNotificationRecordResponseSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioOwnerApiSession
} from "../../../../../../../server/studio-settings/http";
import { createRuntimeWorkspaceDecommissionService } from "../../../../../../../server/workspaces/decommission-service";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { workspaceId } = await context.params;
    const body = workspaceDecommissionNotificationRecordRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeWorkspaceDecommissionService().recordWorkspaceDecommissionNotification(
        {
          kind: body.kind,
          ownerUserId: session.ownerUserId,
          workspaceId
        }
      );

    return NextResponse.json(
      workspaceDecommissionNotificationRecordResponseSchema.parse(result)
    );
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
