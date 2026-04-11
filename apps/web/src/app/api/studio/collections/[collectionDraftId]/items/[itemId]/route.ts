import { NextResponse } from "next/server";

import {
  createCollectionDraftErrorResponse,
  requireStudioApiSession
} from "../../../../../../../server/collections/http";
import { createRuntimeCollectionDraftService } from "../../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    collectionDraftId: string;
    itemId: string;
  }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { collectionDraftId, itemId } = await context.params;
    const result =
      await createRuntimeCollectionDraftService().removeCollectionDraftItem({
        collectionDraftId,
        itemId,
        ownerUserId: session.ownerUserId
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
