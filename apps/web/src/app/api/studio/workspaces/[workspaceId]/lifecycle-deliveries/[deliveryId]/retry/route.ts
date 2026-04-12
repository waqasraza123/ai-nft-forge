import { workspaceLifecycleNotificationDeliveryRetryResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  requireStudioOwnerApiSession
} from "../../../../../../../../server/studio-settings/http";
import { createRuntimeWorkspaceLifecycleDeliveryService } from "../../../../../../../../server/workspaces/lifecycle-delivery-runtime";

type RouteContext = {
  params: Promise<{
    deliveryId: string;
    workspaceId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { deliveryId, workspaceId } = await context.params;
    const result =
      await createRuntimeWorkspaceLifecycleDeliveryService().retryWorkspaceLifecycleDelivery(
        {
          deliveryId,
          ownerUserId: session.ownerUserId,
          workspaceId
        }
      );

    return NextResponse.json(
      workspaceLifecycleNotificationDeliveryRetryResponseSchema.parse({
        delivery: result
      })
    );
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
