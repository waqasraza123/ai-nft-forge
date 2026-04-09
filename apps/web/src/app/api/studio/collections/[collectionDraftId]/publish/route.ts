import { collectionPublicationMerchandisingRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCollectionDraftErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../../../server/collections/http";
import { createRuntimeCollectionDraftService } from "../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    collectionDraftId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { collectionDraftId } = await context.params;
    const result =
      await createRuntimeCollectionDraftService().publishCollectionDraft({
        collectionDraftId,
        ownerUserId: session.user.id
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { collectionDraftId } = await context.params;
    const result =
      await createRuntimeCollectionDraftService().unpublishCollectionDraft({
        collectionDraftId,
        ownerUserId: session.user.id
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { collectionDraftId } = await context.params;
    const body = collectionPublicationMerchandisingRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().updateCollectionPublicationMerchandising(
        {
          collectionDraftId,
          displayOrder: body.displayOrder,
          isFeatured: body.isFeatured,
          ownerUserId: session.user.id
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
