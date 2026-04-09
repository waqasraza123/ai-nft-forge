import { generatedAssetModerationUpdateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createGeneratedAssetErrorResponse,
  requireStudioApiSession
} from "../../../../../../server/generated-assets/http";
import { createRuntimeGeneratedAssetService } from "../../../../../../server/generated-assets/runtime";

type RouteContext = {
  params: Promise<{
    generatedAssetId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { generatedAssetId } = await context.params;
    const body = generatedAssetModerationUpdateRequestSchema.parse(
      await request.json()
    );
    const result = await createRuntimeGeneratedAssetService().updateModeration({
      generatedAssetId,
      moderationStatus: body.moderationStatus,
      ownerUserId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    return createGeneratedAssetErrorResponse(error);
  }
}
