import { generatedAssetModerationUpdateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createGeneratedAssetErrorResponse,
  requireStudioActiveApiSession
} from "../../../../../../server/generated-assets/http";
import { createRuntimeGeneratedAssetService } from "../../../../../../server/generated-assets/runtime";

type RouteContext = {
  params: Promise<{
    generatedAssetId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveApiSession();
    const { generatedAssetId } = await context.params;
    const body = generatedAssetModerationUpdateRequestSchema.parse(
      await request.json()
    );
    const result = await createRuntimeGeneratedAssetService().updateModeration({
      generatedAssetId,
      moderationStatus: body.moderationStatus,
      workspaceId: session.workspace.id
    });

    return NextResponse.json(result);
  } catch (error) {
    return createGeneratedAssetErrorResponse(error);
  }
}
