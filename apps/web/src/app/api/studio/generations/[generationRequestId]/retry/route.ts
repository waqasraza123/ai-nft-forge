import { NextResponse } from "next/server";

import {
  createGenerationErrorResponse,
  requireStudioActiveApiSession
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
    const session = await requireStudioActiveApiSession();
    const { generationRequestId } = await context.params;
    const result =
      await createRuntimeGenerationService().retryGenerationRequest({
        generationRequestId,
        ownerUserId: session.ownerUserId,
        workspaceId: session.workspace.id
      });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createGenerationErrorResponse(error);
  }
}
