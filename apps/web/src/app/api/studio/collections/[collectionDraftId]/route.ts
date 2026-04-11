import { collectionDraftUpdateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCollectionDraftErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../../server/collections/http";
import { createRuntimeCollectionDraftService } from "../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    collectionDraftId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { collectionDraftId } = await context.params;
    const body = collectionDraftUpdateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().updateCollectionDraft({
        collectionDraftId,
        description: body.description,
        ownerUserId: session.ownerUserId,
        slug: body.slug,
        status: body.status,
        title: body.title
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
