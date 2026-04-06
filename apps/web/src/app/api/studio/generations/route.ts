import { generationRequestCreateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createGenerationErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../server/generations/http";
import { createRuntimeGenerationService } from "../../../../server/generations/runtime";

export async function POST(request: Request) {
  try {
    const session = await requireStudioApiSession();
    const body = generationRequestCreateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeGenerationService().createGenerationRequest({
        ownerUserId: session.user.id,
        pipelineKey: body.pipelineKey,
        sourceAssetId: body.sourceAssetId,
        variantCount: body.variantCount
      });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createGenerationErrorResponse(error);
  }
}
