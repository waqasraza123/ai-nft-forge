import { NextResponse } from "next/server";

import {
  createGenerationErrorResponse,
  requireStudioApiSession
} from "../../../../../../server/generations/http";
import { createRuntimeGenerationService } from "../../../../../../server/generations/runtime";

type RetryGenerationRouteContext = {
  params: Promise<{
    generationRequestId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RetryGenerationRouteContext
) {
  try {
    const session = await requireStudioApiSession();
    const { generationRequestId } = await context.params;
    const result =
      await createRuntimeGenerationService().retryGenerationRequest({
        generationRequestId,
        ownerUserId: session.ownerUserId
      });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createGenerationErrorResponse(error);
  }
}
